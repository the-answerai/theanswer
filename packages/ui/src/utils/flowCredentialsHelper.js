/**
 * Utility functions for detecting and managing missing credentials in flows
 */

import { extractMissingCredentials } from '@utils/extractMissingCredentials'
import { extractAllCredentials } from '@utils/extractAllCredentials'
import { getCredentialCategory } from '@utils/getCredentialCategory'

// Re-export for convenience
export { extractMissingCredentials, extractAllCredentials, getCredentialCategory }

/**
 * Convert camelCase or PascalCase string to sentence case
 * @param {string} str - String in camelCase or PascalCase
 * @returns {string} String in sentence case
 */
export const toSentenceCase = (str) => {
    if (!str) return ''

    // Handle special cases and acronyms
    const specialCases = {
        API: 'API',
        MCP: 'MCP',
        URL: 'URL',
        HTTP: 'HTTP',
        HTTPS: 'HTTPS',
        Oauth: 'OAuth',
        OpenAI: 'OpenAI',
        ChatGPT: 'ChatGPT',
        LLM: 'LLM',
        AI: 'AI'
    }

    // Check if it's already a special case
    if (specialCases[str]) return specialCases[str]

    // Convert camelCase/PascalCase to words
    const result = str
        // Insert space before uppercase letters (but not at the start)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Insert space before numbers
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        // Handle consecutive uppercase letters (like "URLApi" -> "URL Api")
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        // Trim and capitalize first letter
        .trim()

    // Capitalize first letter and lowercase the rest, except for special cases
    return result
        .split(' ')
        .map((word, index) => {
            // Check if word is a special case
            if (specialCases[word]) return specialCases[word]

            // First word always capitalized
            if (index === 0) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            }

            // Check if word looks like an acronym (all caps and short)
            if (word.length <= 3 && word === word.toUpperCase()) {
                return word
            }

            // Regular word
            return word.toLowerCase()
        })
        .join(' ')
}

/**
 * Group missing credentials by credential type for better organization
 * @param {array} missingCredentials - Array of missing credential objects
 * @returns {object} Grouped credentials by type
 */
export const groupCredentialsByType = (missingCredentials) => {
    const grouped = {}

    // Define credential groups that should be treated as one logical choice
    const credentialGroups = {
        redis: ['redisCacheApi', 'redisCacheUrlApi'],
        upstashRedis: ['upstashRedisApi', 'upstashRedisMemoryApi']
    }

    // Create reverse mapping from credential type to group
    const typeToGroup = {}
    Object.entries(credentialGroups).forEach(([groupName, types]) => {
        types.forEach((type) => {
            typeToGroup[type] = groupName
        })
    })

    missingCredentials.forEach((credInfo) => {
        const credentialType = credInfo.credentialType

        if (credentialType) {
            // Check if this credential type belongs to a group
            const groupKey = typeToGroup[credentialType] || credentialType
            const displayName =
                groupKey === 'redis' ? 'Redis' : groupKey === 'upstashRedis' ? 'Upstash Redis' : toSentenceCase(credentialType)

            if (!grouped[groupKey]) {
                grouped[groupKey] = {
                    credentialName: groupKey,
                    label: displayName,
                    credentialTypes: groupKey === credentialType ? [credentialType] : credentialGroups[groupKey] || [credentialType],
                    nodes: []
                }
            }

            // Avoid duplicate node entries for the same logical group
            const existingNode = grouped[groupKey].nodes.find(
                (node) => node.nodeId === credInfo.nodeId && node.parameterName === credInfo.parameterName
            )

            if (!existingNode) {
                grouped[groupKey].nodes.push({
                    nodeId: credInfo.nodeId,
                    nodeName: credInfo.nodeName,
                    parameterName: credInfo.parameterName,
                    isRequired: credInfo.isRequired,
                    isCore: credInfo.isCore,
                    categoryType: credInfo.categoryType,
                    categoryDisplayName: credInfo.categoryDisplayName,
                    nodeCategory: credInfo.nodeCategory,
                    nodeType: credInfo.nodeType
                })
            }
        }
    })

    return grouped
}

