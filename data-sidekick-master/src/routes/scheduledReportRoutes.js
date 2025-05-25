import express from 'express'
import {
    createScheduledReport,
    getScheduledReports,
    getScheduledReportById,
    updateScheduledReport,
    deleteScheduledReport,
    updateLastRunTime
} from '../controllers/scheduledReportController.js'

const router = express.Router()

// Scheduled Report routes
router.post('/', createScheduledReport)
router.get('/', getScheduledReports)
router.get('/:id', getScheduledReportById)
router.put('/:id', updateScheduledReport)
router.delete('/:id', deleteScheduledReport)
router.put('/:id/last-run', updateLastRunTime)

export default router
