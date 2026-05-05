import { cloneDeep } from 'lodash'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'

// Resolve a credential name against the live pool using a case-insensitive fallback.
// Old saved chatflows / credential rows can carry historical casing (e.g. `JiraApi`)
// that no longer matches the camelCase keys registered by current credential classes
// (e.g. `jiraApi`). Returning the canonical key here keeps downstream lookups happy.
const resolveCredentialKey = (requestedName: string, pool: Record<string, unknown>): string | undefined => {
    if (Object.prototype.hasOwnProperty.call(pool, requestedName)) {
        return requestedName
    }
    const lowered = requestedName.toLowerCase()
    for (const key of Object.keys(pool)) {
        if (key.toLowerCase() === lowered) {
            return key
        }
    }
    return undefined
}

// Get all component credentials
const getAllComponentsCredentials = async (): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = []
        for (const credName in appServer.nodesPool.componentCredentials) {
            const clonedCred = cloneDeep(appServer.nodesPool.componentCredentials[credName])
            dbResponse.push(clonedCred)
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: componentsCredentialsService.getAllComponentsCredentials - ${getErrorMessage(error)}`
        )
    }
}

const getComponentByName = async (credentialName: string) => {
    try {
        const appServer = getRunningExpressApp()
        const pool = appServer.nodesPool.componentCredentials
        if (!credentialName.includes('&amp;')) {
            const resolvedKey = resolveCredentialKey(credentialName, pool)
            if (resolvedKey) {
                return pool[resolvedKey]
            }
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: componentsCredentialsService.getComponentByName - Credential ${credentialName} not found`
            )
        } else {
            const dbResponse = []
            for (const name of credentialName.split('&amp;')) {
                const resolvedKey = resolveCredentialKey(name, pool)
                if (resolvedKey) {
                    dbResponse.push(pool[resolvedKey])
                } else {
                    throw new InternalFlowiseError(
                        StatusCodes.NOT_FOUND,
                        `Error: componentsCredentialsService.getComponentByName - Credential ${name} not found`
                    )
                }
            }
            return dbResponse
        }
    } catch (error) {
        // Preserve InternalFlowiseError status (e.g. 404) instead of always re-wrapping as 500.
        if (error instanceof InternalFlowiseError) {
            throw error
        }
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: componentsCredentialsService.getComponentByName - ${getErrorMessage(error)}`
        )
    }
}

// Returns specific component credential icon via name
const getSingleComponentsCredentialIcon = async (credentialName: string) => {
    try {
        const appServer = getRunningExpressApp()
        const pool = appServer.nodesPool.componentCredentials
        const resolvedKey = resolveCredentialKey(credentialName, pool)
        if (!resolvedKey) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialName} not found`)
        }
        const credInstance = pool[resolvedKey]
        if (credInstance.icon === undefined) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialName} icon not found`)
        }

        if (credInstance.icon.endsWith('.svg') || credInstance.icon.endsWith('.png') || credInstance.icon.endsWith('.jpg')) {
            const filepath = credInstance.icon
            return filepath
        } else {
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Credential ${credentialName} icon is missing icon`)
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) {
            throw error
        }
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: componentsCredentialsService.getSingleComponentsCredentialIcon - ${getErrorMessage(error)}`
        )
    }
}

export default {
    getAllComponentsCredentials,
    getComponentByName,
    getSingleComponentsCredentialIcon
}
