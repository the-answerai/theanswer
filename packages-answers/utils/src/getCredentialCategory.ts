/**
 * Determine credential category based on node category and type
 * @param {string} nodeCategory - Node category (e.g., "Chat Models", "Tools", "MCP Servers")
 * @param {string} credentialType - Credential type name
 * @returns {object} Category info with type, display name, and isCore flag
 */
export const getCredentialCategory = (nodeCategory?: string, credentialType?: string) => {
    // Normalize category
    const category = (nodeCategory || '').toLowerCase()
    const credType = (credentialType || '').toLowerCase()

    // Chat Models - always required for basic functionality
    if (category.includes('chat model') || category.includes('llm')) {
        return { type: 'chatModel', displayName: 'Chat Model', isCore: true }
    }

    // MCP Servers - optional tools
    if (category.includes('mcp server') || credType.includes('mcp')) {
        return { type: 'mcpServer', displayName: 'MCP Server', isCore: false }
    }

    // Tools - optional enhancements
    if (category.includes('tool')) {
        return { type: 'tool', displayName: 'Tool', isCore: false }
    }

    // Agents - required for agent flows
    if (category.includes('agent')) {
        return { type: 'agent', displayName: 'Agent', isCore: true }
    }

    // Chains - required for chain flows
    if (category.includes('chain')) {
        return { type: 'chain', displayName: 'Chain', isCore: true }
    }

    // Document Loaders
    if (category.includes('document loader')) {
        return { type: 'documentLoader', displayName: 'Document Loader', isCore: false }
    }

    // Vector Stores
    if (category.includes('vector store')) {
        return { type: 'vectorStore', displayName: 'Vector Store', isCore: false }
    }

    // Cache - optional but important
    if (credType.includes('redis') || credType.includes('cache')) {
        return { type: 'cache', displayName: 'Cache', isCore: false }
    }

    // Default
    return { type: 'other', displayName: 'Other', isCore: false }
}

