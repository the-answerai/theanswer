import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'

const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineTicketsController.createTicket - body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineTicketsController.createTicket - user not authenticated'
            )
        }

        const ticket = await dataEngineService.createTicket(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(ticket)
    } catch (error) {
        next(error)
    }
}

const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineTicketsController.getAllTickets - user not authenticated'
            )
        }

        const tickets = await dataEngineService.getAllTickets(req.query, req.user)
        return res.json(tickets)
    } catch (error) {
        next(error)
    }
}

const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineTicketsController.getTicketById - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineTicketsController.getTicketById - user not authenticated'
            )
        }

        const ticket = await dataEngineService.getTicketById(req.params.id, req.user)
        return res.json(ticket)
    } catch (error) {
        next(error)
    }
}

const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineTicketsController.updateTicket - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineTicketsController.updateTicket - user not authenticated'
            )
        }

        const ticket = await dataEngineService.updateTicket(req.params.id, req.body, req.user)
        return res.json(ticket)
    } catch (error) {
        next(error)
    }
}

const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineTicketsController.deleteTicket - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineTicketsController.deleteTicket - user not authenticated'
            )
        }

        const result = await dataEngineService.deleteTicket(req.params.id, req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket
}
