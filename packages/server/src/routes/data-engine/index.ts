import express from 'express'
import domainsRoutes from './domains'
import urlsRoutes from './urls'
import callsRoutes from './calls'
import tagsRoutes from './tags'
import documentsRoutes from './documents'
import ticketsRoutes from './tickets'
import chatsRoutes from './chats'

const router = express.Router()

// Mount all Data Engine routes
router.use('/domains', domainsRoutes)
router.use('/urls', urlsRoutes)
router.use('/calls', callsRoutes)
router.use('/tags', tagsRoutes)
router.use('/documents', documentsRoutes)
router.use('/tickets', ticketsRoutes)
router.use('/chats', chatsRoutes)

export default router
