/**
 * Parallel Tool Execution POC
 * Main application entry point
 */
import dotenv from 'dotenv'
import express from 'express'
import WeatherTool from './tools/weatherTool.js'
import CalculatorTool from './tools/calculatorTool.js'
import DatabaseTool from './tools/databaseTool.js'
import ToolOrchestrator from './utils/toolOrchestrator.js'
import GeneralistAgent from './agents/generalistAgent.js'
import AgentRegistry from './services/agentRegistry.js'
import GraphGenerator from './utils/graphGenerator.js'

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
app.use(express.json())

// Initialize tools and agents
const toolOrchestrator = new ToolOrchestrator()
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
    console.error('ERROR: OPENAI_API_KEY not found in environment variables')
    process.exit(1)
}

// Register tools
toolOrchestrator.registerTools([new WeatherTool(), new CalculatorTool(), new DatabaseTool()])

// Initialize agent registry
const agentRegistry = new AgentRegistry(apiKey)

// Create generalist agent
const generalistAgent = new GeneralistAgent(apiKey, toolOrchestrator)

// Initialize graph generator
const graphGenerator = new GraphGenerator()

// Define API routes
app.post('/api/chat', async (req, res) => {
    try {
        const { message, chatHistory } = req.body

        if (!message) {
            return res.status(400).json({ error: 'Message is required' })
        }

        console.log(`Received message: ${message}`)

        // Run the generalist agent
        const result = await generalistAgent.run(message, chatHistory || [])

        // Process agent run for visualization
        graphGenerator.processAgentRun(message, result)

        // Return the response with graph visualization
        return res.json({
            response: result.response.content,
            toolResults: result.toolResults,
            usedTools: result.usedTools,
            graph: {
                text: graphGenerator.generateTextGraph(),
                mermaid: graphGenerator.generateMermaidGraph()
            }
        })
    } catch (error) {
        console.error('Error processing request:', error)
        return res.status(500).json({ error: error.message })
    }
})

app.get('/api/tools', (req, res) => {
    const tools = toolOrchestrator.getAllTools().map((tool) => ({
        name: tool.name,
        description: tool.description
    }))

    return res.json({ tools })
})

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Parallel Tool Execution POC running on port ${PORT}`)
    console.log(
        `Available tools: ${toolOrchestrator
            .getAllTools()
            .map((t) => t.name)
            .join(', ')}`
    )
    console.log('Ready to process requests!')
    console.log('\nTo test the API, send a POST request to http://localhost:3000/api/chat')
    console.log('Example curl command:')
    console.log(`curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "I need to know the weather in New York and calculate 583 * 24. Also, get info about user-123 from the database."}'`)
})

// The automatic example execution has been disabled
// You can now use the API directly

export { app, generalistAgent, toolOrchestrator, graphGenerator }
