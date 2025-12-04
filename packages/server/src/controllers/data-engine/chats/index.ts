import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'
import checkOwnership from '../../../utils/checkOwnership'

const createChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineChatsController.createChat - body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineChatsController.createChat - user not authenticated')
        }

        const chat = await dataEngineService.createChat(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(chat)
    } catch (error) {
        next(error)
    }
}

const getAllChats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineChatsController.getAllChats - user not authenticated'
            )
        }

        const chats = await dataEngineService.getAllChats(req.query, req.user)
        return res.json(chats)
    } catch (error) {
        next(error)
    }
}

const getChatById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineChatsController.getChatById - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineChatsController.getChatById - user not authenticated'
            )
        }

        const chat = await dataEngineService.getChatById(req.params.id, req.user)

        // Check ownership before returning
        if (req.user && !(await checkOwnership(chat, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineChatsController.getChatById - Unauthorized')
        }

        return res.json(chat)
    } catch (error) {
        next(error)
    }
}

const updateChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineChatsController.updateChat - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineChatsController.updateChat - user not authenticated')
        }

        // First get the resource to check ownership
        const existingChat = await dataEngineService.getChatById(req.params.id, req.user)

        // Check ownership before updating
        if (req.user && !(await checkOwnership(existingChat, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineChatsController.updateChat - Unauthorized')
        }

        const chat = await dataEngineService.updateChat(req.params.id, req.body, req.user)
        return res.json(chat)
    } catch (error) {
        next(error)
    }
}

const deleteChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineChatsController.deleteChat - id not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineChatsController.deleteChat - user not authenticated')
        }

        // First get the resource to check ownership
        const existingChat = await dataEngineService.getChatById(req.params.id, req.user)

        // Check ownership before deleting
        if (req.user && !(await checkOwnership(existingChat, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineChatsController.deleteChat - Unauthorized')
        }

        const result = await dataEngineService.deleteChat(req.params.id, req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    createChat,
    getAllChats,
    getChatById,
    updateChat,
    deleteChat
}
