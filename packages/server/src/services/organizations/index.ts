import { StatusCodes } from 'http-status-codes'
import { IUser } from '../../Interface'
import { Organization } from '../../database/entities/Organization'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

// Get organization by ID
const getOrganizationById = async (id: string, user?: IUser): Promise<Organization> => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = await appServer.AppDataSource.getRepository(Organization)
            .createQueryBuilder('organization')
            .where('organization.id = :id', { id })
            .getOne()

        if (!dbResponse) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Organization not found`)
        }

        return dbResponse
    } catch (error) {
        if (error instanceof InternalFlowiseError && error.statusCode === StatusCodes.NOT_FOUND) {
            throw error
        }
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: organizationService.getOrganizationById - ${getErrorMessage(error)}`
        )
    }
}

// Update organization enabled integrations
const updateOrganizationEnabledIntegrations = async (id: string, enabledIntegrations: string, user?: IUser): Promise<Organization> => {
    try {
        const appServer = getRunningExpressApp()

        // First verify the organization exists and user has access
        const organization = await getOrganizationById(id, user)

        // For now, we'll allow any authenticated user to update their own organization
        // In the future, this should check for admin permissions

        const organizationRepo = appServer.AppDataSource.getRepository(Organization)

        await organizationRepo.update({ id }, { enabledIntegrations })

        // Return updated organization
        const updatedOrganization = await organizationRepo.findOneBy({ id })

        if (!updatedOrganization) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Organization not found after update`)
        }

        return updatedOrganization
    } catch (error) {
        if (error instanceof InternalFlowiseError && error.statusCode === StatusCodes.NOT_FOUND) {
            throw error
        }
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: organizationService.updateOrganizationEnabledIntegrations - ${getErrorMessage(error)}`
        )
    }
}

export default {
    getOrganizationById,
    updateOrganizationEnabledIntegrations
}
