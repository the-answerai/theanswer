# Ticket Planning Workflow Skill

This skill provides comprehensive patterns for transforming Linear tickets into actionable implementation plans through systematic investigation and collaborative planning.

## Purpose

Transform uncertainty into clarity by:
- Gathering complete ticket context from Linear
- Exploring relevant codebase sections
- Identifying patterns and conventions
- Asking targeted clarifying questions
- Creating detailed, actionable implementation plans
- Establishing clear success criteria

## Planning Methodology

### Phase 1: Ticket Intelligence Gathering

#### Step 1: Fetch Ticket from Linear

```bash
# Get complete ticket information
ticket_id="AAI-123"
ticket_json=$(mcp__linear__get_issue --id "$ticket_id")

# Extract all relevant fields
title=$(echo "$ticket_json" | jq -r '.title')
description=$(echo "$ticket_json" | jq -r '.description')
status=$(echo "$ticket_json" | jq -r '.state.name')
priority=$(echo "$ticket_json" | jq -r '.priority')
labels=$(echo "$ticket_json" | jq -r '.labels[].name' | tr '\n' ', ')
assignee=$(echo "$ticket_json" | jq -r '.assignee.name // "Unassigned"')
creator=$(echo "$ticket_json" | jq -r '.creator.name')
created=$(echo "$ticket_json" | jq -r '.createdAt')
url=$(echo "$ticket_json" | jq -r '.url')

# Get comments/discussion
comments=$(mcp__linear__list_comments --issueId "$ticket_id")

# Get related tickets
parent_id=$(echo "$ticket_json" | jq -r '.parent.id // empty')
children_ids=$(echo "$ticket_json" | jq -r '.children[].id // empty')
```

#### Step 2: Parse and Understand Requirements

**Extract structured information:**

```markdown
# Ticket Summary: AAI-123

**Title**: Add OAuth2 token refresh support

**Type**: Feature (from labels: feature, backend, api)

**Priority**: High (Priority 2)

**Status**: Todo → Will move to In Progress

**Description**:
Currently, users must re-authenticate when their access tokens expire
(typically after 1 hour). This creates a poor user experience during
long sessions.

We need to implement OAuth2 token refresh following RFC 6749, allowing
users to obtain new access tokens without re-entering credentials.

**Acceptance Criteria** (from description):
- [ ] Users can refresh expired tokens without re-authentication
- [ ] Invalid refresh tokens return appropriate error (401)
- [ ] Token refresh respects rate limits
- [ ] Refresh tokens expire after 30 days of inactivity
- [ ] Existing session state is preserved after refresh

**Related Context**:
- Parent ticket: AAI-100 (OAuth2 Implementation)
- Depends on: AAI-120 (OAuth2 base setup - DONE)
- Blocks: AAI-125 (Mobile app integration)

**Discussion** (from 3 comments):
- @alice: "Should we store refresh tokens in database or Redis?"
- @bob: "Need to ensure organizationId is tracked with tokens"
- @charlie: "Consider token rotation for security"
```

**Identify what's unclear:**

```markdown
## Clarification Needed:

1. **Token Storage**: Database vs Redis?
   - Database: Persistent, queryable, slower
   - Redis: Fast, auto-expiry, volatile

2. **Token Rotation**: Implement now or later?
   - RFC 6749 recommends rotation
   - Adds complexity
   - Better security

3. **Refresh Token Scope**: Same as access token or restricted?

4. **Multi-device**: Support multiple refresh tokens per user?
```

### Phase 2: Deep Codebase Exploration

#### Step 1: Identify Relevant Code Sections

**Start with broad search patterns:**

```bash
# Find existing authentication code
rg "authentication|auth|token" --type ts --files-with-matches

# Find OAuth-related code
rg "oauth|OAuth" --type ts --files-with-matches

# Find token handling
rg "jwt|token.*expir|refresh.*token" --type ts --files-with-matches
```

**Narrow down to specific files:**

