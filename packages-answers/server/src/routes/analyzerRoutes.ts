import express from 'express'
import analyzerController from '../controllers/analyzerController'

const router = express.Router()

router.get('/research-views', analyzerController.getResearchViews)

export default router
