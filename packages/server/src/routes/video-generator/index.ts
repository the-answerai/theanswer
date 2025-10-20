import express from 'express'
import rateLimit from 'express-rate-limit'
import videoGeneratorController from '../../controllers/video-generator'

const router = express.Router()

const generateRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many video generation requests, please try again later.'
})

const archiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
})

const enhanceRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many prompt enhancement requests, please try again later.'
})

router.post('/generate', generateRateLimiter, videoGeneratorController.generateVideo)
router.post('/enhance', enhanceRateLimiter, videoGeneratorController.enhancePrompt)
router.get('/status/:jobId', videoGeneratorController.getJobStatus)
router.get('/recent', videoGeneratorController.listRecentJobs)
router.get('/archive', archiveRateLimiter, videoGeneratorController.listArchivedVideos)

export default router
