import { supabase } from '../config/db.js'
import fetch from 'node-fetch'
import { logTokenUsage } from '../utils/usageTracker.js'
import { processDocumentWithAnswerAI } from '../utils/documentProcessor.js'
import { testConnection } from '../services/answerAI/index.js'
import { processTextDocument, checkProcessingStatus } from '../services/answerAI/documentProcessor.js'
import fs from 'node:fs'
import path from 'node:path'
import unstructuredService from '../services/unstructured/index.js'

/**
 * Get Supabase user ID from Auth0 ID
 * @param {string} auth0Id - The Auth0 ID (sub)
 * @returns {string|null} - The Supabase user ID or null if not found
 */
async function getSupabaseUserId(auth0Id) {
    if (!auth0Id) return null

    try {
        const { data, error } = await supabase.from('users').select('id').eq('auth0_id', auth0Id).single()

        if (error) {
            console.error('Error fetching user ID:', error)
            return null
        }

        return data?.id || null
    } catch (error) {
        console.error('Error in getSupabaseUserId:', error)
        return null
    }
}

/**
 * Get all documents for a research view
 */
export const getDocumentsByResearchView = async (req, res) => {
    try {
        const { viewId } = req.params
        const { page = 1, limit = 50, sort, filter, categoryId } = req.query

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Verify ownership of the research view
        const { data: existingView, error: checkError } = await supabase
            .from('research_views')
            .select('id')
            .eq('id', viewId)
            .eq('user_id', userId)
            .single()

        if (checkError || !existingView) {
            return res.status(404).json({
                error: "Research view not found or you don't have permission to access it"
            })
        }

        // Get data sources for this research view
        const { data: dataSources, error: dataSourceError } = await supabase
            .from('data_sources')
            .select('id')
            .eq('research_view_id', viewId)

        if (dataSourceError) throw dataSourceError

        if (!dataSources || dataSources.length === 0) {
            return res.json({ data: [], count: 0, page, totalPages: 0 })
        }

        // Prepare query to get documents
        let query = supabase
            .from('documents')
            .select('*, document_metadata(*)', { count: 'exact' })
            .in(
                'source_id',
                dataSources.map((ds) => ds.id)
            )

        // Add category filter if provided
        if (categoryId) {
            const { data: categoryDocs, error: catError } = await supabase
                .from('document_categories')
                .select('document_id')
                .eq('category_id', categoryId)

            if (catError) throw catError

            if (categoryDocs && categoryDocs.length > 0) {
                query = query.in(
                    'id',
                    categoryDocs.map((doc) => doc.document_id)
                )
            } else {
                // No documents in this category
                return res.json({ data: [], count: 0, page, totalPages: 0 })
            }
        }

        // Add text search filter if provided
        if (filter?.text) {
            query = query.textSearch('content', filter.text, { type: 'plain' })
        }

        // Add source filter if provided
        if (filter?.sourceId) {
            query = query.eq('source_id', filter.sourceId)
        }

        // Add date filters if provided
        if (filter?.dateFrom) {
            query = query.gte('publication_date', filter.dateFrom)
        }

        if (filter?.dateTo) {
            query = query.lte('publication_date', filter.dateTo)
        }

        // Add sorting
        if (sort) {
            const [field, direction] = sort.split(':')
            if (field && direction) {
                query = query.order(field, { ascending: direction === 'asc' })
            }
        } else {
            // Default sort by publication date, newest first
            query = query.order('publication_date', {
                ascending: false,
                nullsFirst: false
            })
        }

        // Add pagination
        const startIndex = (page - 1) * limit
        query = query.range(startIndex, startIndex + limit - 1)

        // Execute query
        const { data: documents, error, count } = await query

        if (error) throw error

        // Format document metadata for easier consumption
        const formattedDocuments = documents.map((doc) => {
            // Convert document_metadata array to object with field names as keys
            const metadata = {}
            if (doc.document_metadata) {
                for (const meta of doc.document_metadata) {
                    metadata[meta.field_name] = meta.field_value
                }
            }

            return {
                ...doc,
                metadata,
                document_metadata: undefined // Remove original array
            }
        })

        // Calculate total pages
        const totalPages = Math.ceil(count / limit)

        res.json({
            data: formattedDocuments,
            count,
            page: Number.parseInt(page),
            totalPages
        })
    } catch (error) {
        console.error('Error fetching documents:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get a specific document by ID
 */
export const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params

        // Get user ID from authentication
        const userId = req.oidc.user?.sub

        // Get document with verification of ownership
        const { data: document, error } = await supabase
            .from('documents')
            .select(
                `
                *,
                document_metadata(*),
                data_sources!inner(
                    id,
                    url,
                    research_views!inner(
                        id,
                        user_id
                    )
                )
            `
            )
            .eq('id', id)
            .eq('data_sources.research_views.user_id', userId)
            .single()

        if (error || !document) {
            return res.status(404).json({
                error: "Document not found or you don't have permission to access it"
            })
        }

        // Get document categories
        const { data: categories, error: catError } = await supabase
            .from('document_categories')
            .select('category_id, assigned_by, analyzer_categories(id, name, description)')
            .eq('document_id', id)

        if (catError) throw catError

        // Format document metadata for easier consumption
        const metadata = {}
        if (document.document_metadata) {
            for (const meta of document.document_metadata) {
                metadata[meta.field_name] = meta.field_value
            }
        }

        const formattedDocument = {
            ...document,
            metadata,
            document_metadata: undefined, // Remove original array
            categories: categories || []
        }

        res.json({ data: formattedDocument })
    } catch (error) {
        console.error('Error fetching document:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Update document categories
 */
export const updateDocumentCategories = async (req, res) => {
    try {
        const { id } = req.params
        const { categories } = req.body

        if (!Array.isArray(categories)) {
            return res.status(400).json({ error: 'Categories must be an array' })
        }

        // Get user ID from authentication
        const userId = req.oidc.user?.sub

        // Verify ownership of the document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select(
                `
                id,
                data_sources!inner(
                    research_views!inner(
                        user_id
                    )
                )
            `
            )
            .eq('id', id)
            .eq('data_sources.research_views.user_id', userId)
            .single()

        if (docError || !document) {
            return res.status(404).json({
                error: "Document not found or you don't have permission to update it"
            })
        }

        // Get research view ID for this document (needed for validation)
        const { data: dataSource, error: dsError } = await supabase
            .from('data_sources')
            .select('research_view_id')
            .eq('id', document.data_sources.id)
            .single()

        if (dsError) throw dsError

        const researchViewId = dataSource.research_view_id

        // Verify that all category IDs belong to this research view
        if (categories.length > 0) {
            const { data: validCategories, error: valError } = await supabase
                .from('analyzer_categories')
                .select('id')
                .eq('research_view_id', researchViewId)
                .in('id', categories)

            if (valError) throw valError

            const validCategoryIds = validCategories.map((c) => c.id)
            const invalidCategories = categories.filter((id) => !validCategoryIds.includes(id))

            if (invalidCategories.length > 0) {
                return res.status(400).json({
                    error: 'Some categories do not belong to this research view',
                    invalidCategories
                })
            }
        }

        // Delete existing user-assigned categories
        const { error: deleteError } = await supabase.from('document_categories').delete().eq('document_id', id).eq('assigned_by', 'user')

        if (deleteError) throw deleteError

        // Insert new categories
        if (categories.length > 0) {
            const categoryRecords = categories.map((categoryId) => ({
                document_id: id,
                category_id: categoryId,
                assigned_by: 'user'
            }))

            const { error: insertError } = await supabase.from('document_categories').insert(categoryRecords)

            if (insertError) throw insertError
        }

        // Update the document's user category (for quick access)
        const { data: catNames, error: namesError } = await supabase.from('analyzer_categories').select('name').in('id', categories)

        if (namesError) throw namesError

        const categoryNames = catNames.map((c) => c.name).join(', ')

        await supabase
            .from('documents')
            .update({
                category_user: categoryNames || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        res.json({
            success: true,
            data: {
                id,
                categories,
                category_user: categoryNames || null
            }
        })
    } catch (error) {
        console.error('Error updating document categories:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Add a custom metadata field to documents in a research view
 */
export const addMetadataField = async (req, res) => {
    try {
        const { viewId } = req.params
        const { fieldName, fieldPrompt, documentIds } = req.body

        if (!fieldName) {
            return res.status(400).json({ error: 'Field name is required' })
        }

        if (!fieldPrompt) {
            return res.status(400).json({ error: 'Field prompt is required' })
        }

        // Get user ID from authentication
        const userId = req.oidc.user?.sub

        // Verify ownership of the research view
        const { data: existingView, error: checkError } = await supabase
            .from('research_views')
            .select('id')
            .eq('id', viewId)
            .eq('user_id', userId)
            .single()

        if (checkError || !existingView) {
            return res.status(404).json({
                error: "Research view not found or you don't have permission to modify it"
            })
        }

        // Get documents for this research view
        let documentsQuery = supabase.from('documents').select('id, content, source_id').order('created_at', { ascending: false })

        if (documentIds && documentIds.length > 0) {
            // Process only specified documents
            documentsQuery = documentsQuery.in('id', documentIds)
        } else {
            // Process all documents in the research view
            const { data: dataSources, error: dsError } = await supabase.from('data_sources').select('id').eq('research_view_id', viewId)

            if (dsError) throw dsError

            if (!dataSources || dataSources.length === 0) {
                return res.status(400).json({ error: 'No data sources found for this research view' })
            }

            documentsQuery = documentsQuery.in(
                'source_id',
                dataSources.map((ds) => ds.id)
            )
        }

        const { data: documents, error: docError } = await documentsQuery

        if (docError) throw docError

        if (!documents || documents.length === 0) {
            return res.status(400).json({ error: 'No documents found to process' })
        }

        // Queue the metadata extraction job for processing
        // In a real implementation, this would use a job queue system
        // For simplicity, we'll process a few immediately and queue the rest

        const MAX_IMMEDIATE = 5 // Process this many immediately
        const immediateDocuments = documents.slice(0, MAX_IMMEDIATE)
        const queuedDocuments = documents.slice(MAX_IMMEDIATE)

        // Process the first few documents immediately
        const immediateResults = await Promise.all(
            immediateDocuments.map(async (doc) => {
                try {
                    return await extractMetadata(doc, fieldName, fieldPrompt, viewId)
                } catch (error) {
                    console.error(`Error extracting metadata for document ${doc.id}:`, error)
                    return {
                        document_id: doc.id,
                        success: false,
                        error: error.message
                    }
                }
            })
        )

        // Queue the rest for background processing
        if (queuedDocuments.length > 0) {
            // In a real implementation, this would add to a job queue
            // For now, we'll just process them asynchronously without waiting
            setTimeout(() => {
                for (const doc of queuedDocuments) {
                    extractMetadata(doc, fieldName, fieldPrompt, viewId).catch((error) => {
                        console.error(`Background extraction error for document ${doc.id}:`, error)
                    })
                }
            }, 100)
        }

        res.json({
            success: true,
            message: `Processing metadata field "${fieldName}" for ${documents.length} documents`,
            immediate_results: immediateResults,
            queued_count: queuedDocuments.length
        })
    } catch (error) {
        console.error('Error adding metadata field:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a document
 */
export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params

        // Get user ID from authentication
        const userId = req.oidc.user?.sub

        // Verify ownership of the document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select(
                `
                id,
                data_sources!inner(
                    research_views!inner(
                        user_id
                    )
                )
            `
            )
            .eq('id', id)
            .eq('data_sources.research_views.user_id', userId)
            .single()

        if (docError || !document) {
            return res.status(404).json({
                error: "Document not found or you don't have permission to delete it"
            })
        }

        // Delete the document (cascading will handle related data)
        const { error } = await supabase.from('documents').delete().eq('id', id)

        if (error) throw error

        res.json({ success: true, message: 'Document deleted successfully' })
    } catch (error) {
        console.error('Error deleting document:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Extract metadata from a document using AI
 * @param {Object} document - The document to process
 * @param {string} fieldName - The name of the metadata field
 * @param {string} fieldPrompt - The prompt for AI extraction
 * @param {string} researchViewId - The ID of the research view
 * @returns {Object} The extraction result
 */
const extractMetadata = async (document, fieldName, fieldPrompt, researchViewId) => {
    try {
        // Check if this field already exists for this document
        const { data: existingField, error: checkError } = await supabase
            .from('document_metadata')
            .select('id')
            .eq('document_id', document.id)
            .eq('field_name', fieldName)
            .single()

        // Limit content to first 8000 chars to avoid token limits
        const content = document.content.substring(0, 8000)

        // Create a prompt for the AI
        const prompt = `
${fieldPrompt}

Here is the document to analyze:
---
${content}
---

Your response should be clear, concise, and directly answer what was asked.
`

        // Call AnswerAI API
        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.COMPLETION_MODEL_ID || 'ac251f9f-aebc-4687-a14a-24be2fc594ad',
                prompt,
                max_tokens: 500,
                temperature: 0.3
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`AI API returned ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        const fieldValue = result.choices[0]?.text.trim()

        if (!fieldValue) {
            throw new Error('No valid response from AI')
        }

        // Log token usage
        if (result.usage) {
            await logTokenUsage(
                researchViewId,
                'metadata_extraction',
                result.usage.prompt_tokens || 0,
                result.usage.completion_tokens || 0,
                result.usage.total_tokens || 0
            )
        }

        // Update or insert the metadata field
        if (existingField) {
            // Update existing field
            const { error } = await supabase.from('document_metadata').update({ field_value: fieldValue }).eq('id', existingField.id)

            if (error) throw error

            return {
                document_id: document.id,
                field_id: existingField.id,
                field_name: fieldName,
                field_value: fieldValue,
                updated: true,
                success: true
            }
        }

        // Insert new field
        const { data, error } = await supabase
            .from('document_metadata')
            .insert({
                document_id: document.id,
                field_name: fieldName,
                field_prompt: fieldPrompt,
                field_value: fieldValue,
                is_predefined: false
            })
            .select()
            .single()

        if (error) throw error

        return {
            document_id: document.id,
            field_id: data.id,
            field_name: fieldName,
            field_value: fieldValue,
            created: true,
            success: true
        }
    } catch (error) {
        console.error(`Error extracting metadata for document ${document.id}:`, error)
        throw error
    }
}

/**
 * Process a document using the AnswerAI document processor API
 * Using standardized configuration, only requires storeId and text
 * @route POST /api/documents/process-with-answerai
 */
export const processWithAnswerAI = async (req, res) => {
    try {
        const { storeId, text } = req.body

        if (!storeId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: storeId'
            })
        }

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: text'
            })
        }

        // Process document using the standardized utility
        const metadata = req.body.metadata || {}
        const loaderName = req.body.loaderName || ''

        // Add storeId to metadata for better filtering
        const enhancedMetadata = {
            ...metadata,
            storeId // Add the storeId to metadata for filtering
        }

        const result = await processTextDocument(storeId, text, enhancedMetadata, loaderName)

        // Return a simplified response
        return res.status(200).json({
            success: true,
            message: 'Document processing initiated',
            documentId: result.file?.id,
            storeId: storeId,
            status: result.file?.status || 'UNKNOWN',
            note: 'Processing happens asynchronously. Chunks will be generated in the background.'
        })
    } catch (error) {
        console.error('Error processing document with AnswerAI:', error)

        // Return appropriate error response
        return res.status(error.message?.includes('UUID') ? 400 : 500).json({
            success: false,
            error: 'Failed to process document',
            message: error.message
        })
    }
}

/**
 * Test the connection to the AnswerAI API
 * @route GET /api/documents/test-answerai-connection
 */
export const testAnswerAIConnection = async (req, res) => {
    try {
        console.log('Testing AnswerAI connection...')
        const result = await testConnection()

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Successfully connected to AnswerAI API',
                details: result
            })
        }

        return res.status(result.status || 500).json({
            success: false,
            message: 'Failed to connect to AnswerAI API',
            error: result.error,
            details: result
        })
    } catch (error) {
        console.error('Error testing AnswerAI connection:', error)
        return res.status(500).json({
            success: false,
            message: 'Exception while testing AnswerAI connection',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
}

/**
 * Get all documents by source ID
 */
export const getDocumentsBySourceId = async (req, res) => {
    try {
        const { sourceId } = req.params
        const { page = 1, limit = 50, sort, filter } = req.query

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Verify ownership of the data source
        const { data: dataSource, error: dataSourceError } = await supabase
            .from('data_sources')
            .select('id, research_view_id')
            .eq('id', sourceId)
            .single()

        if (dataSourceError || !dataSource) {
            return res.status(404).json({
                error: "Data source not found or you don't have permission to access it"
            })
        }

        // Verify ownership of the research view
        const { data: researchView, error: researchViewError } = await supabase
            .from('research_views')
            .select('id')
            .eq('id', dataSource.research_view_id)
            .eq('user_id', userId)
            .single()

        if (researchViewError || !researchView) {
            return res.status(404).json({
                error: "Research view not found or you don't have permission to access it"
            })
        }

        // Prepare query to get documents
        let query = supabase.from('documents').select('*, document_metadata(*)', { count: 'exact' }).eq('source_id', sourceId)

        // Apply sorting if specified
        if (sort) {
            const [field, order] = sort.split(':')
            query = query.order(field, { ascending: order === 'asc' })
        } else {
            // Default sorting by publication date or created_at
            query = query.order('publication_date', {
                ascending: false,
                nullsLast: true
            })
        }

        // Apply pagination
        const offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        // Execute query
        const { data: documents, error: documentsError, count } = await query

        if (documentsError) throw documentsError

        // Calculate total pages
        const totalPages = Math.ceil(count / limit)

        return res.json({
            data: documents || [],
            count,
            page: Number.parseInt(page),
            totalPages
        })
    } catch (error) {
        console.error('Error fetching documents by source:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get document embeddings for visualization
 * This function retrieves document embeddings for a research view to enable
 * visualization of document similarity in the UI.
 */
export const getDocumentEmbeddings = async (req, res) => {
    try {
        const { viewId } = req.params

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        // Verify access to the research view
        const { data: researchView, error: viewError } = await supabase
            .from('research_views')
            .select('*')
            .eq('id', viewId)
            .eq('user_id', userId)
            .single()

        if (viewError || !researchView) {
            return res.status(404).json({ error: 'Research view not found or access denied' })
        }

        // Get the document store ID
        const storeId = researchView.answerai_store_id
        if (!storeId) {
            return res.status(404).json({
                error: 'No document store found for this research view',
                message: 'Please vectorize documents first'
            })
        }

        // Query the documents with their embeddings
        // First determine if we should filter by store_id or not
        let query = supabase.from('aai_documents').select('id, content, embedding, metadata')

        try {
            // Check if there's a store_id column by querying a single row
            const { data: sampleDoc, error: sampleError } = await supabase.from('aai_documents').select('store_id').limit(1)

            // If store_id exists and no error, filter by it
            if (!sampleError && sampleDoc) {
                query = query.eq('store_id', storeId)
            } else {
                console.log('store_id column might not exist in aai_documents table, skipping filter')
            }
        } catch (err) {
            console.log('Could not determine if store_id exists, skipping filter:', err.message)
        }

        // Execute the query
        const { data: documents, error: docsError } = await query.order('id', { ascending: true })

        if (docsError) {
            console.error('Error fetching document embeddings:', docsError)
            return res.status(500).json({
                error: 'Failed to retrieve document embeddings',
                details: docsError.message
            })
        }

        // Filter documents to include only those with embeddings and validate embedding format
        const documentsWithEmbeddings = documents.filter((doc) => {
            // Check if embedding exists and is in a valid format
            if (!doc.embedding) return false

            // Handle different embedding formats - could be JSON string or array
            try {
                if (typeof doc.embedding === 'string') {
                    // Try to parse if it's a JSON string
                    const parsed = JSON.parse(doc.embedding)
                    return Array.isArray(parsed) && parsed.length > 0
                }

                // Could be a special PostgreSQL vector type - convert to array
                if (doc.embedding && typeof doc.embedding === 'object' && doc.embedding.length !== undefined) {
                    return true
                }

                return Array.isArray(doc.embedding) && doc.embedding.length > 0
            } catch (e) {
                console.error(`Invalid embedding format for document ${doc.id}:`, e)
                return false
            }
        })

        if (documentsWithEmbeddings.length === 0) {
            return res.status(404).json({
                error: 'No documents with valid embeddings found',
                message: 'Please ensure documents are properly vectorized'
            })
        }

        // Create a more lightweight response with essential data for visualization
        const visualizationData = documentsWithEmbeddings.map((doc) => {
            // Extract a title from metadata or content
            let title = 'Document'

            if (doc.metadata && typeof doc.metadata === 'object') {
                // Try to get title from metadata
                if (doc.metadata.title) {
                    title = doc.metadata.title
                } else if (doc.metadata.name) {
                    title = doc.metadata.name
                } else if (doc.metadata.document_name) {
                    title = doc.metadata.document_name
                }
            }

            // If no title from metadata, use first 30 chars of content
            if (title === 'Document' && doc.content) {
                title = doc.content.substring(0, 30) + (doc.content.length > 30 ? '...' : '')
            }

            // Ensure embedding is in array format
            let embeddingArray
            try {
                if (typeof doc.embedding === 'string') {
                    embeddingArray = JSON.parse(doc.embedding)
                } else if (doc.embedding && typeof doc.embedding === 'object') {
                    // Could be a PG vector type - try to convert to array
                    embeddingArray = Array.from(doc.embedding)
                } else {
                    embeddingArray = doc.embedding
                }
            } catch (e) {
                console.error(`Error parsing embedding for document ${doc.id}:`, e)
                // Provide a fallback embedding
                embeddingArray = Array(10)
                    .fill(0)
                    .map(() => Math.random())
            }

            return {
                id: doc.id,
                title: title,
                embedding: embeddingArray,
                metadata: doc.metadata
            }
        })

        return res.status(200).json({
            success: true,
            data: visualizationData,
            count: visualizationData.length
        })
    } catch (error) {
        console.error('Error in getDocumentEmbeddings:', error)
        return res.status(500).json({
            error: 'An error occurred while retrieving document embeddings',
            details: error.message
        })
    }
}

/**
 * Process a document using Unstructured and return the structured data
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const processDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const filePath = req.file.path

        // Process the file using Unstructured API
        const structuredData = await unstructuredService.processFile(filePath)

        // Return the structured data
        return res.status(200).json(structuredData)
    } catch (error) {
        console.error('Error processing document:', error)
        return res.status(500).json({ error: `Failed to process document: ${error.message}` })
    }
}

/**
 * Extract text from a document using Unstructured
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const extractTextFromDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const filePath = req.file.path

        // Extract text from the file
        const extractedText = await unstructuredService.extractText(filePath)

        // Return the extracted text
        return res.status(200).json({ text: extractedText })
    } catch (error) {
        console.error('Error extracting text from document:', error)
        return res.status(500).json({ error: `Failed to extract text: ${error.message}` })
    }
}

/**
 * Check if Unstructured API is available
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkUnstructuredStatus = async (req, res) => {
    try {
        const isAvailable = await unstructuredService.checkApiStatus()

        if (isAvailable) {
            return res.status(200).json({ status: 'available' })
        }

        return res.status(503).json({ status: 'unavailable' })
    } catch (error) {
        console.error('Error checking Unstructured status:', error)
        return res.status(500).json({ error: `Failed to check status: ${error.message}` })
    }
}

export default {
    processDocument,
    extractTextFromDocument,
    checkUnstructuredStatus
}
