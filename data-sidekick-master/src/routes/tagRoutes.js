import express from 'express'
import { getAllTags, createTag, updateTag, deleteTag, getCallTags, getTagStats, processTags } from '../controllers/tagController.js'

const router = express.Router()

// Tag management routes
router.get('/', getAllTags)
router.post('/', createTag)
router.put('/:id', updateTag)
router.delete('/:id', deleteTag)

// Call tag routes
router.get('/call-tags', getCallTags)
router.get('/stats', getTagStats)
router.post('/process', processTags)

export default router