/**
 * Group all credentials (assigned and unassigned) by credential type for QuickSetup mode
 * @param {array} allCredentials - Array of all credential objects
 * @returns {object} Grouped credentials by type
 */
export const groupAllCredentialsByType = (allCredentials) => {
    const grouped = {}

    // Define credential groups that should be treated as one logical choice
    const credentialGroups = {
        redis: ['redisCacheApi', 'redisCacheUrlApi'],
        upstashRedis: ['upstashRedisApi', 'upstashRedisMemoryApi']
    }

    // Create reverse mapping from credential type to group
    const typeToGroup = {}
    Object.entries(credentialGroups).forEach(([groupName, types]) => {
        types.forEach((type) => {
            typeToGroup[type] = groupName
        })
    })

    allCredentials.forEach((credInfo) => {
        const credentialType = credInfo.credentialType

        if (credentialType) {
            // Check if this credential type belongs to a group
            const groupKey = typeToGroup[credentialType] || credentialType
            const displayName =
                groupKey === 'redis' ? 'Redis' : groupKey === 'upstashRedis' ? 'Upstash Redis' : toSentenceCase(credentialType)

            if (!grouped[groupKey]) {
                grouped[groupKey] = {
                    credentialName: groupKey,
                    label: displayName,
                    credentialTypes: groupKey === credentialType ? [credentialType] : credentialGroups[groupKey] || [credentialType],
                    nodes: [],
                    isAssigned: false,
                    assignedCredentialId: null
                }
            }

            // Check if any node in this group has assigned credentials
            if (credInfo.isAssigned) {
                grouped[groupKey].isAssigned = true
                grouped[groupKey].assignedCredentialId = credInfo.assignedCredentialId
            }

            // Avoid duplicate node entries for the same logical group
            const existingNode = grouped[groupKey].nodes.find(
                (node) => node.nodeId === credInfo.nodeId && node.parameterName === credInfo.parameterName
            )

            if (!existingNode) {
                grouped[groupKey].nodes.push({
                    nodeId: credInfo.nodeId,
                    nodeName: credInfo.nodeName,
                    parameterName: credInfo.parameterName,
                    isAssigned: credInfo.isAssigned,
                    assignedCredentialId: credInfo.assignedCredentialId,
                    isRequired: credInfo.isRequired,
                    isCore: credInfo.isCore,
                    categoryType: credInfo.categoryType,
                    categoryDisplayName: credInfo.categoryDisplayName,
                    nodeCategory: credInfo.nodeCategory,
                    nodeType: credInfo.nodeType
                })
            }
        }
    })

    return grouped
}

/**
 * Update flow data with new credential assignments
 * @param {string|object} flowData - Original flow data
 * @param {object} credentialAssignments - Object mapping nodeId to credentialId
 * @returns {object} Updated flow data
 */
const CONFIG_COMPONENT_KEYS = [
    'llmModel',
    'llmModelName',
    'agentModel',
    'conditionAgentModel',
    'retrieverModel',
    'model',
    'modelName',
    'chatModel',
    'assistantModel',
    'selectedAssistant',
    'toolModel',
    'selectedTool',
    'agentFlowModel'
]

const buildConfigEntryKey = (nodeId, parameterName, credentialType) => `${nodeId}:${parameterName}:${credentialType}`

const resolveConfigComponentName = (config, inputs, parameterName) => {
    if (!config || typeof config !== 'object') return ''
    for (const key of CONFIG_COMPONENT_KEYS) {
        if (typeof config[key] === 'string' && config[key]) return config[key]
    }
    const matchingInputKey = parameterName.replace(/Config$/, '')
    if (matchingInputKey && typeof inputs?.[matchingInputKey] === 'string') {
        return inputs[matchingInputKey]
    }
    for (const value of Object.values(config)) {
        if (typeof value === 'string' && value) {
            return value
        }
    }
    return ''
}

