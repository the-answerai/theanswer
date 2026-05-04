# Guardrails Settings E2E Tests

Comprehensive Playwright E2E tests for the Guardrails Settings UI (Phase 3).

## Test Coverage

### 1. Authentication & Authorization (3 tests)
- ✅ Admin user can access guardrails settings page
- ✅ Non-admin user cannot save guardrails settings (403 Forbidden)
- ✅ Unauthenticated user is redirected to Auth0 login

### 2. UI Structure (3 tests)
- ✅ Page displays correct structure and elements
- ✅ Simple Mode displays all three presets (Strict, Balanced, Lenient)
- ✅ Advanced and Custom tabs show "Coming soon" message

### 3. Preset Selection (6 tests)
- ✅ Can select Strict preset
- ✅ Can select Balanced preset
- ✅ Can select Lenient preset
- ✅ Can switch between presets
- ✅ Save button becomes enabled when preset is selected
- ✅ Cancel button appears when changes are made

### 4. Save Configuration (6 tests)
- ✅ Can save Strict preset configuration
- ✅ Can save Balanced preset configuration
- ✅ Can save Lenient preset configuration
- ✅ Success message auto-dismisses after 3 seconds
- ✅ Save button shows loading state
- ✅ Cancel button clears changes

### 5. Configuration Persistence (2 tests)
- ✅ Saved configuration persists after page reload
- ✅ Configuration auto-detects current preset on load

### 6. API Integration (4 tests)
- ✅ GET request loads current configuration
- ✅ PUT request sends correct preset configuration
- ✅ API error shows error message
- ✅ API request includes organization ID in URL

### 7. Warning States (2 tests)
- ✅ Shows warning when guardrails are disabled
- ✅ Shows custom config warning when configuration doesn't match preset

**Total Tests:** 26

---

## Prerequisites

### 1. Environment Setup

Copy `apps/web/e2e/env.example` to `apps/web/.env.test` and configure:

```bash
# Test user credentials
TEST_USER_ENTERPRISE_ADMIN_EMAIL=your-admin@example.com
TEST_USER_ENTERPRISE_MEMBER_EMAIL=your-member@example.com
TEST_USER_PASSWORD=your-test-password

# Organization
TEST_ENTERPRISE_AUTH0_ORG_ID=org_xxxxxxxxxxxxx
TEST_ENTERPRISE_ORG_NAME=Your Org Name

# Base URL (optional)
BASE_URL=http://localhost:3000
```

### 2. Test Users

Create two test users in Auth0:

**Admin User:**
- Email: As configured in `TEST_USER_ENTERPRISE_ADMIN_EMAIL`
- Role: `Admin` (must have admin role in organization)
- Organization: Member of test organization

**Member User:**
- Email: As configured in `TEST_USER_ENTERPRISE_MEMBER_EMAIL`
- Role: `Member` or `Builder` (non-admin)
- Organization: Member of test organization

### 3. Development Server

Ensure the development server is running:

```bash
pnpm dev
```

Server should be accessible at `http://localhost:3000`

---

## Running Tests

### Run All Guardrails Tests

```bash
# From repository root
pnpm test:e2e -- guardrails-settings.spec.ts

# Or from apps/web directory
pnpm test:e2e -- tests/guardrails-settings.spec.ts
```

### Run with UI Mode (Recommended for Development)

```bash
pnpm test:e2e:ui -- guardrails-settings.spec.ts
```

### Run Specific Test Suite

```bash
# Authentication tests only
pnpm test:e2e -- guardrails-settings.spec.ts -g "Authentication & Authorization"

# Preset selection tests only
pnpm test:e2e -- guardrails-settings.spec.ts -g "Preset Selection"

# Save configuration tests only
pnpm test:e2e -- guardrails-settings.spec.ts -g "Save Configuration"
```

### Run Single Test

```bash
pnpm test:e2e -- guardrails-settings.spec.ts -g "Admin user can access guardrails settings page"
```

### Debug Mode

```bash
pnpm test:e2e:debug -- guardrails-settings.spec.ts
```

---

## Test Data Flow

### Typical Test Flow:

