import express from 'express'
import {
    createOutboundCall,
    getCalls,
    getUntaggedCalls,
    analyzeCall,
    getCallById,
    getCallByRecordingUrl,
    clearCallAnalysis,
    getCallsByPhoneNumber
} from '../controllers/callController.js'

const router = express.Router()

// Specific routes first
router.post('/outbound', createOutboundCall)
router.get('/', getCalls)
router.get('/untagged', getUntaggedCalls)
router.post('/analyze', analyzeCall)
router.post('/clear-analysis', clearCallAnalysis)
router.get('/url/:url', getCallByRecordingUrl)
router.get('/phone/:phoneNumber', getCallsByPhoneNumber)

// Generic ID route last
router.get('/:id', getCallById)

// Call analysis route
router.post('/analyze-call', analyzeCall)

export default router
