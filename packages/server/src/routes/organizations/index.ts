import express from 'express'
import organizationController from '../../controllers/organizations'
import enforceAbility from '../../middlewares/authentication/enforceAbility'

const router = express.Router()

// Generic organization config endpoints
router.get('/:id/config', enforceAbility('Organization'), organizationController.getOrganizationConfig)
router.put('/:id/config', enforceAbility('Organization'), organizationController.updateOrganizationConfig)

// Guardrails convenience endpoints (must be before generic /:id route)
router.get('/:id/config/guardrails', enforceAbility('Organization'), organizationController.getOrganizationGuardrailsConfig)
router.put('/:id/config/guardrails', enforceAbility('Organization'), organizationController.updateOrganizationGuardrailsConfig)

// Organization metadata
router.get('/:id', enforceAbility('Organization'), organizationController.getOrganizationById)

// Organization credentials (integrations)
router.get('/:id/credentials', enforceAbility('Organization'), organizationController.getOrganizationCredentials)
router.put('/:id/credentials', enforceAbility('Organization'), organizationController.updateOrganizationCredentials)

export default router