export const updateFlowDataWithCredentials = (flowData, credentialAssignments) => {
    try {
        const flow = typeof flowData === 'string' ? JSON.parse(flowData) : { ...flowData }

        if (!flow.nodes || !Array.isArray(flow.nodes)) {
            return flow
        }

        // Update nodes with credential assignments
        flow.nodes = flow.nodes.map((node) => {
            if (credentialAssignments[node.id]) {
                const updatedNode = { ...node }
                updatedNode.data = { ...node.data }
                const assignedCredential = credentialAssignments[node.id]

                // Set the credential
                updatedNode.data.credential = assignedCredential

                // Also set in inputs for compatibility
                if (!updatedNode.data.inputs) {
                    updatedNode.data.inputs = {}
                }
                updatedNode.data.inputs['FLOWISE_CREDENTIAL_ID'] = assignedCredential

                // Update nested config objects that track credential assignments
                Object.entries(updatedNode.data.inputs).forEach(([inputKey, inputValue]) => {
                    if (!inputValue || typeof inputValue !== 'object') return
                    if (!Object.prototype.hasOwnProperty.call(inputValue, 'credential')) return
                    updatedNode.data.inputs[inputKey] = {
                        ...inputValue,
                        credential: assignedCredential
                    }
                })

                return updatedNode
            }
            return node
        })

        return flow
    } catch (error) {
        console.error('Error updating flow data with credentials:', error)
        return flowData
    }
}

export const collectFlowCredentials = async (flowData, options = {}) => {
    const { fetchNodeDefinition } = options
    const flow = typeof flowData === 'string' ? JSON.parse(flowData) : { ...flowData }

    if (!flow.nodes || !Array.isArray(flow.nodes)) {
        return {
            allCredentials: [],
            missingCredentials: [],
            hasCredentials: false,
            hasMissingCredentials: false
        }
    }

    const baseMissing = extractMissingCredentials(flow).missingCredentials || []
    const baseAll = extractAllCredentials(flow).allCredentials || []

    const allCredentials = [...baseAll]
    const missingCredentials = [...baseMissing]

    const seenAllKeys = new Set(allCredentials.map((cred) => buildConfigEntryKey(cred.nodeId, cred.parameterName, cred.credentialType)))
    const seenMissingKeys = new Set(
        missingCredentials.map((cred) => buildConfigEntryKey(cred.nodeId, cred.parameterName, cred.credentialType))
    )

    if (typeof fetchNodeDefinition === 'function') {
        for (const node of flow.nodes) {
            const nodeData = node.data || {}
            const inputs = nodeData.inputs || {}

            for (const [inputKey, inputValue] of Object.entries(inputs)) {
                if (!inputKey.endsWith('Config')) continue
                if (!inputValue || typeof inputValue !== 'object') continue
                if (!Object.prototype.hasOwnProperty.call(inputValue, 'credential')) continue

                const componentName = resolveConfigComponentName(inputValue, inputs, inputKey)

                let nodeDefinition = null
                let credentialNames = []

                if (componentName) {
                    try {
                        nodeDefinition = await fetchNodeDefinition(componentName)
                        const credentialObj = nodeDefinition?.credential
                        if (credentialObj?.credentialNames && Array.isArray(credentialObj.credentialNames)) {
                            credentialNames = credentialObj.credentialNames
                        }
                    } catch (error) {
                        console.warn(`Failed to load node definition for ${componentName}:`, error)
                    }
                }

                if (!credentialNames.length) {
                    credentialNames = componentName ? [componentName] : [inputKey]
                }

                const label =
                    nodeDefinition?.label ||
                    (componentName ? toSentenceCase(componentName) : toSentenceCase(inputKey.replace(/Config$/, 'Credential')))

                credentialNames.forEach((credentialName) => {
                    const entryKey = buildConfigEntryKey(node.id, inputKey, credentialName)
                    const isAssigned = !!inputValue.credential
                    const entry = {
                        nodeId: node.id,
                        nodeName: nodeData.name || 'Unknown Node',
                        nodeCategory: nodeData.category || 'Unknown',
                        nodeType: nodeData.type || node.type || 'Unknown',
                        credentialType: credentialName,
                        parameterName: inputKey,
                        label,
                        isOptional: false,
                        isRequired: true,
                        isAssigned,
                        assignedCredentialId: isAssigned ? inputValue.credential : null
                    }

                    if (!seenAllKeys.has(entryKey)) {
                        seenAllKeys.add(entryKey)
                        allCredentials.push(entry)
                    }

                    if (!isAssigned && !seenMissingKeys.has(entryKey)) {
                        seenMissingKeys.add(entryKey)
                        missingCredentials.push(entry)
                    }
                })
            }
        }
    }

    return {
        allCredentials,
        missingCredentials,
        hasCredentials: allCredentials.length > 0,
        hasMissingCredentials: missingCredentials.length > 0
    }
}

