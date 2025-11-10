import { z } from 'zod'
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { BaseRetriever } from '@langchain/core/retrievers'
import { ICommonObject } from '../../../src/Interface'
import { resolveFlowObjValue } from '../../../src/utils'
import { SOURCE_DOCUMENTS_PREFIX } from '../../../src/agents'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'

type IFlowConfig = { sessionId?: string; chatId?: string; input?: string; state?: ICommonObject }
type DynamicStructuredToolClass = any // Passed as parameter to avoid circular dependency

/**
 * Safely parses JSON with error handling
 * @param jsonString - JSON string to parse
 * @param fieldName - Name of the field (for error messages)
 * @returns Parsed object or null if invalid
 */
function safeJsonParse(jsonString: string, fieldName: string): any {
    try {
        return JSON.parse(jsonString)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.warn(`[RetrieverTool] Invalid JSON in ${fieldName}: ${errorMessage}. Ignoring filter.`)
        return null
    }
}

/**
 * Normalizes simple filter values to operator format
 * Gracefully handles invalid filter structures by skipping problematic entries
 * @param filter - Raw filter object
 * @returns Normalized filter with explicit operators, or null if invalid
 */
export function normalizeSimpleFilter(filter: any): any {
    if (!filter) {
        return null
    }

    if (typeof filter !== 'object') {
        console.warn(`[RetrieverTool] Invalid filter type: expected object, got ${typeof filter}. Ignoring filter.`)
        return null
    }

    const normalized: any = {}

    try {
        for (const [key, value] of Object.entries(filter)) {
            // Preserve logical operators
            if (key.startsWith('$')) {
                if (key === '$and' || key === '$or') {
                    // Recursively normalize array elements
                    if (Array.isArray(value)) {
                        const normalizedArray = value.map((v) => normalizeSimpleFilter(v)).filter((v) => v !== null) // Remove invalid entries
                        if (normalizedArray.length > 0) {
                            normalized[key] = normalizedArray
                        }
                    } else {
                        console.warn(`[RetrieverTool] Invalid ${key} value: expected array, got ${typeof value}. Skipping.`)
                    }
                } else {
                    // Other operators - preserve as is
                    normalized[key] = value
                }
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Already in operator format: {"field": {"$eq": "value"}}
                normalized[key] = value
            } else if (Array.isArray(value)) {
                // Array: convert to $in operator
                normalized[key] = { $in: value }
            } else if (value !== undefined && value !== null) {
                // Simple value: convert to $eq operator
                normalized[key] = { $eq: value }
            }
            // Skip undefined/null values
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.warn(`[RetrieverTool] Error normalizing filter: ${errorMessage}. Using partial filter.`)
    }

    return Object.keys(normalized).length > 0 ? normalized : null
}

/**
 * Merges static and dynamic filters with AND logic
 * @param staticFilter - Filter from node configuration (or API override)
 * @param dynamicFilter - Filter from LLM function call (may contain hallucinated fields)
 * @param flowConfig - Flow context for $flow variable resolution
 * @returns Merged filter object, or null if both are invalid
 */
export function mergeFilters(staticFilter: any, dynamicFilter: any, flowConfig?: IFlowConfig): any {
    // Step 1: Resolve $flow variables in both filters
    const resolvedStatic = staticFilter ? resolveFlowObjValue(staticFilter, flowConfig) : null
    const resolvedDynamic = dynamicFilter ? resolveFlowObjValue(dynamicFilter, flowConfig) : null

    // Step 2: Normalize simple values to operators (gracefully handles invalid filters)
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
 * Preserves all original retriever configuration (searchType, searchKwargs, etc.)
 * @param retriever - Base retriever to create filtered version from
 * @param filter - Filter to apply
 * @returns New retriever instance with filter applied and original config preserved
 * @throws Error if retriever doesn't support filtering
 */
export function createFilteredRetriever(retriever: BaseRetriever, filter: any): BaseRetriever {
    // Check if retriever has vectorStore property
    if (!('vectorStore' in retriever)) {
        throw new Error('Retriever does not support filtering - vectorStore property not found')
    }

    const vectorStoreRetriever = retriever as VectorStoreRetriever<any>
    const vectorStore = vectorStoreRetriever.vectorStore

    // Extract all configuration from original retriever to preserve search behavior
    const originalRetriever = retriever as any
    const retrieverConfig: any = {
        // Core configuration
        k: originalRetriever.k || 4,
        filter: filter || undefined,

        // Search configuration (preserve searchType and searchKwargs)
        searchType: originalRetriever.searchType,
        searchKwargs: originalRetriever.searchKwargs,

        // Callback configuration
        callbacks: originalRetriever.callbacks,
        tags: originalRetriever.tags,
        metadata: originalRetriever.metadata,
        verbose: originalRetriever.verbose
    }

    // Remove undefined values to use vector store defaults only when not specified
    Object.keys(retrieverConfig).forEach((key) => {
        if (retrieverConfig[key] === undefined) {
            delete retrieverConfig[key]
        }
    })

    // Create new retriever instance with all original configuration preserved
    // This avoids shared state mutation and is thread-safe while maintaining search behavior
    const newRetriever = vectorStore.asRetriever(retrieverConfig)

    return newRetriever
}

/**
 * Creates a retriever tool with static filter only (v3.0 backward compatible behavior)
 * @param config - Configuration object
 * @param DynamicStructuredTool - Tool class (passed to avoid circular dependency)
 * @returns DynamicStructuredTool instance
 */
export function createStaticRetrieverTool(
    config: {
        name: string
        description: string
        retriever: BaseRetriever
        returnSourceDocuments: boolean
        includeMetadata: boolean
        retrieverToolMetadataFilter: any
        flow: any
    },
    DynamicStructuredTool: DynamicStructuredToolClass
): any {
    const { name, description, retriever, returnSourceDocuments, includeMetadata, retrieverToolMetadataFilter, flow } = config

    const input = { name, description }

    const func = async ({ input }: { input: string }, _?: CallbackManagerForToolRun, flowConfig?: IFlowConfig) => {
        let finalRetriever = retriever

        // Apply static filter if it exists (v3.0 behavior)
        if (retrieverToolMetadataFilter) {
            // Parse filter with error handling
            const metadataFilter =
                typeof retrieverToolMetadataFilter === 'object'
                    ? retrieverToolMetadataFilter
                    : safeJsonParse(retrieverToolMetadataFilter, 'Additional Metadata Filter')

            if (metadataFilter) {
                const resolvedFilter = resolveFlowObjValue(metadataFilter, flowConfig)
                const normalizedFilter = normalizeSimpleFilter(resolvedFilter)

                if (normalizedFilter) {
                    // Create new retriever with filter to avoid shared state mutation
                    try {
                        finalRetriever = createFilteredRetriever(retriever, normalizedFilter)
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                        console.warn(
                            `[RetrieverTool] Failed to create filtered retriever: ${errorMessage}. ` +
                                `Falling back to v3.0 behavior (not thread-safe). ` +
                                `This may cause issues with concurrent requests.`
                        )

                        // Fallback to v3.0 behavior (not thread-safe)
                        if ('vectorStore' in retriever) {
                            const vectorStore = (retriever as VectorStoreRetriever<any>).vectorStore
                            vectorStore.filter = normalizedFilter
                        } else {
                            console.error(
                                `[RetrieverTool] Retriever does not support filtering and fallback failed. ` + `Filter will be ignored.`
                            )
                        }
                    }
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

    const tool = new DynamicStructuredTool({ ...input, func, schema })
    tool.setFlowObject(flow)
    return tool
}

/**
 * Creates a retriever tool with dynamic filtering capability
 * @param config - Configuration object
 * @param DynamicStructuredTool - Tool class (passed to avoid circular dependency)
 * @returns DynamicStructuredTool instance
 */
export function createDynamicRetrieverTool(
    config: {
        name: string
        description: string
        retriever: BaseRetriever
        returnSourceDocuments: boolean
        includeMetadata: boolean
        retrieverToolMetadataFilter: any
        metadataFieldsDescription: string
        flow: any
    },
    DynamicStructuredTool: DynamicStructuredToolClass
): any {
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
        // Parse static filter with error handling
        const staticFilter =
            retrieverToolMetadataFilter && typeof retrieverToolMetadataFilter === 'string'
                ? safeJsonParse(retrieverToolMetadataFilter, 'Additional Metadata Filter')
                : retrieverToolMetadataFilter

        // Merge static and dynamic filters (gracefully handles invalid/hallucinated filters)
        const mergedFilter = mergeFilters(staticFilter, filter, flowConfig)

        // Create new retriever with merged filter (thread-safe)
        let finalRetriever = retriever
        if (mergedFilter) {
            try {
                finalRetriever = createFilteredRetriever(retriever, mergedFilter)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                console.warn(
                    `[RetrieverTool] Failed to apply filter: ${errorMessage}. ` + `Proceeding without filter to avoid breaking the query.`
                )
                // Continue with unfiltered retriever
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

    // Create schema with optional filter parameter
    const filterDescription =
        'Optional metadata filters as key-value pairs. ' +
        'Use simple format {"field": "value"} for equality. ' +
        'Arrays match any: {"tags": ["a", "b"]}. ' +
        'Invalid fields will be ignored by the vector store. ' +
        (metadataFieldsDescription ? 'Available fields: see tool description above.' : '')

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

    const tool = new DynamicStructuredTool({ ...input, func, schema })
    tool.setFlowObject(flow)
    return tool
}
