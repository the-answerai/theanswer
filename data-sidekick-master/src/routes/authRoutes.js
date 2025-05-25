import express from 'express'
import pkg from 'express-openid-connect'
const { requiresAuth } = pkg
import { supabase } from '../config/db.js'
import { handleUserAuth } from '../utils/authHandler.js'

const router = express.Router()

// Get current authenticated user
router.get('/user', requiresAuth(), async (req, res) => {
    try {
        const user = req.oidc.user

        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' })
        }

        // Get or create user in Supabase
        const supabaseUser = await handleUserAuth(user)

        if (!supabaseUser) {
            return res.status(500).json({ error: 'Failed to get or create user in database' })
        }

        res.json({ user: supabaseUser })
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ error: 'Failed to fetch user information' })
    }
})

// Get user profile by ID (protected route)
router.get('/profile/:id', requiresAuth(), async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single()

        if (error) throw error

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.json(user)
    } catch (error) {
        console.error('Error fetching user profile:', error)
        res.status(500).json({ error: 'Failed to fetch user profile' })
    }
})

export default router
