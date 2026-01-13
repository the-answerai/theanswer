# OAuth2 Token Refresh - Complete Planning Example

This example demonstrates the full ticket planning workflow for implementing OAuth2 token refresh support (AAI-123).

## Ticket Context

```markdown
# Ticket Summary: AAI-123

**Title**: Add OAuth2 token refresh support
**Type**: Feature (from labels: feature, backend, api)
**Priority**: High (Priority 2)
**Status**: Todo -> Will move to In Progress

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

## Clarification Needed

```markdown
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

## Codebase Exploration Results

### Current Authentication Architecture

**File: packages/server/src/services/auth/index.ts**

```typescript
generateTokens(user: User): TokenPair {
  const accessToken = jwt.sign(
    { userId: user.id, organizationId: user.organizationId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  // No refresh token implementation yet

  return { accessToken }
}
```

**Key insights:**
- Access tokens expire in 1 hour
- Tokens contain userId and organizationId (multi-tenancy)
- No refresh token logic exists
- Uses JWT (RS256 signing)

**File: packages/server/src/middlewares/auth/jwt.ts**

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

**File: packages/server/src/database/entities/User.ts**

```typescript
@Entity()
export class User {
  @Column() id: string
  @Column() email: string
  @Column() organizationId: string
  // No refreshToken field
  // No refreshTokenExpiresAt field
}
```

**Key insights:**
- No schema for storing refresh tokens
- Need database migration to add fields
- Consider separate RefreshToken entity for multi-device support

### Existing Patterns to Follow

**Error Handling Pattern:**
```typescript
try {
  const result = await operation()
  return result
} catch (error) {
  logger.error('Operation failed', { error, context })
  throw new InternalFlowiseError('ERROR_CODE', error.message)
}
```

**Database Entity Pattern:**
```typescript
@Entity()
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  organizationId: string // Multi-tenancy required

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

**Route Authentication Pattern:**
```typescript
router.post(
  '/endpoint',
  enforceAbility('Resource'),
  controller.action
)
```

## Clarifying Questions Asked

### 1. Refresh Token Storage Strategy

**Context**: Currently no token storage exists.

**Options**:
- A) **PostgreSQL Table** (recommended) - Queryable, audit trail, integrates with existing patterns
- B) **Redis with PostgreSQL backup** - Fast lookup, auto-expiry, more complex

**Decision**: PostgreSQL (Option A)

### 2. Multi-Device Support

**Options**:
- A) **Single refresh token** - One active token per user, simpler
- B) **Multiple refresh tokens** (recommended) - One per device/session, better UX

**Decision**: Multiple tokens (Option B)

### 3. Token Rotation

**Options**:
- A) **Implement now** - Better security, detects theft
- B) **Implement later** (recommended) - Simpler MVP, follow-up ticket

**Decision**: Defer to later (Option B)

### 4. Refresh Token Expiry

**Options**:
- A) **Fixed 30-day expiry** - Simpler logic
- B) **Sliding 30-day expiry** (recommended) - Updates on use, better for active users

**Decision**: Sliding expiry (Option B)

## Implementation Plan

### Overview

Implement OAuth2 token refresh to allow users to obtain new access tokens without re-authentication when their tokens expire.

**Approach**:
- Add RefreshToken entity with multi-device support
- Create token refresh endpoint with rate limiting
- Update authentication flow to issue refresh tokens
- Add middleware to handle token expiry gracefully
- Follow existing patterns for multi-tenancy and error handling

**Decisions Summary**:
- Storage: PostgreSQL (consistency with existing patterns)
- Multi-device: Supported (better UX)
- Token rotation: Deferred to follow-up ticket (scoping)
- Expiry: Sliding 30-day window (better for active users)

### Architecture Changes

#### New Database Entity: RefreshToken

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
  organizationId: string // Multi-tenancy required

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

#### New API Endpoint

```
POST /api/v1/auth/refresh
Body: { refreshToken: string }
Response: { accessToken: string, refreshToken: string }
Middleware: enforceAbility('Auth'), rateLimiter
```

### Implementation Steps

#### Step 1: Database Migration (30 min)
**Complexity**: Simple

Create migration for RefreshToken table with indexes on `token` and `organizationId, userId`.

#### Step 2: Create RefreshToken Entity (20 min)
**Complexity**: Simple

File: `packages/server/src/database/entities/RefreshToken.ts`

#### Step 3: Update AuthService - Generate Refresh Token (45 min)
**Complexity**: Moderate

Key points:
- Generate cryptographically secure random token
- Hash before storing (never store plaintext)
- Include organizationId (multi-tenancy)
- Return unhashed token to client

#### Step 4: Add AuthService - Refresh Token Method (60 min)
**Complexity**: Moderate

```typescript
async refreshAccessToken(refreshTokenValue: string): Promise<TokenPair> {
  // Find matching token (compare hashes)
  // Check expiry and revocation
  // Get user with organizationId filter (multi-tenancy!)
  // Update lastUsedAt and extend expiry (sliding window)
  // Generate new access token
  return { accessToken, refreshToken }
}
```

#### Step 5: Create Refresh Token Controller (30 min)
**Complexity**: Simple

File: `packages/server/src/controllers/auth/refresh.ts`

#### Step 6: Add Routes (20 min)
**Complexity**: Simple

```typescript
// /refresh - No enforceAbility (creates auth), rate limited
router.post('/refresh', rateLimiter({ max: 10 }), controller.refresh)

