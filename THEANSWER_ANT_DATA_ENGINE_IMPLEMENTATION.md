# TheAnswer - Data Engine Integration Implementation Guide
## Phase 1: API Gateway Layer

**Project:** TheAnswer
**Role:** API Gateway and Authentication Proxy
**Timeline:** Week 1-2
**Status:** Ready for Implementation

---

## Table of Contents
1. [Project Context](#project-context)
2. [What You're Building](#what-youre-building)
3. [Implementation Checklist](#implementation-checklist)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Testing Guide](#testing-guide)
6. [Deployment](#deployment)

---

## Project Context

### What is TheAnswer?
TheAnswer is a monorepo application built with Turbo that provides AI-powered workflow automation through Flowise chatflows. It uses:
- **Architecture:** 4-layer pattern (Route → Controller → Service → Entity)
- **Backend:** Express.js + TypeORM
- **Frontend:** Next.js 13+ with App Router
- **Auth:** Auth0 JWT + API Key authentication
- **Database:** PostgreSQL (TypeORM + Prisma dual system)

### What is Data Engine?
Data Engine (formerly data-sidekick) is a full-stack application for managing structured data across multiple domains:
- **Resources:** Domains, URLs, Calls, Tags, Documents, Tickets, Chats
- **Backend:** Express.js + Supabase
- **Database:** Supabase (PostgreSQL)
- **Auth:** Auth0 (session-based)

### How They Work Together
```
User → TheAnswer API (Validates API Key)
     → Data Engine (Service Auth)
     → Supabase (Data Storage)
```

**Key Principle:** TheAnswer acts as a secure gateway. Users authenticate with TheAnswer API keys, and TheAnswer communicates with Data Engine using a shared service key.

---

## What You're Building

You are creating **7 new resource endpoints** in TheAnswer that proxy requests to Data Engine:

1. **Domains** - Website domain metadata
2. **URLs** - Page-level analysis
3. **Calls** - Call logs with transcripts
4. **Tags** - Shared taxonomy
5. **Documents** - Vector-embedded documents
6. **Tickets** - Support tickets
7. **Chats** - Chat conversation logs

Each resource will have **full CRUD operations** (Create, Read, Update, Delete) following TheAnswer's existing patterns.

---

## Implementation Checklist

### Phase 1.1: Foundation (Days 1-2)
- [ ] Add environment variables
- [ ] Create DataEngineService with HTTP client
- [ ] Test service connection to Data Engine
- [ ] Create base route structure

### Phase 1.2: Core Resources (Days 3-7)
- [ ] Implement Domains endpoints
- [ ] Implement URLs endpoints
- [ ] Implement Calls endpoints
- [ ] Implement Tags endpoints

### Phase 1.3: Extended Resources (Days 8-10)
- [ ] Implement Documents endpoints
- [ ] Implement Tickets endpoints
- [ ] Implement Chats endpoints

### Phase 1.4: Testing & Documentation (Days 11-14)
- [ ] Unit tests for all controllers
- [ ] Integration tests for service communication
- [ ] API documentation
- [ ] Deployment to staging

---

## Step-by-Step Implementation

### Step 1: Environment Configuration

**File:** `/.env`

Add these variables to your existing `.env` file:

```bash
# Data Engine Integration
DATA_ENGINE_API_URL=http://localhost:5001
DATA_ENGINE_SERVICE_KEY=test-service-key-local-dev-only
```

**For Production:** Use Bitwarden Secrets (BWS):

```bash
# .env (production)
DATA_ENGINE_API_URL=https://data-sidekick-prod.onrender.com
DATA_ENGINE_SERVICE_KEY=${BWS_DATA_ENGINE_SERVICE_KEY}
```

### Step 2: Create DataEngineService

**File:** `packages/server/src/services/data-engine/index.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { IUser } from '../../Interface'

/**
 * Service for communicating with Data Engine
 * Handles all HTTP requests to the external data API
 */
class DataEngineService {
    private client: AxiosInstance
    private baseURL: string
    private serviceKey: string

    constructor() {
        this.baseURL = process.env.DATA_ENGINE_API_URL || 'http://localhost:5001'
        this.serviceKey = process.env.DATA_ENGINE_SERVICE_KEY || ''

        if (!this.serviceKey) {
            console.error('[DataEngineService] DATA_ENGINE_SERVICE_KEY environment variable is missing')
            throw new Error('DATA_ENGINE_SERVICE_KEY is required for Data Engine integration')
        }

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Key': this.serviceKey
            }
        })

        console.log(`[DataEngineService] Initialized with baseURL: ${this.baseURL}`)
    }

    // ==================== DOMAINS ====================

    async createDomain(data: any, user: IUser) {
        return this.request('POST', '/api/external/domains', {
            ...data,
            metadata: this.buildMetadata(user, 'create')
        }, user)
    }

    async getAllDomains(query: any, user: IUser) {
        return this.request('GET', '/api/external/domains', null, user, query)
    }

    async getDomainById(id: string, user: IUser) {
        return this.request('GET', `/api/external/domains/${id}`, null, user)
    }

    async updateDomain(id: string, data: any, user: IUser) {
        return this.request('PUT', `/api/external/domains/${id}`, {
            ...data,
            metadata: this.buildMetadata(user, 'update')
        }, user)
    }

    async deleteDomain(id: string, user: IUser) {
        return this.request('DELETE', `/api/external/domains/${id}`, null, user)
    }

    // ==================== URLS ====================

    async createUrl(data: any, user: IUser) {
        return this.request('POST', '/api/external/urls', {
            ...data,
            metadata: this.buildMetadata(user, 'create')
        }, user)
    }

    async getAllUrls(query: any, user: IUser) {
        return this.request('GET', '/api/external/urls', null, user, query)
    }

    async getUrlById(id: string, user: IUser) {
        return this.request('GET', `/api/external/urls/${id}`, null, user)
    }

    async updateUrl(id: string, data: any, user: IUser) {
        return this.request('PUT', `/api/external/urls/${id}`, {
            ...data,
            metadata: this.buildMetadata(user, 'update')
        }, user)
    }

    async deleteUrl(id: string, user: IUser) {
        return this.request('DELETE', `/api/external/urls/${id}`, null, user)
    }

    // ==================== CALLS ====================

    async createCall(data: any, user: IUser) {
        return this.request('POST', '/api/external/calls', {
            ...data,
            metadata: this.buildMetadata(user, 'create')
        }, user)
    }

    async getAllCalls(query: any, user: IUser) {
        return this.request('GET', '/api/external/calls', null, user, query)
    }

    async getCallById(id: string, user: IUser) {
        return this.request('GET', `/api/external/calls/${id}`, null, user)
    }

    async updateCall(id: string, data: any, user: IUser) {
        return this.request('PUT', `/api/external/calls/${id}`, {
            ...data,
            metadata: this.buildMetadata(user, 'update')
        }, user)
    }

    async deleteCall(id: string, user: IUser) {
        return this.request('DELETE', `/api/external/calls/${id}`, null, user)
    }

    // ==================== TAGS ====================

    async createTag(data: any, user: IUser) {
        return this.request('POST', '/api/external/tags', {
            ...data,
            metadata: this.buildMetadata(user, 'create')
        }, user)
    }

    async getAllTags(query: any, user: IUser) {
        return this.request('GET', '/api/external/tags', null, user, query)
    }

    async getTagById(id: number, user: IUser) {
        return this.request('GET', `/api/external/tags/${id}`, null, user)
    }

    async getTagHierarchy(user: IUser) {
        return this.request('GET', '/api/external/tags/hierarchy', null, user)
    }

    async updateTag(id: number, data: any, user: IUser) {
        return this.request('PUT', `/api/external/tags/${id}`, {
            ...data,
            metadata: this.buildMetadata(user, 'update')
        }, user)
    }

    async deleteTag(id: number, user: IUser) {
        return this.request('DELETE', `/api/external/tags/${id}`, null, user)
    }

    // ==================== DOCUMENTS ====================

    async createDocument(data: any, user: IUser) {
        return this.request('POST', '/api/external/documents', {
            ...data,
            metadata: {
                ...(data.metadata || {}),
                organization_id: user.organizationId,
                created_by: user.email,
                source_system: 'theanswer'
            }
        }, user)
    }

    async getAllDocuments(query: any, user: IUser) {
        return this.request('GET', '/api/external/documents', null, user, query)
    }

    async getDocumentById(id: string, user: IUser) {
        return this.request('GET', `/api/external/documents/${id}`, null, user)
    }

    async updateDocument(id: string, data: any, user: IUser) {
        return this.request('PUT', `/api/external/documents/${id}`, data, user)
    }

    async deleteDocument(id: string, user: IUser) {
        return this.request('DELETE', `/api/external/documents/${id}`, null, user)
    }

    async searchDocuments(query: string, matchCount: number = 10, filter: any, user: IUser) {
        return this.request('POST', '/api/external/documents/search', {
            query,
            matchCount,
            filter: {
                ...filter,
                organization_id: user.organizationId
            }
        }, user)
    }

    // ==================== TICKETS ====================

    async createTicket(data: any, user: IUser) {
        return this.request('POST', '/api/external/tickets', {
            ...data,
            metadata: this.buildMetadata(user, 'create')
        }, user)
    }

    async getAllTickets(query: any, user: IUser) {
        return this.request('GET', '/api/external/tickets', null, user, query)
    }

    async getTicketById(id: string, user: IUser) {
        return this.request('GET', `/api/external/tickets/${id}`, null, user)
    }

    async updateTicket(id: string, data: any, user: IUser) {
        return this.request('PUT', `/api/external/tickets/${id}`, {
            ...data,
            metadata: this.buildMetadata(user, 'update')
        }, user)
    }

    async deleteTicket(id: string, user: IUser) {
        return this.request('DELETE', `/api/external/tickets/${id}`, null, user)
    }

    // ==================== CHATS ====================

    async createChat(data: any, user: IUser) {
        return this.request('POST', '/api/external/chats', {
            ...data,
            metadata: this.buildMetadata(user, 'create')
        }, user)
    }

    async getAllChats(query: any, user: IUser) {
        return this.request('GET', '/api/external/chats', null, user, query)
    }

    async getChatById(id: string, user: IUser) {
        return this.request('GET', `/api/external/chats/${id}`, null, user)
    }

    async updateChat(id: string, data: any, user: IUser) {
        return this.request('PUT', `/api/external/chats/${id}`, {
            ...data,
            metadata: this.buildMetadata(user, 'update')
        }, user)
    }

    async deleteChat(id: string, user: IUser) {
        return this.request('DELETE', `/api/external/chats/${id}`, null, user)
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Generic request handler
     */
    private async request(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        path: string,
        data: any = null,
        user: IUser,
        params: any = {}
    ): Promise<any> {
        try {
            const config = {
                method,
                url: path,
                params: {
                    ...params,
                    organizationId: user.organizationId
                },
                ...(data && { data })
            }

            console.log(`[DataEngineService] ${method} ${path}`, {
                organizationId: user.organizationId,
                userId: user.id
            })

            const response = await this.client.request(config)
            return response.data

        } catch (error) {
            this.handleError(error, method, path)
        }
    }

    /**
     * Build metadata object for create/update operations
     */
    private buildMetadata(user: IUser, operation: 'create' | 'update') {
        const base = {
            source_system: 'theanswer',
            source_organization_id: user.organizationId,
            source_user_id: user.id
        }

        if (operation === 'create') {
            return {
                ...base,
                created_by: user.email
            }
        }

        return {
            ...base,
            last_updated_by: user.email,
            last_updated_from: 'theanswer'
        }
    }

    /**
     * Centralized error handling
     */
    private handleError(error: unknown, method: string, path: string): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError

            // Extract status and message from response
            const status = axiosError.response?.status || StatusCodes.INTERNAL_SERVER_ERROR
            const errorData = axiosError.response?.data as any
            const message = errorData?.error || errorData?.details || axiosError.message

            console.error(`[DataEngineService] ${method} ${path} failed:`, {
                status,
                message,
                data: errorData
            })

            throw new InternalFlowiseError(
                status,
                `Error: dataEngineService.${method.toLowerCase()}${this.getMethodName(path)} - ${message}`
            )
        }

        // Non-Axios errors
        console.error(`[DataEngineService] ${method} ${path} unexpected error:`, error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: dataEngineService.${method.toLowerCase()}${this.getMethodName(path)} - ${getErrorMessage(error)}`
        )
    }

    /**
     * Extract method name from path for error messages
     */
    private getMethodName(path: string): string {
        const parts = path.split('/')
        const resource = parts[3] || 'resource' // /api/external/{resource}
        return resource.charAt(0).toUpperCase() + resource.slice(1)
    }
}

export default new DataEngineService()
```

### Step 3: Create Controllers

**Pattern:** Each resource gets its own controller following the 4-layer architecture.

**Example File:** `packages/server/src/controllers/data-engine/domains/index.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'

const createDomain = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.createDomain - body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.createDomain - user not authenticated'
            )
        }

        const domain = await dataEngineService.createDomain(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(domain)
    } catch (error) {
        next(error)
    }
}