```
Relevant files found:
- packages/server/src/services/auth/index.ts (authentication service)
- packages/server/src/middlewares/auth/jwt.ts (JWT middleware)
- packages/server/src/controllers/oauth/index.ts (OAuth controller)
- packages/server/src/database/entities/User.ts (user entity)
- packages/server/src/routes/auth/index.ts (auth routes)
```

#### Step 2: Understand Current Architecture

**Read key files systematically:**

```markdown
## Current Authentication Architecture

### File: packages/server/src/services/auth/index.ts

**Current token generation:**
```typescript
generateTokens(user: User): TokenPair {
  const accessToken = jwt.sign(
    { userId: user.id, organizationId: user.organizationId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  // ❌ No refresh token implementation yet

  return { accessToken }
}
```

**Key insights:**
- Access tokens expire in 1 hour
- Tokens contain userId and organizationId (✓ multi-tenancy)
- No refresh token logic exists
- Uses JWT (RS256 signing)

### File: packages/server/src/middlewares/auth/jwt.ts

**Current token validation:**
```typescript
validateAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new InternalFlowiseError('TOKEN_EXPIRED')
    }
    throw new InternalFlowiseError('TOKEN_INVALID')
  }
}
```

**Key insights:**
- Expired tokens throw TOKEN_EXPIRED error
- No refresh mechanism in place
- Frontend receives error and redirects to login

### File: packages/server/src/database/entities/User.ts

**Current User entity:**
```typescript
@Entity()
export class User {
  @Column() id: string
  @Column() email: string
  @Column() organizationId: string
  // ❌ No refreshToken field
  // ❌ No refreshTokenExpiresAt field
}
```

**Key insights:**
- No schema for storing refresh tokens
- Need database migration to add fields
- Consider separate RefreshToken entity for multi-device support
```

#### Step 3: Find Similar Implementations

**Search for patterns to follow:**

```bash
# Find other token-related implementations
rg "jwt\.sign|jwt\.verify" --type ts -A 5

# Find other middleware patterns
ls packages/server/src/middlewares/

# Find error handling patterns
rg "InternalFlowiseError" --type ts -B 2 -A 2
```

**Document patterns found:**

```markdown
## Existing Patterns to Follow

### 1. Error Handling Pattern (from src/services/chatflow/index.ts)

```typescript
try {
  const result = await operation()
  return result
} catch (error) {
  logger.error('Operation failed', { error, context })
  throw new InternalFlowiseError('ERROR_CODE', error.message)
}
```

**Apply to token refresh:**
- Use InternalFlowiseError consistently
- Log errors with context
- Return appropriate error codes

### 2. Database Entity Pattern (from src/database/entities/*)

```typescript
@Entity()
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  organizationId: string // ✓ Multi-tenancy

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

**Apply to RefreshToken entity:**
- Include organizationId (critical!)
- Use UUID primary keys
- Add timestamps
- Consider soft deletes

### 3. Route Authentication Pattern (from src/routes/*/index.ts)

```typescript
router.post(
  '/endpoint',
  enforceAbility('Resource'),
  controller.action
)
```

**Apply to refresh endpoint:**
- Must have enforceAbility middleware
- Use 'OAuth' or 'Auth' resource name
- Follow RESTful conventions
```

#### Step 4: Check Project Guidelines

**Read project-specific docs:**

```bash
# Check CLAUDE.md for patterns
cat CLAUDE.md | grep -A 10 "multi-tenancy\|authentication\|database"

# Check .cursorrules for resource patterns
cat .cursorrules | grep -A 20 "Resource Pattern"

