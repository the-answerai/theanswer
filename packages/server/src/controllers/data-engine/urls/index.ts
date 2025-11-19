import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'

const createUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineUrlsController.createUrl - body not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineUrlsController.createUrl - user not authenticated')
        }

        const url = await dataEngineService.createUrl(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(url)
    } catch (error) {
        next(error)
    }
}

const getAllUrls = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineUrlsController.getAllUrls - user not authenticated')
        }

        const urls = await dataEngineService.getAllUrls(req.query, req.user)
        return res.json(urls)
    } catch (error) {
        next(error)
    }
}

const getUrlById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineUrlsController.getUrlById - id not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineUrlsController.getUrlById - user not authenticated')
        }

        const url = await dataEngineService.getUrlById(req.params.id, req.user)
        return res.json(url)
    } catch (error) {
        next(error)
    }
}

const updateUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineUrlsController.updateUrl - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineUrlsController.updateUrl - user not authenticated')
        }

        const url = await dataEngineService.updateUrl(req.params.id, req.body, req.user)
        return res.json(url)
    } catch (error) {
        next(error)
    }
}

const deleteUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineUrlsController.deleteUrl - id not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineUrlsController.deleteUrl - user not authenticated')
        }

        const result = await dataEngineService.deleteUrl(req.params.id, req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    createUrl,
    getAllUrls,
    getUrlById,
    updateUrl,
    deleteUrl
}
