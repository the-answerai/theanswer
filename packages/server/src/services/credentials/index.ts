import { StatusCodes } from 'http-status-codes'
import { omit } from 'lodash'
import { ICredentialReturnResponse } from '../../Interface'
import { Credential } from '../../database/entities/Credential'
import { WorkspaceShared } from '../../enterprise/database/entities/EnterpriseEntities'
import { WorkspaceService } from '../../enterprise/services/workspace.service'
import { getWorkspaceSearchOptions } from '../../enterprise/utils/ControllerServiceUtils'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { decryptCredentialData, transformToCredentialEntity } from '../../utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { GoogleOauth2Client } from '../../utils/refreshGoogleAccessToken'
import { refreshStoredCredentialTokens } from '../../utils'

const createCredential = async (requestBody: any, userId: string, organizationId: string) => {
    try {
        const appServer = getRunningExpressApp()
        const newCredential = await transformToCredentialEntity(requestBody)
        newCredential.userId = userId
        newCredential.organizationId = organizationId

        if (requestBody.id) {
            newCredential.id = requestBody.id
        }

        const credential = await appServer.AppDataSource.getRepository(Credential).create(newCredential)
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.createCredential - ${getErrorMessage(error)}`
        )
    }
}

// Delete all credentials from chatflowid
const deleteCredentials = async (credentialId: string, workspaceId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).delete({ id: credentialId, workspaceId: workspaceId })
        if (!dbResponse) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.deleteCredential - ${getErrorMessage(error)}`
        )
    }
}

const getAllCredentials = async (paramCredentialName: any, workspaceId: string) => {
    try {
        const appServer = getRunningExpressApp()
        let dbResponse: any[] = []
        if (paramCredentialName) {
            if (Array.isArray(paramCredentialName)) {
                for (let i = 0; i < paramCredentialName.length; i += 1) {
                    const name = paramCredentialName[i] as string
                    const searchOptions = {
                        credentialName: name,
                        ...getWorkspaceSearchOptions(workspaceId)
                    }
                    const credentials = await appServer.AppDataSource.getRepository(Credential).findBy(searchOptions)
                    dbResponse.push(...credentials.map((c) => omit(c, ['encryptedData'])))
                }
            } else {
                const searchOptions = {
                    credentialName: paramCredentialName,
                    ...getWorkspaceSearchOptions(workspaceId)
                }
                const credentials = await appServer.AppDataSource.getRepository(Credential).findBy(searchOptions)
                dbResponse = [...credentials]
            }
            // get shared credentials
            if (workspaceId) {
                const workspaceService = new WorkspaceService()
                const sharedItems = (await workspaceService.getSharedItemsForWorkspace(workspaceId, 'credential')) as Credential[]
                if (sharedItems.length) {
                    for (const sharedItem of sharedItems) {
                        // Check if paramCredentialName is array
                        if (Array.isArray(paramCredentialName)) {
                            for (let i = 0; i < paramCredentialName.length; i += 1) {
                                const name = paramCredentialName[i] as string
                                if (sharedItem.credentialName === name) {
                                    // @ts-ignore
                                    sharedItem.shared = true
                                    dbResponse.push(omit(sharedItem, ['encryptedData']))
                                }
                            }
                        } else {
                            if (sharedItem.credentialName === paramCredentialName) {
                                // @ts-ignore
                                sharedItem.shared = true
                                dbResponse.push(omit(sharedItem, ['encryptedData']))
                            }
                        }
                    }
                }
            }
        } else {
            const credentials = await appServer.AppDataSource.getRepository(Credential).findBy(getWorkspaceSearchOptions(workspaceId))
            for (const credential of credentials) {
                dbResponse.push(omit(credential, ['encryptedData']))
            }

            // get shared credentials
            if (workspaceId) {
                const workspaceService = new WorkspaceService()
                const sharedItems = (await workspaceService.getSharedItemsForWorkspace(workspaceId, 'credential')) as Credential[]
                if (sharedItems.length) {
                    for (const sharedItem of sharedItems) {
                        // @ts-ignore
                        sharedItem.shared = true
                        dbResponse.push(omit(sharedItem, ['encryptedData']))
                    }
                }
            }
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.getAllCredentials - ${getErrorMessage(error)}`
        )
    }
}

const getCredentialById = async (credentialId: string, workspaceId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        // TODO: Check if necessary to filter by userId
        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }
        // Decrpyt credentialData
        const decryptedCredentialData = await decryptCredentialData(
            credential.encryptedData,
            credential.credentialName,
            appServer.nodesPool.componentCredentials
        )
        const returnCredential: ICredentialReturnResponse = {
            ...credential,
            plainDataObj: decryptedCredentialData
        }
        const dbResponse: any = omit(returnCredential, ['encryptedData'])
        if (workspaceId) {
            const shared = await appServer.AppDataSource.getRepository(WorkspaceShared).count({
                where: {
                    workspaceId: workspaceId,
                    sharedItemId: credentialId,
                    itemType: 'credential'
                }
            })
            if (shared > 0) {
                dbResponse.shared = true
            }
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.getCredentialById - ${getErrorMessage(error)}`
        )
    }
}

const updateCredential = async (credentialId: string, requestBody: any, workspaceId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }
        const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
        requestBody.plainDataObj = { ...decryptedCredentialData, ...requestBody.plainDataObj }
        // requestBody.organizationId = organizationId
        const updateCredential = await transformToCredentialEntity(requestBody)
        updateCredential.workspaceId = workspaceId
        await appServer.AppDataSource.getRepository(Credential).merge(credential, updateCredential)
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.updateCredential - ${getErrorMessage(error)}`
        )
    }
}

const updateAndRefreshToken = async (credentialId: string, workspaceId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }
        const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
        const googleOauth2Client = new GoogleOauth2Client({
            googleAccessToken: decryptedCredentialData.googleAccessToken,
            googleRefreshToken: decryptedCredentialData.googleRefreshToken
        })
        const { access_token, expiry_date } = await googleOauth2Client.refreshToken()

        const updateBody = {
            name: credential.name,
            credentialName: credential.credentialName,
            plainDataObj: {
                ...decryptedCredentialData,
                googleAccessToken: access_token,
                expiresAt: new Date(expiry_date)
            },
            userId: credential.userId,
            organizationId: credential.organizationId,
            workspaceId: credential.workspaceId
        }
        const updateCredentialEntity = await transformToCredentialEntity(updateBody)
        await appServer.AppDataSource.getRepository(Credential).merge(credential, updateCredentialEntity)
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        return dbResponse
    } catch (error: any) {
        // Return 401 for re-authentication required errors (e.g., invalid_grant)
        if (error.code === 'REAUTH_REQUIRED' || error.message?.includes('re-authenticate')) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Error: credentialsService.updateRefreshToken - ${error.message}`)
        }
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.updateRefreshToken - ${getErrorMessage(error)}`
        )
    }
}

const updateAndRefreshAtlassianToken = async (credentialId: string, workspaceId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()

        // Verify credential belongs to workspace before refresh
        const existingCredential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        })
        if (!existingCredential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found in workspace`)
        }

        // Use centralized OAuth utility
        const success = await refreshStoredCredentialTokens(credentialId, appServer.AppDataSource)

        if (!success) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Failed to refresh Atlassian token')
        }

        // Return the updated credential
        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId,
            workspaceId: workspaceId
        })
        return credential
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.updateAndRefreshAtlassianToken - ${getErrorMessage(error)}`
        )
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
