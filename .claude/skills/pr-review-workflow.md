---
name: pr-review-workflow
description: "Comprehensive PR review methodology with security and quality checks"
---

# PR Review Workflow Skill

Comprehensive framework for thorough, constructive pull request reviews.

## Quick PR Review Checklist (15-Point Summary)

Use this for fast reviews. Expand to detailed sections below for specifics.

### Security (5 items)
- [ ] All routes have `enforceAbility` or `checkPermission` middleware
- [ ] Controllers call `checkOwnership()` before returning/modifying resources
- [ ] No hardcoded secrets, tokens, or API keys
- [ ] SQL queries use parameterization (no string interpolation)
- [ ] No sensitive data in logs or error messages

### Data Integrity (5 items)
- [ ] All queries filter by `organizationId`
- [ ] Non-admin queries also filter by `userId`
- [ ] Migrations use `IF NOT EXISTS` and include `down()` rollback
- [ ] Entity has `organizationId` field (indexed)
- [ ] No cross-tenant data access introduced

### Code Quality (5 items)
- [ ] Errors use `InternalFlowiseError` with format: `Error: {service}.{method} - {desc}`
- [ ] Required fields validated, types checked, max limits set
- [ ] Async operations properly awaited with error handling
- [ ] Functions < 50 lines, clear naming, comments on complex logic
- [ ] Tests cover new functionality and edge cases

---

## Route Security Checklist

### Required Middleware
```typescript
// REQUIRED: All routes must have auth middleware
router.get('/', enforceAbility('Resource'), controller.getAll)
router.post('/', enforceAbility('Resource'), controller.create)
```

### Checklist
- [ ] All routes have `enforceAbility` or `checkPermission` middleware
- [ ] Exception: Organization routes (id IS organizationId - special case)
- [ ] Exception: Public endpoints (`/ping`, `/healthcheck`, webhooks)
- [ ] `checkAnyPermission` used for multiple permissions (comma-separated)
- [ ] Ability names match resource names (e.g., `Chatflow` for chatflow routes)

---

## Controller Validation Checklist

### Required Patterns
```typescript
const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Parameter validation
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: controller.getById - id required')
        }

        // 2. User context check
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: controller.getById - user required')
        }

        const resource = await service.getById(req.params.id, req.user)

        // 3. Ownership check BEFORE returning
        if (!(await checkOwnership(resource, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: controller.getById - Unauthorized')
        }

        return res.json(resource)
    } catch (error) {
        next(error)  // 4. Pass errors to middleware
    }
}
```

### Checklist
- [ ] Parameter validation: `req.params.id` exists
- [ ] Body validation: `req.body` exists for POST/PUT
- [ ] User context: `req.user` exists
- [ ] `checkOwnership()` called BEFORE returning/modifying resources
- [ ] Errors passed to `next(error)`

---

## Service Layer Checklist

### Required Patterns
```typescript
async getById(id: string, user: IUser): Promise<Resource> {
    const resource = await this.repository.findOne({
        where: {
            id,
            organizationId: user.organizationId,  // REQUIRED
            ...(user.role !== 'admin' && { userId: user.id })  // Non-admin filter
        }
    })

    if (!resource) {
        throw new InternalFlowiseError(
            StatusCodes.NOT_FOUND,
            `Error: resourceService.getById - Resource ${id} not found`
        )
    }
    return resource
}
```

### Checklist
- [ ] `organizationId` filter on ALL queries
- [ ] `userId` filter for non-admin queries
- [ ] `workspaceId` handled (auto via Repository Decorator OR manual)
- [ ] Errors wrapped with `InternalFlowiseError`
- [ ] `getErrorMessage()` used for external errors

---

## Multi-Tenancy Checklist (CRITICAL)

**Every database operation MUST be tenant-scoped.**

### Checklist
- [ ] Services filter by `organizationId` on ALL operations
- [ ] Non-admin queries additionally filter by `userId`
- [ ] Controllers use `checkOwnership()` before data access
- [ ] Entity has `organizationId` field (indexed)
- [ ] No cross-tenant queries introduced
- [ ] API responses don't expose other orgs' data
- [ ] JOIN queries preserve `organizationId` filters
- [ ] Subqueries include `organizationId`

### Violation Detection
```bash
# Find queries missing organizationId
git diff staging..HEAD | grep -E "\.(find|findOne|where|createQueryBuilder)"
# Verify each has organizationId filter
```

---

## Validation Middleware Checklist

### Checklist
- [ ] Required fields validated (not null/undefined)
- [ ] Type validation (string, number, array, boolean)
- [ ] Format validation (URL, email, enum values, date ranges)
- [ ] Max limits set (`pageSize <= 100`, string lengths)
- [ ] Sanitization on string inputs (trim, escape)
- [ ] Array length limits

---

## Database Migration Checklist

### Required Patterns
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // Safe re-runs
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "resource" (...)
    `)

    // Add column with default for existing rows
    await queryRunner.query(`
        ALTER TABLE "resource"
        ADD COLUMN IF NOT EXISTS "newField" varchar DEFAULT 'default_value'
    `)

    // Backfill existing data
    await queryRunner.query(`
        UPDATE "resource" SET "newField" = 'computed_value' WHERE "newField" IS NULL
    `)

    // Index on tenant fields
    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_resource_orgId" ON "resource" ("organizationId")
    `)
}