const getAllDomains = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.getAllDomains - user not authenticated'
            )
        }

        const domains = await dataEngineService.getAllDomains(req.query, req.user)
        return res.json(domains)
    } catch (error) {
        next(error)
    }
}

const getDomainById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.getDomainById - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.getDomainById - user not authenticated'
            )
        }

        const domain = await dataEngineService.getDomainById(req.params.id, req.user)
        return res.json(domain)
    } catch (error) {
        next(error)
    }
}

const updateDomain = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.updateDomain - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.updateDomain - user not authenticated'
            )
        }

        const domain = await dataEngineService.updateDomain(req.params.id, req.body, req.user)
        return res.json(domain)
    } catch (error) {
        next(error)
    }
}

const deleteDomain = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.deleteDomain - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.deleteDomain - user not authenticated'
            )
        }

        const result = await dataEngineService.deleteDomain(req.params.id, req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    createDomain,
    getAllDomains,
    getDomainById,
    updateDomain,
    deleteDomain
}
```

**Create similar controllers for:**
- `packages/server/src/controllers/data-engine/urls/index.ts`
- `packages/server/src/controllers/data-engine/calls/index.ts`
- `packages/server/src/controllers/data-engine/tags/index.ts`
- `packages/server/src/controllers/data-engine/documents/index.ts`
- `packages/server/src/controllers/data-engine/tickets/index.ts`
- `packages/server/src/controllers/data-engine/chats/index.ts`

**Pattern is identical - just replace:**
- `Domain` → `Url`, `Call`, `Tag`, `Document`, `Ticket`, `Chat`
- `createDomain` → `createUrl`, `createCall`, etc.

### Step 4: Create Routes

**File:** `packages/server/src/routes/data-engine/domains.ts`

```typescript
import express from 'express'
import domainsController from '../../controllers/data-engine/domains'
import enforceAbility from '../../middlewares/authentication/enforceAbility'

