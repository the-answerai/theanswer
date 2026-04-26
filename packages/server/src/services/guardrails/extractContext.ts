/**
 * Extract RAG source-document text for faithfulness checking.
 *
 * Moved out of buildChatflow.ts so both the chain path and the AgentFlow V2
 * path can share a single implementation. Handles both JSON-string and
 * already-parsed-array inputs.
 */

import logger from '../../utils/logger'

export const extractTextFromSourceDocuments = (sourceDocuments: any): string | undefined => {
    try {
        const docs = typeof sourceDocuments === 'string' ? JSON.parse(sourceDocuments) : sourceDocuments
        if (!Array.isArray(docs) || docs.length === 0) return undefined
        const textChunks = docs.map((doc) => doc?.pageContent || '').filter((text: string) => text.length > 0)
        if (textChunks.length === 0) return undefined
        return textChunks.join('\n\n')
    } catch (error) {
        logger.warn('[Guardrails] Failed to extract text from sourceDocuments', { error: (error as Error).message })
        return undefined
    }
}
