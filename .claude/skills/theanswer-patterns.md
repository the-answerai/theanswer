---
name: theanswer-patterns
description: TheAnswer-specific patterns for multi-tenancy, authentication, and authorization
---

# TheAnswer Multi-Tenancy & Authorization Patterns

This skill documents the core multi-tenancy patterns used throughout TheAnswer. Understanding these patterns is essential for implementing secure, properly-scoped resources.

## Core Architecture Overview

TheAnswer uses a layered multi-tenancy approach:

```
Organization → Workspace → User → Resource
```

Resources are scoped to workspaces, with optional cross-workspace sharing via the Repository Decorator pattern.

---

## 1. Repository Decorator Pattern (Core Innovation)

The WorkspaceAwareRepository uses JavaScript Proxy to auto-inject workspace filtering into all TypeORM queries without modifying service code.

### Location
`packages/server/src/aai/repository/WorkspaceAwareRepository.ts`

### How It Works

```typescript
// Services use standard TypeORM - filtering is AUTOMATIC
const chatflows = await repository.find()  // Auto-filtered by workspace
const qb = repository.createQueryBuilder('cf').getMany()  // Also auto-filtered
```

### Implementation

```typescript
export function createWorkspaceAwareRepository<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityName: string
): Repository<T> {
    // Skip non-workspace entities
    if (!WORKSPACE_ENTITIES.has(entityName)) {
        return repository
    }

    return new Proxy(repository, {
        get(target, prop: string | symbol) {
            const original = target[prop as keyof Repository<T>]
            if (typeof original !== 'function') return original

            // Intercept find methods to inject workspace filter
            if (['find', 'findBy', 'findOne', 'findOneBy', 'findAndCount', 'count'].includes(String(prop))) {
                return async (...args: any[]) => {
                    if (!isMultiWorkspaceSharingEnabled()) {
                        return (original as Function).apply(target, args)
                    }
                    const enhanced = enhanceFindOptions(args[0])
                    return (original as Function).call(target, enhanced)
                }
            }

            // Intercept createQueryBuilder to wrap with auto-filter
            if (String(prop) === 'createQueryBuilder') {
                return (alias?: string) => {
                    const qb = (original as Function).call(target, alias)
                    if (!isMultiWorkspaceSharingEnabled()) return qb
                    return wrapQueryBuilder(qb, alias || entityName.toLowerCase())
                }
            }

            return typeof original === 'function' ? (original as Function).bind(target) : original
        }
    })
}
```

### Registered Workspace Entities

Add new entities to `WORKSPACE_ENTITIES` set for auto-filtering:

```typescript
const WORKSPACE_ENTITIES = new Set([
    'ChatFlow',
    'Tool',
    'Variable',
    'DocumentStore',
    'Credential',
    'Assistant',
    'Apikey',
    'Dataset',
    'Evaluation',
    'Evaluator',
    'Execution'
])
```

### Registering New Entities

```typescript
import { registerWorkspaceEntity } from '../aai/repository/WorkspaceAwareRepository'

// Register at runtime (for custom entities)
registerWorkspaceEntity('MyNewEntity')
```

---

## 2. Request Context (AsyncLocalStorage)

Request-scoped context provides workspace IDs anywhere in the call stack without parameter drilling.

### Location
`packages/server/src/aai/context/RequestContext.ts`

### Context Interface

```typescript
interface RequestContextData {
    user?: IUser
    workspaceIds?: string[]      // [activeWorkspaceId, sharedWorkspaceId]
    defaultWorkspaceId?: string  // Shared/default workspace
}
```

### Accessing Context

```typescript
import {
    getWorkspaceIdsFromContext,
    getUserFromContext,
    getDefaultWorkspaceIdFromContext
} from '../aai/context/RequestContext'

// In any service/utility (no req parameter needed)
const workspaceIds = getWorkspaceIdsFromContext()
const user = getUserFromContext()
const defaultWs = getDefaultWorkspaceIdFromContext()
```

### Context Middleware