/**
 * Check if a credential assignment is valid for a node
 * @param {object} node - Flow node
 * @param {string} credentialId - Credential ID to check
 * @param {array} availableCredentials - Available credentials for this type
 * @returns {boolean} Whether the assignment is valid
 */
export const isValidCredentialAssignment = (node, credentialId, availableCredentials) => {
    if (!credentialId || !availableCredentials) return false

    return availableCredentials.some((cred) => cred.id === credentialId)
}

/**
 * Organize credentials into three sections: Required, Optional, and Connected
 * - Required: Unconnected credentials that must be assigned (isRequired: true)
 * - Optional: Unconnected credentials that are optional (isRequired: false)
 * - Connected: All connected credentials (sorted: required first, then optional)
 * @param {object} groupedCredentials - Grouped credentials object
 * @returns {object} Organized credentials with three sections
 */
export const organizeCredentialsByPriority = (groupedCredentials) => {
    const sections = {
        required: [],    // Unconnected required credentials
        optional: [],    // Unconnected optional credentials
        connected: []    // All connected credentials
    }

    Object.entries(groupedCredentials).forEach(([groupKey, group]) => {
        const isConnected = group.isAssigned || false
        
        // Check if ANY node in this group is marked as required
        // isRequired is calculated as: category.isCore || !credentialParam.optional
        const isRequired = group.nodes?.some((node) => node.isRequired === true) || false
        
        // Also track isCore for sorting connected credentials
        const isCore = group.nodes?.some((node) => node.isCore === true) || false

        const credentialItem = {
            groupKey,
            ...group,
            isConnected,
            isRequired,
            isCore
        }

        // Route to appropriate section based on connection status and requirement
        if (!isConnected && isRequired) {
            // Unconnected required credentials go to "Required"
            sections.required.push(credentialItem)
        } else if (!isConnected && !isRequired) {
            // Unconnected optional credentials go to "Optional"
            sections.optional.push(credentialItem)
        } else if (isConnected) {
            // All connected credentials go to "Connected"
            sections.connected.push(credentialItem)
        }
    })

    // Sort functions
    const sortByLabel = (a, b) => (a.label || '').localeCompare(b.label || '')
    
    // Sort connected section: required first, then alphabetically within each group
    const sortConnected = (a, b) => {
        // Required credentials before optional
        if (a.isRequired && !b.isRequired) return -1
        if (!a.isRequired && b.isRequired) return 1
        // Then alphabetically by label
        return (a.label || '').localeCompare(b.label || '')
    }

    // Sort each section
    sections.required.sort(sortByLabel)
    sections.optional.sort(sortByLabel)
    sections.connected.sort(sortConnected)

    return sections
}
