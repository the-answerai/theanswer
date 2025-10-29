import { omit } from 'lodash'
import { Document } from '@langchain/core/documents'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { IDocument, ICommonObject, INode, INodeData, INodeParams, INodeOutputsValue } from '../../../src/Interface'
import { handleEscapeCharacters } from '../../../src'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

class AAIUrls_DocumentLoaders implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    tags: string[]
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'AnswerAgentAI URLs'
        this.name = 'aaiUrls'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'answerai-square-black.png'
        this.category = 'Document Loaders'
        this.description = 'Load URL/page information from AnswerAgentAI Datastore'
        this.tags = ['AAI']
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Limit',
                name: 'limit',
                type: 'number',
                default: 100,
                description: 'Maximum number of URLs to load',
                optional: true
            },
            {
                label: 'Search Term',
                name: 'searchTerm',
                type: 'string',
                description: 'Search in URL, domain name, page title, and description',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include Tags',
                name: 'includeTags',
                type: 'string',
                placeholder: 'blog,product_page',
                description: 'Comma-separated list of tag slugs to include',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include Tags Logic',
                name: 'includeTagsLogic',
                type: 'options',
                options: [
                    {
                        label: 'OR (any tag matches)',
                        name: 'OR'
                    },
                    {
                        label: 'AND (all tags must match)',
                        name: 'AND'
                    }
                ],
                default: 'OR',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Exclude Tags',
                name: 'excludeTags',
                type: 'string',
                placeholder: 'error_page,404',
                description: 'Comma-separated list of tag slugs to exclude',
                optional: true,
                additionalParams: true
            },
            {
                label: 'HTTP Status Filter',
                name: 'statusFilter',
                type: 'string',
                placeholder: 'success,redirect',
                description:
                    'Comma-separated list of status categories (success, redirect, client_error, server_error, unknown) or specific codes (200, 404, etc.)',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Has Analysis',
                name: 'hasAnalysis',
                type: 'options',
                options: [
                    {
                        label: 'All',
                        name: 'all'
                    },
                    {
                        label: 'Analyzed Only',
                        name: 'analyzed'
                    },
                    {
                        label: 'Not Analyzed',
                        name: 'not_analyzed'
                    }
                ],
                default: 'all',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include AI Analysis in Content',
                name: 'includeAiAnalysis',
                type: 'boolean',
                default: true,
                description: 'Include full AI analysis markdown in page content',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description:
                    'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ]
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const limit = nodeData.inputs?.limit as number
        const searchTerm = nodeData.inputs?.searchTerm as string
        const includeTags = nodeData.inputs?.includeTags as string
        const includeTagsLogic = (nodeData.inputs?.includeTagsLogic as string) || 'OR'
        const excludeTags = nodeData.inputs?.excludeTags as string
        const statusFilter = nodeData.inputs?.statusFilter as string
        const hasAnalysis = (nodeData.inputs?.hasAnalysis as string) || 'all'
        const includeAiAnalysis = nodeData.inputs?.includeAiAnalysis !== false
        const metadata = nodeData.inputs?.metadata
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const output = nodeData.outputs?.output as string

        let omitMetadataKeys: string[] = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }

        // Validate inputs
        if (limit !== undefined && limit !== null) {
            if (limit <= 0) {
                throw new Error('Limit must be a positive number')
            }
            if (!Number.isInteger(limit)) {
                throw new Error('Limit must be an integer')
            }
        }

        if (includeTagsLogic && !['OR', 'AND'].includes(includeTagsLogic)) {
            throw new Error('Include Tags Logic must be either "OR" or "AND"')
        }

        if (statusFilter) {
            const validCategories = ['success', 'redirect', 'client_error', 'server_error', 'informational', 'unknown']
            const statusFilters = statusFilter.split(',').map((s) => s.trim())
            for (const filter of statusFilters) {
                // Check if it's a valid category or a valid HTTP status code (100-599)
                const isCategory = validCategories.includes(filter)
                const isNumeric = /^\d+$/.test(filter)
                const statusCode = isNumeric ? parseInt(filter, 10) : null

                if (!isCategory && (!isNumeric || statusCode === null || statusCode < 100 || statusCode > 599)) {
                    throw new Error(
                        `Invalid status filter "${filter}". Must be one of: ${validCategories.join(', ')}, or a valid HTTP status code (100-599)`
                    )
                }
            }
        }

        if (hasAnalysis && !['all', 'analyzed', 'not_analyzed'].includes(hasAnalysis)) {
            throw new Error('Has Analysis must be one of: "all", "analyzed", "not_analyzed"')
        }

        // Get environment variables
        const supabaseUrl = process.env.AAI_DATASTORE_SUPABASE_URL
        const supabaseKey = process.env.AAI_DATASTORE_SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                'AAI Datastore configuration missing. Please set AAI_DATASTORE_SUPABASE_URL and AAI_DATASTORE_SUPABASE_SERVICE_ROLE_KEY environment variables.'
            )
        }

        const loaderOptions: AAIUrlsLoaderParams = {
            supabaseUrl,
            supabaseKey,
            limit: limit || 100,
            searchTerm: searchTerm || null,
            includeTags: includeTags ? includeTags.split(',').map((t) => t.trim()) : [],
            includeTagsLogic,
            excludeTags: excludeTags ? excludeTags.split(',').map((t) => t.trim()) : [],
            statusFilter: statusFilter ? statusFilter.split(',').map((s) => s.trim()) : [],
            hasAnalysis,
            includeAiAnalysis
        }

        const loader = new AAIUrlsLoader(loaderOptions)

        let docs: IDocument[] = []

        if (textSplitter) {
            docs = await loader.load()
            docs = await textSplitter.splitDocuments(docs)
        } else {
            docs = await loader.load()
        }

        // Apply metadata
        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata)
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {
                              ...parsedMetadata
                          }
                        : omit(
                              {
                                  ...doc.metadata,
                                  ...parsedMetadata
                              },
                              omitMetadataKeys
                          )
            }))
        } else {
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {}
                        : omit(
                              {
                                  ...doc.metadata
                              },
                              omitMetadataKeys
                          )
            }))
        }

        if (output === 'text') {
            let finalText = ''
            for (const doc of docs) {
                finalText += `${doc.pageContent}\n`
            }
            return handleEscapeCharacters(finalText, false)
        }

        return docs
    }
}