const router = express.Router()

// All routes protected by API key authentication
router.post('/', enforceAbility('DataEngineDomain'), domainsController.createDomain)
router.get('/', enforceAbility('DataEngineDomain'), domainsController.getAllDomains)
router.get('/:id', enforceAbility('DataEngineDomain'), domainsController.getDomainById)
router.put('/:id', enforceAbility('DataEngineDomain'), domainsController.updateDomain)
router.delete('/:id', enforceAbility('DataEngineDomain'), domainsController.deleteDomain)

export default router
```

**Create similar route files for all resources:**
- `urls.ts`, `calls.ts`, `tags.ts`, `documents.ts`, `tickets.ts`, `chats.ts`

**Aggregate Routes File:** `packages/server/src/routes/data-engine/index.ts`

```typescript
import express from 'express'
import domainsRoutes from './domains'
import urlsRoutes from './urls'
import callsRoutes from './calls'
import tagsRoutes from './tags'
import documentsRoutes from './documents'
import ticketsRoutes from './tickets'
import chatsRoutes from './chats'

const router = express.Router()

// Mount all Data Engine routes
router.use('/domains', domainsRoutes)
router.use('/urls', urlsRoutes)
router.use('/calls', callsRoutes)
router.use('/tags', tagsRoutes)
router.use('/documents', documentsRoutes)
router.use('/tickets', ticketsRoutes)
router.use('/chats', chatsRoutes)

