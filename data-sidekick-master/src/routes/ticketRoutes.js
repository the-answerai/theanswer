import express from 'express'
import { getTickets, getTicketById, updateTicket } from '../controllers/ticketController.js'

const router = express.Router()

router.get('/', getTickets)
router.get('/:id', getTicketById)
router.put('/:id', updateTicket)

export default router
