# PR Review Workflow Skill

This skill provides a comprehensive framework for conducting thorough, constructive pull request reviews that improve code quality while fostering team growth.

## Purpose

Guide reviewers through systematic PR analysis covering:
- Code correctness and logic
- Security vulnerabilities
- Performance implications
- Maintainability and readability
- Project-specific patterns (multi-tenancy, authentication)
- Constructive feedback delivery

## Review Methodology

### Step 1: Gather Context

**Before starting the review, collect:**

```bash
# Get PR metadata
gh pr view <number> --json number,title,body,author,state,isDraft,reviewDecision

# Get changed files list
gh pr view <number> --json files --jq '.files[].path'

# Get PR diff
gh pr diff <number>
```

**Ask the user:**
- Which PR number or URL to review?
- Are there specific concerns or areas to focus on?
- What's the context of these changes (bug fix, feature, refactor)?
- Is this a draft PR or ready for full review?

**Extract from PR:**
- Title and description
- Linear ticket reference (if any)
- Changed files and line counts
- Author and reviewers
- Current review status

### Step 2: Analyze PR Scope

**Categorize the PR type:**

```
Type Detection:
- feat/* branch → Feature (new functionality)
- fix/* branch → Bug fix (correcting existing behavior)
- chore/* branch → Maintenance (dependencies, refactoring)
- docs/* branch → Documentation only
```

**Assess size:**
```
Small:  < 100 lines changed (quick review)
Medium: 100-500 lines (standard review)
Large:  500-1000 lines (thorough review needed)
X-Large: > 1000 lines (suggest breaking up)
```

**If X-Large:**
```
⚠️  Large PR Detected: 1,234 lines changed

Consider:
  1. Breaking into smaller, focused PRs
  2. Extended review time needed
  3. Multiple reviewers recommended

Proceed with review? (yes/no)
```

### Step 3: Systematic Diff Analysis

**Review each changed file systematically:**

#### A. Correctness & Logic

**Check for:**
- Does the code do what it claims to do?
- Are edge cases handled?
- Null/undefined reference safety
- Logic soundness
- Return value handling
- Error conditions

**Pattern to detect:**
```typescript
// ❌ Missing null check
function processUser(user: User) {
  return user.email.toLowerCase() // Crash if user or email is null
}

// ✅ Proper null handling
function processUser(user: User | null): string | null {
  if (!user?.email) return null
  return user.email.toLowerCase()
}
```

**Review checklist:**
- [ ] All code paths return expected types
- [ ] Edge cases (empty arrays, null values) handled
- [ ] Loops have proper termination conditions
- [ ] Async operations properly awaited
- [ ] Promises properly error-handled

#### B. Security Vulnerabilities

**Check for:**

1. **Input Validation**
```typescript
// ❌ Unsanitized input
router.post('/search', (req, res) => {
  const query = req.body.query
  db.raw(`SELECT * FROM users WHERE name LIKE '%${query}%'`) // SQL injection!
})

// ✅ Parameterized query
router.post('/search', (req, res) => {
  const query = req.body.query
  db('users').where('name', 'like', `%${query}%`) // Safe
})
```

2. **Authentication/Authorization**
```typescript
// ❌ Missing authentication
router.get('/api/admin/users', adminController.getUsers)

// ✅ With enforceAbility middleware
router.get('/api/admin/users', enforceAbility('Admin'), adminController.getUsers)
```

3. **Sensitive Data Exposure**
```typescript
// ❌ Logging sensitive data
console.log('User logged in:', user) // Contains password hash, tokens, etc.

// ✅ Log only necessary info
console.log('User logged in:', { id: user.id, email: user.email })
```

4. **XSS Prevention**
```typescript
// ❌ Dangerous HTML rendering
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ Safe rendering
<div>{sanitizeHtml(userInput)}</div>
```

