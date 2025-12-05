# Flowise 3.0.0 → 3.0.11 Upgrade Plan

## Goal
Get build compiling while preserving AAI data (users, Stripe, Auth0).

## Strategy: Build First
Add AAI columns to enterprise entities rather than modifying enterprise to use AAI entities.

---

## Phase 1: Fix Types (Get Building)

### 1.1 Fix `LoggedInUser` type
**File:** `packages/server/src/enterprise/Interface.Enterprise.ts`

```typescript
// Make stripeCustomerId optional (line 87)
stripeCustomerId?: string  // Change from required to optional

// Add missing AAI fields to LoggedInUser:
defaultChatflowId?: string
trialPlanId?: string
```

### 1.2 Add AAI columns to enterprise User entity
**File:** `packages/server/src/enterprise/database/entities/user.entity.ts`

Add columns after line 43:
```typescript
@Column({ type: 'varchar', length: 255, unique: true, nullable: true })
auth0Id?: string

@Column({ type: 'varchar', length: 100, nullable: true })
stripeCustomerId?: string

@Index()
@Column({ type: 'uuid', nullable: true })
organizationId?: string

@Column({ type: 'uuid', nullable: true })
trialPlanId?: string

@Column({ type: 'uuid', nullable: true })
defaultChatflowId?: string
```

### 1.3 Add AAI columns to enterprise Organization entity
**File:** `packages/server/src/enterprise/database/entities/organization.entity.ts`

Add columns:
```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
auth0Id?: string

@Column({ type: 'varchar', length: 100, nullable: true })
stripeCustomerId?: string

@Column({ type: 'boolean', default: false })
billingPoolEnabled?: boolean

@Column({ type: 'uuid', nullable: true })
currentPaidPlanId?: string

@Column({ type: 'jsonb', nullable: true })
enabledIntegrations?: string
```

### 1.4 Fix `IUser` interface compatibility
**File:** `packages/server/src/Interface.ts`

The interface already extends LoggedInUser correctly. After 1.1, the `stripeCustomerId` conflict will be resolved.

---

## Phase 2: Fix Build Errors by Category

### 2.1 Missing imports
Add to files that need them:
```typescript
import { IsNull } from 'typeorm'
import chatflowsService from '../../services/chatflows'
import { checkOwnership } from '../../utils/checkOwnership'
```

### 2.2 `User not assignable to IUser` errors (~60 errors)
**Cause:** Enterprise `User` entity doesn't implement `IUser`.

**Fix:** After adding AAI columns to enterprise User (1.2), update entity to implement IUser:
```typescript
import { IUser } from '../../Interface'

@Entity()
export class User implements IUser {
```

### 2.3 Missing `workspaceId` parameter errors (~20 errors)
**Files:** Controllers calling services

**Fix:** Get workspaceId from user and pass to services:
```typescript
const workspaceId = req.user?.activeWorkspaceId
// Pass to service calls
```

### 2.4 Auth middleware workspace population
**File:** `packages/server/src/middlewares/authentication/index.ts`

After JWT validation, populate workspace data:
```typescript
// Look up user's workspace
const workspaceUser = await AppDataSource.getRepository(WorkspaceUser)
    .findOne({ where: { userId: user.id }, relations: ['workspace', 'role'] })

if (workspaceUser) {
    req.user.activeWorkspaceId = workspaceUser.workspaceId
    req.user.activeOrganizationId = workspaceUser.workspace.organizationId
    req.user.activeWorkspace = workspaceUser.workspace.name
    req.user.roleId = workspaceUser.roleId
    // ... etc
}
```

### 2.5 File path `.replace` errors (~8 errors)
**Files:** dalle-image, video-generator controllers/services

**Cause:** Type changed from `string` to `{ path: string; totalSize: number }`

**Fix:** Access `.path` property before calling `.replace()`:
```typescript
filePath.path.replace(...)  // Instead of filePath.replace(...)
```

### 2.6 Missing `user` variable in services
**Files:** `assistants/index.ts`, `tools/index.ts`

**Fix:** Add `user` parameter to function signatures or get from context.

### 2.7 passport.ts done() callback type
**File:** `packages/server/src/config/passport.ts`

**Fix:** Return proper `LoggedInUser` or `false`, not raw profile object.

### 2.8 JWT sign type error
**File:** `packages/server/src/enterprise/middleware/passport/index.ts`

**Fix:** Ensure `expiresIn` is passed correctly to `jwt.sign()`.

---

## Phase 3: Migration Strategy

### 3.1 Create bridge migration
**New File:** `packages/server/src/database/migrations/postgres/{timestamp}-AddAAIColumnsToEnterpriseSchema.ts`

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // Add AAI columns to user table
    await queryRunner.query(`
        ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS "auth0Id" varchar(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(100),
        ADD COLUMN IF NOT EXISTS "organizationId" uuid,
        ADD COLUMN IF NOT EXISTS "trialPlanId" uuid,
        ADD COLUMN IF NOT EXISTS "defaultChatflowId" uuid;
    `)

    // Add AAI columns to organization table
    await queryRunner.query(`
        ALTER TABLE "organization"
        ADD COLUMN IF NOT EXISTS "auth0Id" varchar(255),
        ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(100),
        ADD COLUMN IF NOT EXISTS "billingPoolEnabled" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "currentPaidPlanId" uuid,
        ADD COLUMN IF NOT EXISTS "enabledIntegrations" jsonb;
    `)
}
```

### 3.2 Create default workspaces migration
**New File:** `packages/server/src/database/migrations/postgres/{timestamp}-CreateDefaultWorkspacesForAAI.ts`

For each organization:
1. Create **org-wide shared workspace** ("Default Workspace") - for "share with organization" resources
2. Create **personal workspace** per user - for private resources

```typescript
// For each organization
const orgWorkspaceId = uuidv4()
await queryRunner.query(`
    INSERT INTO workspace (id, name, "organizationId", ...)
    VALUES ($1, 'Default Workspace', $2, ...)
`, [orgWorkspaceId, org.id])

// For each user in org
const personalWorkspaceId = uuidv4()
await queryRunner.query(`
    INSERT INTO workspace (id, name, "organizationId", ...)
    VALUES ($1, 'Personal Workspace', $2, ...)
`, [personalWorkspaceId, org.id])

// Link user to both workspaces
await queryRunner.query(`
    INSERT INTO workspace_user (...)
    VALUES -- org workspace with member role
           -- personal workspace with owner role
`)

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `enterprise/Interface.Enterprise.ts` | Make `stripeCustomerId` optional, add `defaultChatflowId`, `trialPlanId` |
| `enterprise/database/entities/user.entity.ts` | Add AAI columns, implement `IUser` |
| `enterprise/database/entities/organization.entity.ts` | Add AAI columns |
| `middlewares/authentication/index.ts` | Populate workspace data after JWT auth |
| `config/passport.ts` | Fix done() callback return type |
| ~30 controller files | Pass `workspaceId` to service calls |
| ~8 dalle/video files | Fix `.replace()` on file path object |

---

## Execution Order

1. **Type fixes** (Interface.Enterprise.ts, Interface.ts)
2. **Entity updates** (user.entity.ts, organization.entity.ts)
3. **Auth middleware** (authentication/index.ts)
4. **Controller fixes** (workspaceId, imports, file path types)
5. **Service fixes** (missing user parameter)
6. **Build verification**
7. **Migration creation** (after build works)

---

## Risk Mitigation

- **Data loss:** Backup DB before migration
- **Auth breaks:** Keep existing Auth0 JWT flow, add workspace lookup as enhancement
- **Missing workspaceId:** Create default workspace per org in migration
