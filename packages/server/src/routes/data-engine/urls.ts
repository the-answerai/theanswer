import express from 'express'
import urlsController from '../../controllers/data-engine/urls'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import { validateCreateUrl, validateUpdateUrl, validatePaginationParams } from '../../middlewares/validation/dataEngineValidation'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('DataEngineUrl'), validateCreateUrl, urlsController.createUrl)

// READ
router.get('/', enforceAbility('DataEngineUrl'), validatePaginationParams, urlsController.getAllUrls)
router.get('/:id', enforceAbility('DataEngineUrl'), urlsController.getUrlById)

// UPDATE
router.put('/:id', enforceAbility('DataEngineUrl'), validateUpdateUrl, urlsController.updateUrl)

// DELETE
router.delete('/:id', enforceAbility('DataEngineUrl'), urlsController.deleteUrl)

export default router
