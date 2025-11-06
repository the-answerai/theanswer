# CLAUDE.md - Server Package

This file provides guidance for working with the Flowise Server package.

## Overview

The server package is the Express.js backend that powers Flowise. It handles API requests, authentication, database operations, and chatflow execution.

## Package Structure

```
packages/server/
├── src/
│   ├── routes/              # API route definitions
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── database/
│   │   ├── entities/        # TypeORM entities
│   │   └── migrations/      # Database migrations
│   ├── middlewares/
│   │   ├── authentication/  # Auth middleware
│   │   └── errors/          # Error handling
│   ├── utils/               # Utility functions
│   ├── Interface.ts         # Type definitions
│   └── index.ts             # Server entry point
├── bin/                     # Executable scripts
├── test/                    # Test files
└── AUTHORIZATION.md         # Auth documentation

```

## Development Commands

```bash
# From repository root
pnpm --filter flowise-server build     # Build server
pnpm --filter flowise-server dev       # Dev mode with hot reload
pnpm --filter flowise-server start     # Production start

# Database migrations
pnpm migration:generate                 # Generate new migration
pnpm migration:run                      # Run pending migrations
pnpm migration:show                     # Show migration status

# Testing
pnpm test:auth                          # Run auth tests
```

## Resource Implementation Pattern

TheAnswer follows a strict 4-layer architecture. When adding new resources (like `Chatflow`, `Assistant`, etc.), follow this pattern:

### Layer 1: Routes (`src/routes/{resource}/index.ts`)

RESTful endpoint definitions with authentication:

```typescript
import express from 'express'
import resourceController from '../../controllers/resource'
import enforceAbility from '../../middlewares/authentication/enforceAbility'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('Resource'), resourceController.createResource)
router.post('/import', enforceAbility('Resource'), resourceController.importResources)

// READ
router.get('/', enforceAbility('Resource'), resourceController.getAllResources)
router.get('/:id', enforceAbility('Resource'), resourceController.getResourceById)

// UPDATE
router.put('/:id', enforceAbility('Resource'), resourceController.updateResource)

// DELETE
router.delete('/:id', enforceAbility('Resource'), resourceController.deleteResource)

export default router
```

**Register in main router (`src/index.ts`):**
```typescript
import resourceRoutes from './routes/resource'
app.use('/api/v1/resources', resourceRoutes)
```

### Layer 2: Controllers (`src/controllers/resource/index.ts`)

Request/response handling with validation and authorization:

```typescript
import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import resourceService from '../../services/resource'
import checkOwnership from '../../utils/checkOwnership'

const createResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Validate request
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: resourceController.createResource - body not provided!'
            )
        }

        // 2. Call service layer
        const apiResponse = await resourceService.createResource(req.body, req.user!)

        // 3. Return response
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getResourceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Validate parameters
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: resourceController.getResourceById - id not provided!'
            )
        }

        // 2. Fetch resource
        const apiResponse = await resourceService.getResourceById(req.params.id, req.user)

        // 3. Check ownership/permissions
        if (req.user && !(await checkOwnership(apiResponse, req.user, req))) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: resourceController.getResourceById - Unauthorized'
            )
        }

        // 4. Return response
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: resourceController.updateResource - id or body not provided!'
            )
        }

        const apiResponse = await resourceService.updateResource(req.params.id, req.body, req.user!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: resourceController.deleteResource - id not provided!'
            )
        }

        const apiResponse = await resourceService.deleteResource(req.params.id, req.user!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource
}
```

### Layer 3: Services (`src/services/resource/index.ts`)

Business logic and database operations:

```typescript
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Resource } from '../../database/entities/Resource'
import { IUser } from '../../Interface'

const createResource = async (data: any, user: IUser): Promise<Resource> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Resource)

        // Create new resource with multi-tenancy fields
        const newResource = repository.create({
            ...data,
            userId: user.id,
            organizationId: user.organizationId
        })

        // Save to database
        const dbResponse = await repository.save(newResource)
        return dbResponse

    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: resourceService.createResource - ${getErrorMessage(error)}`
        )
    }
}

const getAllResources = async (user?: IUser): Promise<Resource[]> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Resource)

        // Build query with multi-tenancy filter
        const query = repository
            .createQueryBuilder('resource')
            .where('resource.organizationId = :organizationId', {
                organizationId: user?.organizationId
            })

        // Non-admin users only see their own resources
        if (user && !user.isAdmin) {
            query.andWhere('resource.userId = :userId', { userId: user.id })
        }

        const dbResponse = await query.getMany()
        return dbResponse

    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: resourceService.getAllResources - ${getErrorMessage(error)}`
        )
    }
}

const getResourceById = async (id: string, user?: IUser): Promise<Resource> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Resource)

        const dbResponse = await repository
            .createQueryBuilder('resource')
            .where('resource.id = :id', { id })
            .getOne()

        if (!dbResponse) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: resourceService.getResourceById - Resource ${id} not found`
            )
        }

        return dbResponse

    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: resourceService.getResourceById - ${getErrorMessage(error)}`
        )
    }
}

const updateResource = async (id: string, data: any, user: IUser): Promise<Resource> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Resource)

        // Fetch existing resource
        const resource = await getResourceById(id, user)

        // Update fields
        const updatedResource = repository.merge(resource, data)

        // Save changes
        const dbResponse = await repository.save(updatedResource)
        return dbResponse

    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: resourceService.updateResource - ${getErrorMessage(error)}`
        )
    }
}

