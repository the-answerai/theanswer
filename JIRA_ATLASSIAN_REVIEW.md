# Jira / Atlassian Code Review

Scope: every file in the repo that touches Jira or Atlassian — credentials, Flowise nodes, MCP servers, server-side OAuth + token refresh, AAI ingest/sync utils, and UI surfaces.

Findings are grouped by severity. Each finding cites the file:line so you can jump straight to it. The companion fixes for the credential-name 500 ship in:
- `packages/server/src/services/components-credentials/index.ts` (case-insensitive lookup + correct status propagation)
- `packages/ui/src/views/canvas/CredentialInputHandler.jsx` (canonical-name normalization + user-visible toast)
- `packages/server/src/database/migrations/postgres/aai/1770000000001-NormalizeLegacyCredentialNames.ts` (data normalization)

Everything below is *additional* to those changes.

---

## Surfaces inventory

| Area | Files |
| --- | --- |
| Credentials | `packages/components/credentials/JiraApi.credential.ts`, `packages/components/credentials/AtlassianOauth.credential.ts` |
| Flowise nodes | `packages/components/nodes/tools/Jira/{Jira.ts, core.ts}`, `packages/components/nodes/tools/MCP/Jira/JiraMCP.ts`, `packages/components/nodes/tools/MCP/Atlassian/AtlassianMcp.ts`, `packages/components/nodes/documentloaders/Jira/Jira.ts` |
| Server OAuth + refresh | `packages/server/src/routes/atlassian-auth/index.ts`, `packages/server/src/controllers/atlassian-auth/index.ts`, `packages/server/src/services/credentials/index.ts` (`updateAndRefreshAtlassianToken`), `packages/server/src/utils/index.ts` (`registerOAuthClient`, `refreshStoredCredentialTokens`, `exchangeCodeForTokens`) |
| AAI Jira utils | `packages-answers/utils/src/jira/{client.ts, getJiraTickets.ts, models/*}`, `packages-answers/utils/src/ingest/jira.ts`, `packages-answers/utils/src/utilities/jiraAdfToMarkdown.ts` |
| UI | `packages-answers/ui/src/JiraSettings.tsx`, `packages/ui/src/ui-component/button/AtlassianAuthButton.jsx`, `packages/ui/src/views/credentials/AddEditCredentialDialog.jsx` (Atlassian OAuth handler) |
| Disabled / dead | `apps/web/app/(Main UI)/settings/integrations/[[...app]]/page.tsx` |

---

## Critical (security or data integrity)

### C1. OAuth popup `postMessage` handlers do not verify `event.origin`

[packages/ui/src/views/credentials/AddEditCredentialDialog.jsx](packages/ui/src/views/credentials/AddEditCredentialDialog.jsx) `handleAtlassianOAuth` (line ~575) and `handleSalesforceOAuth` / `handleGoogleOAuth` all do:

```jsx
const handleMessage = (event) => {
    if (event.data?.type === 'AUTH_SUCCESS' && event.data.user) {
        setCredentialData((prevData) => ({
            ...prevData,
            access_token: event.data.user.access_token,
            ...
```

They never check `event.origin`. Any tab that holds a window reference (or any iframe in the page) can `postMessage` an `AUTH_SUCCESS` payload into the listener and inject attacker-supplied tokens into a credential that the user is about to save. The same window even calls `setCredentialData` and auto-fills the credential name.

**Fix:** assert `event.origin === window.location.origin` (or whatever origin you actually return the popup to) before trusting `event.data`. Apply uniformly to the Google, Salesforce, and Atlassian handlers.

### C2. MCP `state` parameter == sessionId, no CSRF binding

In [packages/ui/src/views/credentials/AddEditCredentialDialog.jsx](packages/ui/src/views/credentials/AddEditCredentialDialog.jsx) the `handleAtlassianOAuth` function builds the auth URL with:

```jsx
const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: mcpData.client_id,
    redirect_uri: mcpData.redirect_uri,
    scope: mcpData.scope,
    state: mcpData.sessionId, // Use sessionId as state parameter
    audience: 'api.atlassian.com',
    prompt: 'consent'
})
```

`sessionId` here is the value returned by `registerOAuthClient` and is also used to look up the in-memory `pendingRegistrations` map. Using the same value as `state` and as the lookup key:

1. Removes the per-user CSRF guarantee that `state` is supposed to provide (any party that obtains the sessionId can forge a callback).
2. Means the callback handler does not bind the OAuth result to the user who initiated the flow — `pendingRegistrations` is keyed by sessionId only and `passport.authenticate('atlassian-dynamic')` runs on a public route (no `verifyToken` / `verifyAAIToken` middleware on `/api/v1/atlassian-auth/*`).