Location: `packages/server/src/aai/middleware/requestContextMiddleware.ts`

```typescript
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const config = getWorkspaceSharingConfig()

    if (!config.enabled || !req.user?.assignedWorkspaces) {
        return next()
    }

    // Find shared workspace using configured identifier
    const sharedWorkspace = req.user.assignedWorkspaces.find((ws) =>
        config.sharedWorkspaceIdentifier.type === 'name'
            ? ws.name === config.sharedWorkspaceIdentifier.value
            : ws.id === config.sharedWorkspaceIdentifier.value
    )

    // Build workspaceIds: [activeWorkspaceId, sharedWorkspaceId]
    const workspaceIds =
        activeWorkspaceId && sharedWorkspaceId && activeWorkspaceId !== sharedWorkspaceId
            ? [activeWorkspaceId, sharedWorkspaceId]
            : [activeWorkspaceId || sharedWorkspaceId].filter(Boolean)

    // Run rest of request inside context store
    requestContext.run({ user: req.user, workspaceIds, defaultWorkspaceId: sharedWorkspaceId }, () => {
        next()
    })
}
```

---

## 3. Multi-Workspace Resource Sharing

Users can access resources from both their active workspace AND a shared "Default Workspace."

### Configuration

Location: `packages/server/src/aai/config/workspaceSharing.ts`

```typescript
// Environment Variables
AAI_MULTI_WORKSPACE_SHARING=true          // Enable feature (default: true)
AAI_SHARED_WORKSPACE_NAME="Default Workspace"  // Shared workspace name
```

### Configuration Interface

```typescript
interface WorkspaceSharingConfig {
    enabled: boolean
    sharedWorkspaceIdentifier: {
        type: 'name' | 'id'
        value: string
    }
}
```

### Debug Mode

```bash
AAI_WORKSPACE_DEBUG=true  # Enable workspace filter logging
```

---

## 4. Entity Requirements

**CRITICAL: All entities must include these fields for multi-tenancy**

### Required Fields

```typescript
import {
    Entity, Column, CreateDateColumn, UpdateDateColumn,
    PrimaryGeneratedColumn, Index
} from 'typeorm'

@Entity()
export class Resource {
    @PrimaryGeneratedColumn('uuid')
    id: string

    // Multi-tenancy fields (ALL REQUIRED)
    @Index()
    @Column({ type: 'uuid', nullable: true })
    userId: string

    @Index()
    @Column({ type: 'uuid', nullable: true })
    organizationId: string

    @Column({ nullable: false })  // REQUIRED for workspace auto-filtering
    workspaceId: string

    // Audit fields (REQUIRED)
    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date

    // Optional visibility
    @Column({ type: 'boolean', default: false })
    isPublic?: boolean

    @Column({ type: 'simple-array', nullable: true })
    visibility?: string[]  // 'PRIVATE' | 'PUBLIC' | 'ORGANIZATION' | 'MARKETPLACE'
}
```

### Entity Checklist

- [ ] `id` - UUID primary key
- [ ] `userId` - Indexed UUID (nullable)
- [ ] `organizationId` - Indexed UUID (nullable)
- [ ] `workspaceId` - Non-nullable string (REQUIRED for auto-filtering)
- [ ] `createdDate` - Auto-populated timestamp
- [ ] `updatedDate` - Auto-updated timestamp
- [ ] Registered in `WORKSPACE_ENTITIES` set (if needs auto-filtering)

---

## 5. Authentication Patterns

### IUser Interface

```typescript
interface IUser {
    id: string
    name: string
    email: string
    organizationId?: string
    permissions?: string[]           // e.g., ['org:manage', 'chatflow:read']
    roles?: string[]                 // e.g., ['Admin', 'User']

    // Workspace context (populated by auth middleware)
    activeWorkspaceId?: string       // Current workspace
    activeOrganizationId?: string    // Current org
    assignedWorkspaces?: any[]       // All assigned workspaces

    // API key context
    apiKey?: {
        id: string
        metadata?: IApiKeyMetadata
    }
}
```

