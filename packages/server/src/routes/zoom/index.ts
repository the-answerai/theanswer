import express from 'express'
import zoomController from '../../controllers/zoom'

const router = express.Router()

// Routes for Zoom operations
router.get('/meetings', zoomController.getMeetings)
router.post('/meetings', zoomController.getMeetings) // Support both GET and POST

export default router