export default router
```

### Step 5: Register Routes in Main Server

**File:** `packages/server/src/index.ts`

Find the section where routes are registered (around line 200-300) and add:

```typescript
import dataEngineRoutes from './routes/data-engine'

// ... existing code ...

// Register Data Engine routes
app.use('/api/v1/data-engine', dataEngineRoutes)
```

---

## Testing Guide

### Manual Testing with curl

**Test Domain Creation:**
```bash
# Get your API key from TheAnswer UI
API_KEY="your-api-key-here"

# Create domain
curl -X POST http://localhost:3000/api/v1/data-engine/domains \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_name": "test.example.com",
    "is_valid": true,
    "meta_title": "Test Domain",
    "meta_description": "Testing integration"
  }'

# List domains
curl -X GET "http://localhost:3000/api/v1/data-engine/domains?page=0&pageSize=10" \
  -H "Authorization: Bearer $API_KEY"
```

### Unit Tests

**File:** `packages/server/test/data-engine/domains.test.ts`

```typescript
import request from 'supertest'
import { app } from '../../src/index'

describe('Data Engine - Domains API', () => {
    const TEST_API_KEY = process.env.TEST_API_KEY || 'test-key'

    describe('POST /api/v1/data-engine/domains', () => {
        it('should create a domain', async () => {
            const response = await request(app)
                .post('/api/v1/data-engine/domains')
                .set('Authorization', `Bearer ${TEST_API_KEY}`)
                .send({
                    domain_name: 'test.com',
                    is_valid: true,
                    meta_title: 'Test Domain'
                })
                .expect(201)

            expect(response.body).toHaveProperty('id')
            expect(response.body.domain_name).toBe('test.com')
            expect(response.body.custom_data).toHaveProperty('source_system', 'theanswer')
        })

        it('should reject request without API key', async () => {
            await request(app)
                .post('/api/v1/data-engine/domains')
                .send({ domain_name: 'test.com' })
                .expect(401)
        })
    })

    describe('GET /api/v1/data-engine/domains', () => {
        it('should list domains', async () => {
            const response = await request(app)
                .get('/api/v1/data-engine/domains')
                .set('Authorization', `Bearer ${TEST_API_KEY}`)
                .expect(200)

            expect(response.body).toHaveProperty('domains')
            expect(response.body).toHaveProperty('total')
            expect(response.body).toHaveProperty('page')
            expect(response.body).toHaveProperty('pageSize')
        })
    })
})
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] All environment variables set in Render
- [ ] BWS secret configured for `DATA_ENGINE_SERVICE_KEY`
- [ ] Service tested in staging environment
- [ ] API documentation updated
- [ ] Team trained on new endpoints

