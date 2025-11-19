import express from 'express'
import urlsController from '../../controllers/data-engine/urls'

const router = express.Router()

// All routes protected by global authentication middleware (API key or JWT)
router.post('/', urlsController.createUrl)
router.get('/', urlsController.getAllUrls)
router.get('/:id', urlsController.getUrlById)
router.put('/:id', urlsController.updateUrl)
router.delete('/:id', urlsController.deleteUrl)

export default router