```
1. Login as admin user
   ↓
2. Navigate to /settings/organization/guardrails
   ↓
3. Page loads with GET /api/v1/organizations/:id/config/guardrails
   ↓
4. User selects a preset (Strict/Balanced/Lenient)
   ↓
5. User clicks "Save Configuration"
   ↓
6. PUT /api/v1/organizations/:id/config/guardrails
   ↓
7. Success message appears
   ↓
8. Configuration persists on reload
```

### API Endpoints Tested:

- `GET /api/v1/organizations/:id/config/guardrails`
- `PUT /api/v1/organizations/:id/config/guardrails`

---

## Expected Behaviors

### Simple Mode
- **Default:** Simple tab selected, shows 3 presets
- **Preset Cards:** Clickable radio cards with descriptions
- **Auto-detection:** Automatically detects current preset from config
- **Save Button:** Disabled until changes made, shows "Saving..." during request
- **Cancel Button:** Appears when changes exist, clears pending changes
- **Success Alert:** Shows for 3 seconds after successful save
- **Error Alert:** Shows if API call fails, stays until dismissed

### Advanced Mode (Placeholder)
- Shows "Coming soon" message
- No functionality in Phase 3

### Custom Mode (Placeholder)
- Shows "Coming soon" message
- No functionality in Phase 3

### Authorization
- **Admin users:** Can view and save configurations
- **Non-admin users:** Can view but cannot save (API returns 403)
- **Unauthenticated:** Redirected to Auth0 login

---

## Preset Configurations

### Strict (0.05)
```json
{
  "enabled": true,
  "safety": { "threshold": 0.05, "action": "block" },
  "pii": { "confidenceThreshold": 0.8, "action": "redact" },
  "faithfulness": { "threshold": 0.005, "action": "warn" }
}
```

### Balanced (0.1)
```json
{
  "enabled": true,
  "safety": { "threshold": 0.1, "action": "block" },
  "pii": { "confidenceThreshold": 0.8, "action": "redact" },
  "faithfulness": { "threshold": 0.005, "action": "warn" }
}
```

### Lenient (0.15)
```json
{
  "enabled": true,
  "safety": { "threshold": 0.15, "action": "warn" },
  "pii": { "confidenceThreshold": 0.85, "action": "warn" },
  "faithfulness": { "enabled": false }
}
```

---

## Troubleshooting

### Tests Fail with "Unauthorized"
**Issue:** Test user doesn't have proper role
**Fix:** Verify test user has `Admin` role in Auth0 organization

### Tests Fail with "Organization not found"
**Issue:** Organization ID mismatch
**Fix:** Check `TEST_ENTERPRISE_AUTH0_ORG_ID` matches actual Auth0 org ID

### Tests Timeout on Login
**Issue:** Auth0 credentials incorrect
**Fix:** Verify `TEST_USER_PASSWORD` is correct for test users

### API Calls Return 404
**Issue:** Development server not running or routes not registered
**Fix:**
```bash
pnpm dev
# Verify http://localhost:3000 is accessible
```

### Preset Not Auto-Detected
**Issue:** Configuration format mismatch
**Fix:** Check database `organizationConfig` JSONB column has correct structure

### Save Button Never Enables
**Issue:** React state not updating
**Fix:** Check browser console for errors, verify API responses

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests - Guardrails

