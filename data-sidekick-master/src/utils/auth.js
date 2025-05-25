import { supabase } from '../config/db.js'

/**
 * Get Supabase user ID from Auth0 ID
 * @param {string} auth0Id - The Auth0 ID (sub)
 * @returns {string|null} - The Supabase user ID or null if not found
 */
export const getSupabaseUserId = async (auth0Id) => {
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

// Add a default export as well to ensure compatibility
export default {
    getSupabaseUserId
}
