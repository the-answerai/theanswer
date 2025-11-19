import express from 'express'
import tagsController from '../../controllers/data-engine/tags'

const router = express.Router()

// All routes protected by global authentication middleware (API key or JWT)
router.post('/', tagsController.createTag)
router.get('/', tagsController.getAllTags)
router.get('/hierarchy', tagsController.getTagHierarchy)
router.get('/:id', tagsController.getTagById)
router.put('/:id', tagsController.updateTag)
router.delete('/:id', tagsController.deleteTag)

export default router
