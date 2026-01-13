---
name: commit-helper
description: "Validates and creates conventional commits with semantic versioning"
---

# Commit Helper Skill

This skill validates and standardizes git commits according to TheAnswer conventions, ensuring quality and consistency.

## Purpose

Ensure all commits:
- Follow conventional commit format
- Reference tickets when applicable
- Don't contain sensitive data or debug code
- Are properly scoped and sized
- Follow TheAnswer commit guidelines

## Commit Message Format

```
<type>(<ticket-id>): <description>

[optional body]

[optional footer]
```

### Types
- `feat` - New features
- `fix` - Bug fixes
- `chore` - Maintenance, dependencies, tooling
- `docs` - Documentation updates
- `refactor` - Code improvements without behavior change
- `test` - Testing improvements
- `perf` - Performance improvements
- `style` - Formatting changes

### Examples
```
feat(AAI-123): add OAuth2 token refresh
fix(AAI-456): resolve memory leak in chat processing
chore(AAI-789): update langchain to v0.3
docs: update CLAUDE.md with workflow guides
test(AAI-123): add OAuth2 integration tests
```

## Workflow

### 1. Validate Current Branch (CRITICAL)

**NEVER allow commits on staging/production branches**

```bash
# Get current branch
git branch --show-current
```

**Branch validation rules:**
```
✅ VALID BRANCHES:
- feature/AAI-123-description
- fix/AAI-456-description
- chore/AAI-789-description

❌ INVALID BRANCHES (BLOCK COMMIT):
- staging
- main
- production
- master
- develop
- Any branch without ticket ID pattern
```

**If on staging/main/production:**
```
⚠️  FATAL: Cannot commit to staging/production

Current branch: staging

You CANNOT commit directly to staging/production branches.

STOP THE COMMIT IMMEDIATELY.

Guide user to:
  1. Use /ticket-start to create proper feature branch
  2. Or use /ticket-create if no ticket exists

DO NOT PROCEED WITH COMMIT.
```

**If branch has no ticket ID:**
```
⚠️  No Linear ticket ID in branch name

Current branch: my-random-branch
Expected pattern: {type}/AAI-###-description

All work must be tracked in Linear tickets.

Guide user to:
  1. Use /ticket-create to create ticket
  2. Use /ticket-start to create proper branch

DO NOT PROCEED WITH COMMIT.
```

**Extract and verify ticket ID:**
```bash
# Extract ticket ID from branch name
# Pattern: {type}/{TICKET-ID}-{description}
# Example: feature/AAI-123-add-oauth2 → AAI-123

# Verify ticket exists
mcp__linear__get_issue --id AAI-123
```

**If ticket not found:**
```
⚠️  Ticket AAI-123 not found in Linear

The branch references a ticket that doesn't exist.

Options:
  1. Create ticket with /ticket-create
  2. Switch to correct branch
  3. Cancel commit

DO NOT PROCEED until resolved.
```

### 2. Check Git Status

```bash
git status --porcelain
```

Identify:
- Staged files
- Unstaged files
- Untracked files

If no changes:
```
No changes to commit. Stage files first with:
  git add <file>
or
  Would you like me to help stage files?
```

### 3. Extract Context

**Ticket ID already extracted and validated in Step 1**

**Get recent commits for style reference:**
```bash
git --no-pager log --oneline -n 5
```

### 4. Analyze User's Commit Message

**Parse message components:**
- Type (feat/fix/chore/etc.)
- Ticket ID (if present)
- Description
- Body (if present)

**Validate format:**
- Type is valid
- Description starts with lowercase
- Description is concise (<50 chars for summary)
- No period at end of summary

### 5. Auto-Enhancement

**If ticket ID missing but branch has one:**
```
Current branch: feature/AAI-123-add-oauth2
Your message: "add token refresh logic"

Suggest: "feat(AAI-123): add token refresh logic"
```

**If type missing:**
```
Your message: "update dependencies"

What type of change?
  [1] feat - New feature
  [2] fix - Bug fix
  [3] chore - Maintenance
  [4] docs - Documentation
  [5] refactor - Code improvement
  [6] test - Testing
```

**If description too vague:**
```
Your message: "fix bug"

This is too vague. Be more specific:
  Good: "fix memory leak in chat processing"
  Bad: "fix bug"

What does this commit actually fix?
```

### 6. Security & Quality Checks

**Scan staged files for issues:**

**Check 1: Sensitive Data**
```bash
# Scan for patterns
grep -r "api_key\|apiKey\|API_KEY" {staged-files}
grep -r "password\|PASSWORD" {staged-files}
grep -r "secret\|SECRET" {staged-files}
grep -r "token\|TOKEN" {staged-files}
```

If found:
```
⚠️  WARNING: Potential sensitive data detected!

File: packages/server/src/config.ts
Line 42: const apiKey = "sk-1234567890abcdef"

This looks like an API key. Please verify:
  1. Is this for testing only?
  2. Should this use environment variables?
  3. Is this safe to commit?

Continue? (yes/no)
```

