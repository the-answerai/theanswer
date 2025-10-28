import { processFlowCredentials } from './processFlowCredentials'

/**
 * Extract all credentials (assigned and unassigned) from flow data for QuickSetup mode
 * @param {string|object} flowData - Flow data as JSON string or object
 * @returns {object} Object containing all credentials info
 */
export const extractAllCredentials = (flowData: string | any) => {
    const { credentials, hasCredentials } = processFlowCredentials(flowData)

    return {
        allCredentials: credentials,
        hasCredentials
    }
}
