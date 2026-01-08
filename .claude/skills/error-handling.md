---
name: error-handling
description: InternalFlowiseError patterns and error message formatting
---

# Error Handling Patterns

Complete reference for error handling in TheAnswer codebase. This document covers 22 discovered patterns from the actual codebase.

## 1. InternalFlowiseError Class

The custom error class used throughout the server:

```typescript
// Location: packages/server/src/errors/internalFlowiseError/index.ts
export class InternalFlowiseError extends Error {
    statusCode: number
    constructor(statusCode: number, message: string) {
        super(message)
        this.statusCode = statusCode
        Error.captureStackTrace(this, this.constructor)
    }
}
```

**Import:**
```typescript
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
```

## 2. Error Message Format Standard

**Pattern:** `Error: {serviceName}.{methodName} - {description}`

```
Error: chatflowService.getChatflowById - Chatflow abc123 not found
       └── service     └── method        └── description
```

**Examples:**
```typescript
// Controller errors
'Error: resourceController.createResource - body not provided!'
'Error: resourceController.getResourceById - id not provided!'
'Error: resourceController.updateResource - Unauthorized'

// Service errors
'Error: chatflowService.getChatflowById - Chatflow abc123 not found'
'Error: resourceService.createResource - Failed to save resource'
'Error: FiddlerGuardrailsService.post - Connection failed'
```

## 3. Complete StatusCodes Reference

| Code | Constant | When to Use |
|------|----------|-------------|
| 400 | `BAD_REQUEST` | Invalid input format, validation failures, external API errors |
| 401 | `UNAUTHORIZED` | Missing/invalid authentication, ownership check failed |
| 403 | `FORBIDDEN` | Valid auth but operation not permitted (e.g., cloud-only features) |
| 404 | `NOT_FOUND` | Resource doesn't exist in database |
| 408 | `REQUEST_TIMEOUT` | Polling/long operation exceeded time limit |
| 409 | `CONFLICT` | Duplicate entry, constraint violation |
| 412 | `PRECONDITION_FAILED` | Required parameter missing |
| 422 | `UNPROCESSABLE_ENTITY` | Semantic validation error (valid format, invalid meaning) |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error, wrapped external errors |
| 502 | `BAD_GATEWAY` | External service returned error or download failed |
| 503 | `SERVICE_UNAVAILABLE` | Circuit breaker open, service temporarily unavailable |

## 4. Service-Level Pattern (Standard Try/Catch)

The most common pattern for service methods:

```typescript
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'

const getResourceById = async (id: string, user?: IUser): Promise<Resource> => {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Resource)

        const resource = await repository.findOne({ where: { id } })

        if (!resource) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: resourceService.getResourceById - Resource ${id} not found`
            )
        }

        return resource
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: resourceService.getResourceById - ${getErrorMessage(error)}`
        )
    }
}
```

## 5. Controller-Level Pattern

Controllers validate, call services, check ownership, and pass errors to middleware:

```typescript
const getResourceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Parameter validation → PRECONDITION_FAILED
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: resourceController.getResourceById - id not provided!'
            )
        }

        // 2. User context check → UNAUTHORIZED
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: resourceController.getResourceById - user not authenticated'
            )
        }

        // 3. Call service (let errors propagate)
        const resource = await resourceService.getResourceById(req.params.id, req.user)

        // 4. Ownership check → UNAUTHORIZED
        if (req.user && !(await checkOwnership(resource, req.user, req))) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: resourceController.getResourceById - Unauthorized'
            )
        }

        return res.json(resource)
    } catch (error) {
        next(error)  // Pass to error middleware
    }
}
```

## 6. Re-throw Pattern (Preserve Status Code)

When catching errors, preserve `InternalFlowiseError` status codes:

```typescript
const createPrediction = async (data: any, user: IUser) => {
    try {
        // ... operations that may throw InternalFlowiseError
        return dbResponse
    } catch (error) {
        // Re-throw InternalFlowiseError to preserve status code
        if (error instanceof InternalFlowiseError) {
            throw error
        }
        // Wrap unknown errors
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: predictionsService.createPrediction - ${getErrorMessage(error)}`
        )
    }
}
```

**Selective re-throw (specific status codes):**
```typescript
} catch (error) {
    // Re-throw NOT_FOUND errors specifically
    if (error instanceof InternalFlowiseError && error.statusCode === StatusCodes.NOT_FOUND) {
        throw error
    }
    throw new InternalFlowiseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error: organizationService.getOrganization - ${getErrorMessage(error)}`
    )
}
```

## 7. Graceful Degradation Pattern (Log and Continue)

For non-critical operations that shouldn't block the main flow:

```typescript
try {
    await nonCriticalOperation()
} catch (error) {
    logger.error('Error in non-critical operation:', error)
    // Continue without throwing - don't break main flow
}
```

**Example from billing service:**
```typescript
try {
    await billingService.syncUsage(params)
} catch (error) {
    logger.warn('Failed to sync usage, continuing:', error)
    // Usage sync failure shouldn't block the request
}
```

## 8. Fail-Open Pattern

Returns null/default on error, allowing main request to complete. Used for optional features:

```typescript
// Location: FiddlerGuardrailsService
public static async initialize(user: IUser): Promise<FiddlerGuardrailsService | null> {
    try {
        const config = await this.loadConfig(user.organizationId!)
        if (!config.enabled) {
            return null
        }

        const credentials = await this.loadCredentials(user.organizationId!, config)
        if (!credentials) {
            console.warn(`Guardrails enabled but no credentials found`)
            return null
        }

        return new FiddlerGuardrailsService(credentials, config)
    } catch (error) {
        // Fail-open: log error but don't throw
        console.error('Error initializing Fiddler Guardrails (fail-open):', error)
        return null
    }
}
```

**Input validation fail-open:**
```typescript
public async validateInput(text: string): Promise<InputValidationResult> {
    try {
        const [safetyResult, piiResult] = await Promise.all([
            this.evaluateSafety(text),
            this.detectPII(text)
        ])
        // ... process results
    } catch (error) {
        // Fail-open: on error, allow the input to pass through
        return {
            safetyResult: { dimensions: [], violations: [], isUnsafe: false },
            piiResult: { detections: [], hasPII: false },
            blocked: false,
            redacted: false,
            violations: {}
        }
    }
}
```

## 9. Circuit Breaker Pattern

Prevents cascading failures with external services:

```typescript
private async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    fallback?: () => T
): Promise<T> {
    // Check if circuit allows execution
    if (!this.circuitBreaker.canExecute()) {
        if (fallback) {
            return fallback()
        }
        throw new InternalFlowiseError(
            StatusCodes.SERVICE_UNAVAILABLE,
            'Error: FiddlerGuardrailsService - Circuit breaker is open'
        )
    }

    try {
        const result = await operation()
        this.circuitBreaker.recordSuccess()
        return result
    } catch (error) {
        this.circuitBreaker.recordFailure()

        // Use fallback if available
        if (fallback) {
            return fallback()
        }
        throw error
    }
}
```

**Usage with fallback:**
```typescript
const apiResponse = await this.executeWithCircuitBreaker(
    async () => {
        return await this.post<SafetyAPIResponse>('/v3/guardrails/ftl-safety', data)
    },
    (): SafetyAPIResponse => {
        // Fallback returns safe defaults
        return { fdl_harmful: 0, fdl_violent: 0 /* ... */ }
    }
)
```

## 10. Promise.all Error Handling

Promise.all fails fast on first rejection:

```typescript
// Parallel checks - fails if any check throws
const [safetyResult, piiResult] = await Promise.all([
    this.evaluateSafety(text),
    this.detectPII(text)
])
```

**Wrap in try/catch at caller level:**
```typescript
try {
    const results = await Promise.all(promises)
    // Process results
} catch (error) {
    throw new InternalFlowiseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error: batchService.processAll - ${getErrorMessage(error)}`
    )
}
```

## 11. Partial Failure Pattern

Returns available data even if some operations fail:

```typescript
const getAllWithOptionalData = async (id: string) => {
    const resource = await getResourceById(id)  // Required - will throw if fails

    // Optional enrichment - failures don't block
    let metadata: Record<string, any> | undefined
    try {
        metadata = await fetchMetadata(id)
    } catch (e) {
        logger.warn('Failed to fetch metadata:', e)
        // metadata stays undefined
    }

    return { ...resource, metadata }
}
```

## 12. JSON Parsing Errors

Always wrap JSON.parse with error handling:

```typescript
try {
    const content = await fs.promises.readFile(packagejsonPath, 'utf8')
    const parsedContent = JSON.parse(content)
    return { version: parsedContent.version }
} catch (error) {
    throw new InternalFlowiseError(
        StatusCodes.NOT_FOUND,
        `Version not found - ${getErrorMessage(error)}`
    )
}
```

**With default fallback:**
```typescript
const parseJsonSafely = (jsonString: string, defaultValue: any = {}) => {
    try {
        return JSON.parse(jsonString)
    } catch (e) {
        logger.warn('Failed to parse JSON, using default:', { error: e })
        return defaultValue
    }
}
```

## 13. Database Constraint Validation

Pre-validate before database operations to provide better errors:

```typescript
const createResource = async (data: CreateResourceDto, user: IUser) => {
    // Pre-validate for duplicates
    const existing = await repository.findOne({
        where: { name: data.name, organizationId: user.organizationId }
    })

    if (existing) {
        throw new InternalFlowiseError(
            StatusCodes.BAD_REQUEST,
            `Error: resourceService.createResource - Resource with name "${data.name}" already exists`
        )
    }

    // Now safe to create
    return await repository.save(newResource)
}
```

**Import validation:**
```typescript
for (const data of newVariables) {
    if (data.id && !validate(data.id)) {
        throw new InternalFlowiseError(
            StatusCodes.PRECONDITION_FAILED,
            `Error: importVariables - invalid id!`
        )
    }
}
```

## 14. External Service Timeouts

Different status codes for different timeout scenarios:

```typescript
// Polling timeout (REQUEST_TIMEOUT)
while (!current.done) {
    if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new InternalFlowiseError(
            StatusCodes.REQUEST_TIMEOUT,
            'Timed out waiting for video generation to complete'
        )
    }
    attempts += 1
    await delay(POLL_INTERVAL_MS)
    current = await checkStatus(jobId)
}

