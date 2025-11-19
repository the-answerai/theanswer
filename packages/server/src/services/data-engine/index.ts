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
        // Base URL should include /api/external path
        const apiBase = process.env.DATA_ENGINE_API_URL || 'http://localhost:3001'
        this.baseURL = `${apiBase}/api/external`
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
        return this.request(
            'POST',
            '/tags',
            {
                ...data,
                metadata: this.buildMetadata(user, 'create')
            },
            user
        )
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
        return this.request(
            'PUT',
            `/tags/${id}`,
            {
                ...data,
                metadata: this.buildMetadata(user, 'update')
            },
            user
        )
    }

    async deleteTag(id: number, user: IUser) {
        return this.request('DELETE', `/tags/${id}`, null, user)
    }

    // ==================== DOCUMENTS ====================

    async createDocument(data: any, user: IUser) {
        return this.request(
            'POST',
            '/documents',
            {
                ...data,
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
        return this.request(
            'POST',
            '/documents/search',
            {
                query_embedding: queryEmbedding,
                match_threshold: matchThreshold,
                match_count: matchCount,
                ...(storeId && { store_id: storeId })
            },
            user!
        )
    }

    // ==================== TICKETS ====================

    async createTicket(data: any, user: IUser) {
        return this.request(
            'POST',
            '/tickets',
            {
                ...data,
                metadata: this.buildMetadata(user, 'create')
            },
            user
        )
    }

    async getAllTickets(query: any, user: IUser) {
        return this.request('GET', '/tickets', null, user, query)
    }

    async getTicketById(id: string, user: IUser) {
        return this.request('GET', `/tickets/${id}`, null, user)
    }

    async updateTicket(id: string, data: any, user: IUser) {
        return this.request(
            'PUT',
            `/tickets/${id}`,
            {
                ...data,
                metadata: this.buildMetadata(user, 'update')
            },
            user
        )
    }

    async deleteTicket(id: string, user: IUser) {
        return this.request('DELETE', `/tickets/${id}`, null, user)
    }

    // ==================== CHATS ====================

    async createChat(data: any, user: IUser) {
        return this.request(
            'POST',
            '/chats',
            {
                ...data,
                metadata: this.buildMetadata(user, 'create')
            },
            user
        )
    }

    async getAllChats(query: any, user: IUser) {
        return this.request('GET', '/chats', null, user, query)
    }

    async getChatById(id: string, user: IUser) {
        return this.request('GET', `/chats/${id}`, null, user)
    }

    async updateChat(id: string, data: any, user: IUser) {
        return this.request(
            'PUT',
            `/chats/${id}`,
            {
                ...data,
                metadata: this.buildMetadata(user, 'update')
            },
            user
        )
    }

    async deleteChat(id: string, user: IUser) {
        return this.request('DELETE', `/chats/${id}`, null, user)
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
                params: params, // Don't add organizationId - service key handles multi-tenancy
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
        const resource = parts[1] || 'resource' // /{resource}
        return resource.charAt(0).toUpperCase() + resource.slice(1)
    }
}

export default new DataEngineService()
