import express from 'express'
import atlassianAuthController from '../../controllers/atlassian-auth'

const router = express.Router()

// GET /api/v1/atlassian-auth/callback
router.get('/callback', atlassianAuthController.atlassianAuthCallback)

// GET /api/v1/atlassian-auth/mcp-initialize
router.get('/mcp-initialize', atlassianAuthController.mcpInitialize)

export default router
