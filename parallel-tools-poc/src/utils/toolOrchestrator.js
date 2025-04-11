/**
 * Tool Orchestrator
 * Handles parallel execution of multiple tools
 */

class ToolOrchestrator {
    constructor() {
        this.tools = new Map()
    }

    /**
     * Register a tool with the orchestrator
     * @param {Object} tool - The tool instance to register
     */
    registerTool(tool) {
        if (!tool.name) {
            throw new Error('Tool must have a name property')
        }
        this.tools.set(tool.name, tool)
        console.log(`Registered tool: ${tool.name}`)
        return this
    }

    /**
     * Register multiple tools at once
     * @param {Array} tools - Array of tool instances
     */
    registerTools(tools) {
        tools.forEach((tool) => this.registerTool(tool))
        return this
    }

    /**
     * Get a registered tool by name
     * @param {string} toolName - The name of the tool to retrieve
     */
    getTool(toolName) {
        return this.tools.get(toolName)
    }

    /**
     * Get all registered tools
     */
    getAllTools() {
        return Array.from(this.tools.values())
    }

    /**
     * Execute tools in parallel based on tool calls
     * @param {Array} toolCalls - Array of tool call objects from the LLM
     * @returns {Promise<Array>} - Results from all tool executions
     */
    async executeToolsInParallel(toolCalls) {
        console.log(`Executing ${toolCalls.length} tools in parallel`)

        const toolPromises = toolCalls.map(async (toolCall) => {
            // Check the format of the tool call and log it for debugging
            console.log('Tool call format:', JSON.stringify(toolCall, null, 2))

            // Handle different tool call formats
            let name, args, toolCallId

            if (toolCall.name && toolCall.args) {
                // New format
                name = toolCall.name
                args = toolCall.args // Already an object, no need to parse
                toolCallId = toolCall.id
            } else if (toolCall.function) {
                // Old format
                name = toolCall.function.name
                args = JSON.parse(toolCall.function.arguments)
                toolCallId = toolCall.id
            } else {
                console.error('Unknown tool call format:', toolCall)
                return {
                    error: 'Unknown tool call format',
                    timestamp: new Date().toISOString()
                }
            }

            const tool = this.tools.get(name)

            if (!tool) {
                console.error(`Tool '${name}' not found`)
                return {
                    tool_call_id: toolCallId,
                    name,
                    error: `Tool '${name}' not found`,
                    timestamp: new Date().toISOString()
                }
            }

            try {
                // Start tool execution timing
                const startTime = Date.now()

                // Execute the tool
                const result = await tool._call(args)

                // Calculate execution time
                const executionTime = Date.now() - startTime

                console.log(`Tool '${name}' executed in ${executionTime}ms`)

                // Return result with tool call ID for tracking
                return {
                    tool_call_id: toolCallId,
                    name,
                    result,
                    executionTime,
                    timestamp: new Date().toISOString()
                }
            } catch (error) {
                console.error(`Error executing tool '${name}':`, error)
                return {
                    tool_call_id: toolCallId,
                    name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            }
        })

        // Wait for all tools to complete execution
        return Promise.all(toolPromises)
    }
}

export default ToolOrchestrator
