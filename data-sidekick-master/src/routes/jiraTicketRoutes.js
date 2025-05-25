import express from 'express'
import { getJiraTickets, getJiraTicketById, updateJiraTicket, getJiraLabels } from '../controllers/jiraTicketController.js'

const router = express.Router()

router.get('/tickets', getJiraTickets)
router.get('/tickets/:id', getJiraTicketById)
router.put('/tickets/:id', updateJiraTicket)
router.get('/labels', getJiraLabels)

export default router
