import axios, { AxiosInstance, AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { IUser } from '../../Interface'
import { auth0M2MTokenManager } from './auth'

/**
 * Service for communicating with Data Engine (data-sidekick)
 * Uses Auth0 Machine-to-Machine authentication
 */
class DataEngineService {
    private client: AxiosInstance
    private baseURL: string

    constructor() {
        // Get base URL from environment or use default
        const apiBase = process.env.DATA_SIDEKICK_URL || process.env.DATA_ENGINE_API_URL || 'http://localhost:3001'
        this.baseURL = `${apiBase}/api/external`

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000
        })

        // ALWAYS log the base URL to verify where requests are going
        console.log(`[DataEngineService] ============================================`)
        console.log(`[DataEngineService] Initialized with baseURL: ${this.baseURL}`)
        console.log(`[DataEngineService] DATA_SIDEKICK_URL: ${process.env.DATA_SIDEKICK_URL}`)
        console.log(`[DataEngineService] DATA_ENGINE_API_URL: ${process.env.DATA_ENGINE_API_URL}`)
        console.log(`[DataEngineService] ============================================`)

        // Only log initialization details in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DataEngineService] Initialized with baseURL: ${this.baseURL}`)

            // Log authentication method
            if (auth0M2MTokenManager.isEnabled()) {
                console.log(`[DataEngineService] Auth: M2M (Auth0 Client Credentials)`)
            } else if (process.env.DATA_ENGINE_SERVICE_KEY) {
                console.log(`[DataEngineService] Auth: Service Key (backward compatible)`)
            } else {
                console.warn(`[DataEngineService] WARNING: No authentication configured! Requests will fail.`)
                console.warn(`[DataEngineService] Set either:`)
                console.warn(`[DataEngineService]   - DATA_SIDEKICK_CLIENT_ID + DATA_SIDEKICK_CLIENT_SECRET (M2M)`)
                console.warn(`[DataEngineService]   - DATA_ENGINE_SERVICE_KEY (legacy)`)
            }
        }
    }

    /**
     * Get authorization headers with M2M token and user context
     * Configurable fallback behavior for authentication failures
     */
    private async getAuthHeaders(user?: IUser): Promise<Record<string, string>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }

        // Configuration: should we fail or fallback on M2M error?
        const allowFallback = process.env.DATA_ENGINE_AUTH_ALLOW_FALLBACK !== 'false' // Default: true

        // Try M2M authentication first
        if (auth0M2MTokenManager.isEnabled()) {
            try {
                const token = await auth0M2MTokenManager.getAccessToken()
                headers['Authorization'] = `Bearer ${token}`
                // Auth success logging removed - was generating noise on every request
                // TODO: Integrate with metrics system for auth method tracking
            } catch (error) {
                // Log M2M failure for monitoring/alerts
                this.logAuthMethod('m2m', false, error)
                console.error('[DataEngineService] M2M authentication failed:', getErrorMessage(error))

                // Check if fallback is allowed
                if (!allowFallback) {
                    console.error('[DataEngineService] Fallback disabled (DATA_ENGINE_AUTH_ALLOW_FALLBACK=false), rejecting request')
                    throw new InternalFlowiseError(
                        StatusCodes.UNAUTHORIZED,
                        'Error: dataEngineService.getAuthHeaders - M2M authentication failed and fallback is disabled'
                    )
                }

                // Fall back to service key if configured
                if (process.env.DATA_ENGINE_SERVICE_KEY) {
                    console.warn('[DataEngineService] ⚠️  FALLBACK: Using service key authentication (M2M failed)')

                    // WARN in production - indicates M2M configuration issue
                    if (process.env.NODE_ENV === 'production') {
                        console.error(
                            '[DataEngineService] ⚠️  PRODUCTION WARNING: M2M authentication failed, falling back to service key. ' +
                                'This indicates a configuration issue and should be investigated immediately.'
                        )
                    }

                    headers['X-Service-Key'] = process.env.DATA_ENGINE_SERVICE_KEY
                } else {
                    // No fallback available
                    throw new InternalFlowiseError(
                        StatusCodes.UNAUTHORIZED,
                        'Error: dataEngineService.getAuthHeaders - M2M authentication failed and no service key available for fallback'
                    )
                }
            }
        } else if (process.env.DATA_ENGINE_SERVICE_KEY) {
            // Use service key if M2M not configured
            headers['X-Service-Key'] = process.env.DATA_ENGINE_SERVICE_KEY
            // Auth success logging removed - was generating noise on every request
        } else {
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Error: dataEngineService.getAuthHeaders - Neither M2M nor service key authentication configured. Set either DATA_SIDEKICK_CLIENT_ID/SECRET or DATA_ENGINE_SERVICE_KEY'
            )
        }

        // Add user context headers if user provided
        if (user) {
            headers['X-Organization-Id'] = user.organizationId
            headers['X-User-Id'] = user.id
            headers['X-User-Email'] = user.email || ''
        }

        return headers
    }

    /**
     * Log authentication method usage for monitoring and alerting
     * In production, this should integrate with your metrics/monitoring system
     */
    private logAuthMethod(method: string, success: boolean, error?: unknown): void {
        const logData = {
            timestamp: new Date().toISOString(),
            method,
            success,
            error: error ? getErrorMessage(error) : undefined
        }

        // Log to console (in production, send to monitoring system)
        if (success) {
            console.log('[DataEngineService] Auth Method:', logData)
        } else {
            console.error('[DataEngineService] Auth Method Failed:', logData)
        }

        // TODO: Integrate with metrics system (Prometheus, OpenTelemetry, etc.)
        // Example: metrics.counter('data_engine_auth', { method, success: success.toString() }).inc()
    }

    // ==================== DOMAINS ====================

    async createDomain(data: any, user: IUser) {
        return this.request(
            'POST',
            '/domains',
            {
                ...data,
                metadata: this.buildMetadata(user, 'create')
            },
            user
        )
    }

    async getAllDomains(query: any, user: IUser) {
        return this.request('GET', '/domains', null, user, query)
    }

    async getDomainById(id: string, user: IUser) {
        return this.request('GET', `/domains/${id}`, null, user)
    }

    async updateDomain(id: string, data: any, user: IUser) {
        return this.request(
            'PUT',
            `/domains/${id}`,
            {
                ...data,
                metadata: this.buildMetadata(user, 'update')
            },
            user
        )
    }

    async deleteDomain(id: string, user: IUser) {
        return this.request('DELETE', `/domains/${id}`, null, user)
    }

    // ==================== URLS ====================

    async createUrl(data: any, user: IUser) {
        return this.request(
            'POST',
            '/urls',
            {
                ...data,
                metadata: this.buildMetadata(user, 'create')
            },
            user
        )
    }

    async getAllUrls(query: any, user: IUser) {
        return this.request('GET', '/urls', null, user, query)
    }

    async getUrlById(id: string, user: IUser) {
        return this.request('GET', `/urls/${id}`, null, user)
    }

    async updateUrl(id: string, data: any, user: IUser) {
        return this.request(
            'PUT',
            `/urls/${id}`,
            {
                ...data,
                metadata: this.buildMetadata(user, 'update')
            },
            user
        )
    }

    async deleteUrl(id: string, user: IUser) {
        return this.request('DELETE', `/urls/${id}`, null, user)
    }

    // ==================== CALLS ====================

    async createCall(data: any, user: IUser) {
        return this.request(
            'POST',
            '/calls',
            {
                ...data,
                metadata: this.buildMetadata(user, 'create')
            },
            user
        )
    }

    async getAllCalls(query: any, user: IUser) {
        return this.request('GET', '/calls', null, user, query)
    }

    async getCallById(id: string, user: IUser) {
        return this.request('GET', `/calls/${id}`, null, user)
    }

    async updateCall(id: string, data: any, user: IUser) {
        return this.request(
            'PUT',
            `/calls/${id}`,
            {
                ...data,
                metadata: this.buildMetadata(user, 'update')
            },
            user
        )
    }

    async deleteCall(id: string, user: IUser) {
        return this.request('DELETE', `/calls/${id}`, null, user)
    }

    // ==================== TAGS ====================

    async createTag(data: any, user: IUser) {
        // Tags table doesn't have metadata column
        return this.request('POST', '/tags', data, user)
    }

    async getAllTags(query: any, user: IUser) {
        return this.request('GET', '/tags', null, user, query)
    }

    async getTagById(id: number, user: IUser) {
        return this.request('GET', `/tags/${id}`, null, user)
    }

    async getTagHierarchy(user: IUser) {
        return this.request('GET', '/tags/hierarchy', null, user)
    }

    async updateTag(id: number, data: any, user: IUser) {
        // Tags table doesn't have metadata column
        return this.request('PUT', `/tags/${id}`, data, user)
    }

    async deleteTag(id: number, user: IUser) {
        return this.request('DELETE', `/tags/${id}`, null, user)
    }

    // ==================== DOCUMENTS ====================

    async createDocument(data: any, user: IUser) {
        // Documents don't have store_id column, just pass through data with enhanced metadata
        const { store_id: _store_id, ...documentData } = data
        return this.request(
            'POST',
            '/documents',
            {
                ...documentData,
                metadata: {
                    ...(data.metadata || {}),
                    organization_id: user.organizationId,
                    created_by: user.email,
                    source_system: 'theanswer'
                }
            },
            user
        )
    }

    async getAllDocuments(query: any, user: IUser) {
        return this.request('GET', '/documents', null, user, query)
    }

    async getDocumentById(id: string, user: IUser) {
        return this.request('GET', `/documents/${id}`, null, user)
    }

    async updateDocument(id: string, data: any, user: IUser) {
        return this.request('PUT', `/documents/${id}`, data, user)
    }

    async deleteDocument(id: string, user: IUser) {
        return this.request('DELETE', `/documents/${id}`, null, user)
    }

    async searchDocuments(queryEmbedding: number[], matchThreshold: number = 0.7, matchCount: number = 10, storeId?: string, user?: IUser) {
        // Documents don't have store_id column
        return this.request(
            'POST',
            '/documents/search',
            {
                query_embedding: queryEmbedding,
                match_threshold: matchThreshold,
                match_count: matchCount
            },
            user!
        )
    }

    // ==================== TICKETS ====================

    async createTicket(data: any, user: IUser) {
        // Tickets have created_by as a direct field (not in metadata)
        // Automatically set from authenticated user
        const ticketData = {
            ...data,
            created_by: data.created_by || user.email || user.id
        }
        return this.request('POST', '/tickets', ticketData, user)
    }

    async getAllTickets(query: any, user: IUser) {
        return this.request('GET', '/tickets', null, user, query)
    }

    async getTicketById(id: string, user: IUser) {
        return this.request('GET', `/tickets/${id}`, null, user)
    }

    async updateTicket(id: string, data: any, user: IUser) {
        // Tickets don't have metadata structure
        return this.request('PUT', `/tickets/${id}`, data, user)
    }

    async deleteTicket(id: string, user: IUser) {
        return this.request('DELETE', `/tickets/${id}`, null, user)
    }

    // ==================== CHATS ====================

    async createChat(data: any, user: IUser) {
        // Chats don't have metadata structure
        return this.request('POST', '/chats', data, user)
    }

    async getAllChats(query: any, user: IUser) {
        return this.request('GET', '/chats', null, user, query)
    }

    async getChatById(id: string, user: IUser) {
        return this.request('GET', `/chats/${id}`, null, user)
    }

    async updateChat(id: string, data: any, user: IUser) {
        // Chats don't have metadata structure
        return this.request('PUT', `/chats/${id}`, data, user)
    }

    async deleteChat(id: string, user: IUser) {
        return this.request('DELETE', `/chats/${id}`, null, user)
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Generic request handler with M2M authentication
     */
    private async request(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        path: string,
        data: any = null,
        user: IUser,
        params: any = {}
    ): Promise<any> {
        try {
            // Get auth headers with M2M token + user context
            const headers = await this.getAuthHeaders(user)

            const config = {
                method,
                url: path,
                params,
                headers,
                ...(data && { data })
            }

            // Only log requests in non-production environments
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[DataEngineService] ${method} ${path} (org: ${user.organizationId})`)
            }

            const response = await this.client.request(config)

            // Validate multi-tenancy for responses
            this.validateMultiTenancy(response.data, user, method, path)

            return response.data
        } catch (error) {
            this.handleError(error, method, path)
        }
    }

    /**
     * Validate multi-tenancy for responses
     * Ensures Data Engine respects organizationId filtering
     */
    private validateMultiTenancy(responseData: any, user: IUser, method: string, path: string): void {
        if (!responseData || !user?.organizationId) {
            return
        }

        // For paginated responses with data array
        if (responseData.data && Array.isArray(responseData.data)) {
            const invalidItems = responseData.data.filter((item: any) => {
                // Check if item has organizationId in metadata or top-level
                const itemOrgId = item.metadata?.organization_id || item.organizationId || item.organization_id
                return itemOrgId && itemOrgId !== user.organizationId
            })

            if (invalidItems.length > 0) {
                console.error('[DataEngineService] Multi-tenancy violation detected:', {
                    method,
                    path,
                    expectedOrg: user.organizationId,
                    violatingItems: invalidItems.map((item: any) => ({
                        id: item.id,
                        orgId: item.metadata?.organization_id || item.organizationId || item.organization_id
                    }))
                })
                throw new InternalFlowiseError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Error: dataEngineService - Data Engine returned items from different organization'
                )
            }
        }
        // For single item responses
        else if (responseData.id) {
            const itemOrgId = responseData.metadata?.organization_id || responseData.organizationId || responseData.organization_id
            if (itemOrgId && itemOrgId !== user.organizationId) {
                console.error('[DataEngineService] Multi-tenancy violation detected:', {
                    method,
                    path,
                    expectedOrg: user.organizationId,
                    returnedOrg: itemOrgId,
                    itemId: responseData.id
                })
                throw new InternalFlowiseError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Error: dataEngineService - Data Engine returned item from different organization'
                )
            }
        }
        // For array responses without pagination wrapper
        else if (Array.isArray(responseData)) {
            const invalidItems = responseData.filter((item: any) => {
                const itemOrgId = item.metadata?.organization_id || item.organizationId || item.organization_id
                return itemOrgId && itemOrgId !== user.organizationId
            })

            if (invalidItems.length > 0) {
                console.error('[DataEngineService] Multi-tenancy violation detected:', {
                    method,
                    path,
                    expectedOrg: user.organizationId,
                    violatingCount: invalidItems.length
                })
                throw new InternalFlowiseError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Error: dataEngineService - Data Engine returned items from different organization'
                )
            }
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
     * Centralized error handling with sanitization
     */
    private handleError(error: unknown, method: string, path: string): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError

            // Extract status and message from response
            const status = axiosError.response?.status || StatusCodes.INTERNAL_SERVER_ERROR
            const errorData = axiosError.response?.data as any

            // Extract error message - try multiple fields and combine them
            let rawMessage = ''
            if (errorData?.details) {
                rawMessage = errorData.details
            } else if (errorData?.error) {
                rawMessage = errorData.error
            } else {
                rawMessage = axiosError.message
            }

            // Log full error details server-side for debugging
            console.error(`[DataEngineService] ${method} ${path} failed:`, {
                status,
                rawMessage,
                errorData,
                axiosMessage: axiosError.message
            })

            // Sanitize error message for client
            // Remove internal paths, stack traces, and sensitive data
            const clientMessage = this.sanitizeErrorMessage(rawMessage, status)

            throw new InternalFlowiseError(
                status,
                `Error: dataEngineService.${method.toLowerCase()}${this.getMethodName(path)} - ${clientMessage}`
            )
        }

        // Non-Axios errors
        console.error(`[DataEngineService] ${method} ${path} unexpected error:`, error)

        // Sanitize generic errors
        const clientMessage = this.sanitizeErrorMessage(getErrorMessage(error), StatusCodes.INTERNAL_SERVER_ERROR)

        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: dataEngineService.${method.toLowerCase()}${this.getMethodName(path)} - ${clientMessage}`
        )
    }

    /**
     * Sanitize error messages to prevent information leakage
     */
    private sanitizeErrorMessage(message: string, status: number): string {
        // Preserve helpful user-facing error messages
        const userFriendlyErrors = [
            'duplicate key value violates unique constraint',
            'already exists',
            'not found',
            'invalid input',
            'required field',
            'must be unique'
        ]

        // Check if this is a user-friendly error that should be preserved
        const isUserFriendly = userFriendlyErrors.some((pattern) => message.toLowerCase().includes(pattern))

        if (isUserFriendly) {
            // Keep the helpful error message but limit length
            if (message.length > 300) {
                message = message.substring(0, 300) + '...'
            }
            return message.trim()
        }

        // Production mode: return generic messages for internal errors
        if (process.env.NODE_ENV === 'production' && status >= 500) {
            return 'Internal server error occurred'
        }

        // Remove file paths
        message = message.replace(/\/[^\s]+\.(ts|js|json)/gi, '[file]')

        // Remove absolute paths
        message = message.replace(/[A-Z]:\\[\w\\-]+/gi, '[path]')
        message = message.replace(/\/[\w/-]+\/[\w/-]+/gi, '[path]')

        // Remove stack trace indicators
        message = message.replace(/at\s+[\w.]+\s+\([^)]+\)/gi, '')

        // Remove potential SQL/database errors with sensitive info
        message = message.replace(/Table\s+['"`][\w_]+['"`]/gi, 'Table [redacted]')
        message = message.replace(/Column\s+['"`][\w_]+['"`]/gi, 'Column [redacted]')

        // Limit message length
        if (message.length > 200) {
            message = message.substring(0, 200) + '...'
        }

        return message.trim()
    }

    /**
     * Extract method name from path for error messages
     */
    private getMethodName(path: string): string {
        const parts = path.split('/')
        const resource = parts[1] || 'resource' // /{resource}
        return resource.charAt(0).toUpperCase() + resource.slice(1)
    }
}

export default new DataEngineService()
