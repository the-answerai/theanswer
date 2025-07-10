# AGENTS.md - TheAnswer Codebase Guide

## Overview

TheAnswer is a comprehensive AI-powered productivity suite built on top of Flowise, an open-source tool for creating customized LLM flows. This codebase extends Flowise's capabilities with additional services, UI components, and enterprise features.

## Architecture Overview

### Monorepo Structure

```
theanswer/
├── apps/
│   └── web/                    # Next.js frontend application
├── packages/                   # Forked Flowise packages
│   ├── server/                 # Node.js backend API
│   ├── docs/                   # Docusauraus Documentation Site
│   ├── ui/                     # React frontend for Flowise
│   ├── components/             # Third-party node integrations
│   ├── embed/                  # Embedding functionality
│   └── embed-react/            # React embedding components
├── packages-answers/           # TheAnswer-specific packages
│   ├── db/                     # Database layer (Prisma)
│   ├── ui/                     # TheAnswer UI components
│   ├── utils/                  # Shared utilities
│   └── types/                  # TypeScript definitions
├── scripts/                    # Development and build scripts
```

### Technology Stack

-   **Backend**: Node.js, Express, TypeORM
-   **Frontend**: Next.js 13+ (App Router), React 18
-   **Database**: PostgreSQL (primary), Prisma (TheAnswer-specific)
-   **Authentication**: Auth0 with JWT
-   **Build System**: Turbo (monorepo orchestration), pnpm
-   **Testing**: Jest, Cypress

## Code Patterns & Conventions

### 1. Import Path Aliases

Always use the configured path aliases for imports:

```typescript
// TheAnswer-specific imports
import { utility } from '@utils/utility'
import { Component } from '@ui/Component'
import { schema } from '@db/schema'

// Flowise imports
import { FlowiseComponent } from '@/components/FlowiseComponent'
import { api } from '@/api/client'
```

### 2. Component Structure (packages/components)

Components follow a strict pattern for Flowise nodes:

```typescript
// packages/components/nodes/chatmodels/ExampleModel/ExampleModel.ts
class ExampleModel_ChatModels implements INode {
    label: string = 'Example Model'
    name: string = 'exampleModel'
    version: number = 1.0
    type: string = 'ExampleModel'
    icon: string = 'example.svg'
    category: string = 'Chat Models'
    description: string = 'Description of the model'
    baseClasses: string[] = [this.type, ...getBaseClasses(LangchainModel)]

    credential: INodeParams = {
        label: 'Connect Credential',
        name: 'credential',
        type: 'credential',
        credentialNames: ['exampleApi']
    }

    inputs: INodeParams[] = [
        // Input parameters
    ]

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        // Implementation
    }
}
```

**Key Requirements:**

-   Always include `tags: ['AAI']` for TheAnswer-specific components
-   Use semantic versioning for `version`
-   Include proper TypeScript interfaces
-   Follow the credential pattern for API integrations

### 3. API Route Structure (packages/server)

Routes follow RESTful conventions with authentication middleware:

```typescript
// packages/server/src/routes/resource/index.ts
import express from 'express'
import resourceController from '../../controllers/resource'
import enforceAbility from '../../middlewares/authentication/enforceAbility'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('Resource'), resourceController.createResource)

// READ
router.get('/', enforceAbility('Resource'), resourceController.getAllResources)
router.get('/:id', enforceAbility('Resource'), resourceController.getResourceById)

// UPDATE
router.put('/:id', enforceAbility('Resource'), resourceController.updateResource)

// DELETE
router.delete('/:id', enforceAbility('Resource'), resourceController.deleteResource)

export default router
```

### 4. Controller Pattern

Controllers handle HTTP requests and delegate to services:

```typescript
// packages/server/src/controllers/resource/index.ts
import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import resourceService from '../../services/resource'

const createResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: resourceController.createResource - body not provided!')
        }
        const apiResponse = await resourceService.createResource(req.body, req.user!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}
```

**Key Patterns:**

-   Always use `InternalFlowiseError` for custom errors
-   Include descriptive error messages with controller/method context
-   Pass `req.user!` to services for authenticated requests
-   Use `next(error)` for error handling

### 5. Service Layer Pattern

Services contain business logic and database operations:

```typescript
// packages/server/src/services/resource/index.ts
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const createResource = async (data: any, user: IUser): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Resource)

        const newResource = repository.create({
            ...data,
            userId: user.id,
            organizationId: user.organizationId
        })

        return await repository.save(newResource)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: resourceService.createResource - ${getErrorMessage(error)}`
        )
    }
}
```

### 6. Database Entity Pattern (TypeORM)

Entities follow consistent patterns with proper indexing and relationships:

```typescript
// packages/server/src/database/entities/Resource.ts
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm'
import { IResource } from '../../Interface'

@Entity()
export class Resource implements IResource {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column({ type: 'text', nullable: true })
    description?: string

    @Column({ type: 'timestamp' })
    @CreateDateColumn()
    createdDate: Date

    @Column({ type: 'timestamp' })
    @UpdateDateColumn()
    updatedDate: Date

    @Index()
    @Column({ type: 'uuid', nullable: true })
    userId?: string

    @Index()
    @Column({ type: 'uuid', nullable: true })
    organizationId?: string

    @Column({
        type: 'simple-array',
        enum: ResourceVisibility,
        default: 'Private'
    })
    visibility?: ResourceVisibility[]
}
```

**Key Requirements:**

-   Always use UUID primary keys
-   Include `userId` and `organizationId` for multi-tenancy
-   Add proper indexes on foreign keys
-   Use enum types for visibility/status fields
-   Include `createdDate` and `updatedDate` timestamps

## Authentication & Authorization

### Auth0 Integration

The system uses Auth0 for authentication with JWT tokens:

```typescript
// Middleware automatically handles:
// 1. JWT validation
// 2. User synchronization
// 3. Organization assignment
// 4. Role-based access control
```

### Permission System

Uses `enforceAbility` middleware for resource-level permissions:

-   **Admin**: Full access to organization resources
-   **User**: Access to owned resources + organization-visible resources
-   **API Key**: Scoped access based on key permissions

### Multi-tenancy

All resources are scoped by `organizationId`:

```typescript
// Always filter by organization in queries
const filter = {
    organizationId: user.organizationId,
    userId: user.id // For non-admin users
}
```

## Testing Patterns

### Unit Tests

```typescript
// packages/server/test/api/resource.test.ts
describe('Resource API', () => {
    beforeEach(async () => {
        // Setup test data
    })

    it('should create resource', async () => {
        const response = await request(app)
            .post('/api/v1/resources')
            .set('Authorization', `Bearer ${TEST_TOKEN}`)
            .send(testData)
            .expect(200)

        expect(response.body).toHaveProperty('id')
    })
})
```

### Integration Tests

Use the established patterns in `packages/server/test/api/billing/` for reference.

## Common Utilities

### Error Handling

```typescript
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'

