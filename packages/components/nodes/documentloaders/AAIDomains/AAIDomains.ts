import { omit } from 'lodash'
import { Document } from '@langchain/core/documents'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { IDocument, ICommonObject, INode, INodeData, INodeParams, INodeOutputsValue } from '../../../src/Interface'
import { handleEscapeCharacters } from '../../../src'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

class AAIDomains_DocumentLoaders implements INode {
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
        this.label = 'AnswerAgentAI Domains'
        this.name = 'aaiDomains'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'answerai-square-black.png'
        this.category = 'Document Loaders'
        this.description = 'Load domain information from AnswerAgentAI Datastore'
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
                description: 'Maximum number of domains to load',
                optional: true
            },
            {
                label: 'Search Term',
                name: 'searchTerm',
                type: 'string',
                description: 'Search in domain name, meta title, and description',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include Tags',
                name: 'includeTags',
                type: 'string',
                placeholder: 'ecommerce,saas',
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
                placeholder: 'spam,parked',
                description: 'Comma-separated list of tag slugs to exclude',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Is Valid',
                name: 'isValid',
                type: 'options',
                options: [
                    {
                        label: 'All',
                        name: 'all'
                    },
                    {
                        label: 'Valid Only',
                        name: 'true'
                    },
                    {
                        label: 'Invalid Only',
                        name: 'false'
                    },
                    {
                        label: 'Unknown',
                        name: 'null'
                    }
                ],
                default: 'all',
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
        const isValid = (nodeData.inputs?.isValid as string) || 'all'
        const hasAnalysis = (nodeData.inputs?.hasAnalysis as string) || 'all'
        const includeAiAnalysis = nodeData.inputs?.includeAiAnalysis !== false
        const metadata = nodeData.inputs?.metadata
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const output = nodeData.outputs?.output as string

        let omitMetadataKeys: string[] = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }

        // Get environment variables
        const supabaseUrl = process.env.AAI_DATASTORE_SUPABASE_URL
        const supabaseKey = process.env.AAI_DATASTORE_SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                'AAI Datastore configuration missing. Please set AAI_DATASTORE_SUPABASE_URL and AAI_DATASTORE_SUPABASE_SERVICE_ROLE_KEY environment variables.'
            )
        }

        // Convert 'all' to null for RPC function (per API spec)
        const isValidFilter = isValid === 'all' ? null : isValid

        const loaderOptions: AAIDomainsLoaderParams = {
            supabaseUrl,
            supabaseKey,
            limit: limit || 100,
            searchTerm: searchTerm || null,
            includeTags: includeTags ? includeTags.split(',').map((t) => t.trim()) : [],
            includeTagsLogic,
            excludeTags: excludeTags ? excludeTags.split(',').map((t) => t.trim()) : [],
            isValid: isValidFilter,
            hasAnalysis,
            includeAiAnalysis
        }

        const loader = new AAIDomainsLoader(loaderOptions)

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

interface AAIDomainsLoaderParams {
    supabaseUrl: string
    supabaseKey: string
    limit: number
    searchTerm: string | null
    includeTags: string[]
    includeTagsLogic: string
    excludeTags: string[]
    isValid: string | null
    hasAnalysis: string
    includeAiAnalysis: boolean
}

class AAIDomainsLoader extends BaseDocumentLoader {
    private supabaseUrl: string
    private supabaseKey: string
    private limit: number
    private searchTerm: string | null
    private includeTags: string[]
    private includeTagsLogic: string
    private excludeTags: string[]
    private isValid: string | null
    private hasAnalysis: string
    private includeAiAnalysis: boolean

    constructor(params: AAIDomainsLoaderParams) {
        super()
        this.supabaseUrl = params.supabaseUrl
        this.supabaseKey = params.supabaseKey
        this.limit = params.limit
        this.searchTerm = params.searchTerm
        this.includeTags = params.includeTags
        this.includeTagsLogic = params.includeTagsLogic
        this.excludeTags = params.excludeTags
        this.isValid = params.isValid
        this.hasAnalysis = params.hasAnalysis
        this.includeAiAnalysis = params.includeAiAnalysis
    }

