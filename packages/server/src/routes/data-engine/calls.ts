import express from 'express'
import callsController from '../../controllers/data-engine/calls'

const router = express.Router()

// All routes protected by global authentication middleware (API key or JWT)
router.post('/', callsController.createCall)
router.get('/', callsController.getAllCalls)
router.get('/:id', callsController.getCallById)
router.put('/:id', callsController.updateCall)
router.delete('/:id', callsController.deleteCall)

export default router
