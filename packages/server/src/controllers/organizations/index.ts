import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import organizationService from '../../services/organizations'

const getOrganizationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            // eslint-disable-next-line no-console
            console.log('=== INFO: No req.user found ===')
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        // Use the authenticated user's organization ID instead of URL parameter
        // since we're dealing with UUID vs Auth0 ID format mismatch
        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        const apiResponse = await organizationService.getOrganizationById(organizationId, req.user)

        return res.json(apiResponse)
    } catch (error) {
        console.error('=== DEBUG: Organization controller error ===', error)
        next(error)
    }
}

const updateOrganizationEnabledIntegrations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.enabledIntegrations) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Enabled integrations data required')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        // Use the authenticated user's organization ID instead of URL parameter
        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        // Convert the integrations object to JSON string for storage
        const enabledIntegrationsJson = JSON.stringify(req.body.enabledIntegrations)

        const apiResponse = await organizationService.updateOrganizationEnabledIntegrations(
            organizationId,
            enabledIntegrationsJson,
            req.user
        )

        return res.json(apiResponse)
    } catch (error) {
        console.error('=== DEBUG: Organization update controller error ===', error)
        next(error)
    }
}

const getOrganizationCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        const apiResponse = await organizationService.getOrganizationCredentials(organizationId, req.user)
        return res.json(apiResponse)
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('=== DEBUG: Organization credentials get controller error ===', error)
        next(error)
    }
}

const updateOrganizationCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.integrations) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Integrations data required')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        // Check if user is admin
        const isAdmin = req.user.roles?.includes('Admin')
        if (!isAdmin) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Admin access required')
        }

        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        const apiResponse = await organizationService.updateOrganizationCredentials(organizationId, req.body.integrations, req.user)

        return res.json(apiResponse)
    } catch (error) {
        console.error('=== DEBUG: Organization credentials update controller error ===', error)
        next(error)
    }
}

const getOrganizationConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        const apiResponse = await organizationService.getOrganizationConfig(organizationId, req.user)
        return res.json(apiResponse)
    } catch (error) {
        console.error('=== DEBUG: Organization config get controller error ===', error)
        next(error)
    }
}

const updateOrganizationConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.config) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Config data required')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        // Check if user is admin
        const isAdmin = req.user.roles?.includes('Admin')
        if (!isAdmin) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Admin access required')
        }

        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        const apiResponse = await organizationService.updateOrganizationConfig(organizationId, req.body.config, req.user)

        return res.json(apiResponse)
    } catch (error) {
        console.error('=== DEBUG: Organization config update controller error ===', error)
        next(error)
    }
}

const getOrganizationGuardrailsConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        const config = await organizationService.getOrganizationConfig(organizationId, req.user)
        // Return just the guardrails config portion
        return res.json(config.guardrails || {})
    } catch (error) {
        console.error('=== DEBUG: Organization guardrails config get controller error ===', error)
        next(error)
    }
}

const updateOrganizationGuardrailsConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.guardrails) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Guardrails config data required')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        // Check if user is admin
        const isAdmin = req.user.roles?.includes('Admin')
        if (!isAdmin) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Admin access required')
        }

        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        // Wrap guardrails config in proper structure
        const apiResponse = await organizationService.updateOrganizationConfig(
            organizationId,
            { guardrails: req.body.guardrails },
            req.user
        )

        // Return just the guardrails portion
        return res.json(apiResponse.guardrails || {})
    } catch (error) {
        console.error('=== DEBUG: Organization guardrails config update controller error ===', error)
        next(error)
    }
}

export default {
    getOrganizationById,
    updateOrganizationEnabledIntegrations,
    getOrganizationCredentials,
    updateOrganizationCredentials,
    getOrganizationConfig,
    updateOrganizationConfig,
    getOrganizationGuardrailsConfig,
    updateOrganizationGuardrailsConfig
}
