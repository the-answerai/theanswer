import express from 'express'
import { analyzeText } from '../controllers/answerAIController.js'

const router = express.Router()

// POST /api/answerai/analyze - Analyze text using AnswerAI
router.post('/analyze', analyzeText)

export default router
