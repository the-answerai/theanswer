import { omit } from 'lodash'
import { Document } from '@langchain/core/documents'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { IDocument, ICommonObject, INode, INodeData, INodeParams, INodeOutputsValue } from '../../../src/Interface'
import { handleEscapeCharacters } from '../../../src'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

class AAITags_DocumentLoaders implements INode {
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
        this.label = 'AnswerAgentAI Tags'
        this.name = 'aaiTags'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'answerai-square-black.png'
        this.category = 'Document Loaders'
        this.description = 'Load tags from AnswerAgentAI Datastore'
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
                default: 1000,
                description: 'Maximum number of tags to load',
                optional: true
            },
            {
                label: 'Search Term',
                name: 'searchTerm',
                type: 'string',
                description: 'Search in tag slug, label, and description',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Parent Tags Only',
                name: 'parentTagsOnly',
                type: 'boolean',
                default: false,
                description: 'Load only parent (top-level) tags',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Child Tags Only',
                name: 'childTagsOnly',
                type: 'boolean',
                default: false,
                description: 'Load only child tags (tags with a parent)',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Include Parent Info',
                name: 'includeParentInfo',
                type: 'boolean',
                default: true,
                description: 'Include parent tag information in child tags',
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
        const parentTagsOnly = nodeData.inputs?.parentTagsOnly as boolean
        const childTagsOnly = nodeData.inputs?.childTagsOnly as boolean
        const includeParentInfo = nodeData.inputs?.includeParentInfo as boolean
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

        const loaderOptions: AAITagsLoaderParams = {
            supabaseUrl,
            supabaseKey,
            limit: limit || 1000,
            searchTerm: searchTerm || null,
            parentTagsOnly: parentTagsOnly || false,
            childTagsOnly: childTagsOnly || false,
            includeParentInfo: includeParentInfo !== false // Default true
        }

        const loader = new AAITagsLoader(loaderOptions)

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

interface AAITagsLoaderParams {
    supabaseUrl: string
    supabaseKey: string
    limit: number
    searchTerm: string | null
    parentTagsOnly: boolean
    childTagsOnly: boolean
    includeParentInfo: boolean
}

class AAITagsLoader extends BaseDocumentLoader {
    private supabaseUrl: string
    private supabaseKey: string
    private limit: number
    private searchTerm: string | null
    private parentTagsOnly: boolean
    private childTagsOnly: boolean
    private includeParentInfo: boolean

    constructor(params: AAITagsLoaderParams) {
        super()
        this.supabaseUrl = params.supabaseUrl
        this.supabaseKey = params.supabaseKey
        this.limit = params.limit
        this.searchTerm = params.searchTerm
        this.parentTagsOnly = params.parentTagsOnly
        this.childTagsOnly = params.childTagsOnly
        this.includeParentInfo = params.includeParentInfo
    }

    public async load(): Promise<IDocument[]> {
        const supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey)

        // Build query
        let query = supabase.from('tags').select(
            this.includeParentInfo
                ? `
                id,
                slug,
                label,
                description,
                color,
                shade,
                parent_id,
                created_at,
                updated_at,
                parent:parent_id (
                    id,
                    slug,
                    label,
                    description,
                    color,
                    shade
                )
            `
                : '*'
        )

        // Apply filters
        if (this.parentTagsOnly) {
            query = query.is('parent_id', null)
        }

        if (this.childTagsOnly) {
            query = query.not('parent_id', 'is', null)
        }

        if (this.searchTerm) {
            query = query.or(`slug.ilike.%${this.searchTerm}%,label.ilike.%${this.searchTerm}%,description.ilike.%${this.searchTerm}%`)
        }

        // Apply limit and order
        query = query.order('label', { ascending: true }).limit(this.limit)

        const { data: tags, error } = await query

        if (error) {
            throw new Error(`Failed to fetch tags from AAI Datastore: ${error.message}`)
        }

        if (!tags || tags.length === 0) {
            return []
        }

        return tags.map((tag) => this.createDocumentFromTag(tag))
    }

    private createDocumentFromTag(tag: any): Document {
        // Create page content from tag information
        const pageContent = [
            `Tag: ${tag.label} (${tag.slug})`,
            tag.description ? `Description: ${tag.description}` : '',
            tag.parent ? `Parent: ${tag.parent.label} (${tag.parent.slug})` : ''
        ]
            .filter(Boolean)
            .join('\n')

        // Build comprehensive metadata
        const metadata: ICommonObject = {
            // Core fields
            id: tag.id,
            slug: tag.slug,
            label: tag.label,
            description: tag.description,
            parent_id: tag.parent_id,

            // Parent information (if available)
            parent_slug: tag.parent?.slug,
            parent_label: tag.parent?.label,
            parent_description: tag.parent?.description,

            // Hierarchy information
            is_parent_tag: tag.parent_id === null,
            is_child_tag: tag.parent_id !== null,

            // Timestamps (ISO strings)
            created_at: tag.created_at,
            updated_at: tag.updated_at,

            // Timestamps (Unix timestamps in seconds for Pinecone numeric filters)
            created_at_timestamp: tag.created_at ? Math.floor(new Date(tag.created_at).getTime() / 1000) : null,
            updated_at_timestamp: tag.updated_at ? Math.floor(new Date(tag.updated_at).getTime() / 1000) : null,

            // Source
            source: 'aai_datastore',
            source_type: 'tag'
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
    nodeClass: AAITags_DocumentLoaders
}