    public async load(): Promise<IDocument[]> {
        const supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey, {
            global: {
                fetch: (...args) => {
                    const [resource, config] = args
                    // Set 60 second timeout for RPC calls
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
        let allDomains: any[] = []
        let currentPage = 0

        console.log('[AAIDomains] Starting load with params:', {
            limit: this.limit,
            searchTerm: this.searchTerm,
            includeTags: this.includeTags,
            includeTagsLogic: this.includeTagsLogic,
            excludeTags: this.excludeTags,
            isValid: this.isValid,
            hasAnalysis: this.hasAnalysis
        })

        while (allDomains.length < this.limit) {
            const remainingItems = this.limit - allDomains.length
            const currentPageSize = Math.min(pageSize, remainingItems)

            console.log(`[AAIDomains] Fetching page ${currentPage}, size ${currentPageSize}`)

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
                        .from('domains')
                        .select(
                            `
                            id,
                            domain_name,
                            is_valid,
                            meta_title,
                            meta_description,
                            robots_txt,
                            sitemaps,
                            custom_data,
                            ai_analysis,
                            created_at,
                            updated_at,
                            last_analyzed_at,
                            domain_tags(
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
                            `domain_name.ilike.%${this.searchTerm}%,meta_title.ilike.%${this.searchTerm}%,meta_description.ilike.%${this.searchTerm}%`
                        )
                    }

                    if (this.isValid !== null) {
                        if (this.isValid === 'true') {
                            query = query.eq('is_valid', true)
                        } else if (this.isValid === 'false') {
                            query = query.eq('is_valid', false)
                        } else if (this.isValid === 'null') {
                            query = query.is('is_valid', null)
                        }
                    }

                    if (this.hasAnalysis === 'analyzed') {
                        query = query.not('ai_analysis', 'is', null)
                    } else if (this.hasAnalysis === 'not_analyzed') {
                        query = query.is('ai_analysis', null)
                    }

                    const { data, error } = await query

                    if (error) {
                        console.error('[AAIDomains] Query error:', error)
                        throw new Error(`Failed to fetch domains from AAI Datastore: ${error.message}`)
                    }

                    console.log(`[AAIDomains] Page ${currentPage} response:`, {
                        hasData: !!data,
                        domainsCount: data?.length || 0
                    })

                    if (!data || data.length === 0) {
                        console.log('[AAIDomains] No more data, stopping pagination')
                        shouldStopPagination = true
                        break
                    }

                    // Transform domain_tags array to flat tags array
                    const domainsWithTags = data.map((domain: any) => ({
                        ...domain,
                        tags: domain.domain_tags?.map((dt: any) => dt.tags).filter(Boolean) || []
                    }))

                    // Apply tag filtering if specified
                    let filteredDomains = domainsWithTags
                    if (this.includeTags.length > 0 || this.excludeTags.length > 0) {
                        filteredDomains = this.filterByTags(domainsWithTags)
                    }

                    allDomains.push(...filteredDomains)
                    currentPage++

                    // Stop if we've fetched enough
                    if (allDomains.length >= this.limit || data.length < currentPageSize) {
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
                            `[AAIDomains] Request failed (attempt ${retryCount}/${maxRetries}), retrying in ${delayMs}ms...`,
                            error.message
                        )
                        await new Promise((resolve) => setTimeout(resolve, delayMs))
                    } else {
                        console.error(`[AAIDomains] All ${maxRetries} retry attempts failed`)
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

        console.log(`[AAIDomains] Load complete. Total domains: ${allDomains.length}`)

        // Truncate to exact limit
        if (allDomains.length > this.limit) {
            allDomains = allDomains.slice(0, this.limit)
        }

        return allDomains.map((domain) => this.createDocumentFromDomain(domain))
    }

    private filterByTags(domains: any[]): any[] {
        return domains.filter((domain) => {
            const domainTagSlugs = domain.tags?.map((t: any) => t.slug) || []

            // Apply include tags filter
            if (this.includeTags.length > 0) {
                if (this.includeTagsLogic === 'AND') {
                    // Domain must have ALL include tags
                    const hasAllTags = this.includeTags.every((tag) => domainTagSlugs.includes(tag))
                    if (!hasAllTags) return false
                } else {
                    // Domain must have AT LEAST ONE include tag (OR logic)
                    const hasAnyTag = this.includeTags.some((tag) => domainTagSlugs.includes(tag))
                    if (!hasAnyTag) return false
                }
            }

            // Apply exclude tags filter
            if (this.excludeTags.length > 0) {
                // Exclude if domain has ANY of the exclude tags (OR logic for exclusion)
                const hasExcludedTag = this.excludeTags.some((tag) => domainTagSlugs.includes(tag))
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

        // Category/Industry
        if (aiAnalysis.category || aiAnalysis.industry) {
            sections.push('### Classification', '')
            if (aiAnalysis.category) {
                sections.push(`**Category:** ${aiAnalysis.category}`)
            }
            if (aiAnalysis.industry) {
                sections.push(`**Industry:** ${aiAnalysis.industry}`)
            }
            sections.push('')
        }

        // Key Insights
        if (aiAnalysis.key_insights) {
            sections.push('### Key Insights', '')
            if (Array.isArray(aiAnalysis.key_insights)) {
                aiAnalysis.key_insights.forEach((insight: string) => {
                    sections.push(`- ${insight}`)
                })
            } else if (typeof aiAnalysis.key_insights === 'string') {
                sections.push(aiAnalysis.key_insights)
            }
            sections.push('')
        }

        // Technologies/Features
        if (aiAnalysis.technologies || aiAnalysis.features) {
            sections.push('### Technical Details', '')
            if (aiAnalysis.technologies) {
                const techs = Array.isArray(aiAnalysis.technologies) ? aiAnalysis.technologies.join(', ') : aiAnalysis.technologies
                sections.push(`**Technologies:** ${techs}`)
            }
            if (aiAnalysis.features) {
                const feats = Array.isArray(aiAnalysis.features) ? aiAnalysis.features.join(', ') : aiAnalysis.features
                sections.push(`**Features:** ${feats}`)
            }
            sections.push('')
        }

        // Confidence Score
        if (aiAnalysis.confidence_score) {
            sections.push(`**Confidence Score:** ${aiAnalysis.confidence_score}`, '')
        }

        // Additional fields (catch-all for any other properties)
        const knownFields = [
            'summary',
            'category',
            'industry',
            'key_insights',
            'technologies',
            'features',
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

    private createDocumentFromDomain(domain: any): Document {
        // Extract custom data and AI analysis
        const customData = domain.custom_data || {}
        const aiAnalysis = domain.ai_analysis || {}

        // Format AI analysis as markdown if requested
        const aiAnalysisMarkdown = this.includeAiAnalysis ? this.formatAiAnalysisAsMarkdown(aiAnalysis) : ''

        // Create page content from meta description or domain analysis
        const pageContent = [
            `# ${domain.domain_name}`,
            '',
            domain.meta_title ? `## ${domain.meta_title}` : '',
            domain.meta_description ? `${domain.meta_description}` : '',
            '',
            aiAnalysisMarkdown
        ]
            .filter(Boolean)
            .join('\n')

        // Build comprehensive metadata
        const metadata: ICommonObject = {
            // Core fields
            id: domain.id,
            domain_name: domain.domain_name,
            is_valid: domain.is_valid,

            // Custom data (spread all custom fields)
            ...customData,

            // AI analysis
            ai_summary: aiAnalysis.summary,
            ai_category: aiAnalysis.category,
            ai_industry: aiAnalysis.industry,
            ai_confidence: aiAnalysis.confidence_score,

            // Tags
            tags: domain.tags || [],
            tag_slugs: (domain.tags || []).map((t: any) => t.slug).filter(Boolean),
            tag_labels: (domain.tags || []).map((t: any) => t.label).filter(Boolean),

            // Timestamps (ISO strings)
            created_at: domain.created_at,
            updated_at: domain.updated_at,
            last_analyzed_at: domain.last_analyzed_at,

            // Timestamps (Unix timestamps in seconds for Pinecone numeric filters)
            created_at_timestamp: domain.created_at ? Math.floor(new Date(domain.created_at).getTime() / 1000) : null,
            updated_at_timestamp: domain.updated_at ? Math.floor(new Date(domain.updated_at).getTime() / 1000) : null,
            last_analyzed_at_timestamp: domain.last_analyzed_at ? Math.floor(new Date(domain.last_analyzed_at).getTime() / 1000) : null,

            // Source
            source: 'aai_datastore',
            source_type: 'domain'
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
    nodeClass: AAIDomains_DocumentLoaders
}
