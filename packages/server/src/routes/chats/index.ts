import express from 'express'
import chatsController from '../../controllers/chats'
import { checkAnyPermission } from '../../enterprise/rbac/PermissionCheck'

const router = express.Router()

// READ - chats are tied to chatflows, use chatflows:view permission
router.get('/', checkAnyPermission('chatflows:view,agentflows:view'), chatsController.getAllChats)
router.get('/:id', checkAnyPermission('chatflows:view,agentflows:view'), chatsController.getChatById)

export default router
