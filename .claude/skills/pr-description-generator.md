# PR Description Generator Skill

This skill generates comprehensive, standardized pull request descriptions by analyzing commits and Linear ticket context.

## Purpose

Create PR descriptions that:
- Summarize changes clearly
- Link to Linear tickets
- Include testing checklist
- Follow TheAnswer conventions
- Provide review guidance

## PR Description Template

```markdown
## Summary
[Brief overview from ticket or commit analysis]

## Changes
[Bullet list of key changes from commits]

## Linear Ticket
Closes [AAI-123](https://linear.app/theanswer/issue/AAI-123)
[Ticket description excerpt]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed

## TheAnswer Checklist
- [ ] Multi-tenancy filters applied (`organizationId`)
- [ ] Authentication middleware present (`enforceAbility`)
- [ ] Database migrations created (if schema changes)
- [ ] CLAUDE.md updated (if architecture changes)
- [ ] No sensitive data committed
- [ ] Debug code removed

## Review Focus
[Areas that need special attention]

## Screenshots / Demo
[If applicable, for UI changes]
```

## Workflow

### 1. Gather Branch Information

```bash
# Get current branch
git branch --show-current

# Example: feature/AAI-123-add-oauth2-support
```

**Extract:**
- Branch type (feature/fix/chore)
- Ticket ID (AAI-123)
- Short description

### 2. Analyze Commits

```bash
# Get commits in this branch vs staging
git log staging..HEAD --oneline --no-decorate

# Get detailed commit messages
git log staging..HEAD --format="%H%n%s%n%b%n---"
```

**Extract from commits:**
- Commit types (feat/fix/chore)
- Commit messages
- Scopes and patterns
- Number of commits

**Categorize commits:**
```
Features (feat):
- Add OAuth2 token refresh
- Add OAuth2 configuration endpoint

Fixes (fix):
- Fix token expiration handling

Tests (test):
- Add OAuth2 integration tests
- Add token refresh unit tests

Documentation (docs):
- Update OAuth2 setup guide
```

### 3. Fetch Linear Ticket Details

If ticket ID found:

```bash
# Using MCP Linear tool
mcp__linear__get_issue --id AAI-123
```

**Extract:**
- Title
- Description
- Acceptance criteria
- Labels
- Priority
- Current status
- URL

### 4. Analyze Changed Files

```bash
# Get file statistics
git diff staging..HEAD --stat

# Get changed files list
git diff staging..HEAD --name-only
```

**Categorize files:**
```
Backend Changes:
- packages/server/src/services/oauth.ts
- packages/server/src/controllers/oauth/index.ts

Tests:
- packages/server/test/oauth.test.ts

Documentation:
- packages/server/AUTHORIZATION.md
```

**Calculate impact:**
- Files changed: X
- Lines added: +Y
- Lines deleted: -Z

### 5. Generate Summary

**For feature branches:**
```
## Summary
This PR implements OAuth2 token refresh support, allowing users to maintain
authenticated sessions without re-logging in. The implementation follows the
OAuth2 RFC 6749 specification and integrates with TheAnswer's existing
authentication system.
```

**For fix branches:**
```
## Summary
Fixes a memory leak in chat message processing that occurred when handling
large message batches. The issue was caused by event listeners not being
properly cleaned up after message processing completed.

Resolves: #789
```

**For chore branches:**
```
## Summary
Updates LangChain dependencies to v0.3.x for improved performance and
security. This update includes breaking changes that required updates to
chat model implementations and vector store integrations.
```

### 6. Generate Changes List

**From commit analysis:**
```
## Changes

### Features
- Implement OAuth2 token refresh endpoint (`POST /api/v1/oauth/refresh`)
- Add OAuth2 configuration management
- Add token expiration validation middleware

### Bug Fixes
- Fix race condition in token refresh logic
- Handle expired tokens gracefully

### Testing
- Add OAuth2 integration test suite (15 tests)
- Add token refresh unit tests
- Add expiration handling tests

### Documentation
- Update AUTHORIZATION.md with OAuth2 flow diagram
- Add OAuth2 setup guide to README
```

### 7. Generate Testing Checklist

**Standard checklist:**
```
## Testing
- [ ] Unit tests added/updated (15 new tests)
- [ ] Integration tests pass (npm run test:auth)
- [ ] E2E tests pass (npm run test:e2e)
- [ ] Manual testing completed
  - [ ] Token refresh works with expired tokens
  - [ ] Token refresh fails with invalid tokens
  - [ ] Token expiration handled correctly
```

**Adapt based on change type:**
- **Database changes:** Add migration testing
- **UI changes:** Add visual regression testing
- **API changes:** Add API contract testing
- **Performance changes:** Add benchmark results

### 8. Generate TheAnswer Checklist

**Analyze code for specific checks:**

```bash
# Check for multi-tenancy
git diff staging..HEAD | grep "organizationId"

# Check for authentication
git diff staging..HEAD | grep "enforceAbility"

# Check for migrations
git diff staging..HEAD --name-only | grep "migration"
```

**Generate relevant checks:**
```
## TheAnswer Checklist
- [x] Multi-tenancy filters applied (`organizationId` in all queries)
- [x] Authentication middleware present (`enforceAbility` on all routes)
- [ ] Database migrations created (schema unchanged)
- [ ] CLAUDE.md updated (no architecture changes)
- [x] No sensitive data committed (verified)
- [x] Debug code removed (verified)
- [x] Tags include ['AAI'] (components only)
```

### 9. Generate Review Focus