### Render Configuration

**Environment Variables:**
```
DATA_ENGINE_API_URL=https://data-sidekick-prod.onrender.com
DATA_ENGINE_SERVICE_KEY=${BWS_DATA_ENGINE_SERVICE_KEY}
```

### Build Command

No changes needed - uses existing Turbo build pipeline:
```bash
pnpm build
```

### Health Check

Add health check endpoint (optional):

**File:** `packages/server/src/controllers/data-engine/health/index.ts`

```typescript
import { Request, Response } from 'express'
import dataEngineService from '../../../services/data-engine'

export const healthCheck = async (req: Request, res: Response) => {
    try {
        // Test connection to Data Engine
        const testUser = {
            id: 'health-check',
            email: 'health@theanswer.ai',
            organizationId: 'health-check-org'
        } as any

        await dataEngineService.getAllTags({}, testUser)

        res.json({
            status: 'healthy',
            dataEngine: 'connected',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            dataEngine: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        })
    }
}
```

---

## Troubleshooting

### Common Issues

**1. Service Key Not Found**
```
Error: DATA_ENGINE_SERVICE_KEY is required
```
**Solution:** Add environment variable to `.env` or Render dashboard

**2. Connection Timeout**
```
Error: timeout of 30000ms exceeded
```
**Solution:** Check Data Engine is running and URL is correct

**3. Unauthorized from Data Engine**
```
Status: 401 - Service authentication required
```
**Solution:** Verify service keys match in both applications

**4. Organization Filter Not Working**
```
Returns data from all organizations
```
**Solution:** Ensure Data Engine is filtering by `organizationId` in queries

---

## Next Steps

1. **Complete implementation** following this guide
2. **Test locally** with curl commands
3. **Write unit tests** for each controller
4. **Deploy to staging** for integration testing
5. **Review** with team before production deployment

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Contact:** Development Team
