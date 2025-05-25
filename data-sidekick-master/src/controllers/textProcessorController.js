import { processText, getProcessingStatus, processAndStoreText } from '../services/textProcessor/index.js'
import { validateConfig } from '../services/textProcessor/utils.js'
import authUtils, { getSupabaseUserId } from '../utils/auth.js'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

/**
 * Process text content with AnswerAI
 */
export const processTextContent = async (req, res) => {
    try {
        const { text, documentId, format, chatflowId, metadata, researchViewId } = req.body

        console.log('Text processing request received:', {
            documentId,
            format,
            chatflowId: chatflowId ? 'provided' : 'not provided',
            researchViewId: researchViewId || 'not provided',
            textLength: text ? text.length : 0
        })

        if (!text) {
            return res.status(400).json({ error: 'Text content is required' })
        }

        let validatedResearchViewId = null

        // If researchViewId is provided, verify ownership
        if (researchViewId) {
            console.log('Using provided research view ID:', researchViewId)
            const auth0Id = req.oidc.user?.sub
            const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

            if (!userId) {
                return res.status(401).json({ error: 'User not found' })
            }

            // Verify research view ownership
            const { data: researchView, error: researchViewError } = await supabase
                .from('research_views')
                .select('id, user_id')
                .eq('id', researchViewId)
                .eq('user_id', userId)
                .single()

            if (researchViewError) {
                console.error('Error verifying research view:', researchViewError)
                return res.status(404).json({
                    error: "Research view not found or you don't have permission to access it",
                    details: researchViewError.message
                })
            }

            validatedResearchViewId = researchView.id
            console.log('Research view ownership verified:', validatedResearchViewId)
        }

        // Get the appropriate chatflow ID
        const effectiveChatflowId = chatflowId || process.env.ANSWERAI_ANALYSIS_CHATFLOW
        if (!effectiveChatflowId) {
            return res.status(500).json({ error: 'No analysis chatflow ID configured' })
        }

        console.log('Processing text with chatflow:', effectiveChatflowId)

        // Process the text
        const result = await processText(text, {
            chatflowId: effectiveChatflowId,
            format: format || 'plain',
            documentId,
            researchViewId: validatedResearchViewId,
            metadata: metadata || {}
        })

        res.json(result)
    } catch (error) {
        console.error('Error processing text:', error)
        res.status(500).json({
            error: 'Error processing text',
            message: error.message
        })
    }
}

/**
 * Get processing status for a document
 */
export const getTextProcessingStatus = async (req, res) => {
    try {
        const { documentId } = req.params

        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' })
        }

        const status = await getProcessingStatus(documentId)
        res.json(status)
    } catch (error) {
        console.error('Error getting processing status:', error)
        res.status(500).json({
            error: 'Error getting processing status',
            message: error.message
        })
    }
}

/**
 * Process and store text as a document with metadata
 * This endpoint handles the full workflow:
 * 1. Create document record
 * 2. Process with AnswerAI
 * 3. Store analysis as metadata
 */
export const processAndStoreDocument = async (req, res) => {
    try {
        const { text, sourceId, title, format, chatflowId, fileType } = req.body
        let { skipAnalysis } = req.body

        console.log('Process and store document request received:', {
            sourceId,
            title: title || '[Not provided]',
            format: format || 'plain',
            fileType: fileType || 'transcript',
            skipAnalysis: skipAnalysis || false,
            textLength: text ? text.length : 0
        })

        // Validate required fields
        if (!text) {
            return res.status(400).json({ error: 'Text content is required' })
        }

        if (!sourceId) {
            return res.status(400).json({ error: 'Source ID is required' })
        }

        // Verify ownership of the data source
        const auth0Id = req.oidc.user?.sub
        const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Check if the source exists and user has access to it
        const { data: source, error: sourceError } = await supabase
            .from('data_sources')
            .select(
                `
                id,
                research_views!inner(
                    id,
                    user_id
                )
            `
            )
            .eq('id', sourceId)
            .eq('research_views.user_id', userId)
            .single()

        if (sourceError || !source) {
            console.error('Error verifying source ownership:', sourceError)
            return res.status(404).json({
                error: "Data source not found or you don't have permission to access it",
                details: sourceError?.message
            })
        }

        console.log('Source ownership verified:', source.id)

        // Get the appropriate chatflow ID if we're not skipping analysis
        let effectiveChatflowId = null
        if (!skipAnalysis) {
            effectiveChatflowId = chatflowId || process.env.ANSWERAI_ANALYSIS_CHATFLOW
            if (!effectiveChatflowId) {
                console.warn('No analysis chatflow ID configured, proceeding without analysis')
                // Instead of failing, just skip the analysis
                skipAnalysis = true
            } else {
                console.log('Using chatflow for analysis:', effectiveChatflowId)
            }
        }

        // Process and store the document
        const result = await processAndStoreText(text, {
            sourceId,
            title,
            chatflowId: effectiveChatflowId,
            format: format || 'plain',
            fileType: fileType || 'transcript',
            skipAnalysis: skipAnalysis
        })

        if (!result.success) {
            return res.status(500).json({
                error: 'Error processing and storing document',
                message: result.error
            })
        }

        // Return more detailed information about the processing result
        const response = {
            success: true,
            documentId: result.documentId,
            document: result.document,
            status: result.document.status
        }

        // If there was an analysis error but the document was created
        if (result.error) {
            response.warning = 'Document was created, but analysis failed'
            response.analysisError = result.error
        }

        // If there was analysis data
        if (result.result) {
            response.analysisComplete = true
        }

        res.json(response)
    } catch (error) {
        console.error('Error processing and storing document:', error)
        res.status(500).json({
            error: 'Error processing and storing document',
            message: error.message
        })
    }
}