**Based on file analysis:**
```
## Review Focus

### Security
- OAuth2 token refresh implementation (packages/server/src/services/oauth.ts)
- Token validation logic (lines 45-78)
- Credential storage (ensure no tokens in code)

### Performance
- Token refresh endpoint efficiency
- Database queries in auth middleware

### Multi-tenancy
- Verify organizationId filters in new queries
- Check ownership validation in controllers
```

### 10. Add Linear Ticket Link

```
## Linear Ticket
Closes [AAI-123: Add OAuth2 token refresh support](https://linear.app/theanswer/issue/AAI-123)

### Acceptance Criteria
- [x] Users can refresh tokens without re-authentication
- [x] Expired tokens trigger refresh automatically
- [x] Invalid refresh tokens return 401
- [x] Token refresh respects rate limits

### Original Description
Currently, users must re-authenticate when their access tokens expire.
This PR implements OAuth2 token refresh to allow seamless session
continuation without user intervention.
```

### 11. Add Metadata

```
---

**Branch:** `feature/AAI-123-add-oauth2-support`
**Target:** `staging` (will merge to `main` after testing)
**Size:** Medium (250 lines changed across 8 files)
**Commits:** 12
**Type:** Feature

**Related PRs:** None
**Dependencies:** Requires OAuth2 credentials setup in .env
```

## Special Cases

### Large PRs (>500 lines)

```
⚠️  Large PR Detected (847 lines changed)

Consider:
  1. Breaking into smaller PRs
  2. Adding detailed documentation
  3. Requesting multiple reviewers

Should I add a "Large PR" warning to the description? (yes/no)
```

If yes, prepend:
```
## ⚠️ Large PR Notice
This PR contains 847 lines of changes across 23 files. Key areas to focus:
1. OAuth2 core implementation (350 lines)
2. Test suite (400 lines)
3. Documentation updates (97 lines)

Estimated review time: 45-60 minutes
```

### Breaking Changes

Detect from commit messages (`BREAKING CHANGE:` footer):

```
## ⚠️ Breaking Changes

This PR includes breaking changes:

### Authentication Middleware
- `enforceAbility` now requires explicit resource names
- Migration guide: [link to docs]

**Before:**
```typescript
router.get('/', enforceAbility(), controller.getAll)
```

**After:**
```typescript
router.get('/', enforceAbility('Resource'), controller.getAll)
```

### Migration Required
- [ ] Update all route definitions
- [ ] Test authentication flows
- [ ] Update documentation
```

### UI Changes

Prompt for screenshots:
```
UI changes detected. Would you like to add screenshots? (yes/no)

Where to add screenshots:
  1. Drag & drop images in PR description
  2. Or provide links to screenshots
  3. Or record demo video

Add to description:
## Screenshots

### Before
[Screenshot of old UI]

### After
[Screenshot of new UI]

### Demo
[Link to demo video or GIF]
```

## Integration with Commands

This skill is invoked by:
- `/pr-create` - Primary PR creation command
- Any command that creates PRs

## Integration with Agents

Used by:
- `git-pr-manager` - Generates PR description
- `git-pr-reviewer` - References description in review

## Output Customization

**Ask user preferences:**
```
PR description ready. Customize?

[1] Use as-is (recommended)
[2] Make it shorter (remove testing/checklist details)
[3] Make it more detailed (add file-by-file breakdown)
[4] Edit manually

Your choice:
```

## Quality Checks

Before finalizing:
- [ ] Summary is clear and concise
- [ ] All commits are categorized
- [ ] Linear ticket is linked
- [ ] Testing checklist is relevant
- [ ] TheAnswer checklist items are accurate
- [ ] Review focus areas identified
- [ ] No sensitive information in description
- [ ] Proper markdown formatting

## Configuration

**Per CLAUDE.md:**
- Always target `staging` branch, not `main`
- Always link Linear tickets
- Always include multi-tenancy checklist
- Always include testing section
- Include screenshots for UI changes

## Example Output

```markdown
## Summary
This PR implements OAuth2 token refresh support, allowing users to maintain
authenticated sessions without re-logging in. Follows OAuth2 RFC 6749 and
integrates with TheAnswer's existing Auth0 authentication.

## Changes

### Features
- Implement OAuth2 token refresh endpoint (`POST /api/v1/oauth/refresh`)
- Add automatic token refresh middleware
- Add token expiration validation

### Testing
- Add OAuth2 integration test suite (15 tests)
- Add token refresh unit tests

### Documentation
- Update AUTHORIZATION.md with OAuth2 flows

## Linear Ticket
Closes [AAI-123: Add OAuth2 token refresh support](https://linear.app/theanswer/issue/AAI-123)

Users can now refresh expired tokens without re-authentication, improving
user experience for long-running sessions.

## Testing
- [x] Unit tests added (15 new tests)
- [x] Integration tests pass
- [x] Manual testing completed:
  - [x] Token refresh with expired tokens
  - [x] Token refresh rejection with invalid tokens
  - [x] Automatic refresh on API calls

## TheAnswer Checklist
- [x] Multi-tenancy filters applied
- [x] Authentication middleware present
- [x] No database migrations needed
- [x] No sensitive data committed
- [x] Debug code removed

## Review Focus
- OAuth2 token refresh implementation (packages/server/src/services/oauth.ts:45-120)
- Token validation middleware (packages/server/src/middlewares/auth/refresh.ts)
- Security: Verify no tokens in code, proper error handling

---
**Branch:** `feature/AAI-123-add-oauth2-support`
**Target:** `staging`
**Size:** Medium (250 lines, 8 files)
**Commits:** 12
```
