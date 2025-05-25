import { supabase } from '../config/db.js'
import { createAnswerAIDocumentStore } from '../utils/documentProcessor.js'
import { createChatflowForResearchView } from '../services/answerAI/chatflowBuilder.js'

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
 * Create a new research view
 */
export const createResearchView = async (req, res) => {
    try {
        const { name, description } = req.body

        if (!name) {
            return res.status(400).json({ error: 'Research view name is required' })
        }

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        const { data, error } = await supabase
            .from('research_views')
            .insert({
                name,
                description,
                user_id: userId
            })
            .select()
            .single()

        if (error) throw error

        // Create folder structure in storage bucket
        try {
            // Create an empty file to establish the folder structure
            // Supabase doesn't have a direct "create folder" API, so we create
            // placeholder files to establish the folder structure
            const researchViewId = data.id

            // Create unprocessed folder by creating a placeholder .keep file
            const unprocessedPath = `${researchViewId}/unprocessed/.keep`
            const { error: storageError } = await supabase.storage.from('research_files').upload(unprocessedPath, new Uint8Array(0), {
                contentType: 'text/plain'
            })

            if (storageError) {
                console.error('Error creating storage folders:', storageError)
            } else {
                console.log(`Created storage folders for research view: ${researchViewId}`)
            }
        } catch (storageError) {
            console.error('Error setting up storage for research view:', storageError)
            // Continue with the response even if storage setup fails
        }

        // Create AnswerAI document store for the new research view
        try {
            const docStoreResult = await createAnswerAIDocumentStore(data)

            // If document store was created successfully, create a chatflow
            if (docStoreResult) {
                // Get the updated research view with the document store ID
                const { data: updatedView, error: refreshError } = await supabase
                    .from('research_views')
                    .select('*')
                    .eq('id', data.id)
                    .single()

                if (!refreshError && updatedView.answerai_store_id) {
                    // Create a chatflow for the research view
                    try {
                        await createChatflowForResearchView(updatedView)
                    } catch (chatflowError) {
                        console.error('Error creating chatflow:', chatflowError)
                        // Continue with the response even if chatflow creation fails
                    }
                }
            }
        } catch (docStoreError) {
            console.error('Error creating AnswerAI document store:', docStoreError)
            // Continue with the response even if document store creation fails
        }

        res.status(201).json({ data })
    } catch (error) {
        console.error('Error creating research view:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get all research views for the authenticated user
 */
export const getAllResearchViews = async (req, res) => {
    try {
        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        const { data, error } = await supabase
            .from('research_views')
            .select(
                `
                *,
                data_sources (
                    id,
                    source_type,
                    url,
                    status,
                    last_fetched_at
                ),
                reports (
                    id,
                    name,
                    created_at
                )
            `
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Count documents per research view
        const researchViewsWithCounts = await Promise.all(
            data.map(async (view) => {
                // Count documents
                const { count: documentCount, error: countError } = await supabase
                    .from('documents')
                    .select('id', { count: 'exact', head: true })
                    .in(
                        'source_id',
                        view.data_sources.map((s) => s.id)
                    )

                if (countError) {
                    console.error('Error counting documents:', countError)
                    return { ...view, document_count: 0 }
                }

                return { ...view, document_count: documentCount || 0 }
            })
        )

        res.json({ data: researchViewsWithCounts })
    } catch (error) {
        console.error('Error fetching research views:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get a specific research view by ID
 */
export const getResearchViewById = async (req, res) => {
    try {
        const { id } = req.params
        console.log(`Getting research view by ID: ${id}`)

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        const { data, error } = await supabase
            .from('research_views')
            .select(
                `
                *,
                data_sources (
                    id,
                    source_type,
                    url,
                    status,
                    last_fetched_at,
                    filter_date_start,
                    filter_date_end,
                    filter_paths
                ),
                reports (
                    id,
                    name,
                    created_at,
                    version
                )
            `
            )
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (error) throw error

        if (!data) {
            return res.status(404).json({ error: 'Research view not found' })
        }

        // Count documents
        const { count: documentCount, error: countError } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .in(
                'source_id',
                data.data_sources.map((s) => s.id)
            )

        if (countError) {
            console.error('Error counting documents:', countError)
        }

        const researchView = {
            ...data,
            document_count: documentCount || 0
        }

        // Create AnswerAI document store if it doesn't exist yet
        console.log(`Checking if research view has document store: ${!!researchView.answerai_store_id}`)
        if (!researchView.answerai_store_id) {
            console.log(`Creating AnswerAI document store for research view: ${id}`)
            try {
                const result = await createAnswerAIDocumentStore(researchView)
                console.log('Document store creation result:', result ? 'Success' : 'Failed')

                // Refresh the research view data to get the updated answerai_store_id
                const { data: updatedData, error: refreshError } = await supabase
                    .from('research_views')
                    .select('answerai_store_id')
                    .eq('id', id)
                    .single()

                if (!refreshError && updatedData) {
                    console.log(`Updated research view with store ID: ${updatedData.answerai_store_id}`)
                    researchView.answerai_store_id = updatedData.answerai_store_id

                    // Check if chatflow already exists
                    if (!researchView.answerai_chatflow_id) {
                        // Create a chatflow for the research view
                        try {
                            console.log('Creating chatflow for research view')
                            await createChatflowForResearchView(researchView)
                        } catch (chatflowError) {
                            console.error('Error creating chatflow:', chatflowError)
                            // Continue with the response even if chatflow creation fails
                        }
                    }
                } else if (refreshError) {
                    console.error(`Error refreshing research view data: ${refreshError.message}`)
                }
            } catch (docStoreError) {
                console.error('Error creating AnswerAI document store:', docStoreError)
                // Continue with the response even if document store creation fails
            }
        } else {
            console.log(`Research view already has document store ID: ${researchView.answerai_store_id}`)

            // Check if chatflow exists, if not, create one
            if (!researchView.answerai_chatflow_id) {
                console.log('Research view does not have a chatflow, creating one')
                try {
                    await createChatflowForResearchView(researchView)
                } catch (chatflowError) {
                    console.error('Error creating chatflow:', chatflowError)
                    // Continue with the response even if chatflow creation fails
                }
            }
        }

        res.json({ data: researchView })
    } catch (error) {
        console.error('Error fetching research view:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Update a research view
 */
export const updateResearchView = async (req, res) => {
    try {
        const { id } = req.params
        const { name, description } = req.body

        if (!name) {
            return res.status(400).json({ error: 'Research view name is required' })
        }

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
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (checkError || !existingView) {
            return res.status(404).json({ error: "Research view not found or you don't have permission to update it" })
        }

        const { data, error } = await supabase
            .from('research_views')
            .update({
                name,
                description,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        res.json({ data })
    } catch (error) {
        console.error('Error updating research view:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a research view
 */
export const deleteResearchView = async (req, res) => {
    try {
        const { id } = req.params

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
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (checkError || !existingView) {
            return res.status(404).json({ error: "Research view not found or you don't have permission to delete it" })
        }

        // Delete the research view (cascading will handle related data)
        const { error } = await supabase.from('research_views').delete().eq('id', id)

        if (error) throw error

        res.json({ success: true, message: 'Research view deleted successfully' })
    } catch (error) {
        console.error('Error deleting research view:', error)
        res.status(500).json({ error: error.message })
    }
}