interface AAIUrlsLoaderParams {
    supabaseUrl: string
    supabaseKey: string
    limit: number
    searchTerm: string | null
    includeTags: string[]
    includeTagsLogic: string
    excludeTags: string[]
    statusFilter: string[]
    hasAnalysis: string
    includeAiAnalysis: boolean
}

class AAIUrlsLoader extends BaseDocumentLoader {
    private supabaseUrl: string
    private supabaseKey: string
    private limit: number
    private searchTerm: string | null
    private includeTags: string[]
    private includeTagsLogic: string
    private excludeTags: string[]
    private statusFilter: string[]
    private hasAnalysis: string
    private includeAiAnalysis: boolean

    constructor(params: AAIUrlsLoaderParams) {
        super()
        this.supabaseUrl = params.supabaseUrl
        this.supabaseKey = params.supabaseKey
        this.limit = params.limit
        this.searchTerm = params.searchTerm
        this.includeTags = params.includeTags
        this.includeTagsLogic = params.includeTagsLogic
        this.excludeTags = params.excludeTags
        this.statusFilter = params.statusFilter
        this.hasAnalysis = params.hasAnalysis
        this.includeAiAnalysis = params.includeAiAnalysis
    }

    public async load(): Promise<IDocument[]> {
        const supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey, {
            global: {
                fetch: (...args) => {
                    const [resource, config] = args
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 60000)

                    return fetch(resource, {
                        ...config,
                        signal: controller.signal
                    }).finally(() => clearTimeout(timeoutId))
                }
            }
        })

        // Use larger page size since we're only selecting essential fields
        const pageSize = Math.min(this.limit, 100)
        let allUrls: any[] = []
        let currentPage = 0

        console.log('[AAIUrls] Starting load with params:', {
            limit: this.limit,
            searchTerm: this.searchTerm,
            includeTags: this.includeTags,
            statusFilter: this.statusFilter,
            hasAnalysis: this.hasAnalysis
        })

        while (allUrls.length < this.limit) {
            const remainingItems = this.limit - allUrls.length
            const currentPageSize = Math.min(pageSize, remainingItems)

            console.log(`[AAIUrls] Fetching page ${currentPage}, size ${currentPageSize}`)

            // Retry logic with exponential backoff
            let retryCount = 0
            const maxRetries = 3
            let lastError: any = null
            let shouldStopPagination = false

            while (retryCount < maxRetries) {
                try {
                    // Build query with only essential fields (exclude heavy JSONB history fields)
                    // NOTE: We explicitly exclude: ai_analysis_overrides, ai_analysis_history,
                    // override_metadata, source_metadata which can be multi-MB per record
                    let query = supabase
                        .from('urls')
                        .select(
                            `
                            id,
                            url,
                            domain_name,
                            domain_id,
                            http_status,
                            status_text,
                            content_type,
                            page_title,
                            meta_description,
                            canonical_url,
                            custom_data,
                            ai_analysis,
                            created_at,
                            updated_at,
                            processed_at,
                            first_seen_at,
                            last_crawled_at,
                            last_analyzed_at,
                            analysis_version,
                            url_tags(
                                tag_id,
                                tags(id, slug, label, color, parent_id)
                            )
                        `
                        )
                        .order('updated_at', { ascending: false })
                        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)

                    // Apply filters
                    if (this.searchTerm) {
                        query = query.or(
                            `url.ilike.%${this.searchTerm}%,domain_name.ilike.%${this.searchTerm}%,page_title.ilike.%${this.searchTerm}%,meta_description.ilike.%${this.searchTerm}%`
                        )
                    }

                    if (this.hasAnalysis === 'analyzed') {
                        query = query.not('ai_analysis', 'is', null)
                    } else if (this.hasAnalysis === 'not_analyzed') {
                        query = query.is('ai_analysis', null)
                    }

                    // Apply HTTP status filter
                    if (this.statusFilter.length > 0) {
                        const statusClauses = this.statusFilter.map((filter) => {
                            if (filter === 'success') return 'http_status.gte.200,http_status.lt.300'
                            if (filter === 'redirect') return 'http_status.gte.300,http_status.lt.400'
                            if (filter === 'client_error') return 'http_status.gte.400,http_status.lt.500'
                            if (filter === 'server_error') return 'http_status.gte.500'
                            if (filter === 'informational') return 'http_status.gte.100,http_status.lt.200'
                            if (filter === 'unknown') return 'http_status.is.null'
                            // Specific status code
                            return `http_status.eq.${filter}`
                        })

                        if (statusClauses.length > 0) {
                            query = query.or(statusClauses.join(','))
                        }
                    }

                    const { data, error } = await query

                    if (error) {
                        console.error('[AAIUrls] Query error:', error)
                        throw new Error(`Failed to fetch URLs from AAI Datastore: ${error.message}`)
                    }

                    console.log(`[AAIUrls] Page ${currentPage} response:`, {
                        hasData: !!data,
                        urlsCount: data?.length || 0
                    })

                    if (!data || data.length === 0) {
                        console.log('[AAIUrls] No more data, stopping pagination')
                        shouldStopPagination = true
                        break
                    }

                    // Transform url_tags array to flat tags array
                    const urlsWithTags = data.map((url: any) => ({
                        ...url,
                        tags: url.url_tags?.map((ut: any) => ut.tags).filter(Boolean) || []
                    }))

                    // Apply tag filtering if specified
                    let filteredUrls = urlsWithTags
                    if (this.includeTags.length > 0 || this.excludeTags.length > 0) {
                        filteredUrls = this.filterByTags(urlsWithTags)
                    }

                    allUrls.push(...filteredUrls)
                    currentPage++

                    // Stop if we've fetched enough
                    if (allUrls.length >= this.limit || data.length < currentPageSize) {
                        shouldStopPagination = true
                        break
                    }

                    // Success - break out of retry loop
                    break
                } catch (error: any) {
                    lastError = error
                    retryCount++

                    if (retryCount < maxRetries) {
                        const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000)
                        console.warn(
                            `[AAIUrls] Request failed (attempt ${retryCount}/${maxRetries}), retrying in ${delayMs}ms...`,
                            error.message
                        )
                        await new Promise((resolve) => setTimeout(resolve, delayMs))
                    } else {
                        console.error(`[AAIUrls] All ${maxRetries} retry attempts failed`)
                        throw lastError
                    }
                }
            }

            // If we got no data, hit the limit, or all retries failed, break out of pagination loop
            if (shouldStopPagination || retryCount >= maxRetries) {
                break
            }

            // Add small delay between successful pages to avoid overwhelming the server
            await new Promise((resolve) => setTimeout(resolve, 200))
        }

        console.log(`[AAIUrls] Load complete. Total URLs: ${allUrls.length}`)

        // Truncate to exact limit
        if (allUrls.length > this.limit) {
            allUrls = allUrls.slice(0, this.limit)
        }

        return allUrls.map((url) => this.createDocumentFromUrl(url))
    }

    private filterByTags(urls: any[]): any[] {
        return urls.filter((url) => {
            const urlTagSlugs = url.tags?.map((t: any) => t.slug) || []

            // Apply include tags filter
            if (this.includeTags.length > 0) {
                if (this.includeTagsLogic === 'AND') {
                    const hasAllTags = this.includeTags.every((tag) => urlTagSlugs.includes(tag))
                    if (!hasAllTags) return false
                } else {
                    const hasAnyTag = this.includeTags.some((tag) => urlTagSlugs.includes(tag))
                    if (!hasAnyTag) return false
                }
            }

            // Apply exclude tags filter
            if (this.excludeTags.length > 0) {
                const hasExcludedTag = this.excludeTags.some((tag) => urlTagSlugs.includes(tag))
                if (hasExcludedTag) return false
            }

            return true
        })
    }

    private formatAiAnalysisAsMarkdown(aiAnalysis: any): string {
        if (!aiAnalysis || Object.keys(aiAnalysis).length === 0) {
            return ''
        }

        const sections: string[] = ['## AI Analysis', '']

        // Summary
        if (aiAnalysis.summary) {
            sections.push('### Summary', aiAnalysis.summary, '')
        }

        // Content Summary
        if (aiAnalysis.content_summary) {
            sections.push('### Content Summary', aiAnalysis.content_summary, '')
        }

        // Category/Type
        if (aiAnalysis.category || aiAnalysis.content_type) {
            sections.push('### Classification', '')
            if (aiAnalysis.category) {
                sections.push(`**Category:** ${aiAnalysis.category}`)
            }
            if (aiAnalysis.content_type) {
                sections.push(`**Content Type:** ${aiAnalysis.content_type}`)
            }
            sections.push('')
        }

        // Topics
        if (aiAnalysis.topics) {
            sections.push('### Topics', '')
            if (Array.isArray(aiAnalysis.topics)) {
                aiAnalysis.topics.forEach((topic: string) => {
                    sections.push(`- ${topic}`)
                })
            } else if (typeof aiAnalysis.topics === 'string') {
                sections.push(aiAnalysis.topics)
            }
            sections.push('')
        }

        // Key Points/Insights
        if (aiAnalysis.key_points || aiAnalysis.key_insights) {
            sections.push('### Key Points', '')
            const points = aiAnalysis.key_points || aiAnalysis.key_insights
            if (Array.isArray(points)) {
                points.forEach((point: string) => {
                    sections.push(`- ${point}`)
                })
            }
            sections.push('')
        }

        // Confidence Score
        if (aiAnalysis.confidence_score) {
            sections.push(`**Confidence Score:** ${aiAnalysis.confidence_score}`, '')
        }

        // Additional fields (catch-all)
        const knownFields = [
            'summary',
            'content_summary',
            'category',
            'content_type',
            'topics',
            'key_points',
            'key_insights',
            'confidence_score',
            'analysis_version'
        ]
        const additionalFields = Object.keys(aiAnalysis).filter((key) => !knownFields.includes(key))

        if (additionalFields.length > 0) {
            sections.push('### Additional Information', '')
            additionalFields.forEach((key) => {
                const value = aiAnalysis[key]
                if (value && typeof value !== 'object') {
                    sections.push(`**${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:** ${value}`)
                } else if (value && typeof value === 'object') {
                    sections.push(`**${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:**`)
                    sections.push('```json')
                    sections.push(JSON.stringify(value, null, 2))
                    sections.push('```')
                }
            })
        }

        return sections.filter(Boolean).join('\n')
    }

    private createDocumentFromUrl(url: any): Document {
        // Extract custom data and AI analysis
        const customData = url.custom_data || {}
        const aiAnalysis = url.ai_analysis || {}

        // Format AI analysis as markdown if requested
        const aiAnalysisMarkdown = this.includeAiAnalysis ? this.formatAiAnalysisAsMarkdown(aiAnalysis) : ''

        // Create page content with proper markdown formatting
        const pageContent = [
            `# ${url.page_title || url.url}`,
            '',
            `**URL:** ${url.url}`,
            url.domain_name ? `**Domain:** ${url.domain_name}` : '',
            url.http_status ? `**Status:** ${url.http_status}` : '',
            '',
            url.meta_description ? url.meta_description : '',
            '',
            aiAnalysisMarkdown
        ]
            .filter(Boolean)
            .join('\n')

        // Build comprehensive metadata
        const metadata: ICommonObject = {
            // Core fields
            id: url.id,
            url: url.url,
            domain_name: url.domain_name,
            domain_id: url.domain_id,
            http_status: url.http_status,
            status_text: url.status_text,
            content_type: url.content_type,
            page_title: url.page_title,
            meta_description: url.meta_description,
            canonical_url: url.canonical_url,

            // Custom data (spread all custom fields)
            ...customData,

            // AI analysis
            ai_summary: aiAnalysis.summary,
            ai_category: aiAnalysis.category,
            ai_content_type: aiAnalysis.content_type,
            ai_topics: aiAnalysis.topics,
            ai_confidence: aiAnalysis.confidence_score,

            // Tags
            tags: url.tags || [],
            tag_slugs: (url.tags || []).map((t: any) => t.slug).filter(Boolean),
            tag_labels: (url.tags || []).map((t: any) => t.label).filter(Boolean),

            // Timestamps (ISO strings)
            created_at: url.created_at,
            updated_at: url.updated_at,
            processed_at: url.processed_at,
            first_seen_at: url.first_seen_at,
            last_crawled_at: url.last_crawled_at,
            last_analyzed_at: url.last_analyzed_at,
            analysis_version: url.analysis_version,

            // Timestamps (Unix timestamps in seconds for Pinecone numeric filters)
            created_at_timestamp: url.created_at ? Math.floor(new Date(url.created_at).getTime() / 1000) : null,
            updated_at_timestamp: url.updated_at ? Math.floor(new Date(url.updated_at).getTime() / 1000) : null,
            processed_at_timestamp: url.processed_at ? Math.floor(new Date(url.processed_at).getTime() / 1000) : null,
            first_seen_at_timestamp: url.first_seen_at ? Math.floor(new Date(url.first_seen_at).getTime() / 1000) : null,
            last_crawled_at_timestamp: url.last_crawled_at ? Math.floor(new Date(url.last_crawled_at).getTime() / 1000) : null,
            last_analyzed_at_timestamp: url.last_analyzed_at ? Math.floor(new Date(url.last_analyzed_at).getTime() / 1000) : null,

            // Source
            source: 'aai_datastore',
            source_type: 'url'
        }

        // Remove undefined/null values
        Object.keys(metadata).forEach((key) => {
            if (metadata[key] === undefined || metadata[key] === null) {
                delete metadata[key]
            }
        })

        return new Document({
            pageContent,
            metadata
        })
    }
}

module.exports = {
    nodeClass: AAIUrls_DocumentLoaders
}
