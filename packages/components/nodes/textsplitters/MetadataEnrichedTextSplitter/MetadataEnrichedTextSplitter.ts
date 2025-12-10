import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from '@langchain/core/documents'

class MetadataEnrichedTextSplitter_TextSplitters implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    tags: string[]

    constructor() {
        this.label = 'Metadata Enriched Text Splitter'
        this.name = 'metadataEnrichedTextSplitter'
        this.version = 1.0
        this.type = 'MetadataEnrichedTextSplitter'
        this.icon = 'textsplitter.svg'
        this.category = 'Text Splitters'
        this.description = `Enriches document chunks by prepending metadata fields to the content. Useful for adding context like IDs, tags, domains, etc. to improve LLM retrieval accuracy.`
        this.baseClasses = [this.type, ...getBaseClasses(RecursiveCharacterTextSplitter)]
        this.tags = ['AAI']
        this.inputs = [
            {
                label: 'Chunk Size',
                name: 'chunkSize',
                type: 'number',
                description: 'Number of characters in each chunk. Default is 1000.',
                default: 1000,
                optional: true
            },
            {
                label: 'Chunk Overlap',
                name: 'chunkOverlap',
                type: 'number',
                description: 'Number of characters to overlap between chunks. Default is 200.',
                default: 200,
                optional: true
            },
            {
                label: 'Custom Separators',
                name: 'separators',
                type: 'string',
                rows: 4,
                description:
                    'Array of custom separators to split on (e.g., [">>SPLIT<<", "\\n\\n", "\\n"]). Will override default separators.',
                placeholder: '[">>SPLIT<<", "\\n\\n", "\\n", " "]',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Metadata Fields',
                name: 'metadataFields',
                type: 'string',
                placeholder: 'id,tags,source',
                description: 'Comma-separated list of metadata fields to prepend to chunks (e.g., "id,tags,source")'
            },
            {
                label: 'Metadata Separator',
                name: 'metadataSeparator',
                type: 'string',
                default: '--- Metadata ---\n',
                description: 'Header text for the metadata section',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Content Separator',
                name: 'contentSeparator',
                type: 'string',
                default: '--- Content ---\n',
                description: 'Header text separating metadata from content',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Format Style',
                name: 'formatStyle',
                type: 'options',
                options: [
                    { label: 'Name-Value Pairs', name: 'name-value' },
                    { label: 'JSON', name: 'json' },
                    { label: 'YAML', name: 'yaml' }
                ],
                default: 'name-value',
                description: 'How to format the metadata fields',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const chunkSize = nodeData.inputs?.chunkSize as string
        const chunkOverlap = nodeData.inputs?.chunkOverlap as string
        const separatorsInput = nodeData.inputs?.separators
        const metadataFieldsInput = nodeData.inputs?.metadataFields as string
        const metadataSeparator = (nodeData.inputs?.metadataSeparator as string) || '--- Metadata ---\n'
        const contentSeparator = (nodeData.inputs?.contentSeparator as string) || '--- Content ---\n'
        const formatStyle = (nodeData.inputs?.formatStyle as string) || 'name-value'

        // Parse custom separators if provided
        let separators: string[] | undefined
        if (separatorsInput) {
            try {
                separators = typeof separatorsInput === 'object' ? separatorsInput : JSON.parse(separatorsInput)
            } catch (error) {
                throw new Error(
                    `Invalid separators format. Use JSON array format (e.g., [">>SPLIT<<", "\\n\\n", "\\n"]). Error: ${error.message}`
                )
            }
        }

        // Parse and validate metadata fields
        let metadataFields: string[]
        try {
            const trimmedInput = metadataFieldsInput?.trim()
            if (!trimmedInput) {
                throw new Error('Metadata Fields cannot be empty')
            }

            // Try JSON array format first
            if (trimmedInput.startsWith('[')) {
                metadataFields = JSON.parse(trimmedInput)
            } else {
                // Comma-separated format
                metadataFields = trimmedInput
                    .split(',')
                    .map((f) => f.trim())
                    .filter((f) => f.length > 0)
            }
        } catch (error) {
            throw new Error(
                `Invalid metadata fields format. Use comma-separated (e.g., "id,tags,source") or JSON array (e.g., ["id","tags","source"]). Error: ${error.message}`
            )
        }

        if (metadataFields.length === 0) {
            throw new Error('At least one metadata field must be specified')
        }

        // Return enriched splitter
        const splitter = new EnrichedTextSplitter({
            chunkSize: chunkSize ? parseInt(chunkSize, 10) : 1000,
            chunkOverlap: chunkOverlap ? parseInt(chunkOverlap, 10) : 200,
            separators,
            metadataFields,
            metadataSeparator,
            contentSeparator,
            formatStyle: formatStyle as 'name-value' | 'json' | 'yaml'
        })

        return splitter
    }
}

class EnrichedTextSplitter extends RecursiveCharacterTextSplitter {
    metadataFields: string[]
    metadataSeparator: string
    contentSeparator: string
    formatStyle: 'name-value' | 'json' | 'yaml'

    constructor(config: {
        chunkSize: number
        chunkOverlap: number
        separators?: string[]
        metadataFields: string[]
        metadataSeparator: string
        contentSeparator: string
        formatStyle: 'name-value' | 'json' | 'yaml'
    }) {
        const baseConfig: any = {
            chunkSize: config.chunkSize,
            chunkOverlap: config.chunkOverlap
        }

        // Add custom separators if provided
        if (config.separators) {
            baseConfig.separators = config.separators
        }

        super(baseConfig)
        this.metadataFields = config.metadataFields
        this.metadataSeparator = config.metadataSeparator
        this.contentSeparator = config.contentSeparator
        this.formatStyle = config.formatStyle
    }

    async splitDocuments(documents: Document[]): Promise<Document[]> {
        // Use parent's splitDocuments to split documents
        const chunks = await super.splitDocuments(documents)

        // Enrich each chunk with metadata
        return chunks.map((chunk) => this.enrichChunk(chunk))
    }

    private enrichChunk(chunk: Document): Document {
        // Extract metadata fields that exist
        const metadataEntries = this.metadataFields
            .map((field) => ({ field, value: chunk.metadata[field] }))
            .filter(({ value }) => value !== undefined && value !== null)

        // If no metadata to add, return chunk as-is
        if (metadataEntries.length === 0) {
            return chunk
        }

        // Format metadata according to style
        const formattedMetadata = this.formatMetadata(metadataEntries)

        // Prepend metadata to content
        const enrichedContent = `${this.metadataSeparator}${formattedMetadata}\n${this.contentSeparator}${chunk.pageContent}`

        // Return new document with enriched content, preserving original metadata
        return new Document({
            pageContent: enrichedContent,
            metadata: { ...chunk.metadata }
        })
    }

    private formatMetadata(entries: Array<{ field: string; value: any }>): string {
        switch (this.formatStyle) {
            case 'name-value':
                return entries.map(({ field, value }) => `${field}: ${this.formatValue(value)}`).join('\n')

            case 'json': {
                const jsonObject = Object.fromEntries(entries.map(({ field, value }) => [field, value]))
                return JSON.stringify(jsonObject, null, 2)
            }

            case 'yaml':
                return entries.map(({ field, value }) => `${field}: ${this.formatValue(value)}`).join('\n')

            default:
                return entries.map(({ field, value }) => `${field}: ${this.formatValue(value)}`).join('\n')
        }
    }

    private formatValue(value: any): string {
        if (Array.isArray(value)) {
            return value.join(', ')
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value)
        }
        return String(value)
    }
}

module.exports = { nodeClass: MetadataEnrichedTextSplitter_TextSplitters }