// Always wrap service calls in try-catch
try {
    // Service logic
} catch (error) {
    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: serviceName.methodName - ${getErrorMessage(error)}`)
}
```

### Database Access

```typescript
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const appServer = getRunningExpressApp()
const repository = appServer.AppDataSource.getRepository(EntityName)
```

### Validation

```typescript
// Always validate required parameters
if (!req.params.id) {
    throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: controller.method - id not provided!')
}
```

## Frontend Patterns (Next.js App)

### App Router Structure

```
apps/web/app/
├── layout.tsx              # Root layout
├── (Main UI)/              # Route group
├── api/                    # API routes
├── widgets/                # Widget pages
└── [encodedDomain]/        # Dynamic routes
```

### TheAnswer UI Components

```typescript
// packages-answers/ui/src/ComponentName/
├── index.tsx               # Main export
├── ComponentName.tsx       # Component implementation
├── ComponentName.types.ts  # TypeScript definitions
├── hooks/                  # Component-specific hooks
└── components/             # Sub-components
```

## Development Guidelines

### 1. Code Quality

-   **Always** use TypeScript with strict mode
-   Follow ESLint configuration (`.eslintrc.cjs`)
-   Use Prettier for formatting (configured in `package.json`)
-   Write descriptive commit messages

### 2. Performance

-   Use React hooks appropriately (`useMemo`, `useCallback` for expensive operations)
-   Implement proper loading states
-   Use pagination for large datasets
-   Optimize database queries with proper indexing

### 3. Security

-   Never expose sensitive data in client-side code
-   Always validate user input
-   Use parameterized queries to prevent SQL injection
-   Implement proper CORS policies

### 4. Testing Strategy

-   Write unit tests for business logic
-   Integration tests for API endpoints
-   Component tests for React components
-   E2E tests for critical user flows

### 5. Refactoring Guidelines

-   **Gradual approach**: Don't refactor everything at once
-   **Test coverage**: Ensure tests exist before refactoring
-   **Backward compatibility**: Maintain API compatibility when possible
-   **Documentation**: Update documentation with changes

## Common Pitfalls & Solutions

### 1. Database Migrations

-   Always create migrations for schema changes
-   Test migrations on development data
-   Use transactions for complex migrations

### 2. Authentication Issues

-   Check `req.user` existence before accessing properties
-   Verify organization membership for multi-tenant resources
-   Handle API key authentication separately from JWT

### 3. Component Development

-   Follow the established node interface patterns
-   Include proper error handling in `init` methods
-   Use semantic versioning for component updates

### 4. Performance Issues

-   Monitor database query performance
-   Use connection pooling appropriately
-   Implement caching for frequently accessed data

## Build & Deployment

### Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm dev              # Start development servers
```

### Environment Variables

Required for development:
.env.template

### Production Considerations

-   Use environment-specific configurations
-   Implement proper logging and monitoring
-   Set up database backups
-   Configure SSL/TLS properly

## Contributing Guidelines

### Before Making Changes

1. **Understand the context**: Read existing code patterns
2. **Check for existing solutions**: Don't reinvent the wheel
3. **Plan the approach**: Consider impact on existing functionality
4. **Write tests**: Ensure new code is properly tested

### Code Review Checklist

-   [ ] Follows established patterns
-   [ ] Includes proper error handling
-   [ ] Has appropriate tests
-   [ ] Updates documentation if needed
-   [ ] Considers security implications
-   [ ] Maintains backward compatibility

### When to Refactor

-   **High-impact, low-risk changes**: Safe to proceed
-   **Legacy code cleanup**: When adding new features to old areas
-   **Performance improvements**: When bottlenecks are identified
-   **Security updates**: Always prioritize security fixes

## Resources

### Key Files to Reference

-   `packages/server/src/Interface.ts`: Core type definitions
-   `packages/server/src/index.ts`: Server configuration
-   `turbo.json`: Build pipeline configuration
-   `package.json`: Dependencies and scripts

### Documentation

-   [Flowise Documentation](https://docs.flowiseai.com/)
-   [TypeORM Documentation](https://typeorm.io/)
-   [Next.js Documentation](https://nextjs.org/docs)
-   [Auth0 Documentation](https://auth0.com/docs)

Remember: This codebase is complex but well-structured. Take time to understand the patterns before making changes, and always prioritize maintainability and security over quick fixes.

## Zoom Integration Implementation

### Current Architecture

The Zoom integration follows the standard Flowise patterns with these key components:

#### Frontend Layer

-   **ZoomMeetingPicker.jsx** (`packages/ui/src/ui-component/zoom/`): Enhanced React dialog component using Material-UI with **tabbed interface** for different meeting types (My, Shared, Organization) and **date range controls**. Features include:
    -   **Three tabs**: My Meetings, Shared Meetings, Organization Meetings
    -   **Date range picker**: Defaults to last 14 days (was previously hardcoded 30 days)
    -   **Real-time meeting counts** in tab badges
    -   **Enhanced error handling** with specific messaging per tab
    -   **Token refresh functionality** with user notifications
    -   **Account ID validation** for organization meetings
-   **zoom.js API client** (`packages/ui/src/api/zoom.js`): Enhanced with new methods:
    -   `getMeetings()` - Original endpoint for user's own meetings
    -   `getSharedMeetings()` - For meetings shared with the user
    -   `getOrganizationMeetings()` - For organization-wide meetings (admin access)
    -   `getMeetingsByType()` - Unified endpoint with meeting type parameter

#### Backend Layer

-   **Zoom Controller** (`packages/server/src/controllers/zoom/index.ts`): Enhanced with **four new endpoints**:
    -   `getMeetings()` - Enhanced original endpoint with date range support (14-day default)
    -   `getSharedMeetings()` - Handles shared meeting requests
    -   `getOrganizationMeetings()` - Uses account-level Zoom API endpoint `GET /accounts/{accountId}/users/{userId}/recordings`
    -   `getMeetingsByType()` - Unified endpoint that routes based on `meetingType` parameter
    -   **Enhanced error handling** with specific HTTP status codes (401, 403)
    -   **Flexible date ranges** with configurable from/to dates
    -   **Account ID validation** for organization-level access
-   **Zoom Routes** (`packages/server/src/routes/zoom/index.ts`): Added new route patterns:
    -   `/api/v1/zoom/meetings` - Original endpoint
    -   `/api/v1/zoom/meetings/shared` - Shared meetings endpoint
    -   `/api/v1/zoom/meetings/organization` - Organization meetings endpoint
    -   `/api/v1/zoom/meetings/by-type` - Unified endpoint
-   **ZoomService.ts** (`packages/components/nodes/documentloaders/Zoom/ZoomService.ts`): Enhanced with new methods:
    -   `getUserMeetings()` - Enhanced user meetings with date range options
    -   `getOrganizationMeetings()` - Account-level meetings access
    -   `getSharedMeetings()` - Shared meetings (currently delegates to user meetings)
    -   `getUserMeetingsById()` - Get meetings for specific user ID
    -   **Account ID management** methods
    -   **Default date range helpers** (14 days back)

### Key Implementation Details

#### Meeting Type Tabs Architecture

```javascript
const meetingTypes = [
    {
        key: 'my',
        label: 'My Meetings',
        icon: IconCalendar,
        description: 'Meetings where you are the host',
        apiMethod: zoomApi.getMeetings
    },
    {
        key: 'shared',
        label: 'Shared Meetings',
        icon: IconUsers,
        description: 'Meetings that have been shared with you',
        apiMethod: zoomApi.getSharedMeetings
    },
    {
        key: 'organization',
        label: 'Organization',
        icon: IconBuilding,
        description: 'Organization-wide meetings (admin access required)',
        apiMethod: zoomApi.getOrganizationMeetings
    }
]
```

#### Date Range Implementation

-   **Default Range**: 14 days ago to today (previously was hardcoded 30 days)
-   **User Configurable**: Date picker controls in modal dialog
-   **API Integration**: Passes `fromDate` and `toDate` parameters to all endpoints

#### Account-Level Access Pattern

```typescript
// Controller usage of account-level endpoint
const endpoint = `https://api.zoom.us/v2/accounts/${params.accountId}/users/${userId}/recordings`
```

### Zoom API Endpoints Used

1. **User Meetings**: `GET /users/me/recordings` - Current user's meetings where they are host
2. **Account-Level Meetings**: `GET /accounts/{accountId}/users/{userId}/recordings` - Organization meetings with account permissions
3. **Meeting Recordings**: `GET /meetings/{meetingId}/recordings` - Individual meeting recordings and transcripts

### Current Implementation Status

✅ **COMPLETED FEATURES:**

-   Enhanced tabbed interface with three meeting types
-   Date range controls with 14-day default
-   Account-level recordings access for organization meetings
-   Enhanced error handling with specific messaging
-   Token refresh functionality
-   Real-time meeting counts in tab badges
-   Proper Material-UI integration with theme support

### Authentication & Permissions

-   **Access Token**: Required for all API calls, with automatic refresh on 401 errors
-   **Account ID**: Required for organization-level meetings, validated in frontend and backend
-   **Permissions**: Organization meetings require admin-level Zoom account permissions
-   **Error Handling**: Specific messaging for 401 (token expired) and 403 (insufficient permissions)

### Future Enhancement Opportunities

1. **Shared Meetings Enhancement**: Currently uses same endpoint as user meetings. Could be enhanced to:

    - Query specific shared user IDs
    - Use organization directory to find shared meetings
    - Implement meeting sharing patterns based on organization structure

2. **Pagination Support**: Add pagination controls for large meeting lists

3. **Advanced Filtering**: Add filters by host, duration, recording type, etc.

4. **Caching Strategy**: Implement client-side caching for meeting lists to reduce API calls

### Known Limitations

-   **Shared Meetings**: Currently delegates to user meetings endpoint due to Zoom API limitations for discovering truly "shared" meetings without knowing specific user IDs
-   **Account ID Requirement**: Organization meetings require account ID to be present in Zoom credentials
-   **Permission Dependencies**: Organization features require admin-level Zoom account permissions
