# Parallel Tool Execution POC - User Guide

This guide explains how to use and extend the Parallel Tool Execution POC.

## Running the Project

1. **Set up your environment**

    - Install Node.js (v16 or later)
    - Clone the repository
    - Run `npm install` to install dependencies
    - Create a `.env` file with your OpenAI API key: `OPENAI_API_KEY=your_key_here`

2. **Start the application**

    - Run `npm start` to start the server
    - The server will run on http://localhost:3000
    - An example query will automatically execute to demonstrate tool execution

3. **Test via API**
    - Use a tool like Postman or cURL to send requests to the API endpoints
    - Example cURL command:
        ```bash
        curl -X POST http://localhost:3000/api/chat \
          -H "Content-Type: application/json" \
          -d '{"message": "I need the weather in London, calculate 245 * 17, and get info about user-456 from the database"}'
        ```

## Understanding the Code

### Key Files and Their Purpose

-   **src/index.js**: Main entry point that sets up the Express server and initializes all components
-   **src/tools/\*.js**: Individual tool implementations
-   **src/utils/toolOrchestrator.js**: Manages tools and handles parallel execution
-   **src/agents/generalistAgent.js**: Main agent implementation that uses tools
-   **src/utils/graphGenerator.js**: Generates visualizations of agent and tool interactions

### How Parallel Execution Works

1. When the user sends a message, the Generalist agent processes it with an LLM
2. If the LLM response includes multiple tool calls, they are collected
3. The Tool Orchestrator maps each tool call to its corresponding function and executes them in parallel
4. All tool results are collected and sent back to the LLM for a final response

## Extending the Project

### Adding a New Tool

To add a new tool, follow these steps:

1. **Create a new tool file** in the `src/tools` directory

    ```javascript
    // src/tools/newTool.js
    import { StructuredTool } from '@langchain/core/tools'

    class NewTool extends StructuredTool {
        constructor() {
            super()
            this.name = 'newTool'
            this.description = 'Description of what your tool does'
            this.schema = {
                type: 'object',
                properties: {
                    // Define input parameters
                    param1: {
                        type: 'string',
                        description: 'Description of parameter 1'
                    }
                },
                required: ['param1']
            }
        }

        async _call(input) {
            const { param1 } = input

            // Implement your tool logic here
            // ...

            return {
                // Return your result
                result: `Processed ${param1}`,
                timestamp: new Date().toISOString()
            }
        }
    }

    export default NewTool
    ```

2. **Register the tool** in `src/index.js`

    ```javascript
    import NewTool from './tools/newTool.js'

    // Register tools
    toolOrchestrator.registerTools([
        // ... existing tools
        new NewTool()
    ])
    ```

### Creating a New Specialist Agent

To add a new specialist agent:

1. **Update the agent registry** in `src/services/agentRegistry.js`

    ```javascript
    initializeSpecialists() {
      // ... existing specialists

      // Create new specialist
      this.registerAgent('newSpecialist', new SpecialistAgent(
        this.apiKey,
        'newSpecialist',
        `You are a specialized agent for [domain].
         Provide expert analysis on [specific tasks].
         Keep responses concise and informative.`
      ));
    }
    ```

### Modifying the Graph Visualization

To change how agent and tool interactions are visualized:

1. **Modify the Graph Generator** in `src/utils/graphGenerator.js`

    ```javascript
    // Add a new node type
    addCustomNode(nodeType, data) {
      const id = this.nodeCounter++;
      this.nodes.push({
        id,
        label: nodeType,
        type: 'custom',
        data
      });
      return id;
    }

    // Modify the mermaid graph generation
    generateMermaidGraph() {
      // ... modify the existing code to change styling or structure
    }
    ```

## Best Practices

1. **Tool Design**

    - Keep tools focused on a single responsibility
    - Provide clear descriptions for tools and their parameters
    - Add appropriate error handling in tool implementations

2. **Agent Prompting**

    - Use clear system prompts to instruct agents on when to use parallel tools
    - Specify exactly how tools should be used together

3. **Testing**
    - Test complex queries that require multiple tools
    - Test error scenarios to ensure graceful handling

## Troubleshooting

### Common Issues

1. **"Tool X not found" errors**

    - Check that the tool is properly registered in the tool orchestrator
    - Ensure the tool name in the LLM's tool call matches the registered name

2. **LLM not using tools in parallel**

    - Review the system prompt to ensure it clearly instructs parallel tool usage
    - Try adjusting the prompt to be more explicit about when to use multiple tools

3. **API errors**
    - Check your OpenAI API key and ensure it has not expired
    - Verify you're using a model that supports function calling

## Advanced Topics

### Using with Different LLM Providers

The project can be extended to work with different LLM providers:

1. **Modify the agent implementation** to use a different provider

    ```javascript
    // Example for using Anthropic
    import { AnthropicChat } from 'langchain/chat_models/anthropic'

    this.model = new AnthropicChat({
        apiKey: this.apiKey,
        modelName: 'claude-2.1',
        temperature: 0.1
    })
    ```

2. **Adjust tool formats** as needed for different providers

### Implementing State Management

For more complex applications, you might want to add state management:

1. **Create a conversation state manager** that persists chat history
2. **Add a database** for storing conversation and tool call history
3. **Implement user authentication** for multi-user support

## Further Resources

-   [LangChain Documentation](https://js.langchain.com/docs/)
-   [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
-   [Express.js Documentation](https://expressjs.com/)