### enforceAbility Middleware

Location: `packages/server/src/middlewares/authentication/enforceAbility.ts`

**All routes MUST use this middleware:**

```typescript
import enforceAbility from '../../middlewares/authentication/enforceAbility'

// Route protection
router.get('/', enforceAbility('ChatFlow'), controller.getAll)
router.get('/:id', enforceAbility('ChatFlow'), controller.getById)
router.post('/', enforceAbility('ChatFlow'), controller.create)
router.put('/:id', enforceAbility('ChatFlow'), controller.update)
router.delete('/:id', enforceAbility('ChatFlow'), controller.delete)
```

### enforceAbility Behavior

1. Returns 401 if `req.user` is missing
2. Checks if user has Admin role
3. Creates access filter (`organizationId`, `userId`)
4. For GET/PUT/DELETE with `:id`, verifies resource access
5. Stores filter in `res.locals.filter`

### Permission Checking

```typescript
// Check specific permission
if (user.permissions?.includes('org:manage')) {
    // Admin-level access
}

// Check role
const isAdmin = user.roles?.includes('Admin')
```

---

## 6. Authorization: checkOwnership

Location: `packages/server/src/utils/checkOwnership.ts`

**Controllers MUST use checkOwnership for authorization:**

```typescript
import checkOwnership from '../../utils/checkOwnership'

const getResourceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resource = await resourceService.getResourceById(req.params.id)

        // REQUIRED: Check ownership before returning
        if (req.user && !(await checkOwnership(resource, req.user, req))) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: resourceController.getResourceById - Unauthorized'
            )
        }

        return res.json(resource)
    } catch (error) {
        next(error)
    }
}
```

### checkOwnership Priority Order

The function checks access in this priority order:

```typescript
const checkOwnership = async (entry, user, req?) => {
    const { id: userId, organizationId, permissions } = user || {}

    // 1. API Key validation (if request provided)
    if (req && entry) {
        const isValidApiKey = await validateFlowAPIKey(req, entry)
        if (isValidApiKey) return true
    }

    // 2. Admin permission check
    if (permissions?.includes('org:manage')) {
        return true
    }

    // 3. Public access or direct ownership
    if (entry?.isPublic || entry?.userId === userId) {
        return true
    }

    // 4. Organization visibility
    if (entry?.visibility?.includes('Organization')) {
        if (organizationId && entry?.organizationId === organizationId) {
            return true
        }
    }

    return false
}
```

### Array Support

```typescript
// Check ownership for multiple resources
const hasAccess = await checkOwnership([resource1, resource2], user, req)
// Returns true only if ALL resources pass
```

---

## 7. API Key Validation

Location: `packages/server/src/utils/validateKey.ts`

### validateFlowAPIKey

Validates API key for a specific chatflow (used for predictions/upsert):

```typescript
export const validateFlowAPIKey = async (req: Request, chatflow: ChatFlow): Promise<boolean> => {
    const chatFlowApiKeyId = chatflow?.apikeyid
    if (!chatFlowApiKeyId) return true  // No API key required

    const authorizationHeader = req.headers['authorization'] ?? ''
    if (!authorizationHeader) return false

    const suppliedKey = authorizationHeader.split('Bearer ').pop()
    if (!suppliedKey) return false

    const apiKey = await apikeyService.getApiKeyById(chatFlowApiKeyId)
    if (!apiKey) return false

    // CRITICAL: Workspace match check
    if (apiKey.workspaceId !== chatflow.workspaceId) return false

    // Verify key secret
    if (!compareKeys(apiKey.apiSecret, suppliedKey)) return false

    return true
}
```

### validateAPIKey

General API key validation (returns key details):

```typescript
export const validateAPIKey = async (req: Request): Promise<{
    isValid: boolean
    apiKey?: ApiKey
    workspaceId?: string
}> => {
    // ... validation logic
    return { isValid: true, apiKey, workspaceId: apiKey.workspaceId }
}
```

