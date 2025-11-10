import { z } from 'zod'
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { BaseRetriever } from '@langchain/core/retrievers'
import { ICommonObject } from '../../../src/Interface'
import { resolveFlowObjValue } from '../../../src/utils'
import { SOURCE_DOCUMENTS_PREFIX } from '../../../src/agents'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'

type IFlowConfig = { sessionId?: string; chatId?: string; input?: string; state?: ICommonObject }

/**
 * Normalizes simple filter values to operator format
 * @param filter - Raw filter object
 * @returns Normalized filter with explicit operators
 */
export function normalizeSimpleFilter(filter: any): any {
    if (!filter || typeof filter !== 'object') {
        return filter
    }

    const normalized: any = {}

    for (const [key, value] of Object.entries(filter)) {
        // Preserve logical operators
        if (key.startsWith('$')) {
            if (key === '$and' || key === '$or') {
                // Recursively normalize array elements
                normalized[key] = Array.isArray(value) ? value.map((v) => normalizeSimpleFilter(v)) : value
            } else {
                normalized[key] = value
            }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Already in operator format: {"field": {"$eq": "value"}}
            normalized[key] = value
        } else if (Array.isArray(value)) {
            // Array: convert to $in operator
            normalized[key] = { $in: value }
        } else {
            // Simple value: convert to $eq operator
            normalized[key] = { $eq: value }
        }
    }

    return normalized
}

/**
 * Merges static and dynamic filters with AND logic
 * @param staticFilter - Filter from node configuration (or API override)
 * @param dynamicFilter - Filter from LLM function call
 * @param flowConfig - Flow context for $flow variable resolution
 * @returns Merged filter object
 */
export function mergeFilters(staticFilter: any, dynamicFilter: any, flowConfig?: IFlowConfig): any {
    // Step 1: Resolve $flow variables in both filters
    const resolvedStatic = staticFilter ? resolveFlowObjValue(staticFilter, flowConfig) : null
    const resolvedDynamic = dynamicFilter ? resolveFlowObjValue(dynamicFilter, flowConfig) : null

    // Step 2: Normalize simple values to operators
    const normalizedStatic = normalizeSimpleFilter(resolvedStatic)
    const normalizedDynamic = normalizeSimpleFilter(resolvedDynamic)

    // Step 3: Merge with AND logic
    if (!normalizedStatic && !normalizedDynamic) return null
    if (!normalizedStatic) return normalizedDynamic
    if (!normalizedDynamic) return normalizedStatic

    // Both exist: combine with $and
    return {
        $and: [normalizedStatic, normalizedDynamic]
    }
}

/**
 * Creates a new retriever instance with the specified filter
 * @param retriever - Base retriever to create filtered version from
 * @param filter - Filter to apply
 * @returns New retriever instance with filter applied
 */
export function createFilteredRetriever(retriever: BaseRetriever, filter: any): BaseRetriever {
    // Check if retriever has vectorStore property
    if (!('vectorStore' in retriever)) {
        throw new Error('Retriever does not support filtering - vectorStore property not found')
    }

    const vectorStoreRetriever = retriever as VectorStoreRetriever<any>
    const vectorStore = vectorStoreRetriever.vectorStore

    // Create new retriever instance with filter
    // This avoids shared state mutation and is thread-safe
    const k = (retriever as any).k || 4

    const newRetriever = vectorStore.asRetriever({
        k,
        filter: filter || undefined
    })

    return newRetriever
}

/**
 * Creates a retriever tool with static filter only (v3.0 backward compatible behavior)
 * @param config - Configuration object
 * @returns DynamicStructuredTool instance
 */
