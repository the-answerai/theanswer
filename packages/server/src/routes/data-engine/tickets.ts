import express from 'express'
import ticketsController from '../../controllers/data-engine/tickets'

const router = express.Router()

// All routes protected by global authentication middleware (API key or JWT)
router.post('/', ticketsController.createTicket)
router.get('/', ticketsController.getAllTickets)
router.get('/:id', ticketsController.getTicketById)
router.put('/:id', ticketsController.updateTicket)
router.delete('/:id', ticketsController.deleteTicket)

export default router
