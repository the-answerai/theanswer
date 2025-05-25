import { supabase } from '../config/db.js'

export const getAllUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase.from('users').select('*').order('name', { ascending: true })

        if (error) throw error

        res.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ error: 'Failed to fetch users' })
    }
}
