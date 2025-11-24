import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import marketplacesService from '../../services/marketplaces'

// Get all templates for marketplaces
const getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await marketplacesService.getAllTemplates(req.user)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Get specific marketplace template
const getMarketplaceTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: marketplacesController.getMarketplaceTemplate - id not provided!`
            )
        }
        const apiResponse = await marketplacesService.getMarketplaceTemplate(req.params.id, req.user)

        // Check if the template is public (Marketplace) for unauthenticated users
        if (!req.user && !apiResponse.isPublic && !apiResponse.visibility.includes('Marketplace')) {
            console.log('[getMarketplaceTemplate] apiResponse:', apiResponse)
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                `Error: marketplacesController.getMarketplaceTemplate - Unauthorized access to non-public template!`
            )
        }

        // For authenticated users, check ownership
        if (req.user && !(await checkOwnership(apiResponse, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }

        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteCustomTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: marketplacesService.deleteCustomTemplate - id not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: marketplacesController.deleteCustomTemplate - workspace ${workspaceId} not found!`
            )
        }
        const apiResponse = await marketplacesService.deleteCustomTemplate(req.params.id, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllCustomTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await marketplacesService.getAllCustomTemplates(req.user?.activeWorkspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const saveCustomTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if ((!req.body && !(req.body.chatflowId || req.body.tool)) || !req.body.name) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: marketplacesService.saveCustomTemplate - body not provided!`
            )
        }
        const body = req.body
        body.workspaceId = req.user?.activeWorkspaceId
        if (!body.workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: marketplacesController.saveCustomTemplate - workspace ${body.workspaceId} not found!`
            )
        }
        const apiResponse = await marketplacesService.saveCustomTemplate(body)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getOrganizationTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Authentication required')
        }

        const apiResponse = await marketplacesService.getOrganizationTemplates(req.user)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    getAllTemplates,
    getAllCustomTemplates,
    getOrganizationTemplates,
    saveCustomTemplate,
    deleteCustomTemplate,
    getMarketplaceTemplate
}