**Fix:**
- Generate a random `state` independently of `sessionId` and store the (state -> sessionId, userId) mapping server-side.
- On callback, look the state up, verify it has not been consumed, and tie the resulting credential to the original user.

### C3. `pendingRegistrations` is an in-process `Map` — breaks behind multiple workers

`registerOAuthClient` in [packages/server/src/utils/index.ts](packages/server/src/utils/index.ts) (line ~2225) stores client_secret + metadata in an in-process `Map<string, PendingRegistration>`. The Atlassian OAuth callback that consumes it can land on a different worker (PM2 cluster, multiple containers behind a load balancer, queue mode with separate workers, etc.) and will silently fail with “Invalid or expired session ID.”

**Fix:** persist pending registrations to Redis (the codebase already uses Redis for sessions when `MODE=queue`) or a short-lived DB table.

### C4. Atlassian auth callback leaks raw error objects to the client window

[packages/server/src/controllers/atlassian-auth/index.ts](packages/server/src/controllers/atlassian-auth/index.ts) at line 49:

```ts
window.opener.postMessage({
    type: 'AUTH_ERROR',
    error: ${JSON.stringify(error)}
}, '*');
```

Three problems on one line:
1. `JSON.stringify(error)` returns `"{}"` for native `Error` instances (no enumerable props) — this is exactly the empty `stack: {}` the user observed in their browser network tab. The opener gets no actionable error message.
2. The same handler `'*'` targets any origin, so a sibling tab/iframe can intercept the error message.
3. If a downstream library throws an error that *is* JSON-serializable but contains stack/internal info, that gets shipped to the browser unfiltered.

**Fix:**
- Sanitize: ship `{ message: error?.message ?? 'Atlassian auth failed' }` only.
- Use a real origin string instead of `'*'` (same as C1).
- The success branch on line 30 has the same `'*'` issue and posts the entire `req.user` object verbatim (all access tokens, refresh tokens, MCP client_secret) — see C5 for tightening.

### C5. Atlassian OAuth callback ships client_secret to the browser

The success branch of the callback above posts `JSON.stringify(req.user)` to `window.opener`. Looking at the message handler in [AddEditCredentialDialog.jsx](packages/ui/src/views/credentials/AddEditCredentialDialog.jsx) (lines 577–588), `req.user` carries `access_token`, `refresh_token`, `mcp_client_id`, **and `mcp_client_secret`**. The browser then writes these into the credential dialog and POSTs them back to the server to be stored encrypted.

The `mcp_client_secret` should never round-trip through the browser. The server already has it in `pendingRegistrations`; it should write the credential row server-side and only return a credential ID (or a redacted summary) to the popup.

**Fix:** create or update the credential server-side in the callback, store the secret directly in the encrypted credential payload, and return only `{ credentialId, displayName }` to the opener.

### C6. `updateAndRefreshAtlassianToken` re-wraps NOT_FOUND / BAD_REQUEST as 500

[packages/server/src/services/credentials/index.ts](packages/server/src/services/credentials/index.ts) lines 245–277 has the **same catch-and-rewrap bug** I just fixed in `componentsCredentialsService`:

```ts
} catch (error) {
    throw new InternalFlowiseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error: credentialsService.updateAndRefreshAtlassianToken - ${getErrorMessage(error)}`
    )
}
```

Both the `NOT_FOUND` (line 255) and the `BAD_REQUEST` (line 262) `InternalFlowiseError`s thrown inside the `try` get re-wrapped as 500 by this `catch`, masking the real status from the client.

**Fix:** mirror the pattern I applied in `componentsCredentialsService.getComponentByName` — `if (error instanceof InternalFlowiseError) throw error;` then re-wrap only unknown errors. Same fix is worth applying to `updateAndRefreshToken` directly above it (line 200) and to `getCredentialById` / `updateCredential` / `deleteCredentials` in the same file, all of which exhibit this pattern.

---

## High

### H1. `JiraApi` credential description still says “on Github”

[packages/components/credentials/JiraApi.credential.ts](packages/components/credentials/JiraApi.credential.ts) line 14–15:

```ts
this.description =
    'Refer to <a target="_blank" href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/">official guide</a> on how to get accessToken on Github'
