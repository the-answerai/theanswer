/**
 * Functions for interacting with AI services in AnswerAI
 */
import { supabase } from '../../config/db.js'
import { makeApiRequest } from './client.js'
import { logTokenUsage } from '../../utils/usageTracker.js'
import { getResearchViewIdFromChunk, getResearchViewIdFromDocument } from './utils.js'

// Default model IDs from environment variables
const EMBEDDING_MODEL_ID = process.env.EMBEDDING_MODEL_ID || 'ac251f9f-aebc-4687-a14a-24be2fc594ad'
const COMPLETION_MODEL_ID = process.env.COMPLETION_MODEL_ID || 'ac251f9f-aebc-4687-a14a-24be2fc594ad'

/**
 * Generate embeddings for document chunks using AnswerAI
 * @param {Array} chunks Array of document chunks
 */
export const generateEmbeddings = async (chunks) => {
    if (!chunks || chunks.length === 0) {
        return
    }

    try {
        // Process chunks in batches (max 20 at a time)
        const BATCH_SIZE = 20

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + BATCH_SIZE)
            const embeddingPromises = batchChunks.map(async (chunk) => {
                try {
                    if (!chunk.chunk_text) {
                        console.error(`Missing chunk text for chunk ${chunk.id}`)
                        return
                    }

                    // Call the AnswerAI API to generate embeddings
                    const result = await makeApiRequest('/embedding', 'POST', {
                        model: EMBEDDING_MODEL_ID,
                        input: chunk.chunk_text
                    })

                    if (!result.embedding) {
                        throw new Error('No embedding returned from API')
                    }

                    // Update the chunk with the embedding
                    const { error: updateError } = await supabase
                        .from('document_chunks')
                        .update({
                            embedding: result.embedding,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', chunk.id)

                    if (updateError) {
                        console.error(`Error updating chunk ${chunk.id} with embedding:`, updateError)
                    }

                    // Log token usage
                    if (result.usage) {
                        const researchViewId = await getResearchViewIdFromChunk(chunk)
                        await logTokenUsage(
                            researchViewId,
                            'embedding',
                            result.usage.prompt_tokens || chunk.token_count || 0,
                            0,
                            result.usage.total_tokens || chunk.token_count || 0
                        )
                    }
                } catch (chunkError) {
                    console.error(`Error generating embedding for chunk ${chunk.id}:`, chunkError)
                }
            })

            // Wait for all embeddings in this batch to complete
            await Promise.all(embeddingPromises)
        }
    } catch (error) {
        console.error('Error generating embeddings:', error)
        throw error
    }
}

/**
 * Suggest a category for a document using AnswerAI
 * @param {Object} document The document object
 */
export const suggestCategory = async (document) => {
    try {
        // Only use the first 2000 tokens of the document for category suggestion
        const maxContent = document.content.split(' ').slice(0, 2000).join(' ')

        // Create a prompt for category suggestion
        const prompt = `
You are an expert content classifier. Based on the following text, suggest a single category that best describes this content.
Respond with just ONE category name (1-3 words), no explanation.

TEXT:
${maxContent}

CATEGORY:`

        // Call AnswerAI for the suggestion
        const result = await makeApiRequest('/completions', 'POST', {
            model: COMPLETION_MODEL_ID,
            prompt,
            max_tokens: 10,
            temperature: 0.3
        })

        const category = result.choices?.[0]?.text.trim()

        if (category) {
            // Update document with AI category suggestion
            await supabase
                .from('documents')
                .update({
                    category_ai: category,
                    updated_at: new Date().toISOString()
                })
                .eq('id', document.id)

            // Log token usage
            if (result.usage) {
                const researchViewId = await getResearchViewIdFromDocument(document)
                await logTokenUsage(
                    researchViewId,
                    'categorization',
                    result.usage.prompt_tokens || 0,
                    result.usage.completion_tokens || 0,
                    result.usage.total_tokens || 0
                )
            }
        }
    } catch (error) {
        console.error(`Error suggesting category for document ${document.id}:`, error)
        // We don't throw here, as this is a non-critical feature
    }
}
