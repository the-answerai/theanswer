import express from 'express'
import organizationController from '../../controllers/organizations'

const router = express.Router()

// Note: Organization routes don't use enforceAbility middleware because:
// 1. The Organization entity doesn't have an organizationId field (its id IS the organization)
// 2. Authorization is handled in controllers by verifying req.user.organizationId matches :id param

// Generic organization config endpoints
router.get('/:id/config', organizationController.getOrganizationConfig)
router.put('/:id/config', organizationController.updateOrganizationConfig)

// Guardrails convenience endpoints (must be before generic /:id route)
router.get('/:id/config/guardrails', organizationController.getOrganizationGuardrailsConfig)
router.put('/:id/config/guardrails', organizationController.updateOrganizationGuardrailsConfig)

// Organization metadata
router.get('/:id', organizationController.getOrganizationById)

// Organization credentials (integrations)
router.get('/:id/credentials', organizationController.getOrganizationCredentials)
router.put('/:id/credentials', organizationController.updateOrganizationCredentials)

export default router
