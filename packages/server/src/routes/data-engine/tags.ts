import express from 'express'
import tagsController from '../../controllers/data-engine/tags'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import { validateCreateTag, validateUpdateTag } from '../../middlewares/validation/dataEngineValidation'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('DataEngineTag'), validateCreateTag, tagsController.createTag)

// READ
router.get('/', enforceAbility('DataEngineTag'), tagsController.getAllTags)
router.get('/hierarchy', enforceAbility('DataEngineTag'), tagsController.getTagHierarchy)
router.get('/:id', enforceAbility('DataEngineTag'), tagsController.getTagById)

// UPDATE
router.put('/:id', enforceAbility('DataEngineTag'), validateUpdateTag, tagsController.updateTag)

// DELETE
router.delete('/:id', enforceAbility('DataEngineTag'), tagsController.deleteTag)

export default router
