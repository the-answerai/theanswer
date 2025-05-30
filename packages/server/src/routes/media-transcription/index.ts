import express from 'express'
import mediaTranscriptionController from '../../controllers/media-transcription'

const router = express.Router()

router.post('/generate', mediaTranscriptionController.generateTranscript)
router.get('/archive', mediaTranscriptionController.listArchivedTranscripts)

export default router
