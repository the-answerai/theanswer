import express from 'express'
import documentsController from '../../controllers/data-engine/documents'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import {
    validateCreateDocument,
    validateUpdateDocument,
    validateSearchDocuments,
    validatePaginationParams
} from '../../middlewares/validation/dataEngineValidation'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('DataEngineDocument'), validateCreateDocument, documentsController.createDocument)

// SEARCH
router.post('/search', enforceAbility('DataEngineDocument'), validateSearchDocuments, documentsController.searchDocuments)

// READ
router.get('/', enforceAbility('DataEngineDocument'), validatePaginationParams, documentsController.getAllDocuments)
router.get('/:id', enforceAbility('DataEngineDocument'), documentsController.getDocumentById)

// UPDATE
router.put('/:id', enforceAbility('DataEngineDocument'), validateUpdateDocument, documentsController.updateDocument)

// DELETE
router.delete('/:id', enforceAbility('DataEngineDocument'), documentsController.deleteDocument)

export default router