**Check 2: Debug Code**
```bash
# Scan for debug statements
grep -r "console\.log\|console\.debug" {staged-files}
grep -r "debugger;" {staged-files}
grep -r "TODO\|FIXME\|XXX" {staged-files}
```

If found:
```
⚠️  Debug code detected:

File: packages/ui/src/views/chatflow.jsx
Line 156: console.log('User data:', user)

Should this be committed?
  [1] Remove before commit
  [2] Keep for now
  [3] Cancel commit
```

**Check 3: File Size**
```bash
# Check for large files
git diff --cached --stat | grep "|\s*[0-9]\{4,\}"
```

If found:
```
⚠️  Large file detected:

File: assets/demo-video.mp4 (45 MB)

Large binary files should not be committed.
Consider:
  1. Use Git LFS
  2. Store in external storage
  3. Add to .gitignore

Continue? (yes/no)
```

**Check 4: Migration Files**
```bash
# Check if migration files are staged
git diff --cached --name-only | grep "migration"
```

If found:
```
⚠️  Database migration detected!

Files:
  - packages/server/src/database/migrations/1234567890-AddOAuth.ts

Have you:
  [ ] Tested migration locally?
  [ ] Verified rollback works?
  [ ] Updated CLAUDE.md if needed?

Per TheAnswer guidelines, prompt user before running migrations.
```

### 7. TheAnswer-Specific Checks

**Check multi-tenancy pattern:**
```bash
# Look for database queries in staged files
grep -r "\.find\|\.findOne\|\.createQueryBuilder" {staged-files}
```

For each query, verify:
```
Checking multi-tenancy patterns...

File: packages/server/src/services/chatflow/index.ts
Line 45: repository.find({ where: { id } })

⚠️  Missing organizationId filter!

Should be:
  repository.find({
    where: {
      id,
      organizationId: user.organizationId
    }
  })

Fix before committing? (yes/no/skip)
```

**Check authentication:**
```bash
# Look for new routes
grep -r "router\.\(get\|post\|put\|delete\)" {staged-files}
```

For each route, verify:
```
Checking route authentication...

File: packages/server/src/routes/oauth/index.ts
Line 12: router.post('/token', oauthController.getToken)

⚠️  Missing enforceAbility middleware!

Should be:
  router.post('/token', enforceAbility('OAuth'), oauthController.getToken)

Fix before committing? (yes/no/skip)
```

### 8. Confirm & Commit

**Present final commit:**
```
Ready to commit:

Type: feat
Ticket: AAI-123
Message: feat(AAI-123): add OAuth2 token refresh

Staged files (3):
  ✓ packages/server/src/services/oauth.ts
  ✓ packages/server/src/controllers/oauth/index.ts
  ✓ packages/server/test/oauth.test.ts

Checks passed:
  ✓ No sensitive data
  ✓ No debug code
  ✓ Multi-tenancy verified
  ✓ Authentication present
  ✓ File sizes OK

Proceed? (yes/edit/cancel)
```

**If user chooses "edit":**
Allow them to modify message, then re-validate.

**Commit:**
```bash
git commit -m "feat(AAI-123): add OAuth2 token refresh"
```

**Success:**
```
✓ Committed: feat(AAI-123): add OAuth2 token refresh
  Files: 3
  Branch: feature/AAI-123-add-oauth2-support

Next steps:
  - More changes needed? Continue working
  - Ready for PR? Run: /pr-create
  - Quick commit? Run: /commit "your message"
```

## Integration with Commands

This skill is invoked by:
- `/commit` - Primary commit command
- Any command that creates commits

## Integration with Agents

Used by:
- `git-pr-manager` - Validates commits before PR
- Any agent that creates commits

## Error Handling

**Invalid commit type:**
```
Error: 'feature' is not a valid commit type
Valid types: feat, fix, chore, docs, refactor, test, perf, style
```

**Commit message too long:**
```
Warning: Commit summary is 87 characters (max 50 recommended)
Consider shortening or moving details to commit body.
```

**Pre-commit hook fails:**
```
Pre-commit hook failed (eslint)

Options:
  [1] Fix issues and retry
  [2] Commit with --no-verify (not recommended)
  [3] Cancel commit

The Answer convention: Fix issues rather than bypass hooks.
```

## Configuration

**Customizable checks:**
- Enable/disable specific checks
- Custom sensitive data patterns
- File size limits
- Custom commit templates

**Per CLAUDE.md:**
- Always use staging for PRs
- Always include ticket ID when available
- Follow conventional commits
- Run security checks

## Quality Checklist

Before completing commit:
- [ ] Commit message follows convention
- [ ] Ticket ID included (if applicable)
- [ ] No sensitive data in files
- [ ] No debug code (or intentional)
- [ ] File sizes reasonable
- [ ] Multi-tenancy patterns followed
- [ ] Routes have authentication
- [ ] Tests included (if feature/fix)
- [ ] User confirmed commit
