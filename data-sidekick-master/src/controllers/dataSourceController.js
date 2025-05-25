import { supabase } from '../config/db.js'
import { fetchWebsiteContent } from '../utils/websiteUtils.js'
import { processDocument } from '../utils/documentProcessor.js'
import { logTokenUsage } from '../utils/usageTracker.js'

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
 * Add a new data source to a research view
 */
export const addDataSource = async (req, res) => {
    try {
        const { viewId } = req.params
        const { sourceType, url, filePath, filterDateStart, filterDateEnd, filterPaths } = req.body

        if (sourceType === 'website' && !url) {
            return res.status(400).json({ error: 'URL is required for website source type' })
        }

        if (sourceType === 'file' && !filePath) {
            return res.status(400).json({ error: 'File path is required for file source type' })
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
            .eq('id', viewId)
            .eq('user_id', userId)
            .single()

        if (checkError || !existingView) {
            return res.status(404).json({ error: "Research view not found or you don't have permission to add to it" })
        }

        // Create the data source
        const { data: dataSource, error } = await supabase
            .from('data_sources')
            .insert({
                research_view_id: viewId,
                source_type: sourceType,
                url: sourceType === 'website' ? url : null,
                file_path: sourceType === 'file' ? filePath : null,
                filter_date_start: filterDateStart || null,
                filter_date_end: filterDateEnd || null,
                filter_paths: filterPaths || null,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        // Trigger the fetch process asynchronously
        if (sourceType === 'website') {
            fetchWebsiteContent(dataSource)
                .then(() => {
                    console.log(`Website fetch completed for source ${dataSource.id}`)
                })
                .catch((err) => {
                    console.error(`Error fetching website for source ${dataSource.id}:`, err)
                    // Update data source status to error
                    supabase
                        .from('data_sources')
                        .update({
                            status: 'error',
                            error_message: err.message,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', dataSource.id)
                })
        }

        // Return the created data source
        res.status(201).json({ data: dataSource })
    } catch (error) {
        console.error('Error adding data source:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get all data sources for a research view
 */
export const getDataSourcesByResearchView = async (req, res) => {
    try {
        const { viewId } = req.params

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
            return res.status(404).json({ error: "Research view not found or you don't have permission to access it" })
        }

        const { data, error } = await supabase
            .from('data_sources')
            .select('*')
            .eq('research_view_id', viewId)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Add document counts to each data source
        const dataSourcesWithCounts = await Promise.all(
            data.map(async (source) => {
                const { count, error: countError } = await supabase
                    .from('documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('source_id', source.id)

                if (countError) {
                    console.error('Error counting documents:', countError)
                    return { ...source, document_count: 0 }
                }

                return { ...source, document_count: count || 0 }
            })
        )

        res.json({ data: dataSourcesWithCounts })
    } catch (error) {
        console.error('Error fetching data sources:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Refresh a data source (re-fetch content)
 */
export const refreshDataSource = async (req, res) => {
    try {
        const { id } = req.params

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Get the data source
        const { data: dataSource, error: fetchError } = await supabase
            .from('data_sources')
            .select('*, research_views!inner(*)')
            .eq('id', id)
            .single()

        if (fetchError || !dataSource) {
            return res.status(404).json({ error: 'Data source not found' })
        }

        // Verify ownership through the research view
        if (dataSource.research_views.user_id !== userId) {
            return res.status(403).json({ error: "You don't have permission to refresh this data source" })
        }

        // Update status to fetching
        await supabase
            .from('data_sources')
            .update({
                status: 'fetching',
                last_fetched_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        // Trigger the refresh process asynchronously
        if (dataSource.source_type === 'website') {
            fetchWebsiteContent(dataSource, true) // true indicates refresh
                .then(() => {
                    console.log(`Website refresh completed for source ${id}`)
                })
                .catch((err) => {
                    console.error(`Error refreshing website for source ${id}:`, err)
                    // Update data source status to error
                    supabase
                        .from('data_sources')
                        .update({
                            status: 'error',
                            error_message: err.message,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', id)
                })
        }

        res.json({
            success: true,
            message: 'Data source refresh initiated',
            data: {
                id: dataSource.id,
                status: 'fetching'
            }
        })
    } catch (error) {
        console.error('Error refreshing data source:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a data source
 */
export const deleteDataSource = async (req, res) => {
    try {
        const { id } = req.params

        // Get Auth0 user ID from authentication
        const auth0Id = req.oidc.user?.sub

        // Get Supabase user ID
        const userId = await getSupabaseUserId(auth0Id)

        if (!userId) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Get the data source
        const { data: dataSource, error: fetchError } = await supabase
            .from('data_sources')
            .select('*, research_views!inner(*)')
            .eq('id', id)
            .single()

        if (fetchError || !dataSource) {
            return res.status(404).json({ error: 'Data source not found' })
        }

        // Verify ownership through the research view
        if (dataSource.research_views.user_id !== userId) {
            return res.status(403).json({ error: "You don't have permission to delete this data source" })
        }

        // Delete the data source (cascading will handle documents)
        const { error } = await supabase.from('data_sources').delete().eq('id', id)

        if (error) throw error

        res.json({ success: true, message: 'Data source deleted successfully' })
    } catch (error) {
        console.error('Error deleting data source:', error)
        res.status(500).json({ error: error.message })
    }
}
