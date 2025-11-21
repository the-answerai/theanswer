import express from 'express'
import rateLimit from 'express-rate-limit'
import domainsRoutes from './domains'
import urlsRoutes from './urls'
import callsRoutes from './calls'
import tagsRoutes from './tags'
import documentsRoutes from './documents'
import ticketsRoutes from './tickets'
import chatsRoutes from './chats'

const router = express.Router()

// Rate limiter for Data Engine API
// Protects against abuse of expensive external API calls
// Key by organization ID to limit per organization
const dataEngineRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each organization to 100 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Rate limit by organization ID (from authenticated user)
        return req.user?.organizationId || req.ip || 'anonymous'
    },
    message: 'Too many requests to Data Engine API. Please try again later.',
    skip: (req) => {
        // Skip rate limiting if no authentication (will be rejected by enforceAbility anyway)
        return !req.user
    }
})

// Apply rate limiter to all Data Engine routes
router.use(dataEngineRateLimiter)

// Mount all Data Engine routes
router.use('/domains', domainsRoutes)
router.use('/urls', urlsRoutes)
router.use('/calls', callsRoutes)
router.use('/tags', tagsRoutes)
router.use('/documents', documentsRoutes)
router.use('/tickets', ticketsRoutes)
router.use('/chats', chatsRoutes)

export default router
