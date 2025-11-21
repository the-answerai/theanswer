import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'
import checkOwnership from '../../../utils/checkOwnership'

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

        const tagId = parseInt(req.params.id, 10)
        if (isNaN(tagId)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: dataEngineTagsController.getTagById - invalid tag ID')
        }

        const tag = await dataEngineService.getTagById(tagId, req.user)

        // Check ownership before returning
        if (req.user && !(await checkOwnership(tag, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.getTagById - Unauthorized')
        }

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

        const tagId = parseInt(req.params.id, 10)
        if (isNaN(tagId)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: dataEngineTagsController.updateTag - invalid tag ID')
        }

        // First get the resource to check ownership
        const existingTag = await dataEngineService.getTagById(tagId, req.user)

        // Check ownership before updating
        if (req.user && !(await checkOwnership(existingTag, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.updateTag - Unauthorized')
        }

        const tag = await dataEngineService.updateTag(tagId, req.body, req.user)
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

        const tagId = parseInt(req.params.id, 10)
        if (isNaN(tagId)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: dataEngineTagsController.deleteTag - invalid tag ID')
        }

        // First get the resource to check ownership
        const existingTag = await dataEngineService.getTagById(tagId, req.user)

        // Check ownership before deleting
        if (req.user && !(await checkOwnership(existingTag, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineTagsController.deleteTag - Unauthorized')
        }

        const result = await dataEngineService.deleteTag(tagId, req.user)
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