---

## 8. Visibility Patterns

### Visibility Types

```typescript
type ChatflowVisibility = 'PRIVATE' | 'PUBLIC' | 'ORGANIZATION' | 'MARKETPLACE'
```

### Entity Pattern

```typescript
@Column({ type: 'simple-array', nullable: true })
visibility?: ChatflowVisibility[]

@Column({ type: 'boolean', default: false })
isPublic?: boolean
```

### Access Logic

```typescript
// Public access (anyone)
if (resource.isPublic) return true

// Organization-wide visibility
if (resource.visibility?.includes('Organization')) {
    if (user.organizationId === resource.organizationId) return true
}

// Private (owner only)
if (resource.userId === user.id) return true
```

---

## 9. Public Endpoints (Special Cases)

Some endpoints require special handling:

### No Authentication Required

```typescript
// Health checks, ping - no middleware
router.get('/ping', (req, res) => res.send('pong'))
router.get('/health', healthController.check)
```

### Optional API Key (Predictions/Upsert)

```typescript
// API key validated per-chatflow, not globally
router.post('/prediction/:id', predictionController.create)  // Uses validateFlowAPIKey
router.post('/upsert/:id', upsertController.create)           // Uses validateFlowAPIKey
```

---

## 10. Key File Locations

| Component | Location |
|-----------|----------|
| Repository Decorator | `packages/server/src/aai/repository/WorkspaceAwareRepository.ts` |
| Request Context | `packages/server/src/aai/context/RequestContext.ts` |
| Context Middleware | `packages/server/src/aai/middleware/requestContextMiddleware.ts` |
| Workspace Config | `packages/server/src/aai/config/workspaceSharing.ts` |
| enforceAbility | `packages/server/src/middlewares/authentication/enforceAbility.ts` |
| checkOwnership | `packages/server/src/utils/checkOwnership.ts` |
| validateKey | `packages/server/src/utils/validateKey.ts` |
| IUser Interface | `packages/server/src/Interface.ts` |
| Entity Examples | `packages/server/src/database/entities/ChatFlow.ts` |

---

## 11. Implementation Checklist

### New Resource Checklist

- [ ] Entity has `userId`, `organizationId`, `workspaceId`, timestamps
- [ ] Entity registered in `WORKSPACE_ENTITIES` (if needs auto-filtering)
- [ ] Routes use `enforceAbility('ResourceName')` middleware
- [ ] Controllers use `checkOwnership(resource, req.user, req)`
- [ ] Services populate `userId`, `organizationId`, `workspaceId` on create
- [ ] Services filter by `organizationId` for non-admin users

### Security Audit Checklist

- [ ] No route without authentication (except health/ping)
- [ ] All queries filter by `organizationId` or use auto-filtering
- [ ] All resource access uses `checkOwnership`
- [ ] API keys validate workspace match
- [ ] Sensitive data not exposed in responses
- [ ] Error messages don't leak internal details

---

## 12. Common Patterns

### Creating Resources

```typescript
const createResource = async (data: any, user: IUser): Promise<Resource> => {
    const repository = getRepository(Resource)

    const newResource = repository.create({
        ...data,
        userId: user.id,
        organizationId: user.organizationId,
        workspaceId: user.activeWorkspaceId  // REQUIRED
    })

    return repository.save(newResource)
}
```

### Querying with Auto-Filter (Recommended)

```typescript
// Repository is already workspace-aware - just use it
const resources = await repository.find()  // Auto-filtered!
```

### Querying with Manual Filter (Legacy)

```typescript
const query = repository
    .createQueryBuilder('resource')
    .where('resource.organizationId = :organizationId', {
        organizationId: user.organizationId
    })

if (!user.permissions?.includes('org:manage')) {
    query.andWhere('resource.userId = :userId', { userId: user.id })
}

const resources = await query.getMany()
```

### Checking Admin Status

```typescript
const isAdmin = user.permissions?.includes('org:manage') ||
                user.roles?.includes('Admin')
```