export function createStaticRetrieverTool(config: {
    name: string
    description: string
    retriever: BaseRetriever
    returnSourceDocuments: boolean
    includeMetadata: boolean
    retrieverToolMetadataFilter: any
    flow: any
}): any {
    const { name, description, retriever, returnSourceDocuments, includeMetadata, retrieverToolMetadataFilter, flow } = config

    const input = { name, description }

    const func = async ({ input }: { input: string }, _?: CallbackManagerForToolRun, flowConfig?: IFlowConfig) => {
        let finalRetriever = retriever

        // Apply static filter if it exists (v3.0 behavior)
        if (retrieverToolMetadataFilter) {
            const flowObj = flowConfig

            const metadatafilter =
                typeof retrieverToolMetadataFilter === 'object' ? retrieverToolMetadataFilter : JSON.parse(retrieverToolMetadataFilter)
            const resolvedFilter = resolveFlowObjValue(metadatafilter, flowObj)
            const normalizedFilter = normalizeSimpleFilter(resolvedFilter)

            // Create new retriever with filter to avoid shared state mutation
            try {
                finalRetriever = createFilteredRetriever(retriever, normalizedFilter)
            } catch (error) {
                // Fallback to v3.0 behavior if asRetriever not available
                if ('vectorStore' in retriever) {
                    const vectorStore = (retriever as VectorStoreRetriever<any>).vectorStore
                    vectorStore.filter = normalizedFilter
                }
            }
        }

        const docs = await finalRetriever.invoke(input)
        const stringifiedDocs = JSON.stringify(docs)

        if (includeMetadata) {
            return stringifiedDocs
        } else {
            const content = docs.map((doc) => doc.pageContent).join('\n\n')
            return returnSourceDocuments ? content + SOURCE_DOCUMENTS_PREFIX + stringifiedDocs : content
        }
    }

    const schema = z.object({
        input: z.string().describe('input to look up in retriever')
    }) as any

    // Import DynamicStructuredTool from parent file
    const DynamicStructuredTool = require('./RetrieverTool').DynamicStructuredTool
    const tool = new DynamicStructuredTool({ ...input, func, schema })
    tool.setFlowObject(flow)
    return tool
}

/**
 * Creates a retriever tool with dynamic filtering capability
 * @param config - Configuration object
 * @returns DynamicStructuredTool instance
 */
export function createDynamicRetrieverTool(config: {
    name: string
    description: string
    retriever: BaseRetriever
    returnSourceDocuments: boolean
    includeMetadata: boolean
    retrieverToolMetadataFilter: any
    metadataFieldsDescription: string
    flow: any
}): any {
    const {
        name,
        description,
        retriever,
        returnSourceDocuments,
        includeMetadata,
        retrieverToolMetadataFilter,
        metadataFieldsDescription,
        flow
    } = config

    // Enhance description with metadata schema if provided
    let enhancedDescription = description
    if (metadataFieldsDescription) {
        enhancedDescription += '\n\nAvailable metadata fields:\n' + metadataFieldsDescription
    }

    const input = { name, description: enhancedDescription }

    const func = async ({ input, filter }: { input: string; filter?: any }, _?: CallbackManagerForToolRun, flowConfig?: IFlowConfig) => {
        // Parse static filter if it's a string
        const staticFilter =
            retrieverToolMetadataFilter && typeof retrieverToolMetadataFilter === 'string'
                ? JSON.parse(retrieverToolMetadataFilter)
                : retrieverToolMetadataFilter

        // Merge static and dynamic filters
        const mergedFilter = mergeFilters(staticFilter, filter, flowConfig)

        // Create new retriever with merged filter
        const finalRetriever = mergedFilter ? createFilteredRetriever(retriever, mergedFilter) : retriever

        const docs = await finalRetriever.invoke(input)
        const stringifiedDocs = JSON.stringify(docs)

        if (includeMetadata) {
            return stringifiedDocs
        } else {
            const content = docs.map((doc) => doc.pageContent).join('\n\n')
            return returnSourceDocuments ? content + SOURCE_DOCUMENTS_PREFIX + stringifiedDocs : content
        }
    }

    // Create schema with optional filter parameter
    const filterDescription =
        'Optional metadata filters as key-value pairs. ' +
        'Use simple format {"field": "value"} for equality. ' +
        'Arrays match any: {"tags": ["a", "b"]}. ' +
        (metadataFieldsDescription ? 'See tool description for available fields.' : '')

    const schema = z.object({
        input: z.string().describe('search query to look up in retriever'),
        filter: z
            .record(
                z.union([
                    z.string(), // Simple string value
                    z.number(), // Simple number value
                    z.boolean(), // Simple boolean value
                    z.array(z.string()) // Array for $in matching
                ])
            )
            .optional()
            .describe(filterDescription)
    }) as any

    // Import DynamicStructuredTool from parent file
    const DynamicStructuredTool = require('./RetrieverTool').DynamicStructuredTool
    const tool = new DynamicStructuredTool({ ...input, func, schema })
    tool.setFlowObject(flow)
    return tool
}
