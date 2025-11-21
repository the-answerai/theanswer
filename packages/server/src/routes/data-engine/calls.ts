import express from 'express'
import callsController from '../../controllers/data-engine/calls'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import { validateCreateCall, validateUpdateCall, validatePaginationParams } from '../../middlewares/validation/dataEngineValidation'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('DataEngineCall'), validateCreateCall, callsController.createCall)

// READ
router.get('/', enforceAbility('DataEngineCall'), validatePaginationParams, callsController.getAllCalls)
router.get('/:id', enforceAbility('DataEngineCall'), callsController.getCallById)

// UPDATE
router.put('/:id', enforceAbility('DataEngineCall'), validateUpdateCall, callsController.updateCall)

// DELETE
router.delete('/:id', enforceAbility('DataEngineCall'), callsController.deleteCall)

export default router