/**
 * Get the processing status for a document
 */
export const getDocumentProcessingStatus = async (req, res) => {
    try {
        const { documentId } = req.params

        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' })
        }

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID - try both import methods
        const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Verify document ownership
        const { data: document, error: documentError } = await supabase
            .from('documents')
            .select(
                `
                id,
                source_id,
                data_sources!inner(
                    research_view_id,
                    research_views!inner(
                        user_id
                    )
                )
            `
            )
            .eq('id', documentId)
            .eq('data_sources.research_views.user_id', userId)
            .single()

        if (documentError || !document) {
            return res.status(404).json({
                error: "Document not found or you don't have permission to access it"
            })
        }

        // Get the processing status
        const status = await getProcessingStatus(documentId)

        res.json({
            success: true,
            data: status
        })
    } catch (error) {
        console.error('Error getting processing status:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get analyses for a specific research view
 */
export const getResearchViewAnalyses = async (req, res) => {
    try {
        const { viewId } = req.params

        if (!viewId) {
            return res.status(400).json({ error: 'Research view ID is required' })
        }

        // Verify ownership of the research view
        const auth0Id = req.oidc.user?.sub
        const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Verify research view ownership
        const { data: researchView, error: researchViewError } = await supabase
            .from('research_views')
            .select('id, name')
            .eq('id', viewId)
            .eq('user_id', userId)
            .single()

        if (researchViewError || !researchView) {
            return res.status(404).json({
                error: "Research view not found or you don't have permission to access it"
            })
        }

        // Get all documents for this research view that have metadata
        const { data: documents, error: documentsError } = await supabase
            .from('documents')
            .select(
                `
                id,
                title,
                content_summary,
                file_type,
                created_at,
                document_metadata(*)
            `
            )
            .eq('status', 'processed')
            .order('created_at', { ascending: false })

        if (documentsError) {
            console.error('Error fetching documents with metadata:', documentsError)
            return res.status(500).json({
                error: 'Error fetching documents',
                details: documentsError.message
            })
        }

        // Format the results
        const analyses = documents.map((doc) => {
            // Convert document_metadata array to an object
            const metadata = {}
            if (doc.document_metadata) {
                for (const meta of doc.document_metadata) {
                    let value = meta.field_value

                    // Try to parse JSON values
                    try {
                        if (value && typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                            value = JSON.parse(value)
                        }
                    } catch (e) {
                        // Keep as string if parsing fails
                    }

                    metadata[meta.field_name] = value
                }
            }

            return {
                documentId: doc.id,
                title: doc.title,
                summary: doc.content_summary,
                fileType: doc.file_type,
                createdAt: doc.created_at,
                metadata
            }
        })

        res.json({
            researchViewId: viewId,
            researchViewName: researchView.name,
            analyses
        })
    } catch (error) {
        console.error('Error getting research view analyses:', error)
        res.status(500).json({
            error: 'Error getting research view analyses',
            message: error.message
        })
    }
}

/**
 * Test connection to AnswerAI
 */
export const testConnection = async (req, res) => {
    try {
        // Use the validate configuration utility from the text processor
        const config = await validateConfig()

        res.json({
            success: config.isValid,
            endpoint: config.endpoint,
            errors: config.errors
        })
    } catch (error) {
        console.error('Error testing connection:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}
