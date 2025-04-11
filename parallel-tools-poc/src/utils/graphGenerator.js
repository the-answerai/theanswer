/**
 * Graph Generator
 * Generates a visualization of tool and agent calls
 */

class GraphGenerator {
    constructor() {
        this.nodes = []
        this.edges = []
        this.nodeCounter = 0
    }

    /**
     * Reset the graph
     */
    reset() {
        this.nodes = []
        this.edges = []
        this.nodeCounter = 0
    }

    /**
     * Add a user query node
     * @param {string} query - The user's query
     * @returns {number} - The ID of the created node
     */
    addUserQueryNode(query) {
        const id = this.nodeCounter++
        this.nodes.push({
            id,
            label: 'User Query',
            type: 'user',
            data: { query }
        })
        return id
    }

    /**
     * Add an agent node
     * @param {string} agentName - The name of the agent
     * @param {Object} response - The agent's response
     * @returns {number} - The ID of the created node
     */
    addAgentNode(agentName, response) {
        const id = this.nodeCounter++
        this.nodes.push({
            id,
            label: agentName,
            type: 'agent',
            data: { response }
        })
        return id
    }

    /**
     * Add a tool node
     * @param {string} toolName - The name of the tool
     * @param {Object} result - The tool's result
     * @returns {number} - The ID of the created node
     */
    addToolNode(toolName, result) {
        const id = this.nodeCounter++
        this.nodes.push({
            id,
            label: toolName,
            type: 'tool',
            data: { result }
        })
        return id
    }

    /**
     * Add an edge between nodes
     * @param {number} sourceId - The source node ID
     * @param {number} targetId - The target node ID
     * @param {string} label - The edge label
     */
    addEdge(sourceId, targetId, label = '') {
        this.edges.push({
            source: sourceId,
            target: targetId,
            label
        })
    }

    /**
     * Process an agent run and add it to the graph
     * @param {string} userQuery - The user's query
     * @param {Object} result - The result of the agent run
     */
    processAgentRun(userQuery, result) {
        // Add user query node
        const userNodeId = this.addUserQueryNode(userQuery)

        // Add generalist agent node
        const generalistNodeId = this.addAgentNode('Generalist', result.response)

        // Add edge from user to generalist
        this.addEdge(userNodeId, generalistNodeId, 'asks')

        // Process tool results
        if (result.toolResults && result.toolResults.length > 0) {
            result.toolResults.forEach((toolResult) => {
                const toolNodeId = this.addToolNode(toolResult.name, toolResult.result)
                this.addEdge(generalistNodeId, toolNodeId, 'calls')
                this.addEdge(toolNodeId, generalistNodeId, 'returns')
            })
        }
    }

    /**
     * Generate a text representation of the graph
     * @returns {string} - Text representation of the graph
     */
    generateTextGraph() {
        let text = 'Graph Visualization:\n\n'

        // Add nodes
        text += 'Nodes:\n'
        this.nodes.forEach((node) => {
            text += `- [${node.id}] ${node.label} (${node.type})\n`
        })

        // Add edges
        text += '\nEdges:\n'
        this.edges.forEach((edge) => {
            const source = this.nodes.find((n) => n.id === edge.source)
            const target = this.nodes.find((n) => n.id === edge.target)
            text += `- [${source.id}] ${source.label} --${edge.label || 'connects to'}--> [${target.id}] ${target.label}\n`
        })

        return text
    }

    /**
     * Generate a mermaid graph definition (for visualization)
     * @returns {string} - Mermaid graph definition
     */
    generateMermaidGraph() {
        let mermaid = 'graph TD;\n'

        // Add nodes with styling
        this.nodes.forEach((node) => {
            let style = ''
            if (node.type === 'user') {
                style = 'style:"fill:#e6f7ff,stroke:#1890ff"'
            } else if (node.type === 'agent') {
                style = 'style:"fill:#f6ffed,stroke:#52c41a"'
            } else if (node.type === 'tool') {
                style = 'style:"fill:#fff7e6,stroke:#fa8c16"'
            }

            mermaid += `    ${node.id}["${node.label}"]${style ? ' ' + style : ''};\n`
        })

        // Add edges
        this.edges.forEach((edge) => {
            mermaid += `    ${edge.source} -- "${edge.label}" --> ${edge.target};\n`
        })

        return mermaid
    }
}

export default GraphGenerator
