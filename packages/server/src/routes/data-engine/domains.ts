import express from 'express'
import domainsController from '../../controllers/data-engine/domains'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import { validateCreateDomain, validateUpdateDomain, validatePaginationParams } from '../../middlewares/validation/dataEngineValidation'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('DataEngineDomain'), validateCreateDomain, domainsController.createDomain)

// READ
router.get('/', enforceAbility('DataEngineDomain'), validatePaginationParams, domainsController.getAllDomains)
router.get('/:id', enforceAbility('DataEngineDomain'), domainsController.getDomainById)

// UPDATE
router.put('/:id', enforceAbility('DataEngineDomain'), validateUpdateDomain, domainsController.updateDomain)

// DELETE
router.delete('/:id', enforceAbility('DataEngineDomain'), domainsController.deleteDomain)

export default router
