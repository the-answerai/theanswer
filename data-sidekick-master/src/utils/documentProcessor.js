import { supabase } from '../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import * as answerAI from '../services/answerAI/index.js'
import { processTextDocument } from '../services/answerAI/documentProcessor.js'
import { upsertTextDocument } from '../services/answerAI/documentProcessor.js'

/**
 * Process a document after it's been created
 * - Split document into chunks
 * - Prepare for AI processing
 * @param {Object} document The document object from Supabase
 */
export const processDocument = async (document) => {
    try {
        if (!document) {
            console.error('No document provided to processDocument')
            return null
        }

        console.log(`Processing document: ${document.id} (${document.title})`)

        // 1. Split document into chunks if it's large
        const chunks = await chunkDocument(document)

        // Temporarily disabling AnswerAI operations due to authentication issues
        // await answerAI.generateEmbeddings(chunks);
        // await answerAI.suggestCategory(document);

        console.log(`Document processing completed for ${document.id} without AnswerAI operations`)

        return document
    } catch (error) {
        console.error(`Error processing document ${document?.id}:`, error)

        // Update document status to error
        if (document?.id) {
            await supabase
                .from('documents')
                .update({
                    status: 'error',
                    updated_at: new Date().toISOString()
                })
                .eq('id', document.id)
        }

        throw error
    }
}

/**
 * Split document into chunks for processing and embedding
 * @param {Object} document The document object
 * @returns {Array} Array of chunk objects
 */
export const chunkDocument = async (document) => {
    try {
        const content = document.content

        // If content is small enough, just create one chunk
        if (content.length < 5000) {
            const chunk = {
                document_id: document.id,
                chunk_index: 0,
                chunk_text: content,
                token_count: document.token_count || Math.ceil(content.split(/\s+/).length * 1.3)
            }

            const { data: insertedChunk, error } = await supabase.from('document_chunks').insert(chunk).select().single()

            if (error) throw error

            return [insertedChunk]
        }

        // Split content into paragraphs
        const paragraphs = content
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0)

        // Combine paragraphs into chunks of roughly 1000-1500 tokens
        // (approximating 1 token = 4 chars)
        const MAX_CHUNK_LENGTH = 4000 // characters, not tokens
        const chunks = []
        let currentChunk = ''
        let chunkIndex = 0

        for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length + 1 <= MAX_CHUNK_LENGTH) {
                // Add to current chunk
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph
            } else {
                // Current chunk is full, save it
                if (currentChunk) {
                    const chunk = {
                        document_id: document.id,
                        chunk_index: chunkIndex++,
                        chunk_text: currentChunk,
                        token_count: Math.ceil(currentChunk.split(/\s+/).length * 1.3)
                    }

                    chunks.push(chunk)
                }

                // Start a new chunk with the current paragraph
                currentChunk = paragraph
            }
        }

        // Add the last chunk if there's anything left
        if (currentChunk) {
            const chunk = {
                document_id: document.id,
                chunk_index: chunkIndex,
                chunk_text: currentChunk,
                token_count: Math.ceil(currentChunk.split(/\s+/).length * 1.3)
            }

            chunks.push(chunk)
        }

        // Insert all chunks to the database
        if (chunks.length > 0) {
            const { data: insertedChunks, error } = await supabase.from('document_chunks').insert(chunks).select()

            if (error) throw error

            return insertedChunks
        }

        return []
    } catch (error) {
        console.error(`Error chunking document ${document.id}:`, error)
        throw error
    }
}

/**
 * Process document using the AnswerAI document-store/upsert API
 * Simplified implementation that only requires storeId and text
 * @param {Object} params - Parameters for document processing
 * @returns {Object} The processed document response
 */
export const processDocumentWithAnswerAI = async (params) => {
    try {
        // Extract required parameters
        const { storeId, text, metadata = {}, url, docId } = params

        if (!storeId) {
            throw new Error('storeId is required')
        }

        if (!text) {
            throw new Error('text is required')
        }

        // Debug the request
        console.log('================================================================')
        console.log('PROCESSING DOCUMENT WITH ANSWERAI')
        console.log('storeId:', storeId)
        console.log('text preview:', text.length > 50 ? `${text.substring(0, 50)}...` : text)
        console.log('text length:', text.length)
        console.log('metadata:', metadata)
        console.log('docId (will be stored in metadata):', docId)
        console.log('url:', url)
        console.log('================================================================')

        // Add storeId and url to metadata for better filtering
        const enhancedMetadata = {
            ...metadata,
            storeId, // Add the storeId to metadata for better filtering
            url: url || metadata.url, // Ensure URL is in metadata
            documentId: docId // Store our document ID in metadata
        }

        // Use the updated upsert function with the proper docId
        return await upsertTextDocument(
            storeId,
            text,
            enhancedMetadata,
            null, // Don't pass docId anymore
            true // Replace existing if present
        )
    } catch (error) {
        console.error('Error processing document with AnswerAI:', error)
        throw error
    }
}

// Export the AnswerAI service functions for direct use
export const createAnswerAIDocumentStore = answerAI.createDocumentStore
export const testAnswerAIConnection = answerAI.testConnection
