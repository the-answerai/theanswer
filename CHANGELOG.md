# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Features

* **guardrails:** add configurable fail-open / fail-closed failure semantics with full env → org → chatflow hierarchy, defaulting to `open` for backward compatibility ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** add observability-only (shadow) mode that records real Fiddler violations without blocking, for safe pilot rollouts ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** add `GET /api/v1/guardrails/selftest` diagnostic endpoint that reports resolved config, credential source, live `healthCheck` latency/status, and circuit-breaker state ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** add Failure Mode toggle and Observability-Only switch to admin Guardrails Settings; add per-chatflow Failure Mode override in chatflow guardrails dialog ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** simple presets (Strict / Balanced / Lenient) now set `failureMode` and `observabilityOnly` so degraded-outage behavior matches preset intent; per-chatflow **Observability-only (override)** switch mirrors org admin controls ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** add amber degraded-state banner above chat messages when safety checks could not be evaluated, with plain-English reason text and an in-accordion Health detail block (mode, per-stage reason, HTTP status, latency) ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** add output validation parity for AgentFlow V2 chatflows (was missing entirely; previously only chain and legacy multi-agent flows ran output validation) ([#1059](https://github.com/the-answerai/theanswer/issues/1059))

### Bug Fixes

* **guardrails:** correctly resolve credentials with `Organization` or `Platform` visibility; previously the runtime filtered strictly by `workspaceId` so a single org-visible credential was invisible to chatflows running in a sibling workspace, silently disabling guardrails ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** stop returning fake-safe results on circuit-open / API errors; previously every failure was indistinguishable from "content was safe", which silently degraded enforcement to telemetry under any dependency failure. Failures now surface as a `degraded` health status that callers act on per `failureMode`. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** replace all `console.warn` / `console.error` calls in the guardrails service with structured `logger.*` so failures appear in Datadog/log aggregation streams ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** admin and chatflow guardrails UIs no longer drop `failureMode` / `observabilityOnly` in React state on partial saves: org page applies the merged config returned by the API; Simple/Advanced saves merge onto existing config; chatflow saves merge partial updates and re-read `chatbotConfig` from the save response ([#1059](https://github.com/the-answerai/theanswer/issues/1059))

### Internal

* **guardrails:** typed errors (`FiddlerAuthError`, `FiddlerUpstreamError`, `FiddlerTimeoutError`, `FiddlerNetworkError`, `FiddlerCircuitOpenError`) replace silent fallbacks; new shared `runStage` helper centralizes fail-open/fail-closed branching across all 5 input/output call sites
* **guardrails:** new env vars `FIDDLER_FAILURE_MODE`, `FIDDLER_OBSERVABILITY_ONLY` (registered in `.alphaAgent/spec/env-vars.json`)
* **guardrails:** new `health` field on `chat_message.guardrails_metadata` JSON column (no DB migration; reuses existing TEXT column)

### Plan-Tier Awareness (Freemium vs Paid Fiddler)

* **guardrails:** new `FiddlerUnsupportedError` distinguishes "Fiddler API said this guardrail is not in your plan" (HTTP 404 + `not supported by the freemium guardrails API`) from a real outage. Plan-tier 404s are now classified `reason: "unsupported"` and treated as `ok: true, degraded: false` — they do not block requests, do not show a degraded banner to end users, and do not trip the circuit breaker. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** unsupported endpoints are cached process-wide per `(sha256(apiKey), endpoint)` so a freemium account does not pay a network round-trip per chat for an endpoint Fiddler will never serve. Cache is keyed by hashed API key so flipping a credential to a paid plan invalidates the prior decision automatically. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** `FiddlerGuardrailsService.capabilityMatrix()` probes safety, PII, and faithfulness independently and returns per-endpoint `GuardrailStageStatus`. The `/api/v1/guardrails/selftest` response now exposes a `capabilities` block plus human-readable `notes` when PII or faithfulness are unavailable on the connected plan. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** admin Guardrails Settings page renders a "Plan capabilities" chip row under the connected credential card (Safety / PII / Faithfulness — green available, amber not-included, red degraded) with a Recheck button. Operators see plan limitations once, up front, instead of via a recurring per-chat banner. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** validation accordion on chat messages now describes `reason: "unsupported"` as "Not included in Fiddler plan (skipped silently)" instead of generic `api_error`. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))

### Bug Fixes (continued)

* **guardrails:** fix Fiddler faithfulness 400 Bad Request — payload was being sent as `{data: {input, context}}`. Fiddler's `/v3/guardrails/ftl-response-faithfulness` requires `{data: {prompt, response, context}}`. Plumbed user prompt through `runOutputStage` from both `buildChatflow.ts` and `buildAgentflow.ts`. Faithfulness checks are now skipped (rather than thrown) when no prompt is available. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))
* **guardrails:** stop showing an amber "Safety checks were unavailable (HTTP 404)" banner to end users on freemium Fiddler plans. The 404 was a plan-tier capability gap, not a runtime outage; runtime now treats it as `unsupported` and keeps the chat banner-free. ([#1059](https://github.com/the-answerai/theanswer/issues/1059))

---

## [2.2.9](https://github.com/the-answerai/theanswer/compare/v2.2.8...v2.2.9) (2026-02-04)

### Bug Fixes

* **AGENT-582:** fix chat selector not switching chatflows when viewing previous chat ([c17d792](https://github.com/the-answerai/theanswer/commit/c17d79281d0f1d0244a331909a01a493d79caa22))
* **AGENT-670:** add self-healing validation to fast path steps ([cffe384](https://github.com/the-answerai/theanswer/commit/cffe38493c69a7e34adf029341fe90155fda1621))
* **AGENT-670:** address PR review feedback ([10eee70](https://github.com/the-answerai/theanswer/commit/10eee7027d9e9d0bc4b44274eff815434e9f184a))
* **AGENT-670:** fix race conditions in auth middleware, add tests ([dc79650](https://github.com/the-answerai/theanswer/commit/dc7965074d403bb187b054b22ac9a36fa5cba5f0))
* **AGENT-670:** optimize auth middleware with fast path, remove org overwrite ([3d7f419](https://github.com/the-answerai/theanswer/commit/3d7f419c8f58b333ba404de5b233e59794a24068))
* **guardrails:** apply Fiddler guardrails to embed endpoint ([65621e8](https://github.com/the-answerai/theanswer/commit/65621e8f8654d9b62a0bd169e54cd440d18aa80a))

---

## [2.2.8](https://github.com/the-answerai/theanswer/compare/v2.2.7...v2.2.8) (2026-01-28)

### Bug Fixes

* **SUPPORT-5:** add ConfirmDialog and persist disconnect to API ([4cb3541](https://github.com/the-answerai/theanswer/commit/4cb354130f23bddeac6134273ac290e7e012c9b1))
* **SUPPORT-5:** auto-save on credential connect ([25c750d](https://github.com/the-answerai/theanswer/commit/25c750d1f3979d306cbc187a3c0136ce45f32015))
* **SUPPORT-5:** use contained secondary for credential action buttons ([f8c00c8](https://github.com/the-answerai/theanswer/commit/f8c00c82a237b2d12ecbf5063c9e5a7072433d3e))

---

## [2.2.7](https://github.com/the-answerai/theanswer/compare/v2.2.6...v2.2.7) (2026-01-28)

### Bug Fixes

* admin dashboard grid and guardrails credential management ([e74f76e](https://github.com/the-answerai/theanswer/commit/e74f76ef5b2654ed76b4f9da4e32a30a112257b4))
* **SUPPORT-5:** add edit loading state, disconnect guard, and typed dialog props ([61e9bfa](https://github.com/the-answerai/theanswer/commit/61e9bfaed5d54469a57278577907efd90b1c4ef0))
* **SUPPORT-5:** add error snackbar on credential load, responsive admin grid, allow disconnect when disabled ([b92d38f](https://github.com/the-answerai/theanswer/commit/b92d38fba873088c7ae44a4a5707ce6afe0976b7))
* **SUPPORT-5:** document credential count logic, show ID in read-only mode ([96bca88](https://github.com/the-answerai/theanswer/commit/96bca885727e7a3ddb87e866f11ebc85d312cb34))
* **SUPPORT-5:** fix loading race condition and add error snackbars ([0ff2721](https://github.com/the-answerai/theanswer/commit/0ff2721979a9943355fd11b8175bc7919f973a73))
* **SUPPORT-5:** pass credential as data prop for edit dialog ([cb25d1a](https://github.com/the-answerai/theanswer/commit/cb25d1a1c7f717f564f2a009d54156d3cd501d3d))
* **SUPPORT-5:** refine read-only state with disconnect/change and edit modal ([78743c0](https://github.com/the-answerai/theanswer/commit/78743c08c08c8cc448483e4b05cff368155e9564))
* **SUPPORT-5:** show read-only state for cross-workspace Fiddler credentials ([c589c90](https://github.com/the-answerai/theanswer/commit/c589c901a0c133013eaefb1ded7be2a15a8ca909))

### Code Refactoring

* **SUPPORT-5:** clean up MasterConfig snackbar helpers, types, and dead code ([45398d3](https://github.com/the-answerai/theanswer/commit/45398d30eea02f0bf451d9505f16a67e4e1fc3b9))

---

## [2.2.6](https://github.com/the-answerai/theanswer/compare/v2.2.5...v2.2.6) (2026-01-26)

### Bug Fixes

* **AGENT-586:** fix AppDrawer overlapping page content ([455dc39](https://github.com/the-answerai/theanswer/commit/455dc39f4cc4072fe85614603cdb47bd808bf496))
* **AGENT-586:** remove unnecessary zIndex from AppDrawer ([4ff5e4e](https://github.com/the-answerai/theanswer/commit/4ff5e4e69e2cc64de9b5280937d29b6d5d00a8c6))
* exclude scripts directory from eslint ([3809952](https://github.com/the-answerai/theanswer/commit/3809952ad67cd2d531095c1902224c0266ee3209))
* resolve all eslint lint errors ([4e28dd6](https://github.com/the-answerai/theanswer/commit/4e28dd6c8b041ab2e718f4eecaf581a3217e8310))
* resolve remaining lint errors for CI ([52fbf2f](https://github.com/the-answerai/theanswer/commit/52fbf2f100cf9498668ad1f23f7ab362ae74da5a))
* simplify no-console rule to always be warning ([8e273f3](https://github.com/the-answerai/theanswer/commit/8e273f38838098f30a17dba6765501b8efa423dd))
* **SUPPORT-18:** auto-detect JWT tokens in browser extension requests ([a9e895e](https://github.com/the-answerai/theanswer/commit/a9e895ee6964dfcbdd42eae66fed201200b377f0))

---

## [2.2.5](https://github.com/the-answerai/theanswer/compare/v2.2.4...v2.2.5) (2026-01-23)

### Bug Fixes

* **AGENT-639:** add organizationId alias to buildAgentGraph options ([85b8f80](https://github.com/the-answerai/theanswer/commit/85b8f808f62c36730cc116e91af0e2b9940bbd39))
* **AGENT-639:** use API key's organizationId for auth context ([0b9e915](https://github.com/the-answerai/theanswer/commit/0b9e9159d919826772360954086478a87e2b4cbc))

---

## [2.2.4](https://github.com/the-answerai/theanswer/compare/v2.2.3...v2.2.4) (2026-01-23)

### Bug Fixes

* **AGENT-639:** pass entity organizationId/workspaceId in vector store options ([734558e](https://github.com/the-answerai/theanswer/commit/734558e289a64137a42078bc561d2c1969edd0e9))
* **ContentfulLoader:** exclude archived entries from query results ([ee96b8c](https://github.com/the-answerai/theanswer/commit/ee96b8cbfd357249a9ebd6fc66348be28623e983))

---

## [2.2.3](https://github.com/the-answerai/theanswer/compare/v2.2.2...v2.2.3) (2026-01-22)

### Bug Fixes

* **AGENT-559:** add API_HOST validation across all Google OAuth files ([91f96f5](https://github.com/the-answerai/theanswer/commit/91f96f5d7c63c8a99d91c8d795a06e9a8b42bb13))
* **AGENT-559:** add API_HOST validation for Google OAuth ([66addc9](https://github.com/the-answerai/theanswer/commit/66addc953b3fb55d967aa837d898be41a8fa71d8))
* **AGENT-559:** use API_HOST for Google OAuth callback URL ([6e2bcff](https://github.com/the-answerai/theanswer/commit/6e2bcff8e44892b495cab35befe60b942f44167e))

---

## [2.2.2](https://github.com/the-answerai/theanswer/compare/v2.2.1...v2.2.2) (2026-01-22)

### Bug Fixes

* **AGENT-639:** include workspaceData in JWT auth req.user ([dad085b](https://github.com/the-answerai/theanswer/commit/dad085b89156a5a0d29dad4f991de6fb2899f6d4))

---

## [2.2.1](https://github.com/the-answerai/theanswer/compare/v2.2.0...v2.2.1) (2026-01-22)

### Bug Fixes

* **AGENT-639:** add organizationId to queryVectorStore options ([ad1c853](https://github.com/the-answerai/theanswer/commit/ad1c853fe22368dfeff6db43f775e106082af384))
* **AGENT-639:** populate organizationId and userId when creating API keys ([4d51edf](https://github.com/the-answerai/theanswer/commit/4d51edf3f3ed2ded5be25e12afb2162b73949411))

---

## [2.2.0](https://github.com/the-answerai/theanswer/compare/v2.1.5...v2.2.0) (2026-01-21)

### Features

* **AGENT-573:** use default chatflow for chat navigation ([2c10cff](https://github.com/the-answerai/theanswer/commit/2c10cffee73a71239928efdb86d85e3cdd192fe2))

### Bug Fixes

* **AGENT-405:** add /sidekick-studio prefix to agentflow URL after save ([5d93f7c](https://github.com/the-answerai/theanswer/commit/5d93f7ca60f82e12dfa3bdb6b2b9e91036568a63))
* **AGENT-612:** fix agent avatar images in canvas chat ([56edb2e](https://github.com/the-answerai/theanswer/commit/56edb2e252b53f6f15ae61d8f8fe33b4c9a26cff))
* **AGENT-617:** forward credential props in recursive NodeInputHandler tab calls ([de1c222](https://github.com/the-answerai/theanswer/commit/de1c22288fb39d47f85dba68055b94fc9a426f27))
* **AGENT-626:** redirect to Auth0 login instead of non-existent /login route ([6ca5379](https://github.com/the-answerai/theanswer/commit/6ca5379af28b36153430768c1bb70f387215b20a))
* **AGENT-639:** use workspaceId filter in queryVectorStore ([c26810d](https://github.com/the-answerai/theanswer/commit/c26810d038a47693a6280c88cf78e63688829ff1))
* **SUPPORT-12:** add enforceAbility middleware and fix response format ([f6c2bbc](https://github.com/the-answerai/theanswer/commit/f6c2bbc26affa19d57da6479107a6cb5fda4d919))
* **SUPPORT-12:** add multi-tenancy authorization to credential refresh ([72d2704](https://github.com/the-answerai/theanswer/commit/72d27045d69074401d394b4c97cfc5dacad20da0))
* **SUPPORT-12:** restore AAI credential refresh routes lost in Flowise merge ([34d53a1](https://github.com/the-answerai/theanswer/commit/34d53a1f66aba8b7fe97b70402ea84df3b5527fb))

---

## [2.1.5](https://github.com/the-answerai/theanswer/compare/v2.1.4...v2.1.5) (2026-01-21)

### Bug Fixes

* **AGENT-635:** add IF EXISTS to migration down() for idempotency ([a857c1c](https://github.com/the-answerai/theanswer/commit/a857c1cb142e64e9b9d8085d2df1fcb849d33371))

---

## [2.1.4](https://github.com/the-answerai/theanswer/compare/v2.1.3...v2.1.4) (2026-01-21)

### Bug Fixes

* **AGENT-634:** populate workspace data for API key auth users ([6658da5](https://github.com/the-answerai/theanswer/commit/6658da529f2825f8e021dbc7abe58260ae4abbf5))
* **AGENT-635:** make AddOrganizationConfig migration idempotent ([655ba49](https://github.com/the-answerai/theanswer/commit/655ba49a61068a91ff1a6b0de1a0911abed2715b))
* **AGENT-638:** enable Langfuse tracing for agentflows via env vars ([ffe261d](https://github.com/the-answerai/theanswer/commit/ffe261dde1539494f52129de75a2f2703bce4aa2))

---

## [2.1.3](https://github.com/the-answerai/theanswer/compare/v2.1.2...v2.1.3) (2026-01-21)

### Bug Fixes

* **AGENT-633:** custom tools not appearing in agent nodes ([0de0073](https://github.com/the-answerai/theanswer/commit/0de00736d0bfb3658d9e2d25fbea2d4d6329edf5))

### Code Refactoring

* **AGENT-633:** simplify CustomTool to use workspace RBAC ([eded456](https://github.com/the-answerai/theanswer/commit/eded456f5a6d3958837c92f46ad9cf76b170fdf0))

---

## [2.1.2](https://github.com/the-answerai/theanswer/compare/v2.1.1...v2.1.2) (2026-01-20)

### Bug Fixes

* update answeragent-mcp version ([ac710e6](https://github.com/the-answerai/theanswer/commit/ac710e696b7a4950de10042a5325e55777bfa98d))

---

## [2.1.1](https://github.com/the-answerai/theanswer/compare/v2.1.0...v2.1.1) (2026-01-20)

### Bug Fixes

* **components:** remove userId override in dropdowns to respect workspace filtering ([50f01a1](https://github.com/the-answerai/theanswer/commit/50f01a16ba8ce9552d384020770daa64d45280fd)), closes [#853](https://github.com/the-answerai/theanswer/issues/853)

---

## [2.1.0](https://github.com/the-answerai/theanswer/compare/v2.0.1...v2.1.0) (2026-01-19)

### Features

* **SUPPORT-9:** add edit and delete credential features to Fiddler guardrails ([0565fc7](https://github.com/the-answerai/theanswer/commit/0565fc773f257a0751540594f0ede69ff0f51be8))

### Bug Fixes

* **AGENT-630:** backup all user-referenced orgs to preserve Auth0 alignment ([f7f6fdf](https://github.com/the-answerai/theanswer/commit/f7f6fdf10b24a2bc0c77d45453eb4a3e290233d4))
* **AGENT-630:** fix orphaned users' organizationId before workspace creation ([f4a6a29](https://github.com/the-answerai/theanswer/commit/f4a6a2944c775f07661b010efa9fedb30e813373))
* **AGENT-630:** handle invalid organizationId in AAI migration ([20e3e0e](https://github.com/the-answerai/theanswer/commit/20e3e0eba85ca085cae1c0410c1ebc44a5f617da))
* **SUPPORT-8:** force Organization visibility for Fiddler credentials ([61bd5b7](https://github.com/the-answerai/theanswer/commit/61bd5b7db4559bcd20f66fbaa118c84d3a571388))

---

## [2.0.1](https://github.com/the-answerai/theanswer/compare/v2.0.0...v2.0.1) (2026-01-13)

### Bug Fixes

* **AGENT-620:** remove email unique constraint from user table ([f90d8d3](https://github.com/the-answerai/theanswer/commit/f90d8d34693a8bea184a9d20327278aaf72e04e3))

---

## [2.0.0](https://github.com/the-answerai/theanswer/compare/v1.13.0...v2.0.0) (2026-01-13)

This is a **major release** that upgrades the core Flowise engine from v1.x to **v3.0.11**, introduces **AgentFlow V2**, adds **40+ new components**, and implements critical security fixes for multi-tenant workspace isolation.

### Table of Contents
- [Breaking Changes](#breaking-changes)
- [Flowise 3.0.11 Upgrade](#flowise-3011-upgrade)
- [AgentFlow V2](#agentflow-v2)
- [New Components](#new-components)
- [Authentication & Multi-Tenancy](#authentication--multi-tenancy)
- [Database Migrations](#database-migrations)
- [UI/UX Improvements](#uiux-improvements)
- [Bug Fixes](#bug-fixes)
- [Security](#security)
- [Infrastructure](#infrastructure)
- [Deprecations](#deprecations)

---

### Breaking Changes

#### 1. AGENT-589: Cross-Workspace Chat Isolation (CRITICAL SECURITY FIX)

**Severity:** CRITICAL - Data Leak Vulnerability

**Vulnerability Description:**

The previous chat query logic contained an OR condition that allowed users to see chats from ALL workspaces they had ever accessed:

```typescript
// VULNERABLE CODE (v1.x)
queryBuilder.andWhere(
    '(chatflow.workspaceId IN (:...workspaceIds) OR chat.ownerId = :userId)',
    { workspaceIds: user.assignedWorkspaces, userId: user.id }
)
```

This meant:
- A user in Workspace A could see confidential chats from Workspace B
- Switching workspaces showed a combined view of ALL workspace chats
- Enterprise customers with multiple workspaces had no data isolation
- Compliance requirements (SOC2, HIPAA, GDPR) for data separation were violated

**The Fix (3-part remediation):**

**Part 1:** Changed from filtering by all `assignedWorkspaces` to filtering by `activeWorkspaceId` only:
```typescript
// FIXED: Filter by active workspace only
queryBuilder.andWhere(
    'chatflow.workspaceId = :activeWorkspaceId',
    { activeWorkspaceId: user.activeWorkspaceId }
)
```

**Part 2:** Removed the OR condition with `ownerId` entirely - workspace now determines visibility:
```typescript
// No more fallback to ownerId - workspace is the boundary
if (!user.activeWorkspaceId) {
    // Security default: no workspace = no data
    queryBuilder.andWhere('1 = 0')
}
```

**Part 3:** Added user ownership filter to prevent cross-user access within workspace:
```typescript
// Users only see their OWN chats
queryBuilder.andWhere('chat.ownerId = :userId', { userId: user.id })
```

**New Behavior:**
| Scenario | v1.x Behavior | v2.0.0 Behavior |
|----------|--------------|-----------------|
| User switches from Workspace A to B | Sees chats from A AND B | Sees ONLY chats from B |
| User has no active workspace | Sees all owned chats | Sees NO chats (security default) |
| User views workspace chats | Sees all workspace chats | Sees only their OWN chats |
| Admin views workspace | Sees all organization chats | Sees only active workspace chats |

**Migration Impact:**
- Users will no longer see chats from other workspaces
- Historical chats remain in database but are filtered by workspace
- If users need access to old chats, they must switch to the correct workspace
- **This is intentional for data isolation and security compliance**

**Affected Files:**
- `packages/server/src/services/chat-messages/index.ts`
- `packages/server/src/services/chatflows/index.ts`

**Commits:** `320175295`, `a1a2bfd49`, `d5a57fce3`

---

#### 2. AGENT-593: Chatflow Configuration Data Loss (CRITICAL DATA INTEGRITY FIX)

**Severity:** CRITICAL - Silent Data Loss

**Vulnerability Description:**

When importing/exporting chatflows, critical configuration fields were silently dropped due to missing field mappings. Users would export a fully configured chatflow and import it with missing settings.

**Fields That Were Lost:**
- `answersConfig` - TheAnswer-specific configuration
- `browserExtConfig` - Browser extension settings
- `chatbotConfig` - Chatbot widget configuration
- `speechToText` - STT settings
- `textToSpeech` - TTS settings
- `followUpPrompts` - Follow-up prompt configuration
- `apiConfig` - API settings
- `analytic` - Analytics configuration

**Impact:**
- Users lost hours of configuration work on import
- Exported chatflows were incomplete
- Migrating between environments required manual reconfiguration
- No warning or error was shown

**The Fix:**

Added all missing fields to `handleLoadFlow` in both canvas and agentflowsv2:

```typescript
// Now preserves ALL configuration
if (flowData.answersConfig) chatflow.answersConfig = flowData.answersConfig
if (flowData.browserExtConfig) chatflow.browserExtConfig = flowData.browserExtConfig
if (flowData.chatbotConfig) chatflow.chatbotConfig = flowData.chatbotConfig
if (flowData.speechToText) chatflow.speechToText = flowData.speechToText
if (flowData.textToSpeech) chatflow.textToSpeech = flowData.textToSpeech
if (flowData.followUpPrompts) chatflow.followUpPrompts = flowData.followUpPrompts
if (flowData.apiConfig) chatflow.apiConfig = flowData.apiConfig
if (flowData.analytic) chatflow.analytic = flowData.analytic
```

**Commits:** `cf5dfa450`, `2b7a67501`, `2bb834d99`

---

#### 3. Request Header Change (API Breaking Change)

**Severity:** HIGH - Requires Client Code Updates

All API requests from the web app now use a new authentication header:

```typescript
// BEFORE (v1.x)
headers: { 'x-request-from': 'internal' }

// AFTER (v2.0.0)
headers: { 'x-request-from': 'aai' }
```

**Why This Changed:**

The new `aai` header triggers Auth0 RS256 JWT verification as the primary authentication method, providing:
- Stronger cryptographic verification
- Better alignment with Auth0 standards
- Clear separation from enterprise HS256 authentication

**Files That Must Be Updated:**

Any custom integrations or clients making direct API calls must update their headers:

| File/Integration | Update Required |
|-----------------|-----------------|
| Custom API clients | Change header value |
| Browser extensions | Change header value |
| External integrations | Change header value |
| Mobile apps | Change header value |

**Affected AAI Files (already updated):**
- `apps/web/app/(Main UI)/(Chat UI)/chat/[chatId]/page.tsx`
- `apps/web/app/api/images/archive/route.ts`
- `apps/web/app/api/images/generate/route.ts`
- `packages-answers/ui/src/AnswersContext.tsx`
- `packages-answers/ui/src/CsvTransfomer/ProcessCsv.tsx`
- `packages-answers/ui/src/CsvTransfomer/ProcessingHistory.tsx`
- `packages-answers/ui/src/ImageCreator/ImageCreator.Client.tsx`
- `packages-answers/ui/src/Profile/Profile.tsx`
- `packages-answers/ui/src/VideoCreator/VideoCreator.Client.tsx`
- `packages-answers/utils/src/findSidekickById.ts`
- `packages-answers/utils/src/findSidekicksForChat.ts`
- `packages-answers/utils/src/getChats.ts`
- `packages/ui/src/api/client.js`

---

#### 4. AgentFlow V1 Deprecated

**Severity:** MEDIUM - Migration Recommended

AgentFlow V1 (Sequential Agents based on LangGraph) is deprecated in favor of AgentFlow V2.

**What Happens:**
- V1 flows continue to work
- V1 flows are labeled as "Agentflow V1" in the UI
- No new V1 features will be developed
- UI shows migration recommendation

**V1 vs V2 Incompatibilities:**

| Aspect | V1 (Sequential Agents) | V2 (AgentFlow) |
|--------|------------------------|----------------|
| Flow Type | `MULTIAGENT` | `AGENTFLOW` |
| State | LangGraph `StateGraph` | Built-in Flow State |
| Memory | External `BaseCheckpointSaver` | Built-in options |
| Execution | `init()` returns LangGraph nodes | `run()` returns output |
| Nodes | 12 node types | 16 node types |

**Migration Path:**
1. Create new AgentFlow V2
2. Recreate logic using V2 nodes
3. Test thoroughly
4. Archive V1 flow

---

#### 5. Enterprise Database Schema Restructure (CRITICAL)

**Severity:** CRITICAL - Requires Database Backup

The enterprise database schema has been completely restructured to support the new workspace-based RBAC system.

**Tables Restructured:**

| Table | Changes |
|-------|---------|
| `user` | New schema: `name`, `email`, `credential`, `tempToken`, `tokenExpiry`, `status`, `createdBy`, `updatedBy` |
| `organization` | New schema: `customerId`, `subscriptionId`, `createdBy`, `updatedBy` |

**New Tables Created:**

| Table | Purpose |
|-------|---------|
| `login_method` | SSO configurations per organization |
| `role` | Permission definitions with JSON permissions array |
| `organization_user` | User-organization junction with roleId and status |
| `workspace_user` | User-workspace junction with roleId, status, lastLogin |

**Migration Process:**

The migration uses a "sandwich" approach to preserve AAI-specific data:

1. **`BackupAAIData1737076223690`** (runs FIRST)
   - Creates `aai_user_backup` table
   - Creates `aai_organization_backup` table
   - Preserves: `auth0Id`, `stripeCustomerId`, `organizationId`, `trialPlanId`, `defaultChatflowId`

2. **`RefactorEnterpriseDatabase1737076223692`** (runs SECOND)
   - Restructures user and organization tables
   - Creates new junction tables
   - **WARNING: This migration has an empty `down()` method - cannot be auto-rolled back**

3. **`AAIRestoreDataAndCreateWorkspaces1737076223693`** (runs THIRD)
   - Restores AAI-specific columns
   - Restores data from backup tables
   - Creates "Default Workspace" per organization
   - Creates "Personal Workspace" per user
   - Links users to workspaces via `workspace_user`

**⚠️ CRITICAL: BACKUP YOUR DATABASE BEFORE MIGRATING**

---

### Flowise 3.0.11 Upgrade

This release incorporates all changes from Flowise upstream versions 2.2.7 through 3.0.11, representing approximately **400+ commits** of improvements.

#### Key Upstream Features Included

| Feature | Description |
|---------|-------------|
| AgentFlow V2 | Complete redesign of multi-agent workflows |
| MCP Updates | Model Context Protocol improvements and SSE support |
| Evaluation System | Dataset-based evaluation for chatflows and agentflows |
| Execution Tracking | Full execution history with shareable links |
| Pagination | New pagination system for large datasets |
| Text-to-Speech | Built-in TTS support |
| Chatflow Versioning | Version tracking and S3 storage support |

---

### AgentFlow V2

AgentFlow V2 is a **complete redesign** of the multi-agent workflow system, replacing the LangGraph-based Sequential Agents with a new, more flexible architecture.

#### What's New in AgentFlow V2

| Feature | Description |
|---------|-------------|
| **Simplified Model Config** | Each node selects its own LLM via dropdown (no wiring required) |
| **Built-in Flow State** | State defined in Start node, updateable by any node |
| **Execution Tracking** | Full history with `Execution` entity and shareable links |
| **Form Input Support** | Start node supports form-based input with validation |
| **Rich Variable System** | `{{ $question }}`, `{{ $form.field }}`, `{{ nodeId.output }}`, etc. |
| **Memory Options** | Built-in ephemeral/persistent memory configuration |
| **Human-in-the-Loop** | Native Human Input node for approval workflows |
| **Iteration Support** | Process arrays in parallel or sequence |

#### New AgentFlow V2 Nodes (16 total)

| Node | Description |
|------|-------------|
| **Start** | Entry point with chat/form input, state definition |
| **LLM** | Direct LLM invocation with memory options |
| **Agent** | Full agent with tools, knowledge bases, structured output |
| **Condition** | If/Else branching with comparisons |
| **ConditionAgent** | LLM-based routing decisions |
| **Human Input** | Human-in-the-loop approval/rejection |
| **Loop** | Loop back to previous node with max iterations |
| **Iteration** | Process array items in parallel/sequence |
| **HTTP** | HTTP requests (GET/POST/PUT/DELETE/PATCH) |
| **Execute Flow** | Call other chatflows/agentflows |
| **Custom Function** | JavaScript code execution |
| **Tool** | Single tool invocation |
| **Direct Reply** | Send immediate response |
| **Retriever** | Vector store retrieval |
| **Sticky Note** | Canvas annotations |

#### New Marketplace Templates

- Agentic RAG V2
- Deep Research V2 / With Multi-turn / With Subagents
- Agents Handoff
- Email Reply HITL Agent
- Financial Research Agent
- Human In The Loop
- Interacting With API
- Iterations
- SQL Agent
- Simple RAG
- Slack Agent
- Structured Output
- Supervisor Worker
- Translator
- Workplace Chat

#### Migration from V1

V1 Sequential Agent nodes are **NOT compatible** with V2 AgentFlow nodes. Manual migration is required:
- V1 type: `MULTIAGENT` → V2 type: `AGENTFLOW`
- V1 uses LangGraph State → V2 uses Flow State
- V1 requires external memory → V2 has built-in memory

**Commits:** `7924fbce0` (Feature/agentflow v2), `e17994d8f` (Evaluations for Agentflows)

---

### New Components

#### New Chat Models

| Component | Description | Commit |
|-----------|-------------|--------|
| **ChatCometAPI** | Unified API gateway for multiple LLM providers (GPT-5, Claude, Gemini) | `099cf481b` |
| **ChatSambanova** | High-performance AI inference (Llama 3.3 70B default) | `bf1ddc3be` |

#### Model Updates

| Model | Commit |
|-------|--------|
| Claude 4, Claude Opus 4.1 | `9bc6bfed6`, `fbae51b26` |
| Claude Sonnet 4.5 | `28b0174ee`, `b50193249` |
| GPT-5 series | `3b1b4dc5f`, `fa15b6873` |
| GPT-4.1 series | `e75c831be` |
| Azure GPT-5/4.1 | `79023c890` |
| Gemini 2.5 Flash | `e35a126b4` |
| Gemini Thinking Budget | `f3d5b7766` |
| Llama 4 on Groq | `5faff5205` |
| AWS Bedrock OSS models | `a5a728fd0` |

#### New Tools (15+)

| Tool | Description | Commit |
|------|-------------|--------|
| **AWS SNS** | Publish messages to AWS SNS topics | `32e5b13c4` |
| **AWS DynamoDB KV Storage** | Store/retrieve versioned values with auto-versioning | `736c2b11a` |
| **JSONPathExtractor** | Extract values from JSON using path expressions | `b12647281` |
| **Jira** | Full Jira operations (issues, comments, users, JQL) | `9d9135bed` |
| **Gmail** | Full Gmail operations (drafts, messages, labels, threads) | `30c4180d9` |
| **Google Docs** | Create, read, update documents, text manipulation | `2387a06ce` |
| **Google Calendar** | Calendar event management | `30c4180d9` |
| **Google Drive** | File management | `30c4180d9` |
| **Google Sheets** | Spreadsheet operations | `30c4180d9` |
| **Microsoft Teams** | Channels, chats, messages management | `30c4180d9` |
| **Microsoft Outlook** | Calendars, events, messages | `30c4180d9` |
| **Arxiv** | Search academic papers | - |
| **RequestsPut/Delete** | HTTP PUT and DELETE tools | - |

#### New Document Loaders

| Loader | Description | Commit |
|--------|-------------|--------|
| **Oxylabs** | Web scraping via Oxylabs API | `a25c5c451` |
| **Google Sheets** | Load spreadsheet data as documents | - |
| **Microsoft Excel** | Load .xlsx, .xls, .xlsm, .xlsb files | `fbe9f34a6` |
| **Microsoft PowerPoint** | Load PowerPoint files | `fbe9f34a6` |
| **Microsoft Word** | Load Word documents | - |

#### New Vector Stores

| Store | Description | Commit |
|-------|-------------|--------|
| **AWS Kendra** | Intelligent search with document retrieval | `af1464f7c` |
| **Teradata VectorStore** | Teradata vector storage support | `ac565b898` |

#### New MCP Servers

| Server | Description | Commit |
|--------|-------------|--------|
| **Supergateway MCP** | Run MCP stdio servers over SSE/WebSockets | `954e6c88f` |
| **Teradata MCP** | Remote HTTP streamable MCP for Teradata | `dd284e37c` |

#### New Credentials (15 total)

- `AgentflowApi`, `CometApi`, `ElevenLabsApi`
- `GmailOAuth2`, `GoogleCalendarOAuth2`, `GoogleDocsOAuth2`, `GoogleDriveOAuth2`, `GoogleSheetsOAuth2`
- `MicrosoftOutlookOAuth2`, `MicrosoftTeamsOAuth2`
- `OxylabsApi`, `SambanovaApi`
- `TeradataBearerToken`, `TeradataTD2`, `TeradataVectorStoreApi`

#### Other Notable Additions

| Component | Description | Commit |
|-----------|-------------|--------|
| Cheerio Web Scraper | Fast web scraping node | `925ca7be8` |
| FireCrawl Extract Tool | Updated Firecrawl with extraction | `572fb31a1` |
| Mem0 Memory Node | Mem0 integration | `13fce4585` |
| Perplexity Node | Perplexity AI integration | `df26e8aef` |
| LiteLLM Component | LiteLLM proxy support | `d75e84709` |
| Text-to-Speech | Built-in TTS | `9b8fee3d8` |
| OpenAI Response API | OpenAI response format support | `b60821964` |
| Gemini Built-In Tools | Native Gemini tools | `f56076813` |

---

### Authentication & Multi-Tenancy

This release implements a complete overhaul of the authentication and authorization system, adopting Flowise's native RBAC while maintaining Auth0 integration for TheAnswer.

#### Authentication Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Request Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request → Check Whitelist → Check Header → Auth Method         │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Whitelisted │ YES │   Pass       │     │              │    │
│  │  Endpoint?   │────▶│   Through    │     │              │    │
│  └──────┬───────┘     └──────────────┘     │              │    │
│         │ NO                                │              │    │
│         ▼                                   │              │    │
│  ┌──────────────┐     ┌──────────────┐     │              │    │
│  │ x-request-   │ aai │ verifyAAI    │     │              │    │
│  │ from header? │────▶│ Token        │     │              │    │
│  └──────┬───────┘     └──────┬───────┘     │              │    │
│         │ internal          │              │              │    │
│         ▼                   ▼              │              │    │
│  ┌──────────────┐     ┌──────────────┐     │              │    │
│  │ Enterprise   │     │ Auth0 RS256  │ FAIL│ Enterprise   │    │
│  │ HS256        │     │ JWT Check    │────▶│ HS256        │    │
│  └──────────────┘     └──────────────┘     │ Fallback     │    │
│                             │ SUCCESS      └──────┬───────┘    │
│                             ▼                     │ FAIL       │
│                       ┌──────────────┐            ▼            │
│                       │ Enrich User  │     ┌──────────────┐    │
│                       │ Data         │     │ 401          │    │
│                       └──────────────┘     │ Unauthorized │    │
│                                            └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Auth0 RS256 JWT Verification (Primary)

**Location:** `packages/server/src/middlewares/authentication/verifyAAIToken.ts`

The new `verifyAAIToken` middleware handles `x-request-from: aai` header requests with Auth0 RS256 JWT as the primary verification method.

**Implementation Details:**

```typescript
// JWT Configuration
const jwtCheck = auth({
    authRequired: true,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGN_ALG ?? 'RS256'
})
```

**Authentication Flow:**

1. **Primary: Auth0 RS256 JWT**
   - Validates token signature using Auth0's public key
   - Verifies audience matches `AUTH0_AUDIENCE`
   - Verifies issuer matches `AUTH0_ISSUER_BASE_URL`
   - Extracts `org_id` from token payload

2. **Fallback: Enterprise HS256**
   - Used when Auth0 verification fails
   - Maintains backwards compatibility
   - Uses passport-based verification

3. **Failure: 401 Unauthorized**
   - No anonymous access allowed
   - Both methods must fail to return 401

**Organization Validation:**

```typescript
// Validates user belongs to allowed Auth0 organizations
const userOrgId = authPayload.org_id
const allowedOrgs = process.env.AUTH0_ORGANIZATION_ID?.split(',')
const isValidOrg = userOrgId && allowedOrgs?.includes(userOrgId)

if (!isValidOrg) {
    return res.status(401).json({
        message: "Unauthorized: Organization doesn't match"
    })
}
```

**Required Environment Variables:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `AUTH0_AUDIENCE` | API identifier | `https://api.theanswer.ai` |
| `AUTH0_ISSUER_BASE_URL` | Auth0 tenant URL | `https://theanswer.auth0.com` |
| `AUTH0_TOKEN_SIGN_ALG` | Signing algorithm | `RS256` (default) |
| `AUTH0_ORGANIZATION_ID` | Allowed org IDs | `org_abc123,org_def456` |

**Commit:** `e689e9b40`

---

#### Workspace-Based RBAC System

**Location:** `packages/server/src/services/*/index.ts`

Adopted Flowise's native RBAC system with workspace-based filtering replacing the previous organization-based filtering.

**Key Changes:**

| Before (v1.x) | After (v2.0.0) |
|---------------|----------------|
| Filter by `organizationId` | Filter by `workspaceId` |
| Organization-level permissions | Workspace-level permissions |
| Single permission set per user | Role-based permissions per workspace |

**Service Layer Changes:**

```typescript
// BEFORE: Organization-based filtering
const chatflows = await repository.find({
    where: { organizationId: user.organizationId }
})

// AFTER: Workspace-based filtering
const chatflows = await repository.find({
    where: { workspaceId: user.activeWorkspaceId }
})
```

**Permission Resolution:**

Permissions are resolved in priority order:

1. **Auth0 Admin Role** → Wildcard permissions `['*']`
2. **Workspace Role** → Permissions from `role.permissions` JSON
3. **Default** → No permissions (access denied)

```typescript
// Permission resolution logic
if (roles?.includes('Admin')) {
    permissions = ['*']  // Full access
} else if (workspaceData.roleId) {
    const role = await RoleRepository.findOne({
        where: { id: workspaceData.roleId }
    })
    permissions = JSON.parse(role.permissions)  // Role-specific
}
```

**RBAC Enforcement:**

```typescript
// In controllers - enforceAbility middleware
router.get('/', enforceAbility('Chatflow'), controller.getAll)

// In services - workspace filtering
const chatflows = await queryBuilder
    .where('chatflow.workspaceId = :workspaceId', {
        workspaceId: user.activeWorkspaceId
    })
    .getMany()
```

**Commit:** `bc6679fce`

---

#### User Enrichment System

**Location:** `packages/server/src/aai/auth/enrichUserData.ts`

Centralized user enrichment logic shared between `/auth/me` endpoint and `aaiPostAuthMiddleware`.

**Enriched User Data Structure:**

```typescript
interface EnrichedUserData {
    // === User Identity ===
    id: string                    // Database user ID
    auth0Id?: string              // Auth0 subject ID
    email: string                 // User email
    name?: string                 // Display name

    // === Organization Context ===
    organizationId: string        // Primary organization
    stripeCustomerId?: string     // Stripe customer ID
    defaultChatflowId?: string    // User's default chatflow

    // === RBAC Fields ===
    roles: string[]               // Auth0 roles (e.g., ['Admin', 'User'])
    permissions: string[]         // Resolved permissions (e.g., ['chatflow:read', 'chatflow:write'])

    // === Subscription/Billing (Flowise Parity) ===
    activeOrganizationSubscriptionId: string
    activeOrganizationCustomerId: string
    activeOrganizationProductId: string
    features: Record<string, string>  // Feature flags from subscription

    // === Workspace Fields ===
    activeWorkspaceId?: string    // Currently active workspace
    activeOrganizationId?: string // Active organization
    activeWorkspace?: string      // Workspace name
    roleId?: string               // Role in active workspace
    isOrganizationAdmin?: boolean // Admin status

    // === Workspace List ===
    assignedWorkspaces?: Array<{
        id: string
        name: string
        role: string              // Role name
        organizationId: string
    }>
}
```

**Enrichment Process:**

```
1. Fetch user from database by auth0Id
2. Get organization data with Stripe info
3. Get workspace assignments from workspace_user
4. Resolve permissions from workspace role
5. Get subscription features
6. Return enriched user object
```

**Commit:** `8f119fb90`

---

#### AAIAuthProvider for Redux Store

**Location:** `apps/web/components/AAIAuthProvider.tsx`

Client component that dispatches `loginSuccess` to Redux store with enriched user data from server-side session.

**Implementation:**

```typescript
'use client'
import { useEffect } from 'react'
import { store } from 'flowise-ui/src/store'
import { loginSuccess } from 'flowise-ui/src/store/reducers/authSlice'

interface AAIAuthProviderProps {
    user: EnrichedUserData | null
    children: React.ReactNode
}

export function AAIAuthProvider({ user, children }: AAIAuthProviderProps) {
    useEffect(() => {
        if (user) {
            // Sync Auth0 session to Redux for Flowise UI compatibility
            store.dispatch(loginSuccess({
                ...user,
                features: user.features || {}
            }))
        }
    }, [user])

    return <>{children}</>
}
```

**Usage in Layout:**

```typescript
// apps/web/app/(Main UI)/(Studio Layout)/layout.tsx
export default async function StudioLayout({ children }) {
    const session = await getCachedSession()

    return (
        <AAIAuthProvider user={session?.user}>
            <AppLayout apiHost={apiHost} accessToken={session?.accessToken}>
                {children}
            </AppLayout>
        </AAIAuthProvider>
    )
}
```

**Why This Is Needed:**
- Flowise UI expects user data in Redux store
- Auth0 session is server-side only
- This bridges the gap between server session and client state

**Commit:** `69909baf1`

---

#### Enterprise Features for Auth0 Admins

Users with the `Admin` role in Auth0 automatically get all enterprise features enabled:

```typescript
const features = roles?.includes('Admin')
    ? getAllFeaturesEnabled()  // All features = true
    : getSubscriptionFeatures(organizationId)  // Based on subscription
```

**Commit:** `50edca5f3`

---

### Workspace System

This release introduces a comprehensive workspace system for multi-tenant resource isolation.

#### Workspace Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Organization                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Default Workspace                      │    │
│  │  (Org-level resources, shared across users)              │    │
│  │                                                          │    │
│  │  • Shared chatflows (visibility: Organization)           │    │
│  │  • Shared credentials                                    │    │
│  │  • Shared tools                                          │    │
│  │  • Team-level document stores                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Personal    │  │   Personal    │  │   Personal    │       │
│  │   Workspace   │  │   Workspace   │  │   Workspace   │       │
│  │   (User A)    │  │   (User B)    │  │   (User C)    │       │
│  │               │  │               │  │               │       │
│  │ • Private     │  │ • Private     │  │ • Private     │       │
│  │   chatflows   │  │   chatflows   │  │   chatflows   │       │
│  │ • Private     │  │ • Private     │  │ • Private     │       │
│  │   credentials │  │   credentials │  │   credentials │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Workspace Types

| Type | Purpose | Created |
|------|---------|---------|
| **Default Workspace** | Organization-level shared resources | Auto-created per organization |
| **Personal Workspace** | User-private resources | Auto-created per user |
| **Custom Workspaces** | Team/project workspaces | Manually created |

#### Workspace-User Relationship

```typescript
// workspace_user table structure
interface WorkspaceUser {
    id: string
    workspaceId: string       // FK to workspace
    userId: string            // FK to user
    roleId: string            // FK to role (permissions)
    status: 'active' | 'inactive' | 'pending'
    lastLogin: Date           // Last workspace access
    createdDate: Date
    updatedDate: Date
}
```

#### Resource Isolation by Workspace

All resources are now filtered by `workspaceId`:

| Resource | Filter | Migration |
|----------|--------|-----------|
| `chat_flow` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `credential` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `variable` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `tool` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `custom_template` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `assistant` | `workspaceId = activeWorkspaceId` | Backfilled |
| `document_store` | `workspaceId = activeWorkspaceId` | Backfilled |
| `apikey` | `workspaceId = activeWorkspaceId` | Backfilled |
| `execution` | `workspaceId = activeWorkspaceId` | Backfilled |
| `evaluation` | `workspaceId = activeWorkspaceId` | Backfilled |
| `chat_message` | Inherits from chatflow | Backfilled via chatflow |

#### Workspace ID Backfill Logic

During migration, existing resources are assigned to workspaces:

```typescript
// Migration logic for workspace assignment
if (resource.visibility === 'Organization' || resource.visibility === 'Marketplace') {
    resource.workspaceId = defaultWorkspace.id  // Shared resource
} else {
    resource.workspaceId = personalWorkspace.id  // Private resource
}
```

#### Workspace Switching

Users can switch workspaces via:

1. **Profile Menu** - Inline workspace list with active indicator
2. **API** - `POST /api/workspaces/switch` endpoint

```typescript
// Workspace switch persists via lastLogin timestamp
await workspaceUserRepository.update(
    { userId, workspaceId },
    { lastLogin: new Date() }
)
```

#### Multi-Workspace Resource Sharing (AGENT-610)

New opt-in feature allowing Personal Workspace users to access Default Workspace resources:

```bash
# Enable in .env
AAI_MULTI_WORKSPACE_SHARING=true
AAI_SHARED_WORKSPACE_NAME="Default Workspace"
AAI_WORKSPACE_DEBUG=true  # Optional: Enable debug logging
```

**How It Works:**

The Smart Repository Decorator intercepts queries and expands workspace filters:

```typescript
// Without sharing: Only personal workspace
WHERE workspaceId = 'personal-ws-123'

// With sharing enabled: Personal + Default workspace
WHERE workspaceId IN ('personal-ws-123', 'default-ws-456')
```

**Use Cases:**
- Share organization tools with all users
- Provide base templates in Default Workspace
- Allow personal customization in Personal Workspace

**Commit:** `e0d891f47` (AGENT-610)

---

### Database Migrations

#### Critical: Enterprise Database Refactoring

**Migration:** `RefactorEnterpriseDatabase1737076223692`

**New table structures:**

| Table | Key Changes |
|-------|-------------|
| `user` | New schema with `name`, `email`, `credential`, `status`, audit fields |
| `organization` | New schema with `customerId`, `subscriptionId`, audit fields |
| `login_method` | NEW - SSO configurations per organization |
| `role` | NEW - Permission definitions |
| `organization_user` | NEW - User-organization junction with roles |
| `workspace_user` | NEW - User-workspace junction with roles, `lastLogin` |

**Required actions:**
1. **BACKUP DATABASE BEFORE MIGRATING**
2. Migrations handle AAI schema differences automatically
3. Creates "Default Workspace" and "Personal Workspace" per organization

#### AAI Data Migration Sandwich

1. `BackupAAIData1737076223690` - Preserves `auth0Id`, `stripeCustomerId`, etc.
2. `RefactorEnterpriseDatabase1737076223692` - Main restructure
3. `AAIRestoreDataAndCreateWorkspaces1737076223693` - Restores AAI data, creates workspaces

#### New Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `evaluation` | Evaluation configurations and results | `AddEvaluation1714548873039` |
| `evaluation_run` | Individual evaluation run results | `AddEvaluation1714548873039` |
| `dataset` | Dataset definitions for evaluations | `AddDatasets1714548903384` |
| `dataset_row` | Individual dataset rows | `AddDatasets1714548903384` |
| `evaluator` | Evaluator definitions | `AddEvaluator1714808591644` |

#### New Columns

| Table | Column | Purpose |
|-------|--------|---------|
| `chat_flow` | `textToSpeech` | TTS configuration |
| `chat_flow` | `currentVersion`, `s3Location` | Versioning support |
| `chat_flow` | `templateId` | Template linking |
| `chat_message` | `tracking_metadata` | Analytics tracking |
| `chat_message` | `guardrails_metadata` | Guardrails data |
| `organization` | `organizationConfig` | Organization settings |
| `organization` | `enabledIntegrations` | Integration toggles |
| `user` | `defaultChatflowId` | Default chatflow |

#### New Indexes

- `IDX_chatflow_name` on `chat_flow(name)`
- `IDX_custom_template_userId` on `custom_template(userId)`
- `IDX_custom_template_organizationId` on `custom_template(organizationId)`
- `IDX_custom_template_parentId` on `custom_template(parentId)`
- `IDX_chat_flow_templateId` on `chat_flow(templateId)`

---

### UI/UX Improvements

#### Canvas Improvements

| Feature | Description | Commit |
|---------|-------------|--------|
| **Grid Toggle** | Toggle background grid on/off | `a0dca552a` |
| **Fuzzy Node Search** | Intelligent search with typo tolerance and ranking | `97515989a` |
| **Snapping Controls** | ReactFlow snapping functionality | `82d60c7d1` |
| **Edge Remove Button** | Remove edges directly | `cd36924bf` |
| **Tooltip on Icons** | Hover tooltips in chatflows/marketplace | `7ef0e99eb` |

#### Theme and Accessibility

| Fix | Description | Commits |
|-----|-------------|---------|
| **Light Mode Contrast** | Fixed invisible text in light mode across billing, admin pages | `44d50c55d`, `2bc8a55c2`, `1389c0e04`, `9b72787b3` |
| **WCAG AA Compliance** | All text now meets 4.5:1 contrast ratio | - |

#### Profile Menu Redesign

New menu layout with:
- Email header with account switching
- Organization indicator with switch icon
- Inline workspace list with active indicator
- Add teammates (admin/builder only)
- Workspace settings (admin/builder only)
- Personalization (theme toggle)
- User profile card at bottom

**Commits:** `965801bea`, `06155238a`, `30254fea5`

#### Marketplace Improvements

- Autocomplete dropdown for use case selection
- Multi-select chips with overflow indicator
- Tooltip for truncated content
- Better grid spacing

**Commit:** `9d438529a`

#### Other UI Fixes

| Fix | Ticket | Commit |
|-----|--------|--------|
| Modals render above drawer | AGENT-597 | `6c6785e0b` |
| AsyncDropdown width | - | `15dd28356` |
| API Code Dialog for AgentFlow V2 | - | `5dd30b1a7` |
| Snackbar auto-close | - | `12b4259a0` |

---

### Bug Fixes

#### Critical & High Severity AAI Fixes (Detailed)

---

##### AGENT-589: Cross-Workspace Chat Data Leak (CRITICAL)

**See:** [Breaking Changes → AGENT-589](#1-agent-589-cross-workspace-chat-isolation-critical-security-fix)

---

##### AGENT-593: Chatflow Configuration Data Loss (CRITICAL)

**See:** [Breaking Changes → AGENT-593](#2-agent-593-chatflow-configuration-data-loss-critical-data-integrity-fix)

---

##### AGENT-588: Corrupted Images Throughout Application (HIGH)

**Severity:** HIGH - Visual functionality broken

**Problem:** PNG images (node icons, tab images in AddNodes panel) displayed as broken/corrupted throughout the application.

**Root Cause:** A custom webpack rule in `next.config.js` was double-processing images:

```javascript
// PROBLEMATIC CODE (removed)
{
    test: /\.(png|jpg|gif|svg)$/,
    use: [
        {
            loader: 'file-loader',
            options: {
                name: '[name].[ext]',
                publicPath: '/_next/static/images/',
                outputPath: 'static/images/'
            }
        }
    ]
}
```

This rule, combined with `transpilePackages: ['ui']`, caused binary PNG files to be processed twice, corrupting them.

**The Fix:**

1. Removed the corrupting 11-line webpack rule from `next.config.js`
2. Simplified `getImage()` function to handle Next.js `StaticImageData`:

```typescript
// FIXED: Properly handle Next.js static images
export const getImage = (name: string): string | StaticImageData => {
    return images[name] || name
}
```

**Impact:**
- All node icons display correctly
- AddNodes panel is fully functional
- No more broken image placeholders

**Commits:** `27a4a29a2`, `143545c9f`

---

##### AGENT-617: Google Drive Document Loader Crashes (HIGH)

**Severity:** HIGH - Feature completely broken

**Problem:** Adding Google Drive as a document loader caused a `ReferenceError` crash:

```
ReferenceError: selectedCredential is not defined
```

**Root Cause:** The credential selection state variables and handler were missing from the component:

```typescript
// MISSING (caused crash)
const [selectedCredential, setSelectedCredential] = useState(null)
const [selectedCredentialData, setSelectedCredentialData] = useState(null)

const handleCredentialDataChange = useCallback((credentialData) => {
    setSelectedCredentialData(credentialData)
}, [])
```

**The Fix:**

Added missing state and handler to both affected components:

1. **Direct component fix:** Added state to specific loader component
2. **NodeInputHandler fix:** Applied fix to parent handler for comprehensive coverage

```typescript
// Added to component
const [selectedCredential, setSelectedCredential] = useState(
    nodeData?.inputs?.credential || null
)
const [selectedCredentialData, setSelectedCredentialData] = useState(
    nodeData?.inputs?.credentialData || null
)

const handleCredentialDataChange = useCallback((credentialData: any) => {
    setSelectedCredentialData(credentialData)
}, [])
```

**Impact:**
- Google Drive document loader works correctly
- Document ingestion workflows are functional
- RAG pipelines with Google Drive sources can be built

**Commits:** `93034fca3`, `2e21ff60d`

---

##### AGENT-592: Sidekick Selection Broken with Workspace RBAC (HIGH)

**Severity:** HIGH - Core feature broken

**Problem:** Two related issues with sidekick selection:

1. Used `isOwner` check instead of `isExecutable`, breaking workspace-level RBAC
2. JSON parsing crashed on null/undefined values during sidekick switching

**Root Cause 1:** Owner-based access check:
```typescript
// BROKEN: Only owner could select sidekick
if (chatflow.isOwner) {
    // Allow selection
}
```

**Root Cause 2:** Unsafe JSON parsing:
```typescript
// CRASHED: No null check
const config = JSON.parse(chatflow.chatbotConfig)  // Error if null
```

**The Fix:**

1. Changed to `isExecutable` for proper RBAC:
```typescript
// FIXED: Server handles workspace access filtering
// isExecutable is set to true since server already filters by workspace
if (chatflow.isExecutable) {
    // Allow selection
}
```

2. Added null checks to JSON parsing:
```typescript
// FIXED: Safe JSON parsing
export function parseFlowData(flowData: string | null | undefined) {
    if (!flowData) return null
    try {
        return JSON.parse(flowData)
    } catch (error) {
        console.error('Failed to parse flow data:', error)
        return null
    }
}
```

**Impact:**
- Shared sidekicks are accessible to all authorized workspace users
- No crashes when switching sidekicks
- Proper RBAC enforcement

**Commits:** `a16ef564d`, `ea6f2f6b9`

---

##### AGENT-618: User Variables Section 404 Errors (HIGH)

**Severity:** HIGH - Feature causes errors

**Problem:** The User Variables section in the profile page called a non-existent API endpoint (`/api/users`), showing 404 errors when users tried to save.

**Root Cause:** The UI was implemented before the API:
```typescript
// Called non-existent endpoint
const response = await fetch('/api/users', {
    method: 'PATCH',
    body: JSON.stringify({ contextFields })
})
// Result: 404 Not Found
```

**The Fix:**

Hidden the User Variables section until API is implemented:

```typescript
// Temporarily hidden with implementation notes
{/*
TODO: User Variables API needed
- POST /api/users/:id/context-fields
- GET /api/users/:id/context-fields
- See AGENT-618 for implementation details
*/}
{false && <UserVariablesSection />}
```

**Impact:**
- No more confusing 404 errors
- Cleaner UI without non-functional features
- Clear path for future implementation

**Commit:** `844942177`

---

##### AGENT-598: Light Mode Text Invisible (MEDIUM)

**Severity:** MEDIUM - Accessibility issue

**Problem:** Multiple pages had white text hardcoded (`color: '#fff'`), making content invisible in light mode:

**Affected Pages:**
- Billing Dashboard
- TotalCreditsProgress component
- BillingOverview
- UsageEventsTable
- CostCalculator
- Admin DocumentStores table
- Admin Chatflows table

**The Fix:**

Replaced 200+ hardcoded colors with theme-aware values:

| Before | After |
|--------|-------|
| `color: '#fff'` | `color: theme.palette.text.primary` |
| `color: 'rgba(255,255,255,0.7)'` | `color: theme.palette.text.secondary` |
| `background: 'rgba(0,0,0,0.2)'` | `background: alpha(theme.palette.background.paper, 0.8)` |
| `border: 'rgba(255,255,255,0.1)'` | `border: theme.palette.divider` |

**Result:**
- WCAG AA compliance (4.5:1 contrast ratio)
- All text readable in both themes
- Consistent theming across application

**Commits:** `44d50c55d`, `2bc8a55c2`, `1389c0e04`, `9b72787b3`

---

#### AAI-Specific Fixes Summary

| Severity | Ticket | Description | Status |
|----------|--------|-------------|--------|
| **Critical** | AGENT-589 | Cross-workspace chat data leak | ✅ Fixed |
| **Critical** | AGENT-593 | Chatflow config data loss on import/export | ✅ Fixed |
| **High** | AGENT-588 | Corrupted images throughout app | ✅ Fixed |
| **High** | AGENT-617 | Google Drive loader crashes | ✅ Fixed |
| **High** | AGENT-592 | Sidekick selection broken with RBAC | ✅ Fixed |
| **High** | AGENT-618 | User Variables 404 errors | ✅ Hidden |
| **Medium** | AGENT-598 | Light mode text invisible | ✅ Fixed |
| **Medium** | AGENT-616 | Rate limit config not saving | ✅ Fixed |
| **Medium** | AGENT-609 | Variables page tab switching broken | ✅ Fixed |
| **Medium** | AGENT-614 | Dataset ID extraction failing | ✅ Fixed |
| **Low** | AGENT-597 | Modals behind drawer | ✅ Fixed |
| **Low** | AGENT-615 | Duplicate button | ✅ Fixed |

---

#### Flowise Upstream Fixes (80+)

**Security Fixes:**
- Path traversal via chatId (`03c1750d7`, `c00ae7848`)
- File path validation (`6e291cf05`)
- Container filesystem vulnerability (`4111ec31b`)
- Insecure link fetching (`e002e617d`)
- Arbitrary file upload (`c2b830f27`)
- ID validation for imports (`f963e5aa4`)

**AgentFlow/Sequential Agents:**
- Supervisor Node with Azure OpenAI (`94cae3b66`)
- Iteration blocking after human input (`62d34066c`)
- Human Input as first node (`6e2f2df26`)
- Agent/LLM nodes when streaming off (`68dc041d0`)
- State interpolation (`bbcfb5ab6`)
- AgentflowV2 State management (`01dab4365`)
- Past image retrieval (`6cf1c82f0`)
- Redis event subscription (`10f85ef47`)

**Chat Models:**
- Anthropic package issues (`a92f7dfc3`)
- Gemini empty contents error (`fc50f2308`)
- Gemini structured output (`2e42dfb63`)
- Gemini image input (`d06b7d7ae`)
- AWS Bedrock vision model override (`ddba891dc`)

**Vector Stores:**
- Weaviate metadata special chars (`7dfa26950`)
- Vector store config not saving (`a6506b3bf`)
- PGVectorStore base class retrieval (`3bd2d63a1`)

**API/Backend:**
- CORS configuration (`fd7fc2f4d`)
- Redis socket crashes (`4326cbe6b`)
- Redis idle timeout (`eadf1b11b`)
- PostgreSQL Record Manager (`7e7ff2494`, `e467d0615`)
- Duplicate metrics in Prometheus/OpenTelemetry (`3098c8e75`)

**Parsing/Data:**
- Zod schema parsing (`4417102f6`)
- JSON metadata parsing (`601de76ae`)
- JSON5 parsing (`4af067a44`)
- Iteration JSON parsing (`44087bc70`)
- Null byte import errors (`9e743e4aa`)

---

### Security

This release includes **15+ security fixes** addressing critical vulnerabilities including path traversal, arbitrary file upload, SSRF, session fixation, and credential leakage.

---

#### Critical Security Fixes

##### 1. Path Traversal via chatId (CRITICAL)

**Vulnerability:** Attackers could use specially crafted `chatId` parameters to access files outside the intended directory.

**Attack Vector:**
```
GET /api/v1/chatmessages?chatId=../../../etc/passwd
```

**Fix:** Added path traversal validation to `chatId` parameter:

```typescript
// packages/server/src/utils/validateChatId.ts
export function validateChatId(chatId: string): boolean {
    // Block path traversal attempts
    if (chatId.includes('..') || chatId.includes('/') || chatId.includes('\\')) {
        throw new InternalFlowiseError(
            StatusCodes.BAD_REQUEST,
            'Invalid chatId format'
        )
    }
    return true
}
```

**Commits:** `03c1750d7`, `c00ae7848`

##### 2. File Path Validation (CRITICAL)

**Vulnerability:** Insufficient file path validation allowed access to unauthorized files.

**Fix:** Enhanced file path validation and sanitization:

```typescript
// Validates paths don't escape allowed directories
function validateFilePath(filePath: string, allowedBase: string): boolean {
    const normalizedPath = path.normalize(filePath)
    const resolvedPath = path.resolve(allowedBase, normalizedPath)
    return resolvedPath.startsWith(path.resolve(allowedBase))
}
```

**Commit:** `6e291cf05`

##### 3. Arbitrary File Upload (CRITICAL)

**Vulnerability:** Attachment creation endpoint allowed uploading files with arbitrary paths, potentially overwriting system files.

**Fix:** Restricted file upload to designated directories with extension validation.

**Commit:** `c2b830f27`

##### 4. Container Filesystem Vulnerability (HIGH)

**Vulnerability:** Docker compose configuration (`metrics/otel/compose.yaml`) allowed unauthorized file modifications within the container.

**Fix:** Restricted container filesystem permissions and implemented non-root execution.

**Commit:** `4111ec31b`

##### 5. Insecure Link Fetching (HIGH)

**Vulnerability:** Links were fetched without proper URL validation, allowing SSRF attacks.

**Fix:** Added URL validation before fetching external resources.

**Commit:** `e002e617d`

##### 6. Import ID Validation (MEDIUM)

**Vulnerability:** Imported data IDs were not validated, allowing injection attacks.

**Fix:** All imported IDs are now validated against expected formats.

**Commit:** `f963e5aa4`

---

#### SSRF Protection (Server-Side Request Forgery)

**New Feature:** HTTP Deny List

Prevents SSRF attacks by blocking requests to internal/private IP ranges:

```bash
# .env configuration
HTTP_DENY_LIST=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8,169.254.0.0/16
```

**Implementation:**

```typescript
// packages/components/src/httpSecurity.ts
import { isIPInCIDR } from './utils'

export function validateURL(url: string): void {
    const denyList = process.env.HTTP_DENY_LIST?.split(',') || []
    const parsedUrl = new URL(url)
    const resolvedIP = dns.resolve(parsedUrl.hostname)

    for (const cidr of denyList) {
        if (isIPInCIDR(resolvedIP, cidr)) {
            throw new Error(`Request to ${url} blocked by HTTP_DENY_LIST`)
        }
    }

    // Also validates redirect chains
}
```

**Protected Against:**
- Access to internal services (localhost, 10.x.x.x, 192.168.x.x)
- Cloud metadata endpoints (169.254.169.254)
- Internal Kubernetes services
- Docker host networking attacks

**Commits:** `0998bf432`, `a3f47af02`, `d081221a9`

---

#### Session Security

##### Session Fixation Prevention

**Vulnerability:** Session tokens were not regenerated after authentication, allowing session fixation attacks.

**Fix:** Sessions are now regenerated on login for all SSO providers:

```typescript
// After successful authentication
req.session.regenerate((err) => {
    if (err) {
        return next(err)
    }
    // Store user data in new session
    req.session.user = authenticatedUser
    req.session.save()
})
```

**Affected Providers:**
- Auth0
- Google OAuth
- GitHub OAuth
- Azure AD

**Commit:** `e8c36b689`

##### Secure Cookies Configuration

**New Feature:** Explicit cookie security control

```bash
# .env configuration
SECURE_COOKIES=true  # Force secure cookies (HTTPS only)
SECURE_COOKIES=false # Allow insecure (development)
# Omit for auto-detection based on environment
```

**Cookie Settings When Enabled:**
```typescript
{
    secure: true,           // HTTPS only
    httpOnly: true,         // No JavaScript access
    sameSite: 'strict',     // CSRF protection
    maxAge: 86400000        // 24 hour expiry
}
```

**Commit:** `a86f61818`

---

#### MCP Security Validation

Enhanced validation for Model Context Protocol (MCP) configurations to prevent malicious server connections.

**New Environment Variables:**

```bash
# Enable custom MCP security checks
CUSTOM_MCP_SECURITY_CHECK=true

# Allowed MCP protocols
CUSTOM_MCP_PROTOCOL=stdio,http,https

# Block dangerous protocols
CUSTOM_MCP_BLOCKED_PROTOCOLS=file,data
```

**Validation Checks:**
- Protocol whitelist validation
- URL format validation
- Hostname resolution validation
- Argument sanitization

**Commits:** `41131dfac`, `d29db16bf`, `e8dac2048`

---

#### Sensitive Data Protection

##### Log Sanitization

**Vulnerability:** Sensitive data (API keys, tokens, passwords) could appear in application logs.

**Fix:** Request headers and body are sanitized before logging:

```typescript
// Sanitized fields
const sensitiveFields = [
    'authorization',
    'x-api-key',
    'password',
    'secret',
    'token',
    'apiKey',
    'accessToken',
    'refreshToken',
    'credential'
]

function sanitizeForLogging(data: object): object {
    const sanitized = { ...data }
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]'
        }
    }
    return sanitized
}
```

**Commit:** `2ae4678da`

---

#### Telemetry Privacy

**Change:** Telemetry is now **disabled by default** (opt-in instead of opt-out).

```bash
# Telemetry is OFF unless explicitly enabled
DISABLE_FLOWISE_TELEMETRY=true  # Default (redundant but explicit)
DISABLE_FLOWISE_TELEMETRY=false # Opt-in to telemetry
```

**What Was Collected:**
- Anonymous usage statistics
- Feature usage counts
- Error reports (sanitized)

**Privacy Impact:**
- No data sent without explicit opt-in
- Compliant with GDPR and similar regulations
- Suitable for air-gapped deployments

**Commit:** `624143ad1`

---

#### Dangerous Tools Removed

##### File System Tools Removed

**Security Decision:** Read/Write file system tools have been removed from the default distribution.

**Removed Tools:**
- `ReadFile` - Read arbitrary files
- `WriteFile` - Write arbitrary files

**Rationale:**
- High risk of path traversal attacks
- Potential for data exfiltration
- Container escape vectors

**Alternative:** Use specific document loaders for controlled file access.

**Commits:** `3cab80391`, `1fb12cd93`

---

#### Non-Root Docker Execution

**Security Enhancement:** Docker containers now run as non-root user by default.

**Dockerfile Changes:**

```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 flowise && \
    adduser --system --uid 1001 --gid 1001 flowise

# Set ownership
RUN chown -R flowise:flowise /app

# Switch to non-root user
USER flowise
```

**Security Benefits:**
- Limits container escape impact
- Prevents root-level file modifications
- Follows container security best practices
- Required for some Kubernetes security policies

**Commit:** `366d38b86`

---

#### Security Configuration Summary

| Setting | Purpose | Recommended Value |
|---------|---------|-------------------|
| `DISABLE_FLOWISE_TELEMETRY` | Disable telemetry | `true` |
| `HTTP_DENY_LIST` | SSRF protection | `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8` |
| `SECURE_COOKIES` | Force HTTPS cookies | `true` (production) |
| `CUSTOM_MCP_SECURITY_CHECK` | MCP validation | `true` |
| `FLOWISE_SECRETKEY_OVERWRITE` | Credential encryption | Strong random key |

---

### Infrastructure

#### Docker Improvements

| Feature | Description | Commit |
|---------|-------------|--------|
| Native health checks | Added curl for proper health checks | `786748972` |
| Non-root execution | Container runs as non-root user | `366d38b86` |
| Split workflows | Separated Docker CI/CD | `a7b6f9b20` |
| Worker updates | Updated worker Dockerfile | `8ba1a0907` |

#### New Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `DISABLE_FLOWISE_TELEMETRY` | Disable telemetry | `true` |
| `HTTP_DENY_LIST` | SSRF protection | - |
| `SECURE_COOKIES` | Force secure cookies | auto |
| `TRUST_PROXY` | Express proxy trust | `true` |
| `ENABLE_BULLMQ_DASHBOARD` | Queue monitoring UI | disabled |
| `REMOVE_ON_AGE` | Queue job age cleanup | - |
| `REMOVE_ON_COUNT` | Queue job count cleanup | - |
| `CUSTOM_MCP_SECURITY_CHECK` | MCP validation | - |
| `AAI_MULTI_WORKSPACE_SHARING` | Resource sharing | `false` |
| `AAI_SHARED_WORKSPACE_NAME` | Shared workspace | "Default Workspace" |

#### Observability

| Feature | Description | Commit |
|---------|-------------|--------|
| Phoenix Tracing | Self-hosted and cloud Phoenix support | `b02667188` |
| Opik Tracer | New Opik integration | `dd56d03b7` |
| LangWatch Metadata | Config override for metadata | `763e33b07` |
| Mistral Cost Metrics | Cost tracking for Mistral models | `f8ca10582` |

#### Caching Improvements

- SSO token caching (`d272683a9`)
- MCP toolkit caching (`2b7a074c8`)
- Google GenAI cache support (`d3510d105`)
- Turbo build caching for DB (`7beb1bb0b`)

---

### Deprecations

| Item | Replacement | Notes |
|------|-------------|-------|
| AgentFlow V1 (Sequential Agents) | AgentFlow V2 | V1 still works, migration recommended |
| `importChatflows` method | New import system | Better validation |
| `x-request-from: internal` | `x-request-from: aai` | Header change |
| `teradatasql` package | Teradata MCP | Removed |
| `rehyperaw` package | - | Removed |
| Read/Write File Tools | - | Security removal |

---

### Migration Checklist

#### Pre-Deployment

- [ ] **BACKUP DATABASE COMPLETELY**
- [ ] Review Auth0 user/organization sync status
- [ ] Verify all users have valid `organizationId` references
- [ ] Document current workspace structure for rollback reference
- [ ] Update client code to use `x-request-from: aai` header

#### During Deployment

- [ ] Run migrations in a maintenance window
- [ ] Monitor migration logs for AAI migration messages
- [ ] Watch for WARNING messages about orphaned users

#### Post-Deployment

- [ ] Verify users can log in via Auth0
- [ ] Verify workspace access is correct
- [ ] Verify chatflows are visible in correct workspaces
- [ ] Test evaluation and dataset features
- [ ] Clean up backup tables after verification

---

### Contributors

This release includes contributions from the Flowise team and TheAnswer AI team.

### Full Changelog

[v1.13.0...v2.0.0](https://github.com/the-answerai/theanswer/compare/v1.13.0...v2.0.0)

---

*For previous releases, see [GitHub Releases](https://github.com/the-answerai/theanswer/releases).*
