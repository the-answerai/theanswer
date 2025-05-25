import { supabase } from '../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import path from 'node:path'
import { processTextDocument, upsertTextDocument } from '../services/answerAI/documentProcessor.js'
import { processText } from '../services/textProcessor/index.js'
import authUtils, { getSupabaseUserId } from '../utils/auth.js'

/**
 * Get a signed URL for file upload
 */
export const getUploadUrl = async (req, res) => {
    try {
        const { viewId } = req.params
        const { fileName, fileType, fileSize } = req.body

        console.log('Upload URL request:', {
            viewId,
            fileName,
            fileType,
            fileSize
        })

        if (!viewId || !fileName || !fileType || !fileSize) {
            return res.status(400).json({ error: 'Missing required parameters' })
        }

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID - try both import methods
        const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Verify research view ownership
        const { data: researchView, error: viewError } = await supabase
            .from('research_views')
            .select('id, name')
            .eq('id', viewId)
            .eq('user_id', userId)
            .single()

        if (viewError || !researchView) {
            return res.status(404).json({ error: "Research view not found or you don't have permission to access it" })
        }

        // Get file extension
        const fileExtension = path.extname(fileName)
        const baseFileName = path.basename(fileName, fileExtension)

        // Sanitize filename: remove special characters like brackets, parentheses, spaces
        const sanitizedFileName = baseFileName
            .replace(/[\[\]\(\)\{\}]/g, '') // Remove brackets and parentheses
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/[^a-zA-Z0-9_\-\.]/g, '') // Keep only alphanumeric, underscore, dash, and period
            .trim()

        // Generate a unique file name to avoid conflicts
        const uniqueFileName = `${sanitizedFileName}_${Date.now()}${fileExtension}`

        // Define the storage path (in the unprocessed folder)
        const storagePath = `${viewId}/unprocessed/${uniqueFileName}`
        console.log('Generated storage path:', storagePath)

        // Generate a signed URL for upload
        console.log('Creating signed URL for bucket:', 'research_files')
        const { data: signedUrl, error: signedUrlError } = await supabase.storage.from('research_files').createSignedUploadUrl(storagePath)

        if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError)
            throw signedUrlError
        }

        console.log('Signed URL created successfully:', signedUrl)

        // Determine file category based on MIME type
        const fileCategory = categorizeFileByMimeType(fileType)
        console.log('Categorized file type:', fileCategory, 'for MIME type:', fileType)

        // Create a record in the research_files table
        const { data: fileRecord, error: fileRecordError } = await supabase
            .from('research_files')
            .insert({
                research_view_id: viewId,
                storage_path: storagePath,
                filename: fileName, // Keep the original filename in the database for display
                file_type: fileCategory,
                file_size: fileSize,
                mime_type: fileType,
                status: 'unprocessed',
                metadata: {
                    original_name: fileName,
                    sanitized_name: uniqueFileName
                }
            })
            .select()
            .single()

        if (fileRecordError) {
            console.error('Error creating file record:', fileRecordError)
            throw fileRecordError
        }

        console.log('File record created successfully:', fileRecord.id)

        res.json({
            signedUrl: signedUrl.signedUrl,
            fileRecord,
            path: storagePath
        })
    } catch (error) {
        console.error('Error generating upload URL:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Categorize a file based on its MIME type
 * @param {string} mimeType - The MIME type of the file
 * @returns {string} - The category of the file (text, document, spreadsheet, presentation, audio, video, image)
 */
function categorizeFileByMimeType(mimeType) {
    const mimeTypeMap = {
        // Text files
        'text/plain': 'text',
        'text/csv': 'text',
        'text/markdown': 'text',

        // Documents
        'application/pdf': 'document',
        'application/msword': 'document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
        'application/rtf': 'document',

        // Spreadsheets
        'application/vnd.ms-excel': 'spreadsheet',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',

        // Presentations
        'application/vnd.ms-powerpoint': 'presentation',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',

        // Audio
        'audio/mpeg': 'audio',
        'audio/mp4': 'audio',
        'audio/wav': 'audio',
        'audio/webm': 'audio',
        'audio/ogg': 'audio',

        // Video
        'video/mp4': 'video',
        'video/webm': 'video',
        'video/quicktime': 'video',
        'video/x-msvideo': 'video',

        // Images
        'image/jpeg': 'image',
        'image/png': 'image',
        'image/gif': 'image',
        'image/webp': 'image',

        // JSON
        'application/json': 'data'
    }

    return mimeTypeMap[mimeType] || 'other'
}

/**
 * Get files for a research view
 */
export const getResearchViewFiles = async (req, res) => {
    try {
        const { viewId } = req.params

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID - try both import methods
        const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Verify research view ownership
        const { data: researchView, error: viewError } = await supabase
            .from('research_views')
            .select('id')
            .eq('id', viewId)
            .eq('user_id', userId)
            .single()

        if (viewError || !researchView) {
            return res.status(404).json({ error: "Research view not found or you don't have permission to access it" })
        }

        // Get files for the research view
        const { data: files, error: filesError } = await supabase
            .from('research_files')
            .select('*')
            .eq('research_view_id', viewId)
            .order('created_at', { ascending: false })

        if (filesError) {
            throw filesError
        }

        res.json({ data: files })
    } catch (error) {
        console.error('Error fetching research view files:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Process an uploaded file
 */
export const processFile = async (req, res) => {
    try {
        const { fileId } = req.params

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID - try both import methods
        const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Get the file details with research view info
        const { data: fileData, error: fileError } = await supabase
            .from('research_files')
            .select(
                `
                *,
                research_views!inner (
                    id,
                    user_id,
                    answerai_store_id
                )
            `
            )
            .eq('id', fileId)
            .eq('research_views.user_id', userId)
            .single()

        if (fileError || !fileData) {
            return res.status(404).json({ error: "File not found or you don't have permission to access it" })
        }

        // Update the file status to processing
        await supabase
            .from('research_files')
            .update({
                status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', fileId)

        // Based on file type, determine how to process it
        try {
            const storagePath = fileData.storage_path
            const storeId = fileData.research_views.answerai_store_id
            const researchViewId = fileData.research_views.id

            if (!storeId) {
                throw new Error('Research view does not have an AnswerAI document store')
            }

            // Download the file from storage
            const { data: fileContent, error: downloadError } = await supabase.storage.from('research_files').download(storagePath)

            if (downloadError) {
                throw downloadError
            }

            // Process the file based on its type
            let result
            const fileType = fileData.file_type
            const mimeType = fileData.mime_type

            // For text-based files, process directly as text
            if (fileType === 'text' || fileType === 'document' || fileType === 'data') {
                // Convert the blob to text
                const text = await fileContent.text()

                // Determine the appropriate format based on mime type
                let format = 'plain'
                if (mimeType.includes('html')) {
                    format = 'html'
                } else if (mimeType.includes('markdown')) {
                    format = 'markdown'
                } else if (mimeType.includes('json')) {
                    format = 'json'
                }

                // Get the appropriate chatflow ID for document analysis
                // Default to the analysis chatflow if not specified
                const chatflowId = process.env.ANSWERAI_DOCUMENT_ANALYSIS_CHATFLOW || process.env.ANSWERAI_ANALYSIS_CHATFLOW

                if (!chatflowId) {
                    throw new Error('No analysis chatflow ID configured')
                }

                // Process with the text processor service
                result = await processText(text, {
                    chatflowId,
                    format,
                    documentId: fileData.id,
                    researchViewId,
                    metadata: {
                        filename: fileData.filename,
                        mimeType: fileData.mime_type,
                        fileType: fileData.file_type,
                        fileSize: fileData.file_size,
                        source: 'research_file'
                    }
                })

                if (!result.success) {
                    throw new Error(result.error || 'Failed to process text document')
                }

                // Also process with AnswerAI document store for vector search
                await upsertTextDocument(
                    storeId,
                    text,
                    {
                        filename: fileData.filename,
                        fileId: fileData.id,
                        documentId: fileData.id,
                        mimeType: fileData.mime_type,
                        source: 'research_file',
                        url: `file://${fileData.filename}`
                    },
                    null,
                    true
                )
            }
            // For other files like audio, video, etc. we would need additional processing
            // This would be implemented later with specialized services for transcription, etc.
            else {
                throw new Error(`Processing for file type ${fileType} not yet implemented`)
            }

            // Update the file status to processed
            await supabase
                .from('research_files')
                .update({
                    status: 'processed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', fileId)

            res.json({
                success: true,
                message: 'File processed successfully',
                fileId: fileId
            })
        } catch (processingError) {
            console.error('Error processing file:', processingError)

            // Update the file status to error
            await supabase
                .from('research_files')
                .update({
                    status: 'error',
                    error_message: processingError.message,
                    updated_at: new Date().toISOString()
                })
                .eq('id', fileId)

            res.status(500).json({
                error: 'Error processing file',
                message: processingError.message
            })
        }
    } catch (error) {
        console.error('Error in processFile:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a file
 */
export const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID - try both import methods
        const userId = (await getSupabaseUserId(auth0Id)) || (await authUtils.getSupabaseUserId(auth0Id))

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Get the file details with research view info
        const { data: fileData, error: fileError } = await supabase
            .from('research_files')
            .select(
                `
                *,
                research_views!inner (
                    id,
                    user_id
                )
            `
            )
            .eq('id', fileId)
            .eq('research_views.user_id', userId)
            .single()

        if (fileError || !fileData) {
            return res.status(404).json({ error: "File not found or you don't have permission to access it" })
        }

        // Delete the file from storage
        const { error: storageError } = await supabase.storage.from('research_files').remove([fileData.storage_path])

        if (storageError) {
            console.error('Error deleting file from storage:', storageError)
        }

        // Delete the file record from the database
        const { error: dbError } = await supabase.from('research_files').delete().eq('id', fileId)

        if (dbError) {
            throw dbError
        }

        res.json({
            success: true,
            message: 'File deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting file:', error)
        res.status(500).json({ error: error.message })
    }
}
