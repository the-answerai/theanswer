import express from 'express'
import chatsController from '../../controllers/data-engine/chats'

const router = express.Router()

// All routes protected by global authentication middleware (API key or JWT)
router.post('/', chatsController.createChat)
router.get('/', chatsController.getAllChats)
router.get('/:id', chatsController.getChatById)
router.put('/:id', chatsController.updateChat)
router.delete('/:id', chatsController.deleteChat)

export default router
