import { omit } from 'lodash'
import { Document } from '@langchain/core/documents'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { IDocument, ICommonObject, INode, INodeData, INodeParams, INodeOutputsValue } from '../../../src/Interface'
import { handleEscapeCharacters } from '../../../src'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

class AAITranscripts_DocumentLoaders implements INode {
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
        this.label = 'AnswerAgentAI Transcripts'
        this.name = 'aaiTranscripts'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'answerai-square-black.png'
        this.category = 'Document Loaders'
        this.description = 'Load call transcripts from AnswerAgentAI Datastore'
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
                description: 'Maximum number of transcripts to load',
                optional: true
            },
            {
                label: 'Search Term',
                name: 'searchTerm',
                type: 'string',
                description: 'Search in transcript and summary',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Date From',
                name: 'dateFrom',
                type: 'string',
                placeholder: '2025-01-01',
                description: 'Filter calls from this date (ISO format: YYYY-MM-DD)',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Date To',
                name: 'dateTo',
                type: 'string',
                placeholder: '2025-12-31',
                description: 'Filter calls to this date (ISO format: YYYY-MM-DD)',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include Tags',
                name: 'includeTags',
                type: 'string',
                placeholder: 'positive_sentiment,product_inquiry',
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
                placeholder: 'spam,test_call',
                description: 'Comma-separated list of tag slugs to exclude',
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
                label: 'Sentiment Min',
                name: 'sentimentMin',
                type: 'number',
                placeholder: '1',
                description: 'Minimum sentiment score (1-10)',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Sentiment Max',
                name: 'sentimentMax',
                type: 'number',
                placeholder: '10',
                description: 'Maximum sentiment score (1-10)',
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
        const dateFrom = nodeData.inputs?.dateFrom as string
        const dateTo = nodeData.inputs?.dateTo as string
        const includeTags = nodeData.inputs?.includeTags as string
        const includeTagsLogic = (nodeData.inputs?.includeTagsLogic as string) || 'OR'
        const excludeTags = nodeData.inputs?.excludeTags as string
        const hasAnalysis = (nodeData.inputs?.hasAnalysis as string) || 'all'
        const sentimentMin = nodeData.inputs?.sentimentMin as number
        const sentimentMax = nodeData.inputs?.sentimentMax as number
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

        if (dateFrom) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/
            if (!datePattern.test(dateFrom)) {
                throw new Error('Date From must be in ISO format (YYYY-MM-DD)')
            }
            const parsedDate = new Date(dateFrom)
            if (isNaN(parsedDate.getTime())) {
                throw new Error('Date From is not a valid date')
            }
        }

        if (dateTo) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/
            if (!datePattern.test(dateTo)) {
                throw new Error('Date To must be in ISO format (YYYY-MM-DD)')
            }
            const parsedDate = new Date(dateTo)
            if (isNaN(parsedDate.getTime())) {
                throw new Error('Date To is not a valid date')
            }
        }

        if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom)
            const toDate = new Date(dateTo)
            if (fromDate > toDate) {
                throw new Error('Date From must be before or equal to Date To')
            }
        }

        if (sentimentMin !== undefined && sentimentMin !== null) {
            if (typeof sentimentMin !== 'number' || isNaN(sentimentMin)) {
                throw new Error('Sentiment Min must be a number')
            }
            if (sentimentMin < 1 || sentimentMin > 10) {
                throw new Error('Sentiment Min must be between 1 and 10')
            }
        }

        if (sentimentMax !== undefined && sentimentMax !== null) {
            if (typeof sentimentMax !== 'number' || isNaN(sentimentMax)) {
                throw new Error('Sentiment Max must be a number')
            }
            if (sentimentMax < 1 || sentimentMax > 10) {
                throw new Error('Sentiment Max must be between 1 and 10')
            }
        }

        if (
            sentimentMin !== undefined &&
            sentimentMin !== null &&
            sentimentMax !== undefined &&
            sentimentMax !== null &&
            sentimentMin > sentimentMax
        ) {
            throw new Error('Sentiment Min cannot be greater than Sentiment Max')
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

        const loaderOptions: AAITranscriptsLoaderParams = {
            supabaseUrl,
            supabaseKey,
            limit: limit || 100,
            searchTerm: searchTerm || null,
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            includeTags: includeTags ? includeTags.split(',').map((t) => t.trim()) : [],
            includeTagsLogic,
            excludeTags: excludeTags ? excludeTags.split(',').map((t) => t.trim()) : [],
            hasAnalysis,
            sentimentMin: sentimentMin || null,
            sentimentMax: sentimentMax || null
        }

        const loader = new AAITranscriptsLoader(loaderOptions)

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

interface AAITranscriptsLoaderParams {
    supabaseUrl: string
    supabaseKey: string
    limit: number
    searchTerm: string | null
    dateFrom: string | null
    dateTo: string | null
    includeTags: string[]
    includeTagsLogic: string
    excludeTags: string[]
    hasAnalysis: string
    sentimentMin: number | null
    sentimentMax: number | null
}

class AAITranscriptsLoader extends BaseDocumentLoader {
    private supabaseUrl: string
    private supabaseKey: string
    private limit: number
    private searchTerm: string | null
    private dateFrom: string | null
    private dateTo: string | null
    private includeTags: string[]
    private includeTagsLogic: string
    private excludeTags: string[]
    private hasAnalysis: string
    private sentimentMin: number | null
    private sentimentMax: number | null

    constructor(params: AAITranscriptsLoaderParams) {
        super()
        this.supabaseUrl = params.supabaseUrl
        this.supabaseKey = params.supabaseKey
        this.limit = params.limit
        this.searchTerm = params.searchTerm
        this.dateFrom = params.dateFrom
        this.dateTo = params.dateTo
        this.includeTags = params.includeTags
        this.includeTagsLogic = params.includeTagsLogic
        this.excludeTags = params.excludeTags
        this.hasAnalysis = params.hasAnalysis
        this.sentimentMin = params.sentimentMin
        this.sentimentMax = params.sentimentMax
    }

    public async load(): Promise<IDocument[]> {
        const supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey)

        // Calculate pagination
        const pageSize = Math.min(this.limit, 1000) // Max 1000 per request
        const totalPages = Math.ceil(this.limit / pageSize)

        let allCalls: any[] = []

        for (let page = 0; page < totalPages; page++) {
            const remainingItems = this.limit - allCalls.length
            const currentPageSize = Math.min(pageSize, remainingItems)

            const { data, error } = await supabase.rpc('filter_calls_v1', {
                page,
                page_size: currentPageSize,
                search_term: this.searchTerm,
                include_tags: {
                    tags: this.includeTags,
                    logic: this.includeTagsLogic
                },
                exclude_tags: {
                    tags: this.excludeTags,
                    logic: 'OR'
                },
                date_from: this.dateFrom,
                date_to: this.dateTo,
                has_analysis: this.hasAnalysis,
                sentiment_min: this.sentimentMin,
                sentiment_max: this.sentimentMax,
                custom_filters: {}
            })

            if (error) {
                throw new Error(`Failed to fetch transcripts from AAI Datastore: ${error.message}`)
            }

            if (!data || !data.calls) {
                break
            }

            allCalls.push(...data.calls)

            // Stop if we've fetched enough or no more results
            if (allCalls.length >= this.limit || data.calls.length < currentPageSize) {
                break
            }
        }

        // Truncate to exact limit
        if (allCalls.length > this.limit) {
            allCalls = allCalls.slice(0, this.limit)
        }

        return allCalls.map((call) => this.createDocumentFromCall(call))
    }

    private createDocumentFromCall(call: any): Document {
        // Extract custom data fields
        const customData = call.custom_data || {}
        const aiAnalysis = call.ai_analysis || {}

        // Create page content from transcript or summary
        const pageContent = call.transcript || call.summary || ''

        // Build comprehensive metadata
        const metadata: ICommonObject = {
            // Core fields
            id: call.id,
            recording_url: call.recording_url,
            duration: call.duration,
            call_datetime: call.call_datetime,
            sentiment_score: call.sentiment_score,

            // Custom data fields
            employee_name: customData.employee_name,
            employee_id: customData.employee_id,
            caller_name: customData.caller_name,
            call_number: customData.call_number,
            call_type: customData.call_type,
            answered_by: customData.answered_by,
            escalated: customData.escalated,
            resolution_status: customData.resolution_status,

            // AI analysis fields
            confidence_score: aiAnalysis.confidence_score,
            analysis_version: aiAnalysis.analysis_version,

            // Tags
            tags: call.tags || [],
            tag_slugs: (call.tags || []).map((t: any) => t.slug).filter(Boolean),
            tag_labels: (call.tags || []).map((t: any) => t.label).filter(Boolean),

            // Timestamps (ISO strings)
            created_at: call.created_at,
            updated_at: call.updated_at,
            last_analyzed_at: call.last_analyzed_at,

            // Timestamps (Unix timestamps in seconds for Pinecone numeric filters)
            call_datetime_timestamp: call.call_datetime ? Math.floor(new Date(call.call_datetime).getTime() / 1000) : null,
            created_at_timestamp: call.created_at ? Math.floor(new Date(call.created_at).getTime() / 1000) : null,
            updated_at_timestamp: call.updated_at ? Math.floor(new Date(call.updated_at).getTime() / 1000) : null,
            last_analyzed_at_timestamp: call.last_analyzed_at ? Math.floor(new Date(call.last_analyzed_at).getTime() / 1000) : null,

            // Source
            source: 'aai_datastore',
            source_type: 'transcript'
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
    nodeClass: AAITranscripts_DocumentLoaders
}
