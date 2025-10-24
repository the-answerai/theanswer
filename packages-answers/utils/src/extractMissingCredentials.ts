/**
 * Utility functions for detecting and managing missing credentials in flows
 */

import { getCredentialCategory } from './getCredentialCategory'

/**
 * Extract required credentials from flow data and identify missing ones
 * @param {string|object} flowData - Flow data as JSON string or object
 * @returns {object} Object containing missing credentials info
 */
export const extractMissingCredentials = (flowData: string | any) => {
    try {
        // Parse flow data if it's a string
        const flow = typeof flowData === 'string' ? JSON.parse(flowData) : flowData

        if (!flow.nodes || !Array.isArray(flow.nodes)) {
            return { missingCredentials: [], hasCredentials: false }
        }

        const missingCredentials: any[] = []
        const credentialTypes = new Set<string>()

        // Iterate through all nodes
        flow.nodes.forEach((node: any) => {
            if (node.data && node.data.inputParams) {
                // Find all credential input parameters
                const credentialParams = node.data.inputParams.filter((param: any) => {
                    return param.type === 'credential'
                })

                credentialParams.forEach((credentialParam: any) => {
                    // Check if credential is assigned
                    const hasCredential =
                        node.data.credential ||
                        (node.data.inputs && node.data.inputs[credentialParam.name]) ||
                        (node.data.inputs && node.data.inputs['FLOWISE_CREDENTIAL_ID'])

                    if (!hasCredential) {
                        // Extract credential names
                        const credentialNames = credentialParam.credentialNames || []

                        credentialNames.forEach((credentialName: string) => {
                            credentialTypes.add(credentialName)

                            // Get category information to determine if credential is core
                            const category = getCredentialCategory(node.data.category, credentialName)
                            
                            // Credential is required if:
                            // 1. Category is core (Chat Models, Agents, etc), OR
                            // 2. Parameter explicitly marked as NOT optional (optional: false)
                            // Default to optional if not explicitly marked
                            const isRequired = category.isCore || (credentialParam.optional === false)

                            const missingCred = {
                                nodeId: node.id,
                                nodeName: node.data.name || 'Unknown Node',
                                nodeCategory: node.data.category || 'Unknown',
                                nodeType: node.data.type || node.type || 'Unknown',
                                credentialType: credentialName,
                                parameterName: credentialParam.name,
                                label: credentialParam.label || credentialParam.name,
                                isRequired: isRequired,
                                isCore: category.isCore,
                                categoryType: category.type,
                                categoryDisplayName: category.displayName
                            }

                            missingCredentials.push(missingCred)
                        })
                    }
                })
            }
        })

        return {
            missingCredentials,
            hasCredentials: credentialTypes.size > 0
        }
    } catch (error) {
        console.error('Error in extractMissingCredentials:', error)
        return { missingCredentials: [], hasCredentials: false }
    }
}