public async down(queryRunner: QueryRunner): Promise<void> {
    // REQUIRED: Rollback capability
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_resource_orgId"`)
    await queryRunner.query(`ALTER TABLE "resource" DROP COLUMN IF EXISTS "newField"`)
}
```

### Checklist
- [ ] `IF NOT EXISTS` / `IF EXISTS` for safe re-runs
- [ ] Default values for NOT NULL columns on existing tables
- [ ] Backfill operations included for data migrations
- [ ] Index on foreign keys and tenant fields (`organizationId`, `userId`)
- [ ] `down()` method for rollback

---

## Error Handling Checklist

### Required Format
```typescript
// Standard error format
throw new InternalFlowiseError(
    StatusCodes.NOT_FOUND,
    `Error: chatflowService.getById - Chatflow ${id} not found`
)
//     ^^^^^^^^^^^^^^^^^^^^^^^   ^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^
//     Format: Error: {service}.{method} - {description}

// Wrapping external errors
try {
    await externalApi.call()
} catch (error) {
    throw new InternalFlowiseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error: service.method - ${getErrorMessage(error)}`
    )
}
```

### Checklist
- [ ] All errors use `InternalFlowiseError`
- [ ] Format: `Error: {service}.{method} - {description}`
- [ ] Appropriate `StatusCodes` used (404, 401, 403, 500, etc.)
- [ ] No sensitive data in error messages (no passwords, tokens, PII)
- [ ] External errors wrapped with `getErrorMessage()`

---

## Logging Checklist

### Checklist
- [ ] No passwords, tokens, or PII logged
- [ ] Sensitive fields use `LOG_SANITIZE_BODY_FIELDS` env var
- [ ] Email patterns masked in logs
- [ ] Stack traces only in development mode
- [ ] Request bodies sanitized before logging

---

## Review Methodology

### Step 1: Gather Context

```bash
gh pr view <number> --json number,title,body,author,state,isDraft
gh pr view <number> --json files --jq '.files[].path'
gh pr diff <number>
```

### Step 2: Assess Scope

| Size | Lines Changed | Review Approach |
|------|---------------|-----------------|
| Small | < 100 | Quick review |
| Medium | 100-500 | Standard review |
| Large | 500-1000 | Thorough review |
| X-Large | > 1000 | Suggest splitting |

### Step 3: Diff Analysis Categories

#### A. Correctness & Logic
- [ ] Code does what it claims
- [ ] Edge cases handled (null, empty arrays)
- [ ] Async operations properly awaited
- [ ] All code paths return expected types

#### B. Security (See Route Security Checklist above)
- [ ] Input validation/sanitization
- [ ] Parameterized SQL queries
- [ ] Authentication on protected routes
- [ ] No sensitive data in logs

#### C. Performance
- [ ] No N+1 queries (use JOINs or batch loading)
- [ ] Efficient algorithms (avoid O(n^2))
- [ ] Event listeners cleaned up in useEffect
- [ ] Caching for expensive operations

#### D. Multi-Tenancy (See Multi-Tenancy Checklist above)
- [ ] organizationId filter on ALL queries
- [ ] No cross-tenant data access

#### E. Maintainability
- [ ] Functions < 50 lines, single responsibility
- [ ] Clear naming (no `x`, `data`, `proc`)
- [ ] Complex logic has comments
- [ ] Magic numbers replaced with constants

### Step 4: Format Review Comments

**Comment format:**
```
**Location**: `file.ts:45`
**Severity**: Critical | Major | Minor | Suggestion
**Issue**: [Brief description]
**Why**: [Impact]
**Fix**: [Code example]
```

**Severity levels:**
- **Critical**: Security, data corruption, crashes - MUST FIX
- **Major**: Bugs, performance - SHOULD FIX
- **Minor**: Edge cases, quality - CONSIDER
- **Suggestion**: Nice-to-have - OPTIONAL

### Step 5: Structure Review Output

```markdown
## PR Review: [Title]

**Summary**: [1-2 sentences]

### Critical Issues (MUST FIX)
1. **Issue** (file:line) - [Details]

### Major Concerns (SHOULD FIX)
2. **Issue** (file:line) - [Details]

### Minor & Suggestions
3. **Issue** (file:line) - [Details]

### Positive Observations
- [Good practices noted]

### Next Steps
1. Fix critical issues before merge
2. Address major concerns (can be follow-up)
```

### Step 6: Post to GitHub

```bash
# Request changes
gh pr review <number> --request-changes --body "Review comments..."

# Approve
gh pr review <number> --approve --body "LGTM!"
```

---

## Testing Checklist

- [ ] Unit tests for new functionality
- [ ] Integration tests for API changes
- [ ] Edge cases tested
- [ ] Tests are meaningful, not just coverage

---

## Documentation Checklist

- [ ] CLAUDE.md updated (if architecture changes)
- [ ] API endpoints documented
- [ ] Complex logic has comments

---

## Review Best Practices

**Do:**
- Focus on actual changes in diff
- Provide concrete suggestions with examples
- Acknowledge good practices
- Prioritize by severity

**Don't:**
- Nitpick style preferences
- Comment on unchanged code
- Be vague ("this could be better")
- Rush through large PRs

---

## Integration

Used by:
- `/pr-review` command
- `git-pr-reviewer` agent
