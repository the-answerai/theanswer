import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'

const createCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineCallsController.createCall - body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineCallsController.createCall - user not authenticated')
        }

        const call = await dataEngineService.createCall(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(call)
    } catch (error) {
        next(error)
    }
}

const getAllCalls = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineCallsController.getAllCalls - user not authenticated'
            )
        }

        const calls = await dataEngineService.getAllCalls(req.query, req.user)
        return res.json(calls)
    } catch (error) {
        next(error)
    }
}

const getCallById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineCallsController.getCallById - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineCallsController.getCallById - user not authenticated'
            )
        }

        const call = await dataEngineService.getCallById(req.params.id, req.user)
        return res.json(call)
    } catch (error) {
        next(error)
    }
}

const updateCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineCallsController.updateCall - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineCallsController.updateCall - user not authenticated')
        }

        const call = await dataEngineService.updateCall(req.params.id, req.body, req.user)
        return res.json(call)
    } catch (error) {
        next(error)
    }
}

const deleteCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineCallsController.deleteCall - id not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineCallsController.deleteCall - user not authenticated')
        }

        const result = await dataEngineService.deleteCall(req.params.id, req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    createCall,
    getAllCalls,
    getCallById,
    updateCall,
    deleteCall
}
