import express from 'express'
import chatsController from '../../controllers/data-engine/chats'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import { validateCreateChat, validateUpdateChat, validatePaginationParams } from '../../middlewares/validation/dataEngineValidation'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('DataEngineChat'), validateCreateChat, chatsController.createChat)

// READ
router.get('/', enforceAbility('DataEngineChat'), validatePaginationParams, chatsController.getAllChats)
router.get('/:id', enforceAbility('DataEngineChat'), chatsController.getChatById)

// UPDATE
router.put('/:id', enforceAbility('DataEngineChat'), validateUpdateChat, chatsController.updateChat)

// DELETE
router.delete('/:id', enforceAbility('DataEngineChat'), chatsController.deleteChat)

export default router
