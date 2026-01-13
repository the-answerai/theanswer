---
globs:
  - packages/server/src/routes/**
---

# API Routes Rules

These rules apply when working with files in `packages/server/src/routes/`.

## Authentication Middleware

**All routes MUST use `enforceAbility` middleware**

```typescript
import enforceAbility from '../../middlewares/authentication/enforceAbility'

// REQUIRED: Protect all endpoints
router.get('/', enforceAbility('Resource'), controller.getAll)
router.get('/:id', enforceAbility('Resource'), controller.getById)
router.post('/', enforceAbility('Resource'), controller.create)
router.put('/:id', enforceAbility('Resource'), controller.update)
router.delete('/:id', enforceAbility('Resource'), controller.delete)
```

Never create routes without authentication:
```typescript
// WRONG: Missing middleware (security vulnerability!)
router.get('/', controller.getAll)
```

## Route Handler Pattern

Routes should only call controllers, never services directly:

```typescript
// CORRECT: Route calls controller
router.post('/', enforceAbility('Resource'), resourceController.createResource)

// WRONG: Route calls service directly
router.post('/', enforceAbility('Resource'), async (req, res) => {
    const result = await resourceService.create(req.body)  // Don't do this
    res.json(result)
})
```

## Controller Authorization

Controllers must use `checkOwnership()` for authorization:

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

## Database Operations

All database operations MUST filter by `organizationId`:

```typescript
// CORRECT: Filter by organizationId
const resources = await repository
    .createQueryBuilder('resource')
    .where('resource.organizationId = :organizationId', {
        organizationId: user.organizationId
    })
    .getMany()

// WRONG: Missing organizationId (data leak!)
const resources = await repository.find({ where: { id } })
```

## Error Handling

Use `InternalFlowiseError` with appropriate status codes:

```typescript
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

// Missing parameter
throw new InternalFlowiseError(
    StatusCodes.PRECONDITION_FAILED,
    'Error: resourceController.create - body not provided!'
)

// Not found
throw new InternalFlowiseError(
    StatusCodes.NOT_FOUND,
    `Error: resourceService.getById - Resource ${id} not found`
)

// Unauthorized
throw new InternalFlowiseError(
    StatusCodes.UNAUTHORIZED,
    'Error: resourceController.getById - Unauthorized'
)
```

## Route Registration

Register new routes in `packages/server/src/index.ts`:

```typescript
import resourceRoutes from './routes/resource'
app.use('/api/v1/resources', resourceRoutes)
```

## Checklist

Before committing route changes:

- [ ] All routes have `enforceAbility` middleware
- [ ] Controllers use `checkOwnership()` for authorization
- [ ] Database queries filter by `organizationId`
- [ ] Errors use `InternalFlowiseError` with proper status codes
- [ ] Route registered in `src/index.ts`