// /revoke - Requires enforceAbility (must be authenticated)
router.post('/revoke', enforceAbility('Auth'), controller.revoke)
```

#### Step 7: Update Login Flow (30 min)
**Complexity**: Simple

Modify login to return both access and refresh tokens.

#### Step 8: Add Unit Tests (90 min)
**Complexity**: Moderate

Test categories: Token Generation, Token Refresh, Token Revocation

#### Step 9: Add Integration Tests (60 min)
**Complexity**: Moderate

Scenarios:
1. Full flow: Login -> Use token -> Expire -> Refresh -> Use new token
2. Multi-device: Login on A -> Login on B -> Both can refresh
3. Security: Stolen token -> Revoke -> Can't refresh
4. Multi-tenancy: User A token can't access User B data

#### Step 10: Update Documentation (30 min)
**Complexity**: Simple

Update AUTHORIZATION.md with refresh token flow diagram.

**Total Estimated Complexity**: Moderate (6-8 hours)

### Testing Strategy

#### Unit Tests

Coverage goals: 90%+ for new code

```typescript
describe('RefreshToken', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens')
    it('should include organizationId in refresh token')
    it('should hash refresh token before storage')
  })

  describe('refreshAccessToken', () => {
    it('should issue new access token with valid refresh token')
    it('should reject expired refresh token')
    it('should reject revoked refresh token')
    it('should enforce multi-tenancy (organizationId filter)')
  })
})
```

#### Integration Tests

1. **Full Authentication Flow**
2. **Multi-Device Support**
3. **Security - Token Theft**
4. **Multi-Tenancy Isolation**

### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token Storage Security | High | Hash tokens with bcrypt, never store plaintext |
| Database Performance | Medium | Add indexes, implement cleanup job |
| Token Rotation Not Implemented | Medium | Create follow-up ticket AAI-126 |
| Multi-Tenancy Bug | Critical | Integration tests verify isolation, PR review |
| Migration Failure | High | Test locally, rollback tested, staging first |

### Success Criteria

**Functional:**
- [ ] Users can refresh expired access tokens
- [ ] Invalid/expired refresh tokens return 401
- [ ] Sliding 30-day expiry works
- [ ] Multiple devices supported
- [ ] Rate limiting enforced

**Technical:**
- [ ] RefreshToken entity includes organizationId
- [ ] All queries filter by organizationId
- [ ] Tokens hashed before storage
- [ ] Uses InternalFlowiseError pattern

**Testing:**
- [ ] Unit test coverage > 90%
- [ ] Integration tests pass
- [ ] Multi-tenancy verified

### Git Strategy

**Branch**: `feature/AAI-123-add-oauth2-token-refresh-support`

**Commit Structure:**
1. `feat(AAI-123): add RefreshToken database entity and migration`
2. `feat(AAI-123): implement refresh token generation in AuthService`
3. `feat(AAI-123): implement refresh token validation and refresh logic`
4. `feat(AAI-123): add refresh token API endpoints`
5. `feat(AAI-123): update login flow to issue refresh tokens`
6. `docs(AAI-123): add OAuth2 refresh token documentation`

**PR Target**: staging (enforced)

**Workflow Commands:**
```bash
/ticket-start AAI-123
# ... make changes ...
/push "add RefreshToken entity and migration"
# ... more changes ...
/push "implement token refresh logic"
# ... when ready ...
/pr-review
```