**Security review checklist:**
- [ ] All user inputs validated/sanitized
- [ ] SQL queries use parameterization
- [ ] Authentication present on protected routes
- [ ] Authorization checks before data access
- [ ] No sensitive data in logs
- [ ] XSS prevention in UI rendering
- [ ] CSRF protection on state-changing endpoints
- [ ] Rate limiting on public endpoints

#### C. Performance Implications

**Check for:**

1. **N+1 Query Problems**
```typescript
// ❌ N+1 queries
for (const user of users) {
  user.posts = await db('posts').where({ userId: user.id })
}

// ✅ Single query with join
const users = await db('users')
  .leftJoin('posts', 'users.id', 'posts.userId')
  .select('users.*', 'posts.*')
```

2. **Inefficient Algorithms**
```typescript
// ❌ O(n²) complexity
for (const item of items) {
  for (const other of items) {
    if (item.id === other.relatedId) { ... }
  }
}

// ✅ O(n) with Map
const itemMap = new Map(items.map(i => [i.id, i]))
for (const item of items) {
  const related = itemMap.get(item.relatedId)
}
```

3. **Memory Leaks**
```typescript
// ❌ Event listener not cleaned up
useEffect(() => {
  window.addEventListener('resize', handleResize)
  // Missing cleanup!
})

// ✅ Proper cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

**Performance review checklist:**
- [ ] No N+1 database queries
- [ ] Efficient algorithms (avoid O(n²) or worse)
- [ ] Appropriate data structures used
- [ ] Event listeners properly cleaned up
- [ ] Large lists virtualized (if UI)
- [ ] Images optimized (if UI)
- [ ] Caching considered for expensive operations

#### D. Multi-Tenancy Patterns (TheAnswer-Specific)

**Critical check: Every database query MUST filter by organizationId**

```typescript
// ❌ CRITICAL: Missing organizationId filter
const chatflows = await db('chatflows')
  .where({ id: chatflowId })

// Data leak! User can access other organizations' data

// ✅ Proper multi-tenancy
const chatflows = await db('chatflows')
  .where({
    id: chatflowId,
    organizationId: user.organizationId // REQUIRED
  })
```

**Scan patterns:**
```bash
# Find all database queries in changed files
git diff staging..HEAD | grep -E "\.(find|findOne|where|createQueryBuilder)"

# For each query, verify organizationId is present
```

**Multi-tenancy review checklist:**
- [ ] All SELECT queries filter by organizationId
- [ ] All UPDATE queries filter by organizationId
- [ ] All DELETE queries filter by organizationId
- [ ] JOIN queries preserve organizationId filters
- [ ] Subqueries include organizationId
- [ ] No raw SQL without organizationId

**If missing organizationId:**
```
⚠️  CRITICAL: Multi-tenancy violation

File: packages/server/src/services/chatflow.ts
Line: 45

Query missing organizationId filter:
  repository.find({ where: { id } })

Impact: Users can access other organizations' data

Required fix:
  repository.find({
    where: {
      id,
      organizationId: user.organizationId
    }
  })

This MUST be fixed before merge.
```

#### E. Authentication Patterns (TheAnswer-Specific)

**All routes MUST have enforceAbility middleware**

```typescript
// ❌ CRITICAL: Missing authentication
router.post('/api/v1/chatflows', chatflowController.create)

// Anyone can create chatflows!

// ✅ Proper authentication
router.post(
  '/api/v1/chatflows',
  enforceAbility('Chatflow'),
  chatflowController.create
)
```

**Scan patterns:**
```bash
# Find new routes in changed files
git diff staging..HEAD | grep -E "router\.(get|post|put|delete|patch)"

# Verify each route has enforceAbility
```

**Authentication review checklist:**
- [ ] All routes have enforceAbility middleware
- [ ] Ability names match resource names
- [ ] Public routes explicitly documented
- [ ] Webhook endpoints have proper auth
- [ ] API endpoints validate tokens

**If missing enforceAbility:**
```
⚠️  CRITICAL: Missing authentication