on:
  pull_request:
    paths:
      - 'apps/web/app/(Main UI)/settings/organization/guardrails/**'
      - 'packages-answers/ui/src/GuardrailsSettings*'
      - 'packages/server/src/routes/organizations/**'
      - 'packages/server/src/controllers/organizations/**'
      - 'packages/ui/src/api/guardrails.js'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:e2e:ci -- guardrails-settings.spec.ts
        env:
          TEST_USER_ENTERPRISE_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          TEST_USER_ENTERPRISE_MEMBER_EMAIL: ${{ secrets.TEST_MEMBER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          TEST_ENTERPRISE_AUTH0_ORG_ID: ${{ secrets.TEST_ORG_ID }}
```

---

## Maintenance

### When to Update Tests

**Add new tests when:**
- Adding new presets
- Implementing Advanced Mode (Phase 4)
- Implementing Custom JSON Mode (Phase 4)
- Adding validation rules
- Changing authorization logic

**Update existing tests when:**
- Changing preset thresholds
- Modifying API endpoints
- Changing UI text/labels
- Altering page layout

### Test Stability Tips

1. **Use data-testid attributes** for stable selectors:
   ```tsx
   <button data-testid="save-guardrails-config">Save</button>
   ```

2. **Avoid brittle text selectors** - use semantic locators when possible

3. **Add explicit waits** for API calls:
   ```typescript
   await page.waitForResponse(resp => resp.url().includes('/guardrails'))
   ```

4. **Mock slow APIs** in tests to improve speed

---

## Pending Test Coverage (Phase 7)

The Phase 7 work (issue [#1059](https://github.com/the-answerai/theanswer/issues/1059)) added new behavior that is **not yet covered** by E2E tests. When extending this spec file, add coverage for:

### Failure Mode (fail-open vs fail-closed)
- ✅ Admin can toggle Failure Mode in Master Config (Fail Open / Fail Closed)
- ✅ Toggle round-trips through `PUT /api/v1/organizations/:id/config/guardrails` and persists `failureMode`
- ✅ Per-chatflow Failure Mode override appears in Chatflow Configuration > Guardrails tab when override is enabled
- ✅ Per-chatflow override correctly inherits org default when left untouched

### Observability-Only Mode
- ✅ Admin can toggle Observability-Only switch
- ✅ When enabled, real Fiddler block-action violations show up in `guardrailsMetadata` but the chat still completes (no 400)

### Diagnostic Selftest Endpoint
- ✅ `GET /api/v1/guardrails/selftest` returns 200 with `healthCheck.ok=true` when guardrails healthy
- ✅ Returns 200 with `healthCheck.degraded=true, reason='no_credentials'` when no credential resolves
- ✅ Returns 200 with `healthCheck.reason='auth_error'` when credential is rejected by Fiddler
- ✅ Returns 200 with `healthCheck.reason='disabled'` when guardrails are disabled by config
- ✅ `credentialSource` reflects actual provenance (`workspace`, `organization`, `env`, etc.)

### Degraded-State UI
- ✅ Amber "Safety checks were unavailable for this message" banner renders above chat response when `health.anyDegraded=true`
- ✅ Banner does NOT render for healthy validations
- ✅ Shield icon turns amber (warning state) when degraded
- ✅ Accordion shows new "Health" section with `mode`, per-stage `reason`, `httpStatus`, `latencyMs`
- ✅ `[BUG] Jira-style` integration: simulated upstream 401 produces both the chat banner AND a `logger.error('[Guardrails] Stage degraded ...')` line in server logs

### Fail-Closed Blocking
- ✅ With `failureMode='closed'` and a known-bad API key, prediction returns HTTP 503 with body `Safety checks are temporarily unavailable (reason: auth_error). Please try again in a moment.`
- ✅ Streaming chatflow on fail-closed + degraded emits a trailing SSE `error` event so client UI can surface it

### AgentFlow V2 Parity
- ✅ AgentFlow V2 chatflow (`type === 'AGENTFLOW'`) emits the same `guardrailsMetadata` shape as chain chatflows (input + output + health)
- ✅ AgentFlow V2 input violation produces the same 400 block as chain path

### Credential Visibility
- ✅ `Organization`-visible `fiddlerApi` credential created in workspace A is correctly resolved by chatflows running in workspace B of the same org (was a bug, now fixed)

---

## Related Documentation

- **Implementation Plan:** `.claude/plans/fiddler-guardrails-implementation.md`
- **Progress Tracking:** `.claude/plans/fiddler-guardrails-status.md`
- **Backend API:** `packages/server/CLAUDE.md`
- **Frontend Components:** `packages-answers/ui/src/GuardrailsSettings.tsx`
- **Issue:** [the-answerai/theanswer#1059](https://github.com/the-answerai/theanswer/issues/1059) — Phase 7 failure semantics + diagnostics
- **Playwright Docs:** https://playwright.dev/

---

## Questions or Issues?

- Check existing tests in `apps/web/e2e/tests/` for patterns
- Review Playwright documentation
- See E2E README: `apps/web/e2e/README.md`
- Report issues with label `e2e-tests`
