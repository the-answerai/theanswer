/**
 * TypeScript interfaces for Data Engine API resources
 * These interfaces provide type safety for requests and responses
 */

export interface IMetadata {
    source_system?: string
    source_organization_id?: string
    source_user_id?: string
    created_by?: string
    last_updated_by?: string
    last_updated_from?: string
    [key: string]: any // Allow additional custom fields
}

// ==================== DOMAINS ====================

export interface ICreateDomainRequest {
    domain_name: string
    is_valid?: boolean
    meta_title?: string
    meta_description?: string
    custom_data?: Record<string, any>
    metadata?: IMetadata
}

export interface IUpdateDomainRequest {
    meta_title?: string
    meta_description?: string
    is_valid?: boolean
    custom_data?: Record<string, any>
    metadata?: IMetadata
}

export interface IDomain {
    id: string
    domain_name: string
    is_valid: boolean
    meta_title?: string
    meta_description?: string
    custom_data?: Record<string, any>
    metadata?: IMetadata
    created_at: string
    updated_at: string
}

export interface IGetDomainsQuery {
    page?: number
    pageSize?: number
    searchTerm?: string
    isValid?: boolean
    hasAnalysis?: boolean
}

// ==================== URLS ====================

export interface ICreateUrlRequest {
    domain_id: string
    domain_name: string
    url: string
    http_status?: number
    status_text?: string
    content_type?: string
    page_title?: string
    meta_description?: string
    canonical_url?: string
    custom_data?: Record<string, any>
    metadata?: IMetadata
}

export interface IUpdateUrlRequest {
    page_title?: string
    meta_description?: string
    http_status?: number
    status_text?: string
    content_type?: string
    canonical_url?: string
    custom_data?: Record<string, any>
    metadata?: IMetadata
}

export interface IUrl {
    id: string
    domain_id: string
    domain_name: string
    url: string
    http_status: number
    status_text?: string
    content_type?: string
    page_title?: string
    meta_description?: string
    canonical_url?: string
    custom_data?: Record<string, any>
    metadata?: IMetadata
    created_at: string
    updated_at: string
}

export interface IGetUrlsQuery {
    page?: number
    pageSize?: number
    statusFilter?: number[]
    domainId?: string
}

// ==================== CALLS ====================

export interface ITranscriptSegment {
    speaker: string
    text: string
    timestamp: number
}

export interface ITranscriptJson {
    speakers: string[]
    segments: ITranscriptSegment[]
}

export interface IAiAnalysis {
    topics?: string[]
    intent?: string
    [key: string]: any
}

export interface IAiCoaching {
    suggestions?: string[]
    [key: string]: any
}

export interface ICreateCallRequest {
    transcript?: string
    transcript_json?: ITranscriptJson
    recording_url?: string
    duration?: number
    call_datetime?: string
    sentiment_score?: number
    summary?: string
    custom_data?: Record<string, any>
    ai_analysis?: IAiAnalysis
    ai_coaching?: IAiCoaching
    metadata?: IMetadata
}

export interface IUpdateCallRequest {
    transcript?: string
    transcript_json?: ITranscriptJson
    recording_url?: string
    duration?: number
    call_datetime?: string
    sentiment_score?: number
    summary?: string
    custom_data?: Record<string, any>
    ai_analysis?: IAiAnalysis
    ai_coaching?: IAiCoaching
    metadata?: IMetadata
}

export interface ICall {
    id: string
    transcript?: string
    transcript_json?: ITranscriptJson
    recording_url?: string
    duration?: number
    call_datetime?: string
    sentiment_score?: number
    summary?: string
    custom_data?: Record<string, any>
    ai_analysis?: IAiAnalysis
    ai_coaching?: IAiCoaching
    metadata?: IMetadata
    created_at: string
    updated_at: string
}

export interface IGetCallsQuery {
    page?: number
    pageSize?: number
    sentimentMin?: number
    sentimentMax?: number
    hasTranscript?: boolean
    dateFrom?: string
    dateTo?: string
}

// ==================== TAGS ====================

export interface ICreateTagRequest {
    slug: string
    label: string
    description?: string
    color?: string
    shade?: string
    parent_id?: number | null
}

export interface IUpdateTagRequest {
    slug?: string
    label?: string
    description?: string
    color?: string
    shade?: string
    parent_id?: number | null
}

export interface ITag {
    id: number
    slug: string
    label: string
    description?: string
    color?: string
    shade?: string
    parent_id?: number | null
    children?: ITag[]
    created_at: string
    updated_at: string
}

// ==================== DOCUMENTS ====================

export interface ICreateDocumentRequest {
    content: string
    embedding?: number[]
    metadata?: IMetadata
}

export interface IUpdateDocumentRequest {
    content?: string
    embedding?: number[]
    metadata?: IMetadata
}

export interface IDocument {
    id: string
    content: string
    embedding?: number[]
    metadata?: IMetadata
    created_at: string
    updated_at: string
}

export interface IGetDocumentsQuery {
    page?: number
    pageSize?: number
}

export interface ISearchDocumentsRequest {
    query_embedding: number[]
    match_threshold?: number
    match_count?: number
}

// ==================== TICKETS ====================

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketType = 'email' | 'phone' | 'chat' | 'other'

export interface ICreateTicketRequest {
    title: string
    description?: string
    status?: TicketStatus
    priority?: TicketPriority
    ticket_type?: TicketType
    assigned_to?: string
    escalated?: boolean
    tags_array?: string[]
    created_by: string // Required field
}

export interface IUpdateTicketRequest {
    title?: string
    description?: string
    status?: TicketStatus
    priority?: TicketPriority
    ticket_type?: TicketType
    assigned_to?: string
    escalated?: boolean
    tags_array?: string[]
}

export interface ITicket {
    id: string
    title: string
    description?: string
    status: TicketStatus
    priority: TicketPriority
    ticket_type?: TicketType
    assigned_to?: string
    escalated: boolean
    tags_array?: string[]
    created_by: string
    created_at: string
    updated_at: string
}

export interface IGetTicketsQuery {
    page?: number
    pageSize?: number
    status?: TicketStatus
    escalated?: boolean
    tags?: string[]
}

// ==================== CHATS ====================

export type ResolutionStatus = 'pending' | 'in_progress' | 'resolved' | 'escalated'

export interface ICreateChatRequest {
    chatbot_name: string
    ai_model?: string
    conversation_id?: string
    user_message: string
    bot_response: string // Note: Data Engine may use different field name
    sentiment_score?: number
    resolution_status?: ResolutionStatus
    tags_array?: string[]
}

export interface IUpdateChatRequest {
    sentiment_score?: number
    resolution_status?: ResolutionStatus
    tags_array?: string[]
}

export interface IChat {
    id: string
    chatbot_name: string
    ai_model?: string
    conversation_id?: string
    user_message: string
    bot_response: string
    sentiment_score?: number
    resolution_status?: ResolutionStatus
    tags_array?: string[]
    created_at: string
    updated_at: string
}

export interface IGetChatsQuery {
    page?: number
    pageSize?: number
    chatbotName?: string
    aiModel?: string
    sentimentMin?: number
}

// ==================== COMMON TYPES ====================

export interface IPaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
}
