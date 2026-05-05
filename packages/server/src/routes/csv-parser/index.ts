import express from 'express'
import csvParserController from '../../controllers/csv-parser'

const router = express.Router()

router.get('/', csvParserController.getAllCsvParseRuns)
router.get('/worker-status', csvParserController.getWorkerStatus)
router.get('/:id', csvParserController.getCsvParseRunById)
router.post('/', csvParserController.createCsvParseRun)
router.get('/:id/signed-url', csvParserController.getProcessedCsvSignedUrl)

export default router