```

Looks like a copy-paste from `GithubApi.credential.ts`. The link is correct, the body text is wrong. Update to “…on how to get an Atlassian API token.”

### H2. `JiraApi` credential is missing required validation flags

Same file, all three inputs (`username`, `accessToken`, `host`) are declared with no `optional: false`, no `placeholder` for `host`, and no validator. The host field also accepts trailing slashes / partial URLs which `core.ts` then concatenates blindly:

```ts
const url = `${this.jiraHost}/rest/api/3/${endpoint}`
```

A user typing `example.atlassian.net` (no protocol) breaks every tool call with a misleading error. A trailing slash produces `//rest/api/3/...` which Jira accepts but is sloppy.

**Fix:**
- Add `placeholder: 'https://example.atlassian.net'` and a `description` that calls out the protocol/no-trailing-slash rule.
- In `core.ts:makeJiraRequest`, normalize `this.jiraHost` once in the constructor (strip trailing `/`, prepend `https://` if missing).

### H3. `Jira_Tools` node missing `tags: ['AAI']`

[packages/components/nodes/tools/Jira/Jira.ts](packages/components/nodes/tools/Jira/Jira.ts) class declaration (lines 6–15) does not declare a `tags` field, and the constructor never assigns `tags = ['AAI']`. The Jira MCP node, document loader, and Atlassian MCP node all do.

Per repo convention (`CLAUDE.md`: *"Always include `tags: ['AAI']` for all TheAnswer-specific components"*), this excludes the `Jira` tool from the Answer tab grouping in the UI.

**Fix:** add `tags: string[]` to the class shape and `this.tags = ['AAI']` in the constructor.

### H4. `JiraApi` credential password fields visible in network log on save

The `accessToken` field is `type: 'password'`, but the credential dialog `addNewCredential` POSTs the entire `plainDataObj` (decrypted tokens) to `/api/v1/credentials`. Combined with C1 / C5 above, this is the third place an OAuth flow could leak tokens. Recommended hardening:

- Confirm the auth-only OAuth flow is the **only** path that ever holds tokens. For the manual `jiraApi` credential there's nothing we can do (user has to type their token), but make sure the dialog's `console.error('OAuth2 authorization error:', error)` and the snackbar `enqueueSnackbar({ message: ... error.message ... })` calls don't echo `plainDataObj` contents.

### H5. `getJiraTickets` swallows the failure and returns `undefined`

[packages-answers/utils/src/jira/getJiraTickets.ts](packages-answers/utils/src/jira/getJiraTickets.ts) line ~79–end:

```ts
} catch (error) {
    console.error('GetJiraTickets:ERROR', error)
}
```

There is no `return` and no rethrow, so the function returns `undefined` on any failure (network error, 401, JQL parse error, malformed Jira response). Callers like `procesProjectUpdated` then run `(await Promise.all(...)).flat()` over `undefined`, or `issues.map(...)` and crash with a noisy `Cannot read property 'map' of undefined` that isn't tied back to the original Jira error.

**Fix:** rethrow, or `return [] as JiraIssue[]`. Consider also surfacing the rate-limit case (429) instead of returning `null` from `fetchJiraData` and letting the caller try to `.issues` on null.

### H6. `JiraClient.getCloudId` will crash for an Atlassian account with no Jira product

[packages-answers/utils/src/jira/client.ts](packages-answers/utils/src/jira/client.ts) line 35–41:

```ts
async getCloudId() {
    const appData = await this.getAppData()
    const jiraData = appData.find((app: any) => app.scopes?.some((scope: string) => scope.includes('jira')))
    console.log('[CloudId]', jiraData.id)
    return jiraData.id
}
```

`appData.find(...)` returns `undefined` if the OAuth user has only granted Confluence scopes, and `jiraData.id` then throws `TypeError: Cannot read properties of undefined (reading 'id')`. The constructor catches this with `.catch((err) => console.log(err))` (line 25), which then causes every subsequent `await this.cloudId` to resolve to `undefined`, producing URLs like `https://api.atlassian.com/ex/jira/undefined/rest/api/3/...`.

**Fix:** throw a typed error if no Jira-scoped resource is returned. Surface that as a credential-level UI error so users know to re-authorize with Jira scopes.

---

## Medium

### M1. Atlassian auth route is unauthenticated

[packages/server/src/routes/atlassian-auth/index.ts](packages/server/src/routes/atlassian-auth/index.ts) declares three routes:

```ts
router.get('/', atlassianAuthController.authenticate)
router.get('/callback', passport.authenticate('atlassian-dynamic', { session: false }), atlassianAuthController.atlassianAuthCallback)
router.get('/mcp-initialize', atlassianAuthController.mcpInitialize)
```

None of them call `verifyToken` / `verifyAAIToken` / `enforceAbility`. `mcp-initialize` registers a fresh OAuth client (third-party API call to Atlassian) on every GET, populating `pendingRegistrations` with no rate limiting.