# Check for existing OAuth docs
ls docs/*oauth* docs/*auth*
```

**Extract relevant guidelines:**

```markdown
## Project Requirements (from CLAUDE.md)

### Multi-Tenancy (CRITICAL):
All database queries MUST filter by organizationId

### Authentication:
All routes MUST have enforceAbility middleware

### Database Migrations:
- Create migration with `pnpm db:migration:create`
- NEVER run migrations automatically
- Prompt user to run: `pnpm db:migrate`

### Error Handling:
- Use InternalFlowiseError consistently
- Don't expose sensitive data in errors
- Log errors with context

### Testing:
- Unit tests required for services
- Integration tests for API endpoints
- Run tests with: `pnpm test:auth`
```

### Phase 3: Collaborative Clarification

#### Ask Targeted Questions (2-4 at a time)

**Present questions with context and options:**

```markdown
## Implementation Questions

Based on codebase exploration, I need clarification on 4 key decisions:

### 1. Refresh Token Storage Strategy

**Context**: Currently no token storage exists. Found two patterns in codebase:
- Session data in Redis (fast, auto-expiry)
- User credentials in PostgreSQL (persistent, queryable)

**Options**:
A) **PostgreSQL Table** (recommended)
   - Pros: Queryable, audit trail, integrates with existing User entity
   - Cons: Slightly slower, requires migration
   - Pattern: Similar to existing ApiKey storage

B) **Redis with PostgreSQL backup**
   - Pros: Fast lookup, auto-expiry
   - Cons: More complex, two storage systems
   - Pattern: Similar to existing session storage

**Recommendation**: PostgreSQL (Option A) for consistency with existing patterns

**Your preference?** (A/B)

---

### 2. Multi-Device Support

**Context**: Ticket mentions "users" but doesn't specify device handling.

**Scenarios**:
- User logs in on laptop → gets refresh token
- User logs in on phone → should laptop session end?

**Options**:
A) **Single refresh token** (simpler)
   - One active refresh token per user
   - New login invalidates old token
   - Logs out other devices

B) **Multiple refresh tokens** (recommended)
   - One refresh token per device/session
   - Users can be logged in on multiple devices
   - Individual device logout

**Recommendation**: Multiple tokens (Option B) for better UX

**Your preference?** (A/B)

---

### 3. Token Rotation

**Context**: RFC 6749 recommends rotating refresh tokens on each use for security.

**Tradeoff**:
- **With rotation**: New refresh token issued on each refresh (more secure)
- **Without rotation**: Same refresh token reused (simpler)

**Options**:
A) **Implement now** (recommended by RFC 6749)
   - Better security
   - Detects token theft
   - More complex implementation

B) **Implement later** (MVP first)
   - Simpler initial implementation
   - Can add in follow-up ticket
   - Still reasonably secure with expiry

**Recommendation**: Implement later (Option B) - ticket scope already large

**Your preference?** (A/B)

---

### 4. Refresh Token Expiry

**Context**: Ticket says "30 days of inactivity". Need to clarify behavior.

**Options**:
A) **Fixed 30-day expiry**
   - Refresh token expires exactly 30 days from creation
   - Simpler logic
   - User must re-login after 30 days regardless

B) **Sliding 30-day expiry** (recommended)
   - Refresh token expires 30 days from last use
   - Updates on each refresh
   - Better for active users

**Recommendation**: Sliding expiry (Option B) for better UX

**Your preference?** (A/B)

---

Please answer with: A or B for each question
Or: "Discuss question X" if you need more context
```

**Handle responses:**

```markdown
## Decisions Made

Based on your responses:

1. **Storage**: PostgreSQL ✓
2. **Multi-device**: Multiple tokens ✓
3. **Rotation**: Defer to later ✓
4. **Expiry**: Sliding 30-day window ✓

These decisions will guide the implementation plan.
```

### Phase 4: Implementation Plan Generation

#### Step 1: Create High-Level Overview

```markdown
# Implementation Plan: AAI-123 - OAuth2 Token Refresh

## Overview

Implement OAuth2 token refresh to allow users to obtain new access tokens
without re-authentication when their tokens expire.

**Approach**:
- Add RefreshToken entity with multi-device support
- Create token refresh endpoint with rate limiting
- Update authentication flow to issue refresh tokens
- Add middleware to handle token expiry gracefully
- Follow existing patterns for multi-tenancy and error handling

**Decisions**:
- Storage: PostgreSQL (consistency with existing patterns)
- Multi-device: Supported (better UX)
- Token rotation: Deferred to follow-up ticket (scoping)
- Expiry: Sliding 30-day window (better for active users)

**Estimated Complexity**: Moderate
**Estimated Time**: 6-8 hours
```

#### Step 2: Detail Architecture Changes

```markdown
## Architecture Changes

### New Database Entity: RefreshToken

```typescript
@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  token: string // Hashed refresh token

  @Column()
  userId: string

  @Column()
  organizationId: string // ✓ Multi-tenancy

  @Column({ nullable: true })
  deviceInfo: string // User agent, device identifier

  @Column()
  expiresAt: Date // Sliding expiry (updated on use)

  @Column({ default: false })
  revoked: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  lastUsedAt: Date
}
```

### New API Endpoint

```
POST /api/v1/auth/refresh
Body: { refreshToken: string }
Response: { accessToken: string, refreshToken: string }
Middleware: enforceAbility('Auth'), rateLimiter
```

### Modified Services

- `AuthService.generateTokens()` - Now returns refresh token
- `AuthService.refreshAccessToken()` - New method
- `AuthService.revokeRefreshToken()` - New method

### Modified Entities

- No changes to User entity (using separate RefreshToken table)
```

#### Step 3: Create Detailed Implementation Steps

```markdown
## Implementation Steps

### Step 1: Database Migration (30 min)
**Complexity**: Simple

Create migration for RefreshToken table:

```bash
pnpm db:migration:create AddRefreshTokenTable
```

**Migration file**:
```typescript
export class AddRefreshTokenTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'refresh_token',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'token', type: 'varchar', length: '255' },
        { name: 'userId', type: 'uuid' },
        { name: 'organizationId', type: 'uuid' },
        { name: 'deviceInfo', type: 'text', isNullable: true },
        { name: 'expiresAt', type: 'timestamp' },
        { name: 'revoked', type: 'boolean', default: false },
        { name: 'createdAt', type: 'timestamp', default: 'now()' },
        { name: 'lastUsedAt', type: 'timestamp', default: 'now()' }
      ]
    }))

    // Add index for faster lookups
    await queryRunner.createIndex('refresh_token', new TableIndex({
      name: 'IDX_REFRESH_TOKEN',
      columnNames: ['token']
    }))

    // Add index for organizationId (multi-tenancy)
    await queryRunner.createIndex('refresh_token', new TableIndex({
      name: 'IDX_REFRESH_TOKEN_ORG',
      columnNames: ['organizationId', 'userId']
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_token')
  }
}
```

**Dependencies**: None
**Testing**: Verify migration runs: `pnpm db:migrate`

---

### Step 2: Create RefreshToken Entity (20 min)
**Complexity**: Simple

**File**: `packages/server/src/database/entities/RefreshToken.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  token: string

  @Column('uuid')
  userId: string

  @Column('uuid')
  organizationId: string // ✓ Multi-tenancy required

  @Column({ type: 'text', nullable: true })
  deviceInfo: string

  @Column('timestamp')
  expiresAt: Date

  @Column({ default: false })
  revoked: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  lastUsedAt: Date
}
```

**Dependencies**: Step 1 (migration)
**Testing**: Verify entity loads in TypeORM

---

### Step 3: Update AuthService - Generate Refresh Token (45 min)
**Complexity**: Moderate

**File**: `packages/server/src/services/auth/index.ts`

**Modify existing method**:
```typescript
async generateTokens(user: User, deviceInfo?: string): Promise<TokenPair> {
  // Generate access token (existing logic)
  const accessToken = jwt.sign(
    { userId: user.id, organizationId: user.organizationId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  // Generate refresh token (NEW)
  const refreshTokenValue = crypto.randomBytes(64).toString('hex')
  const hashedToken = await bcrypt.hash(refreshTokenValue, 10)

  // Store refresh token in database (NEW)
  const refreshToken = new RefreshToken()
  refreshToken.token = hashedToken
  refreshToken.userId = user.id
  refreshToken.organizationId = user.organizationId // ✓ Multi-tenancy
  refreshToken.deviceInfo = deviceInfo
  refreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  refreshToken.revoked = false

  await this.refreshTokenRepository.save(refreshToken)

  return {
    accessToken,
    refreshToken: refreshTokenValue // Return unhashed token to client
  }
}
```

**Key points**:
- Generate cryptographically secure random token
- Hash before storing (never store plaintext tokens)
- Include organizationId (✓ multi-tenancy)
- Return unhashed token to client (they need it for refresh)

**Dependencies**: Step 2 (entity)
**Testing**: Unit test token generation and storage

---

### Step 4: Add AuthService - Refresh Token Method (60 min)
**Complexity**: Moderate

**File**: `packages/server/src/services/auth/index.ts`

**New method**:
```typescript
async refreshAccessToken(refreshTokenValue: string): Promise<TokenPair> {
  try {
    // Find all non-revoked refresh tokens
    const refreshTokens = await this.refreshTokenRepository.find({
      where: { revoked: false }
    })

    // Find matching token (compare hashes)
    let matchedToken: RefreshToken | null = null
    for (const rt of refreshTokens) {
      const isMatch = await bcrypt.compare(refreshTokenValue, rt.token)
      if (isMatch) {
        matchedToken = rt
        break
      }
    }

    if (!matchedToken) {
      throw new InternalFlowiseError('REFRESH_TOKEN_INVALID', 'Refresh token not found')
    }

    // Check expiry
    if (matchedToken.expiresAt < new Date()) {
      throw new InternalFlowiseError('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired')
    }

    // Check revocation
    if (matchedToken.revoked) {
      throw new InternalFlowiseError('REFRESH_TOKEN_REVOKED', 'Refresh token has been revoked')
    }

    // Get user (with organizationId filter - multi-tenancy!)
    const user = await this.userRepository.findOne({
      where: {
        id: matchedToken.userId,
        organizationId: matchedToken.organizationId // ✓ Multi-tenancy
      }
    })

    if (!user) {
      throw new InternalFlowiseError('USER_NOT_FOUND', 'User not found')
    }

    // Update last used timestamp (sliding expiry)
    matchedToken.lastUsedAt = new Date()
    matchedToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await this.refreshTokenRepository.save(matchedToken)

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, organizationId: user.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    return {
      accessToken,
      refreshToken: refreshTokenValue // Return same refresh token (no rotation)
    }

  } catch (error) {
    logger.error('Token refresh failed', { error })
    throw error
  }
}
```

**Key points**:
- Hash comparison for security
- Check expiry before accepting
- Update lastUsedAt for sliding window
- Filter user by organizationId (✓ multi-tenancy)
- Use InternalFlowiseError for consistency

**Dependencies**: Step 3
**Testing**: Unit tests for happy path and error cases

---

### Step 5: Create Refresh Token Controller (30 min)
**Complexity**: Simple

**File**: `packages/server/src/controllers/auth/refresh.ts`

```typescript
import { Request, Response } from 'express'
import { AuthService } from '../../services/auth'
import { InternalFlowiseError } from '../../errors'

export class RefreshTokenController {
  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        throw new InternalFlowiseError('MISSING_REFRESH_TOKEN', 'Refresh token is required')
      }

      const authService = new AuthService()
      const tokens = await authService.refreshAccessToken(refreshToken)

      res.json({
        success: true,
        data: tokens
      })

    } catch (error) {
      if (error instanceof InternalFlowiseError) {
        res.status(401).json({
          success: false,
          error: error.message
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        })
      }
    }
  }

  async revoke(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body
      const authService = new AuthService()

      await authService.revokeRefreshToken(refreshToken)

      res.json({ success: true })

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to revoke token'
      })
    }
  }
}
```

**Dependencies**: Step 4
**Testing**: Integration tests for endpoint

---

### Step 6: Add Routes (20 min)
**Complexity**: Simple

**File**: `packages/server/src/routes/auth/index.ts`

```typescript
import { Router } from 'express'
import { RefreshTokenController } from '../../controllers/auth/refresh'
import { enforceAbility } from '../../middlewares/auth/enforceAbility'
import { rateLimiter } from '../../middlewares/rateLimiter'

const router = Router()
const controller = new RefreshTokenController()

// Token refresh endpoint
router.post(
  '/refresh',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 min
  controller.refresh // Note: No enforceAbility - this endpoint creates auth
)

// Token revocation endpoint
router.post(
  '/revoke',
  enforceAbility('Auth'), // ✓ Authentication required to revoke
  controller.revoke
)

export default router
```

**Key points**:
- Rate limiting to prevent brute force
- /refresh doesn't need enforceAbility (it creates the auth)
- /revoke needs enforceAbility (must be authenticated)

**Dependencies**: Step 5
**Testing**: Integration tests for routes

---

### Step 7: Update Login Flow (30 min)
**Complexity**: Simple

**File**: `packages/server/src/controllers/auth/login.ts`

**Modify login method**:
```typescript
async login(req: Request, res: Response) {
  const { email, password } = req.body
  const deviceInfo = req.headers['user-agent']

  // ... existing validation ...

  const user = await authService.validateCredentials(email, password)

  // Generate tokens (now includes refresh token)
  const tokens = await authService.generateTokens(user, deviceInfo)

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken // NEW: Return refresh token
    }
  })
}
```

**Dependencies**: Step 3
**Testing**: Integration test for login flow

---

### Step 8: Add Unit Tests (90 min)
**Complexity**: Moderate

**File**: `packages/server/test/auth/refresh-token.test.ts`

**Test cases**:
```typescript
describe('RefreshToken', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => { ... })
    it('should include organizationId in refresh token', async () => { ... })
    it('should hash refresh token before storage', async () => { ... })
  })

  describe('refreshAccessToken', () => {
    it('should issue new access token with valid refresh token', async () => { ... })
    it('should reject expired refresh token', async () => { ... })
    it('should reject revoked refresh token', async () => { ... })
    it('should reject invalid refresh token', async () => { ... })
    it('should update lastUsedAt timestamp', async () => { ... })
    it('should extend expiry (sliding window)', async () => { ... })
    it('should enforce multi-tenancy (organizationId filter)', async () => { ... })
  })

  describe('revokeRefreshToken', () => {
    it('should revoke token', async () => { ... })
    it('should prevent revoked token from refreshing', async () => { ... })
  })
})
```

**Run tests**:
```bash
pnpm test:auth
```

**Dependencies**: Steps 3-6
**Testing**: All tests passing

---

### Step 9: Add Integration Tests (60 min)
**Complexity**: Moderate

**File**: `packages/server/test/integration/auth-refresh.test.ts`

**Test scenarios**:
1. Full flow: Login → Use access token → Expire → Refresh → Use new token
2. Multi-device: Login on device A → Login on device B → Both can refresh
3. Security: Stolen refresh token → Revoke → Can't refresh
4. Multi-tenancy: User A refresh token → Can't access User B data

**Dependencies**: Steps 1-8
**Testing**: Integration tests passing

---

### Step 10: Update Documentation (30 min)
**Complexity**: Simple

**Files to update**:

1. **packages/server/AUTHORIZATION.md**
   - Add OAuth2 refresh token flow diagram
   - Document /refresh endpoint
   - Explain token lifecycle

2. **CLAUDE.md** (if needed)
   - Add refresh token pattern to examples
   - Note multi-tenancy requirement

**Dependencies**: Steps 1-9
**Testing**: Documentation review

---

## Total Estimated Time: 6.5 hours
```

#### Step 4: Testing Strategy

```markdown
## Testing Strategy

### Unit Tests (packages/server/test/auth/refresh-token.test.ts)

**Coverage goals**: 90%+ for new code

**Test categories**:
1. **Token Generation**
   - Generates valid tokens
   - Includes organizationId
   - Hashes tokens before storage

2. **Token Refresh**
   - Happy path (valid token → new access token)
   - Expired token rejection
   - Invalid token rejection
   - Revoked token rejection
   - Multi-tenancy enforcement

3. **Token Revocation**
   - Successful revocation
   - Revoked token can't refresh

**Run**: `pnpm test:auth`

### Integration Tests (packages/server/test/integration/auth-refresh.test.ts)

**Test scenarios**:
1. **Full Authentication Flow**
   ```
   POST /auth/login → Get tokens
   GET /api/v1/chatflows (with access token) → Success
   Wait for expiry
   GET /api/v1/chatflows → 401 (expired)
   POST /auth/refresh (with refresh token) → New access token
   GET /api/v1/chatflows (with new token) → Success
   ```

2. **Multi-Device Support**
   ```
   Login on device A → Get refresh token A
   Login on device B → Get refresh token B
   Refresh with token A → Success
   Refresh with token B → Success
   ```

3. **Security - Token Theft**
   ```
   Login → Get refresh token
   POST /auth/revoke → Revoke token
   POST /auth/refresh (with revoked token) → 401
   ```

4. **Multi-Tenancy Isolation**
   ```
   User from Org A logs in → Get refresh token A
   User from Org B logs in → Get refresh token B
   Refresh with token A → Access to Org A data only
   Refresh with token A → Cannot access Org B data
   ```

### Manual Testing Checklist

After implementation:
- [ ] Login and receive refresh token
- [ ] Wait for access token to expire (or mock expiry)
- [ ] Refresh token and receive new access token
- [ ] Use new access token successfully
- [ ] Revoke refresh token
- [ ] Attempt to refresh with revoked token (should fail)
- [ ] Login on multiple devices
- [ ] Verify both devices can refresh independently
- [ ] Check database: organizationId present in refresh_token table
- [ ] Check logs: No sensitive data (tokens) logged
```

#### Step 5: Risk Assessment

```markdown
## Risk Assessment & Mitigation

### Risk 1: Token Storage Security
**Impact**: High
**Likelihood**: Medium

**Risk**: Refresh tokens stored in database could be compromised

**Mitigation**:
- ✓ Hash tokens before storage (like passwords)
- ✓ Use bcrypt with high cost factor
- ✓ Store hashes, never plaintext
- ✓ Log suspicious refresh patterns

### Risk 2: Database Performance
**Impact**: Medium
**Likelihood**: Low

**Risk**: Finding refresh token requires iterating through hashes (bcrypt compare)

**Mitigation**:
- ✓ Add index on organizationId for faster filtering
- ✓ Implement cleanup job for expired tokens
- Consider: Add token_hash field for faster lookup (follow-up)

### Risk 3: Token Rotation Not Implemented
**Impact**: Medium
**Likelihood**: High

**Risk**: Not implementing token rotation (RFC 6749 recommendation) reduces security

**Mitigation**:
- ✓ Document decision in ticket comments
- ✓ Create follow-up ticket for rotation (AAI-126)
- ✓ Current implementation still secure with expiry

### Risk 4: Multi-Tenancy Bug
**Impact**: Critical
**Likelihood**: Low

**Risk**: Missing organizationId filter could leak data across organizations

**Mitigation**:
- ✓ Code review checklist includes organizationId verification
- ✓ Integration tests verify multi-tenancy isolation
- ✓ All queries include organizationId filter
- Use: `/pr-review` to catch issues

### Risk 5: Migration Failure
**Impact**: High
**Likelihood**: Low

**Risk**: Migration could fail in production

**Mitigation**:
- ✓ Test migration locally first
- ✓ Test rollback (down migration)
- ✓ Run on staging before production
- ✓ User prompted to run migration manually (not automatic)
```

#### Step 6: Success Criteria

```markdown
## Success Criteria

### Functional Requirements
- [ ] Users can refresh expired access tokens using refresh token
- [ ] Invalid/expired refresh tokens return 401 error
- [ ] Refresh tokens expire after 30 days of inactivity (sliding window)
- [ ] Multiple devices can maintain separate refresh tokens
- [ ] Refresh endpoint is rate-limited (10 requests per 15 minutes)

### Technical Requirements
- [ ] RefreshToken entity includes organizationId (multi-tenancy)
- [ ] All database queries filter by organizationId
- [ ] Refresh endpoint uses enforceAbility pattern (no middleware on refresh)
- [ ] Refresh tokens are hashed before storage
- [ ] Uses InternalFlowiseError for error handling
- [ ] Logging doesn't expose sensitive data

### Testing Requirements
- [ ] Unit test coverage > 90% for new code
- [ ] Integration tests cover full auth flow
- [ ] Multi-tenancy isolation verified in tests
- [ ] All edge cases tested (expiry, revocation, etc.)

### Documentation Requirements
- [ ] AUTHORIZATION.md updated with refresh flow
- [ ] API endpoint documented
- [ ] Migration instructions in PR description
- [ ] CLAUDE.md updated if patterns changed

### Quality Requirements
- [ ] Code review completed (use `/pr-review`)
- [ ] No security vulnerabilities (verified in review)
- [ ] Performance acceptable (< 100ms for refresh)
- [ ] Database indexes added for performance
```

### Phase 5: Git Strategy

```markdown
## Git Strategy

### Branch
`feature/AAI-123-add-oauth2-token-refresh-support`

**Created from**: staging

### Commit Structure

**Recommended commits** (logical units):

1. `feat(AAI-123): add RefreshToken database entity and migration`
   - Migration file
   - RefreshToken entity
   - Database configuration

2. `feat(AAI-123): implement refresh token generation in AuthService`
   - Update generateTokens method
   - Add token hashing logic
   - Add tests

3. `feat(AAI-123): implement refresh token validation and refresh logic`
   - Add refreshAccessToken method
   - Add revokeRefreshToken method
   - Add tests

4. `feat(AAI-123): add refresh token API endpoints`
   - Controller
   - Routes
   - Rate limiting

5. `feat(AAI-123): update login flow to issue refresh tokens`
   - Modify login controller
   - Integration tests

6. `docs(AAI-123): add OAuth2 refresh token documentation`
   - AUTHORIZATION.md updates
   - CLAUDE.md updates (if needed)

**Total**: 6 commits

### PR Strategy

**Title**: `feat: Add OAuth2 token refresh support (AAI-123)`

**Description** (auto-generated by `/push`):
- Summary of changes
- Link to AAI-123
- Testing checklist
- TheAnswer-specific checks
- Migration instructions
- Review focus areas

**Target**: staging (enforced)

**Reviewers**: Request 1-2 reviewers

**After merge**: Ticket auto-updates to Done

### Using Commands

```bash
# Start work
/ticket-start AAI-123

# Make changes, then commit
git add .
/commit "add RefreshToken entity and migration"

# Continue working
git add .
/commit "implement token refresh logic"

# When ready for review
/push

# Address review feedback, then
git add .
/commit "fix multi-tenancy filter in refresh logic"
/push
```
```

## Integration with Commands

This skill is used by:
- `/ticket-start` - Primary ticket planning command
- `linear-ticket-planner` agent - Implements this workflow

## Integration with Agents

Used by:
- `linear-ticket-planner` - Autonomous ticket planning

## Quality Standards

Before completing plan:
- [ ] Ticket requirements fully understood
- [ ] Codebase exploration thorough
- [ ] All clarifying questions asked
- [ ] Implementation steps are actionable
- [ ] Testing strategy is comprehensive
- [ ] Risks identified and mitigated
- [ ] Success criteria clear and measurable
- [ ] Git strategy defined
