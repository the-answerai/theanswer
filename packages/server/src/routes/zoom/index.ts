import express from 'express'
import zoomController from '../../controllers/zoom'

const router = express.Router()

// Routes for Zoom operations
router.get('/meetings', zoomController.getMeetings)
router.post('/meetings', zoomController.getMeetings) // Support both GET and POST

// Enhanced routes for different meeting types
router.get('/meetings/shared', zoomController.getSharedMeetings)
router.post('/meetings/shared', zoomController.getSharedMeetings)

router.get('/meetings/organization', zoomController.getOrganizationMeetings)
router.post('/meetings/organization', zoomController.getOrganizationMeetings)

// Unified endpoint that routes based on meeting type parameter
router.get('/meetings/by-type', zoomController.getMeetingsByType)
router.post('/meetings/by-type', zoomController.getMeetingsByType)

export default router