**Fix:** require an authenticated user on `mcp-initialize` so we can attribute pending registrations to a user (which also helps fix C2). Keep `/callback` open (third-party redirect) but bind the callback to the originating user via `state` (see C2). Add `express-rate-limit` to `mcp-initialize` regardless.

### M2. Atlassian token refresh has no leeway on `expiration_time`

`refreshStoredCredentialTokens` in `packages/server/src/utils/index.ts` (line ~2336+) refreshes when called explicitly; the MCP node says token refresh is "handled automatically by server before node initialization" but the actual trigger logic (somewhere upstream) appears to compare `expiration_time` against `Date.now()` exactly. Recommend adding a 60–120 s leeway to avoid races where a refresh fires at the wall-clock boundary.

### M3. `JiraMCP` credential reads `host` from the credential, not from a node input

[packages/components/nodes/tools/MCP/Jira/JiraMCP.ts](packages/components/nodes/tools/MCP/Jira/JiraMCP.ts) line 109:

```ts
const jiraUrl = getCredentialParam('host', credentialData, nodeData)
```

The `JiraApi` credential has `host` as one of three inputs, but the **non-MCP** Jira tool (`packages/components/nodes/tools/Jira/Jira.ts`) takes `jiraHost` from a *node input* instead. So users who edit one and not the other end up with mismatched hosts. The data loader (`packages/components/nodes/documentloaders/Jira/Jira.ts`) also takes `host` from a node input.

**Fix:** pick one. Standard pattern is "host belongs on the credential" because it's tied to the API token. Drop the `host` input from the tool / loader nodes and always read it from the credential.

### M4. `JiraSettings.tsx` calls `setFilters({ datasources: { jira: { ... } } })` without merging

[packages-answers/ui/src/JiraSettings.tsx](packages-answers/ui/src/JiraSettings.tsx) lines 116, 123:

```tsx
onChange={(value: string[]) => setFilters({ datasources: { jira: { project: value } } })}
```

This replaces the entire `filters` object (which `appSettings.filters` is also typed as a union containing `confluence`, `slack`, etc.). Toggling Jira project filter wipes all sibling filters.

**Fix:** spread previous state: `setFilters((prev) => ({ ...prev, datasources: { ...prev.datasources, jira: { ...prev.datasources?.jira, project: value } } }))`.

### M5. Dead route `apps/web/app/(Main UI)/settings/integrations/[[...app]]/page.tsx`

Currently:

```tsx
const SettingsIntegrationsAppPage = async ({ params }: any) => {
    return null
    // const appSettings = await getAppSettings();
    // return <IntegrationSettings app={params.app} appSettings={appSettings} editable />;
}
```

