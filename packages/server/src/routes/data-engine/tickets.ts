import express from 'express'
import ticketsController from '../../controllers/data-engine/tickets'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
import { validateCreateTicket, validateUpdateTicket, validatePaginationParams } from '../../middlewares/validation/dataEngineValidation'

const router = express.Router()

// CREATE
router.post('/', enforceAbility('DataEngineTicket'), validateCreateTicket, ticketsController.createTicket)

// READ
router.get('/', enforceAbility('DataEngineTicket'), validatePaginationParams, ticketsController.getAllTickets)
router.get('/:id', enforceAbility('DataEngineTicket'), ticketsController.getTicketById)

// UPDATE
router.put('/:id', enforceAbility('DataEngineTicket'), validateUpdateTicket, ticketsController.updateTicket)

// DELETE
router.delete('/:id', enforceAbility('DataEngineTicket'), ticketsController.deleteTicket)

export default router