const deleteResource = async (id: string, user: IUser): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Resource)

        // Fetch resource to verify existence
        await getResourceById(id, user)

        // Soft delete (if using @DeleteDateColumn)
        const dbResponse = await repository.softDelete(id)

        // Or hard delete
        // const dbResponse = await repository.delete(id)

        return dbResponse

    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: resourceService.deleteResource - ${getErrorMessage(error)}`
        )
    }
}

export default {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource
}
```

### Layer 4: Entities (`src/database/entities/Resource.ts`)

TypeORM entity definitions:

```typescript
import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
    Index
} from 'typeorm'

@Entity()
export class Resource {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column({ type: 'text', nullable: true })
    description?: string

    // Multi-tenancy fields (REQUIRED)
    @Index()
    @Column({ type: 'uuid', nullable: true })
    userId: string

    @Index()
    @Column({ type: 'uuid', nullable: true })
    organizationId: string

    // Audit fields (REQUIRED)
    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date

    // Soft delete support (OPTIONAL)
    @DeleteDateColumn()
    deletedDate?: Date

    // Additional fields as needed
    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>
}
```

**Register entity in `src/database/entities/index.ts`:**
```typescript
export { Resource } from './Resource'
```

## Authentication & Authorization

### Authentication Middleware

All `/api/v1/` routes are protected by dual authentication:

1. **API Key Authentication (Primary)**
   - Header: `Authorization: Bearer <api-key>`
   - Associates request with user and organization
   - Tracks usage and activity

2. **JWT Authentication (Fallback)**
   - Auth0 JWT tokens for UI access
   - Organization-based multi-tenancy
   - Role-based access control

### Using `enforceAbility`

The `enforceAbility` middleware enforces resource-level permissions:

```typescript
import enforceAbility from '../../middlewares/authentication/enforceAbility'

// Protect routes with ability checks
router.get('/', enforceAbility('Resource'), controller.getAll)
router.post('/', enforceAbility('Resource'), controller.create)
router.put('/:id', enforceAbility('Resource'), controller.update)
router.delete('/:id', enforceAbility('Resource'), controller.delete)
```

**How it works:**
1. Validates authentication (API key or JWT)
2. Syncs user data with database
3. Checks user's organization membership
4. Verifies resource-level permissions
5. Attaches `req.user` with user context

### Multi-Tenancy Pattern

**ALWAYS scope resources by organization:**

```typescript
// In services: Filter by organizationId
const resources = await repository
    .createQueryBuilder('resource')
    .where('resource.organizationId = :organizationId', {
        organizationId: user.organizationId
    })
    .getMany()

// In controllers: Check ownership
if (req.user && !(await checkOwnership(resource, req.user, req))) {
    throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized')
}
```

### User Context (`req.user`)

After authentication, `req.user` contains:

```typescript
interface IUser {
    id: string
    email: string
    organizationId: string
    isAdmin: boolean
    // ... other fields
}
```

## Error Handling

### Using `InternalFlowiseError`

Always use the custom error class for consistent error handling:

```typescript
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'

// Validation errors
if (!req.body) {
    throw new InternalFlowiseError(
        StatusCodes.PRECONDITION_FAILED,
        'Error: controllerName.methodName - body not provided!'
    )
}

// Not found errors
if (!resource) {
    throw new InternalFlowiseError(
        StatusCodes.NOT_FOUND,
        `Error: serviceName.methodName - Resource ${id} not found`
    )
}

// Wrapping external errors
try {
    // ... operation
} catch (error) {
    throw new InternalFlowiseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error: serviceName.methodName - ${getErrorMessage(error)}`
    )
}
```

### Error Format Convention

**Pattern:** `Error: {serviceName}.{methodName} - {description}`

Examples:
- `Error: chatflowService.getChatflowById - Chatflow abc123 not found`
- `Error: resourceController.createResource - body not provided!`

## Database Operations

### Accessing the Database

```typescript
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const appServer = getRunningExpressApp()
const repository = appServer.AppDataSource.getRepository(EntityName)
```

### Query Builder Pattern

```typescript
// Simple query
const resources = await repository.find()

// With conditions
const resources = await repository.find({
    where: { organizationId: user.organizationId }
})

// Query builder for complex queries
const resources = await repository
    .createQueryBuilder('resource')
    .where('resource.organizationId = :organizationId', {
        organizationId: user.organizationId
    })
    .andWhere('resource.isActive = :isActive', { isActive: true })
    .orderBy('resource.createdDate', 'DESC')
    .getMany()

