import express from 'express'
import documentsController from '../../controllers/data-engine/documents'

const router = express.Router()

// All routes protected by global authentication middleware (API key or JWT)
router.post('/', documentsController.createDocument)
router.post('/search', documentsController.searchDocuments)
router.get('/', documentsController.getAllDocuments)
router.get('/:id', documentsController.getDocumentById)
router.put('/:id', documentsController.updateDocument)
router.delete('/:id', documentsController.deleteDocument)

export default router
