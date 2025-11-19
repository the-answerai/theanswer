import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'

const createTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineTagsController.createTag - body not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.createTag - user not authenticated')
        }

        const tag = await dataEngineService.createTag(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(tag)
    } catch (error) {
        next(error)
    }
}

const getAllTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.getAllTags - user not authenticated')
        }

        const tags = await dataEngineService.getAllTags(req.query, req.user)
        return res.json(tags)
    } catch (error) {
        next(error)
    }
}

const getTagById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineTagsController.getTagById - id not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.getTagById - user not authenticated')
        }

        const tag = await dataEngineService.getTagById(parseInt(req.params.id), req.user)
        return res.json(tag)
    } catch (error) {
        next(error)
    }
}

const getTagHierarchy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineTagsController.getTagHierarchy - user not authenticated'
            )
        }

        const hierarchy = await dataEngineService.getTagHierarchy(req.user)
        return res.json(hierarchy)
    } catch (error) {
        next(error)
    }
}

const updateTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineTagsController.updateTag - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.updateTag - user not authenticated')
        }

        const tag = await dataEngineService.updateTag(parseInt(req.params.id), req.body, req.user)
        return res.json(tag)
    } catch (error) {
        next(error)
    }
}

const deleteTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: dataEngineTagsController.deleteTag - id not provided')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.deleteTag - user not authenticated')
        }

        const result = await dataEngineService.deleteTag(parseInt(req.params.id), req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    createTag,
    getAllTags,
    getTagById,
    getTagHierarchy,
    updateTag,
    deleteTag
}
