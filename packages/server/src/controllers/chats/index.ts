import { Request, Response, NextFunction } from 'express'
import chatsService from '../../services/chats'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

const getAllChats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: chatsController.getAllChats - Unauthorized')
        }
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
        const cursor = req.query.cursor as string | undefined
        const apiResponse = await chatsService.getAllChats(req.user, { limit, cursor })
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getChatById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: chatsController.getChatById - Unauthorized')
        }
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: chatsController.getChatById - Missing chat ID')
        }
        const apiResponse = await chatsService.getChatById(req.params.id, req.user)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    getAllChats,
    getChatById
}
