# Parallel Tool Execution POC

A Node.js proof of concept demonstrating parallel tool execution with LangChain and OpenAI.

## Overview

This project shows how to implement parallel tool execution with LLMs, where multiple tools are called simultaneously instead of sequentially. The implementation uses LangChain and OpenAI's tool calling capabilities.

## Features

-   **Parallel Tool Execution**: Execute multiple LLM tool calls simultaneously
-   **Diverse Tool Types**: Weather information, calculator, and database lookup tools
-   **Agent Architecture**: Generalist agent that can use multiple tools in parallel
-   **Visualization**: Graph representation of tool calls and agent interactions
-   **API Endpoints**: Express server with endpoints for chatting and viewing available tools

## Project Structure

```
parallel-tools-poc/
├── src/
│   ├── agents/
│   │   ├── generalistAgent.js   # Main agent that can use multiple tools
│   │   └── specialistAgent.js   # Domain-specific agents for specialized tasks
│   ├── tools/
│   │   ├── weatherTool.js       # Tool for retrieving weather information
│   │   ├── calculatorTool.js    # Tool for performing calculations
│   │   └── databaseTool.js      # Tool for database lookups
│   ├── utils/
│   │   ├── toolOrchestrator.js  # Orchestrates parallel tool execution
│   │   └── graphGenerator.js    # Generates visualization of tool/agent calls
│   ├── services/
│   │   └── agentRegistry.js     # Registry for managing different agents
│   └── index.js                 # Main application entry point
├── .env                         # Environment variables
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## How Parallel Tool Execution Works

1. **Tool Registration**: Tools are registered with the Tool Orchestrator.
2. **Agent Creation**: The Generalist agent is initialized with access to all tools.
3. **User Input**: The user sends a query that might require multiple tool calls.
4. **LLM Processing**: The LLM identifies which tools are needed and requests them.
5. **Parallel Execution**: Instead of executing tools one by one, all tool calls are gathered and executed in parallel using `Promise.all()`.
6. **Result Aggregation**: Results from all tools are collected and passed back to the LLM.
7. **Final Response**: The LLM synthesizes a response using all the tool results.

## Key Components

### Tool Orchestrator

The `ToolOrchestrator` class handles parallel execution of tools:

```javascript
async executeToolsInParallel(toolCalls) {
  const toolPromises = toolCalls.map(async (toolCall) => {
    // Extract tool details
    const { name, arguments: argsStr, id: toolCallId } = toolCall.function;
    const tool = this.tools.get(name);

    // Execute the tool
    const result = await tool._call(JSON.parse(argsStr));

    // Return result with tool call ID
    return {
      tool_call_id: toolCallId,
      name,
      result
    };
  });

  // Wait for all tools to complete execution
  return Promise.all(toolPromises);
}
```

### Generalist Agent

The `GeneralistAgent` class uses the Tool Orchestrator to execute tools in parallel:

```javascript
async run(input, chatHistory = []) {
  // Get the initial LLM response
  const response = await chain.invoke({
    input,
    chat_history: chatHistory
  });

  // If the response has tool calls, execute them in parallel
  if (response.tool_calls && response.tool_calls.length > 0) {
    // Execute all tool calls in parallel
    const toolResults = await this.toolOrchestrator.executeToolsInParallel(response.tool_calls);

    // Format tool messages for the LLM
    const toolMessages = this.formatToolMessages(toolResults);

    // Get the final response with tool results
    const finalResponse = await this.model.invoke([
      ...chatHistory,
      new HumanMessage(input),
      response,
      ...toolMessages
    ]);

    return {
      response: finalResponse,
      toolResults,
      usedTools: response.tool_calls.map(tc => tc.function.name)
    };
  }

  // If no tools were used, return the direct response
  return {
    response,
    toolResults: [],
    usedTools: []
  };
}
```

## Getting Started

### Prerequisites

-   Node.js (v16 or later)
-   OpenAI API key

### Installation

1. Clone this repository:

    ```
    git clone <repository-url>
    cd parallel-tools-poc
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Create a `.env` file with your OpenAI API key:
    ```
    OPENAI_API_KEY=your_api_key_here
    ```

### Running the Application

Start the server:

```
npm start
```

The application will run on http://localhost:3000 and automatically execute an example query.

### API Endpoints

-   **POST /api/chat**: Send a message to the agent

    ```json
    {
        "message": "I need to know the weather in New York and calculate 583 * 24",
        "chatHistory": []
    }
    ```

-   **GET /api/tools**: Get a list of available tools

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

-   [LangChain](https://js.langchain.com/) for the LLM framework
-   [OpenAI](https://openai.com/) for the GPT models