Returns `null`, with the real implementation commented out. This is the entry point that previously surfaced the `JiraSettings` component to end users. Either:
- Delete the route + remove the `IntegrationSetting.tsx` / `JiraSettings.tsx` plumbing, or
- Re-enable it (and run through M4 first so it doesn't shred filter state).

Right now the dead route is misleading anyone navigating to `/settings/integrations/jira`.

### M6. `getJiraTickets` constructs URLs with un-encoded JQL

```ts
let endpoint = `search?jql=${jql}&maxResults=...`
```

JQL values with spaces, `=`, `,`, or quotes need `encodeURIComponent`. The same pattern recurs three times in this file. The `JiraTool.makeJiraRequest` chain uses `URLSearchParams` correctly; this older util doesn't.

---

## Low

### L1. `Jira_Tools.init` throws raw `Error` without typing

`Jira.ts` lines 379–389:

```ts
if (!username) throw new Error('No username found in credential')
if (!accessToken) throw new Error('No access token found in credential')
if (!jiraHost) throw new Error('No Jira host provided')
```

These bubble up untyped. Other tool nodes use the `INodeOutputsValue` error pattern or a custom error class. Not user-facing damage, but it makes Datadog/Sentry grouping noisier.

### L2. `JiraMcp` and `Jira_Tools.transformNodeInputsToToolArgs` have several `if` ladders that silently lose the source field name

```ts
if (nodeData.inputs?.projectKey) defaultParams.projectKey = nodeData.inputs.projectKey
if (nodeData.inputs?.issueType) defaultParams.issueType = nodeData.inputs.issueType
...
```

This is fine but the value `0` for `issueMaxResults` will be skipped (truthiness). Recommend `!= null` checks.

### L3. `JiraMCP.ts` MCP server is launched with `command: process.execPath`

[packages/components/nodes/tools/MCP/Jira/JiraMCP.ts](packages/components/nodes/tools/MCP/Jira/JiraMCP.ts) line 113. This works but is fragile — running under a sandboxed deployment (e.g. some Docker images strip /proc/self/exe) breaks this. Consider a fallback to `node` resolved from `PATH`.

### L4. `jiraAdfToMarkdown.ts` is half-commented and only handles a tiny subset of node types

[packages-answers/utils/src/utilities/jiraAdfToMarkdown.ts](packages-answers/utils/src/utilities/jiraAdfToMarkdown.ts) — the original implementation is commented out (lines 20+). The active implementation (below the comment block) is shorter and likely missing node types like `mediaSingle`, `expand`, `panel`, `codeBlock`. Either delete the stale comment block or revive the missing handlers.

### L5. `processJiraUpdated` has a typo (`requierd`)

[packages-answers/utils/src/ingest/jira.ts](packages-answers/utils/src/ingest/jira.ts) lines 38 and 82:

```ts
if (!user) throw new Error('User is requierd')
```

Trivial spelling fix; appears twice.

### L6. `AtlassianAuthButton` renders unconditionally for `componentCredential.name === 'atlassianOAuth'`

[packages/ui/src/ui-component/button/AtlassianAuthButton.jsx](packages/ui/src/ui-component/button/AtlassianAuthButton.jsx) — fine as-is, but the dialog renders Google / Salesforce / Atlassian buttons in sequence, each gated by their own name check. If you ever add a fourth provider this will be five conditional buttons in a row. Worth refactoring to a `<OAuthAuthButton provider="atlassian|google|salesforce" />` registry once we add the next one.

---

## Notes / decisions for follow-up

### N1. PascalCase credential names — leave them

The repo currently has five `credential.name` values that start with an uppercase letter (`PostgresApi`, `PostgresUrl`, `MySQLApi`, `AlibabaApi`, `E2BApi`). All the current node code references them with the exact PascalCase string, so they work — they're just inconsistent with the rest. Renaming them would require:
- Updating every node `credentialNames` reference
- A data migration like the one shipped with this PR for both `chat_flow.flowData` and `credential.credentialName`
- A coordinated UI release because cached frontends would briefly request the old name

The case-insensitive lookup we just added in `componentsCredentialsService.getComponentByName` already makes mixed-case requests work, so the cost/benefit doesn't justify the rename right now. Revisit if/when we standardize the credentials nomenclature broadly.

### N2. `scripts/integration-mapping.json` and `scripts/integration-report.md` are stale

Both files reference `"name": "JiraApi"` (uppercase). They are not loaded at runtime (only `scripts/analyze-integrations.ts` and the docs validators read them). Worth regenerating on the next docs pass so they don't mislead future readers / agents.

### N3. AAI multi-tenant risk in credentials service

The credential service (`packages/server/src/services/credentials/index.ts`) requires `req.user.activeWorkspaceId` to be present (the `Credential.workspaceId` column is `NOT NULL`). The `verifyAAIToken` flow sets this via `populateWorkspaceData`, which has a fallback that creates a default workspace if missing. The legacy `verifyToken` (HS256 passport) sets it from the JWT meta. **Both** paths are fragile if their downstream queries fail — and the failure mode is silent (just a 500 on the eventual INSERT).

Worth a separate hardening pass: in `credentialsController.createCredential`, fail fast with a 400 when `activeWorkspaceId` is missing, with a clear message pointing the user at the workspace setup flow. Otherwise the same 500 the user reported here will keep recurring whenever the workspace bootstrap is incomplete.

---

## Suggested follow-up tickets

| Ticket | Surface | Severity |
| --- | --- | --- |
| Verify `event.origin` in OAuth `postMessage` listeners | UI / security | Critical (C1) |
| Random `state` independent of sessionId for Atlassian MCP OAuth | Server + UI | Critical (C2) |
| Move `pendingRegistrations` to Redis | Server | Critical (C3) |
| Sanitize `JSON.stringify(error)` in OAuth callback HTML | Server | Critical (C4) |
| Stop round-tripping `mcp_client_secret` through the browser | Server + UI | Critical (C5) |
| Apply `if (err instanceof InternalFlowiseError) throw err` pattern across `credentialsService` | Server | Critical (C6) |
| Fix `JiraApi` credential description text | Components | High (H1) |
| Normalize `host` field across Jira nodes | Components | Medium (M3) |
| Decide on `/settings/integrations/[[...app]]` route | Web | Medium (M5) |
| Encode JQL when building `getJiraTickets` URLs | AAI utils | Medium (M6) |
| Fail fast on missing `activeWorkspaceId` in credential create | Server | Medium (N3) |