// External service returned error (BAD_REQUEST)
if (!response.ok) {
    const message = await response.text()
    throw new InternalFlowiseError(
        StatusCodes.BAD_REQUEST,
        `External API error: ${message}`
    )
}

// Download/gateway failure (BAD_GATEWAY)
if (!downloadResponse.ok) {
    throw new InternalFlowiseError(
        StatusCodes.BAD_GATEWAY,
        `Failed to download from external service: ${downloadResponse.status}`
    )
}
```

## 15. Streaming Error Handling

Don't send error response when streaming is active:

```typescript
// Location: packages/server/src/middlewares/errors/index.ts
async function errorHandlerMiddleware(
    err: InternalFlowiseError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR

    // Transform user-facing messages
    if (err.message.includes('401 Incorrect API key provided')) {
        err.message = '401 Invalid model key or Incorrect local model configuration.'
    }

    const displayedError = {
        statusCode,
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    }

    // Only send JSON response if NOT streaming
    if (!req.body || !req.body.streaming || req.body.streaming === 'false') {
        res.setHeader('Content-Type', 'application/json')
        res.status(displayedError.statusCode).json(displayedError)
    }
    // For streaming requests, error is handled differently
}
```

## 16. Global Error Handler Middleware

The middleware that catches all errors:

```typescript
// Location: packages/server/src/middlewares/errors/index.ts
async function errorHandlerMiddleware(
    err: InternalFlowiseError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR

    // Map API key errors to user-friendly messages
    if (err.message.includes('401 Incorrect API key provided')) {
        err.message = '401 Invalid model key or Incorrect local model configuration.'
    }

    const displayedError = {
        statusCode,
        success: false,
        message: err.message,
        // Stack trace only in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    }

    if (!req.body?.streaming || req.body.streaming === 'false') {
        res.setHeader('Content-Type', 'application/json')
        res.status(displayedError.statusCode).json(displayedError)
    }
}
```

## 17. Axios Error Handling

Special handling for HTTP client errors:

```typescript
private async post<T>(endpoint: string, data: any): Promise<T> {
    try {
        const response = await this.client.post<T>(endpoint, data)
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError
            throw new InternalFlowiseError(
                axiosError.response?.status || StatusCodes.INTERNAL_SERVER_ERROR,
                `Error: FiddlerGuardrailsService.post - ${getErrorMessage(error)}`
            )
        }
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: FiddlerGuardrailsService.post - ${getErrorMessage(error)}`
        )
    }
}
```

## 18. getErrorMessage Utility

Safely extracts error message from any error type:

```typescript
// Location: packages/server/src/errors/utils.ts
type ErrorWithMessage = { message: string }

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    )
}

const toErrorWithMessage = (maybeError: unknown): ErrorWithMessage => {
    if (isErrorWithMessage(maybeError)) return maybeError

    try {
        return new Error(JSON.stringify(maybeError))
    } catch {
        // Handle circular references
        return new Error(String(maybeError))
    }
}

export const getErrorMessage = (error: unknown) => {
    return toErrorWithMessage(error).message
}
```

## 19. Feature Flag Errors (FORBIDDEN)

For features disabled by configuration or platform:

```typescript
const createVariable = async (data: any, user: IUser) => {
    // Check platform restrictions
    if (process.env.CLOUD_PLATFORM === 'true') {
        throw new InternalFlowiseError(
            StatusCodes.FORBIDDEN,
            'Cloud platform does not support runtime variables!'
        )
    }

    // Proceed with creation
    return await repository.save(newVariable)
}
```

## 20. Validation Array Errors (BAD_REQUEST)

Detailed validation for array inputs:

```typescript
const validateIntegrations = async (integrations: any) => {
    if (!Array.isArray(integrations)) {
        throw new InternalFlowiseError(
            StatusCodes.BAD_REQUEST,
            'Integrations must be an array'
        )
    }

    for (const integration of integrations) {
        if (typeof integration !== 'object' || integration === null) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                'Each integration must be an object'
            )
        }

        if (!integration.label || typeof integration.label !== 'string') {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                'Integration label is required and must be a non-empty string'
            )
        }

        if (typeof integration.enabled !== 'boolean') {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                'Integration enabled must be a boolean'
            )
        }
    }
}
```

## 21. Logging with Error Context

Log errors with context before throwing:

```typescript
const attachPaymentMethod = async (params: AttachPaymentMethodParams) => {
    try {
        const billingService = new BillingService()
        return await billingService.attachPaymentMethod(params)
    } catch (error) {
        // Log with context for debugging
        logger.error('Error attaching payment method:', error)

        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to attach payment method: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}
```

## 22. Chained Credential Errors

Sequential checks with specific NOT_FOUND messages:

```typescript
const getVectorStore = async (credentialId: string) => {
    // Check credential exists
    const credential = await credentialRepository.findOne({ where: { id: credentialId } })
    if (!credential) {
        throw new InternalFlowiseError(
            StatusCodes.NOT_FOUND,
            `Credential ${credentialId} not found in the database!`
        )
    }

    // Check credential has required field
    const credentialData = await decryptCredentialData(credential.encryptedData)
    if (!credentialData.apiKey) {
        throw new InternalFlowiseError(
            StatusCodes.NOT_FOUND,
            `OpenAI ApiKey not found`
        )
    }

    // Continue with valid credentials...
}
```

## Security Best Practices

### Never Expose Internal Details

```typescript
// WRONG: Exposes database structure
throw new InternalFlowiseError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    `SQL error at column "organizationId" - ${error.stack}`
)

// CORRECT: Generic message with wrapped error
throw new InternalFlowiseError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    `Error: resourceService.create - ${getErrorMessage(error)}`
)
```

### Never Expose Credentials

```typescript
// WRONG: Exposes API key in error
throw new Error(`Failed to connect with key: ${apiKey}`)

// CORRECT: Generic connection error
throw new InternalFlowiseError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'Error: externalService.connect - Connection failed'
)
```

## Error Handling Checklist

Before committing code, verify:

- [ ] All errors use `InternalFlowiseError`
- [ ] Error messages follow format: `Error: {service}.{method} - {description}`
- [ ] Appropriate status codes used (see reference table)
- [ ] External errors wrapped with `getErrorMessage()`
- [ ] No sensitive data in error messages
- [ ] Controllers pass errors to `next(error)`
- [ ] InternalFlowiseError re-thrown to preserve status codes
- [ ] Fail-open patterns used for non-critical features
- [ ] Streaming requests don't get JSON error responses
