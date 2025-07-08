import express from 'express'
import chatflowsController from '../../controllers/chatflows'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
const router = express.Router()

// READ
router.get('/chatflows', enforceAbility('ChatFlow'), chatflowsController.getAdminChatflows)

export default router
