import express from 'express'
import chatflowsController from '../../controllers/chatflows'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
const router = express.Router()

// CREATE
router.post('/', enforceAbility('ChatFlow'), chatflowsController.saveChatflow)
router.post('/importchatflows', enforceAbility('ChatFlow'), chatflowsController.importChatflows)

// READ
router.get('/', enforceAbility('ChatFlow'), chatflowsController.getAllChatflows)
router.get(['/', '/:id'], enforceAbility('ChatFlow'), chatflowsController.getChatflowById)
router.get(['/apikey/', '/apikey/:apikey'], enforceAbility('ChatFlow'), chatflowsController.getChatflowByApiKey)

// UPDATE
router.put(['/', '/:id'], enforceAbility('ChatFlow'), chatflowsController.updateChatflow)

// DELETE
router.delete(['/', '/:id'], enforceAbility('ChatFlow'), chatflowsController.deleteChatflow)

export default router