File: packages/server/src/routes/oauth/index.ts
Line: 23

Route without enforceAbility:
  router.post('/token', oauthController.getToken)

Impact: Unauthenticated access possible

Required fix:
  router.post(
    '/token',
    enforceAbility('OAuth'),
    oauthController.getToken
  )

This MUST be fixed before merge.
```

#### F. Maintainability & Readability

**Check for:**

1. **Function Complexity**
```typescript
// ❌ Too complex (80+ lines, multiple responsibilities)
function handleUserAction(user, action, context) {
  // 80 lines of nested if/else, multiple concerns mixed
}

// ✅ Broken into focused functions
function handleUserAction(user, action, context) {
  validateAction(action)
  const permissions = getUserPermissions(user)
  checkAuthorization(permissions, action)
  executeAction(action, context)
  logAction(user, action)
}
```

2. **Naming Conventions**
```typescript
// ❌ Unclear names
function proc(d) { ... }
const x = getData()

// ✅ Clear, descriptive names
function processUserData(userData) { ... }
const authenticatedUser = getAuthenticatedUser()
```

3. **Error Handling**
```typescript
// ❌ Silent failures
try {
  await processPayment(amount)
} catch (e) {
  console.log(e) // Silent failure!
}

// ✅ Proper error handling
try {
  await processPayment(amount)
} catch (error) {
  logger.error('Payment processing failed', { error, amount })
  throw new InternalFlowiseError('PAYMENT_FAILED', error.message)
}
```

**Maintainability review checklist:**
- [ ] Functions are focused (< 50 lines)
- [ ] Variable names are descriptive
- [ ] Complex logic has comments
- [ ] Error handling is comprehensive
- [ ] Magic numbers replaced with constants
- [ ] Duplication minimized

### Step 4: Create Structured Review Comments

**Format each finding:**

```markdown
**Location**: `packages/server/src/services/oauth.ts:45`
**Severity**: Critical | Major | Minor | Suggestion
**Issue**: [Brief description]

**Why**: [Impact or concern]

**Suggestion**:
[Concrete recommendation with code example]

\`\`\`typescript
// Proposed fix
[code example]
\`\`\`
```

**Severity guidelines:**
- **Critical**: Security vulnerability, data corruption, crashes
- **Major**: Significant bug, performance issue, breaks functionality
- **Minor**: Edge case bug, suboptimal pattern, code quality
- **Suggestion**: Nice-to-have improvements, style preferences

**Example review comment:**

```markdown
**Location**: `packages/server/src/services/chatflow.ts:45`
**Severity**: Critical

**Issue**: Missing organizationId filter in database query

**Why**: This allows users to access chatflows from other organizations,
violating multi-tenancy and potentially exposing sensitive data.

**Suggestion**:
Add organizationId filter to the query:

\`\`\`typescript
const chatflow = await this.repository.findOne({
  where: {
    id: chatflowId,
    organizationId: user.organizationId // Add this
  }
})
\`\`\`
```

### Step 5: Organize Findings

**Group by severity:**

```
## PR Review: Add OAuth2 token refresh support

**Summary**:
Implements OAuth2 refresh tokens. Code quality is good but has
critical security issues that must be addressed.

### 🚨 Critical Issues (MUST FIX)

1. **Missing organizationId filter** (oauth.ts:45)
   - [Details and suggestion]

2. **Missing enforceAbility middleware** (routes/oauth.ts:12)
   - [Details and suggestion]

### ⚠️ Major Concerns (SHOULD FIX)

3. **Token not properly validated** (services/token.ts:89)
   - [Details and suggestion]

4. **N+1 query in refresh logic** (services/oauth.ts:123)
   - [Details and suggestion]

### 💡 Minor Issues & Suggestions

5. **Consider extracting token validation** (oauth.ts:56-78)
   - [Details and suggestion]

6. **Add JSDoc comments** (oauth.ts:34)
   - [Details and suggestion]

### ✅ Positive Observations

- Excellent test coverage (15 new tests)
- Clear error messages
- Proper TypeScript types throughout
- Good commit message format

### Next Steps

1. Address critical issues (1-2) before merge
2. Consider major concerns (3-4) - can be follow-up
3. Minor suggestions (5-6) - optional improvements
```

