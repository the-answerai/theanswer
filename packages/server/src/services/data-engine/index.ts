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

    /**
     * Get authorization headers with M2M token and user context
     * Falls back to service key if M2M not configured (backward compatible)
     */
    private async getAuthHeaders(user?: IUser): Promise<Record<string, string>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }

        // Try M2M authentication first
        if (auth0M2MTokenManager.isEnabled()) {
            try {
                const token = await auth0M2MTokenManager.getAccessToken()
                headers['Authorization'] = `Bearer ${token}`
                console.log('[DataEngineService] Using M2M authentication')
            } catch (error) {
                console.warn('[DataEngineService] M2M authentication failed, falling back to service key')
                // Fall through to service key
                if (process.env.DATA_ENGINE_SERVICE_KEY) {
                    headers['X-Service-Key'] = process.env.DATA_ENGINE_SERVICE_KEY
                    console.log('[DataEngineService] Using service key authentication (fallback)')
                } else {
                    throw error // Re-throw if no fallback available
                }
            }
        } else if (process.env.DATA_ENGINE_SERVICE_KEY) {
            // Use service key if M2M not configured
            headers['X-Service-Key'] = process.env.DATA_ENGINE_SERVICE_KEY
            console.log('[DataEngineService] Using service key authentication')
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
        // Tickets don't have metadata with source_user_id
        return this.request('POST', '/tickets', data, user)
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

            console.log(`[DataEngineService] ${method} ${path} (org: ${user.organizationId})`)

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
        const resource = parts[1] || 'resource' // /{resource}
        return resource.charAt(0).toUpperCase() + resource.slice(1)
    }
}

export default new DataEngineService()
