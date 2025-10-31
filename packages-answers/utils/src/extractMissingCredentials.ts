/**
 * Utility functions for detecting and managing missing credentials in flows
 */

import { processFlowCredentials } from './processFlowCredentials'

/**
 * Extract required credentials from flow data and identify missing ones
 * @param {string|object} flowData - Flow data as JSON string or object
 * @returns {object} Object containing missing credentials info
 */
export const extractMissingCredentials = (flowData: string | any) => {
    const { credentials, hasCredentials } = processFlowCredentials(flowData)

    const missingCredentials = credentials
        .filter((credential) => !credential.isAssigned)
        .map(({ isAssigned, assignedCredentialId, ...rest }) => rest)

    return {
        missingCredentials,
        hasCredentials
    }
}
