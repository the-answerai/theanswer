import express from 'express'
import { generateReport, getAllReports, getReportById, updateReport, deleteReport } from '../controllers/reportController.js'

const router = express.Router()

// Report routes
router.post('/generate-report', generateReport)
router.get('/', getAllReports)
router.get('/:id', getReportById)
router.put('/:id', updateReport)
router.delete('/:id', deleteReport)

export default router
