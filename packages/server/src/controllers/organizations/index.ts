import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import organizationService from '../../services/organizations'

const getOrganizationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('=== DEBUG: Organization Controller GET ===', {
            hasUser: !!req.user,
            userId: req.user?.id,
            userEmail: req.user?.email,
            userOrganizationId: req.user?.organizationId,
            userRoles: req.user?.roles,
            requestedId: req.params.id,
            authHeader: req.headers.authorization?.substring(0, 20) + '...'
        })

        if (!req.user) {
            console.log('=== DEBUG: No req.user found ===')
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }

        // Use the authenticated user's organization ID instead of URL parameter
        // since we're dealing with UUID vs Auth0 ID format mismatch
        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        console.log('=== DEBUG: Using organization ID ===', {
            userOrgId: organizationId,
            requestedId: req.params.id,
            usingUserOrgId: true
        })

        const apiResponse = await organizationService.getOrganizationById(organizationId, req.user)

        console.log('=== DEBUG: Organization found ===', {
            orgId: apiResponse.id,
            orgName: apiResponse.name,
            hasEnabledIntegrations: !!apiResponse.enabledIntegrations
        })

        return res.json(apiResponse)
    } catch (error) {
        console.error('=== DEBUG: Organization controller error ===', error)
        next(error)
    }
}

const updateOrganizationEnabledIntegrations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('=== DEBUG: Organization Controller PUT ===', {
            hasUser: !!req.user,
            userId: req.user?.id,
            requestedId: req.params.id,
            hasBody: !!req.body.enabledIntegrations
        })

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

export default {
    getOrganizationById,
    updateOrganizationEnabledIntegrations
}
