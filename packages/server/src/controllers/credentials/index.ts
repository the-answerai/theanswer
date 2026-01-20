import { Request, Response, NextFunction } from 'express'
import credentialsService from '../../services/credentials'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

const createCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.createCredential - body not provided!`
            )
        }
        const body = req.body
        body.workspaceId = req.user?.activeWorkspaceId
        const userId = req.user?.id || ''
        const organizationId = req.user?.activeOrganizationId || ''
        const apiResponse = await credentialsService.createCredential(body, userId, organizationId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.deleteCredentials - id not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: credentialsController.deleteCredentials - workspace ${workspaceId} not found!`
            )
        }
        const apiResponse = await credentialsService.deleteCredentials(req.params.id, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: credentialsController.getAllCredentials - workspace ${workspaceId} not found!`
            )
        }
        const apiResponse = await credentialsService.getAllCredentials(req.query.credentialName, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getCredentialById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.getCredentialById - id not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: credentialsController.getCredentialById - workspace ${workspaceId} not found!`
            )
        }
        const apiResponse = await credentialsService.getCredentialById(req.params.id, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.updateCredential - id not provided!`
            )
        }
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.updateCredential - body not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: credentialsController.updateCredential - workspace ${workspaceId} not found!`
            )
        }
        const apiResponse = await credentialsService.updateCredential(req.params.id, req.body, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateAndRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.credentialId) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: credentialsController.updateAndRefreshToken - credentialId not provided!'
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                'Error: credentialsController.updateAndRefreshToken - workspace not found!'
            )
        }
        const apiResponse = await credentialsService.updateAndRefreshToken(req.body.credentialId, workspaceId)
        return res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: apiResponse
        })
    } catch (error) {
        next(error)
    }
}

const updateAndRefreshAtlassianToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.credentialId) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: credentialsController.updateAndRefreshAtlassianToken - credentialId not provided!'
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                'Error: credentialsController.updateAndRefreshAtlassianToken - workspace not found!'
            )
        }
        const apiResponse = await credentialsService.updateAndRefreshAtlassianToken(req.body.credentialId, workspaceId)
        return res.json({
            success: true,
            message: 'Atlassian token refreshed successfully',
            data: apiResponse
        })
    } catch (error) {
        next(error)
    }
}

export default {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    updateCredential,
    updateAndRefreshToken,
    updateAndRefreshAtlassianToken
}
