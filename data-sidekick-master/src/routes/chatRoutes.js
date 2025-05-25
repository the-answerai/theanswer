import express from 'express'
import { getChats, getChatById, updateChat } from '../controllers/chatController.js'

const router = express.Router()

router.get('/', getChats)
router.get('/:id', getChatById)
router.put('/:id', updateChat)
router.patch('/:id', updateChat)

export default router
