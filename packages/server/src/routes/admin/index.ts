import express from 'express'
import chatflowsController from '../../controllers/chatflows'
import organizationsController from '../../controllers/organizations'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
const router = express.Router()

// CHATFLOWS
// READ
router.get('/chatflows', enforceAbility('ChatFlow'), chatflowsController.getAdminChatflows)
router.get('/chatflows/default-template', enforceAbility('ChatFlow'), chatflowsController.getDefaultChatflowTemplate)
router.get('/chatflows/:id/versions', enforceAbility('ChatFlow'), chatflowsController.getChatflowVersions)
// UPDATE
router.put('/chatflows/bulk-update', enforceAbility('ChatFlow'), chatflowsController.bulkUpdateChatflows)
router.post('/chatflows/:id/rollback/:version', enforceAbility('ChatFlow'), chatflowsController.rollbackChatflowToVersion)

// ORGANIZATIONS
// READ - temporarily without enforceAbility for debugging
router.get('/organizations/:id', organizationsController.getOrganizationById)

// UPDATE - temporarily without enforceAbility for debugging
router.put('/organizations/:id/enabled-integrations', organizationsController.updateOrganizationEnabledIntegrations)

export default router