### Step 6: Post Review to GitHub

**Using gh CLI:**

```bash
# Post general comment
gh pr comment <number> --body "$(cat <<'EOF'
[Your review content here]
EOF
)"

# Request changes
gh pr review <number> \
  --request-changes \
  --body "$(cat <<'EOF'
Critical security issues found. See comments for details.
EOF
)"

# Approve
gh pr review <number> \
  --approve \
  --body "$(cat <<'EOF'
Looks good! Nice work on the test coverage.
EOF
)"

# Add inline comment (GitHub API)
gh api repos/{owner}/{repo}/pulls/<number>/reviews \
  -f body="Review complete" \
  -f event="REQUEST_CHANGES" \
  -F comments[][path]="src/file.ts" \
  -F comments[][position]=10 \
  -F comments[][body]="Specific feedback here"
```

### Step 7: Follow-Up Review

**After author addresses feedback:**

1. **Check if issues resolved:**
```bash
# Get latest diff
gh pr diff <number>

# Check specific files
gh pr diff <number> -- path/to/file.ts
```

2. **Verify fixes:**
- Critical issues: Verify each is properly fixed
- Major concerns: Check if addressed or plan exists
- Suggestions: Note if implemented

3. **Post follow-up:**
```bash
gh pr review <number> --approve --body "$(cat <<'EOF'
✓ Critical issues resolved
✓ Security concerns addressed
✓ Ready to merge

Nice work addressing the feedback!
EOF
)"
```

## TheAnswer-Specific Checklist

**For every PR, verify:**

### Multi-Tenancy
- [ ] All database queries include organizationId
- [ ] No raw SQL without organizationId
- [ ] Join queries preserve organizationId filters
- [ ] Subqueries include organizationId

### Authentication
- [ ] All routes have enforceAbility middleware
- [ ] Ability names match resource names
- [ ] Public routes are explicitly documented
- [ ] Token validation is present

### Error Handling
- [ ] Uses InternalFlowiseError consistently
- [ ] Error messages don't expose sensitive data
- [ ] Errors are logged appropriately
- [ ] User-facing errors are helpful

### Testing
- [ ] Unit tests for new functionality
- [ ] Integration tests for API changes
- [ ] Edge cases are tested
- [ ] Tests are meaningful, not just coverage

### Database
- [ ] Migrations are included (if schema changes)
- [ ] Migrations are reversible
- [ ] No direct SQL without parameterization
- [ ] Indexes added for new queries

### Documentation
- [ ] CLAUDE.md updated (if architecture changes)
- [ ] API endpoints documented
- [ ] Complex logic has comments
- [ ] README updated (if needed)

## Review Anti-Patterns to Avoid

**❌ Don't:**
- Nitpick style without project-standard violations
- Comment on existing code not changed in PR
- Request changes without clear reasoning
- Be vague ("this could be better")
- Ignore positive aspects
- Rush through large PRs

**✅ Do:**
- Focus on actual changes in the diff
- Provide concrete suggestions with examples
- Acknowledge good practices
- Prioritize issues by severity
- Be constructive and collaborative
- Ask questions when unsure

## Integration with Commands

This skill is used by:
- `/pr-review` - Primary PR review command
- `git-pr-reviewer` agent - Autonomous PR review

## Integration with Agents

Used by:
- `git-pr-reviewer` - Implements this workflow

## Quality Standards

Before completing review:
- [ ] Reviewed ALL changed files
- [ ] Checked all critical patterns (auth, multi-tenancy)
- [ ] Comments are actionable and specific
- [ ] Severity levels are appropriate
- [ ] Positive aspects acknowledged
- [ ] Next steps are clear