// With relations
const resource = await repository
    .createQueryBuilder('resource')
    .leftJoinAndSelect('resource.user', 'user')
    .where('resource.id = :id', { id })
    .getOne()
```

### Soft Delete

If using `@DeleteDateColumn()`:

```typescript
// Soft delete
await repository.softDelete(id)

// Restore soft-deleted
await repository.restore(id)

// Query including soft-deleted
const resources = await repository
    .createQueryBuilder('resource')
    .withDeleted()  // Include soft-deleted records
    .getMany()
```

## Database Migrations

### Creating Migrations

```bash
# Generate migration from entity changes
pnpm migration:generate

# Run pending migrations
pnpm migration:run

# Show migration status
pnpm migration:show
```

### Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateResourceTable1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "resource" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "description" text,
                "userId" uuid,
                "organizationId" uuid,
                "createdDate" TIMESTAMP DEFAULT now(),
                "updatedDate" TIMESTAMP DEFAULT now(),
                "deletedDate" TIMESTAMP
            )
        `)

        // Add indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_resource_userId" ON "resource"("userId")
        `)
        await queryRunner.query(`
            CREATE INDEX "IDX_resource_organizationId" ON "resource"("organizationId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "resource"`)
    }
}
```

## Testing

### Authentication Tests

Located in `test/api/`:

```typescript
import request from 'supertest'
import { app } from '../../src/index'

describe('Resource API', () => {
    const TEST_TOKEN = 'test-jwt-token'

    it('should create resource', async () => {
        const response = await request(app)
            .post('/api/v1/resources')
            .set('Authorization', `Bearer ${TEST_TOKEN}`)
            .send({
                name: 'Test Resource',
                description: 'Test description'
            })
            .expect(200)

        expect(response.body).toHaveProperty('id')
        expect(response.body.name).toBe('Test Resource')
    })

    it('should reject unauthorized request', async () => {
        await request(app)
            .get('/api/v1/resources')
            .expect(401)
    })
})
```

## Best Practices

### 1. Controllers
- **Thin controllers:** Delegate all business logic to services
- **Validate early:** Check required parameters at the start
- **Use checkOwnership:** Always verify resource access
- **Consistent errors:** Use `InternalFlowiseError` with proper status codes

### 2. Services
- **Pure logic:** No direct request/response handling
- **Transaction safety:** Use database transactions for multi-step operations
- **Error wrapping:** Catch and wrap errors with context
- **Multi-tenancy:** Always filter by `organizationId`

### 3. Entities
- **Required fields:** Always include `userId`, `organizationId`, `createdDate`, `updatedDate`
- **Indexes:** Add indexes on foreign keys and frequently queried fields
- **Soft delete:** Use `@DeleteDateColumn()` for recoverable deletes
- **JSON columns:** Use for flexible metadata storage

### 4. Security
- **Never skip auth:** All routes must use `enforceAbility`
- **Validate inputs:** Check all user inputs before processing
- **Parameterized queries:** TypeORM query builder prevents SQL injection
- **Hide sensitive data:** Don't expose credentials or internal details

## Common Patterns

### Pagination

```typescript
const getAllResources = async (
    user: IUser,
    page: number = 1,
    limit: number = 20
): Promise<{ resources: Resource[], total: number }> => {
    const skip = (page - 1) * limit

    const [resources, total] = await repository.findAndCount({
        where: { organizationId: user.organizationId },
        skip,
        take: limit,
        order: { createdDate: 'DESC' }
    })

    return { resources, total }
}
```

### File Operations

```typescript
import path from 'path'
import fs from 'fs/promises'

const uploadFile = async (file: Express.Multer.File, user: IUser) => {
    const uploadPath = path.join(
        process.cwd(),
        'uploads',
        user.organizationId,
        file.originalname
    )

    await fs.mkdir(path.dirname(uploadPath), { recursive: true })
    await fs.writeFile(uploadPath, file.buffer)

    return uploadPath
}
```

### Transactions

```typescript
const complexOperation = async (data: any, user: IUser) => {
    const queryRunner = appServer.AppDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
        // Multiple database operations
        const resource1 = await queryRunner.manager.save(Resource, data1)
        const resource2 = await queryRunner.manager.save(Resource, data2)

        await queryRunner.commitTransaction()
        return { resource1, resource2 }

    } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
    } finally {
        await queryRunner.release()
    }
}
```

## Environment Variables

Key server configuration in `.env`:

```bash
# Database
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=example_user
DATABASE_PASSWORD=example_password
DATABASE_NAME=example_db

# Redis
REDIS_URL=redis://localhost:6379

# Auth0
AUTH0_SECRET=your-secret
AUTH0_AUDIENCE=your-audience
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com

# Server
PORT=3000
FLOWISE_DOMAIN=http://localhost:3000

# API Keys
APIKEY_STORAGE_TYPE=db
```

## Resources

- **AUTHORIZATION.md:** Detailed authentication documentation
- **Root CLAUDE.md:** Overall architecture guidance
- **Interface.ts:** Core type definitions
- **TypeORM Documentation:** https://typeorm.io/
