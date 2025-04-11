/**
 * Generalist Agent
 * An agent that can use multiple tools in parallel
 */
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { HumanMessage, ToolMessage } from '@langchain/core/messages'

class GeneralistAgent {
    constructor(apiKey, toolOrchestrator) {
        this.apiKey = apiKey
        this.toolOrchestrator = toolOrchestrator
        this.model = new ChatOpenAI({
            apiKey: this.apiKey,
            modelName: 'gpt-4o',
            temperature: 0.1
        })

        // Create a model that can use tools
        this.modelWithTools = this.model.bind({
            tools: this.toolOrchestrator.getAllTools()
        })

        this.systemPrompt = `
You are an AI assistant with access to specialized tools.
When you need information that requires these tools, request them all at once.
For example, if you need both weather and calculator information, call both tools in parallel rather than one at a time.

IMPORTANT INSTRUCTIONS:
1. If multiple tools are required to answer a question, call them ALL AT ONCE, not sequentially.
2. When multiple tools are called, use ALL their results to formulate your final answer.
3. Keep your answers concise and focused.
4. Only use tools when necessary.
`
    }

    /**
     * Create the prompt template
     */
    createPrompt() {
        return ChatPromptTemplate.fromMessages([
            ['system', this.systemPrompt],
            ['human', '{input}']
        ])
    }

    /**
     * Create the full agent chain
     */
    createChain() {
        const prompt = this.createPrompt()

        return RunnableSequence.from([
            {
                input: (input) => input.input,
                chat_history: (input) => input.chat_history || []
            },
            prompt,
            this.modelWithTools
        ])
    }

    /**
     * Process multiple tool results and format messages for the LLM
     * @param {Array} toolResults - Results from parallel tool execution
     * @returns {Array} - Formatted tool messages
     */
    formatToolMessages(toolResults) {
        return toolResults.map((result) => {
            console.log('Formatting tool result:', JSON.stringify(result, null, 2))
            return new ToolMessage({
                content: JSON.stringify(result.result || result.error),
                tool_call_id: result.tool_call_id,
                name: result.name
            })
        })
    }

    /**
     * Run the agent with a user input
     * @param {string} input - User input
     * @param {Array} chatHistory - Previous messages in the conversation
     * @returns {Object} - The agent's response
     */
    async run(input, chatHistory = []) {
        console.log(`Running Generalist agent with input: ${input}`)

        // Initialize chain
        const chain = this.createChain()

        // Get the initial LLM response
        const response = await chain.invoke({
            input
        })

        console.log('LLM response:', JSON.stringify(response, null, 2))

        // If the response has tool calls, execute them in parallel
        if (response.tool_calls && response.tool_calls.length > 0) {
            console.log(`Agent requested ${response.tool_calls.length} tools`)

            // Execute all tool calls in parallel
            const toolResults = await this.toolOrchestrator.executeToolsInParallel(response.tool_calls)

            // Format tool messages for the LLM
            const toolMessages = this.formatToolMessages(toolResults)

            // Create the updated messages with the original input, the LLM's tool calls,
            // and the results from the tools
            const messages = [...chatHistory, new HumanMessage(input), response, ...toolMessages]

            // Get the final response from the LLM, now with tool results
            const finalResponse = await this.model.invoke(messages)

            // Map the tool calls to get the names, handling both old and new formats
            const usedTools = response.tool_calls.map((tc) => {
                return tc.name || (tc.function ? tc.function.name : 'unknown')
            })

            return {
                response: finalResponse,
                toolResults,
                usedTools
            }
        }

        // If no tools were used, return the direct response
        return {
            response,
            toolResults: [],
            usedTools: []
        }
    }
}

export default GeneralistAgent
