# Parallel Tool Execution POC - Quick Start Guide

Get up and running with the Parallel Tool Execution POC in minutes.

## 1. Prerequisites

-   Node.js (v16 or later)
-   npm or yarn
-   OpenAI API key

## 2. Installation

Clone the repository and install dependencies:

```bash
# Clone the project
git clone <repository-url>
cd parallel-tools-poc

# Install dependencies
npm install
```

## 3. Configuration

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## 4. Running the Application

Start the development server:

```bash
npm start
```

The server will start on http://localhost:3000, and an example query will automatically run to demonstrate the parallel tool execution capabilities.

## 5. Try It Out

### Using cURL

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I need to know the weather in Boston, calculate 125 * 16, and look up user-456 in the database"}'
```

### Using JavaScript Fetch

```javascript
fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: 'I need to know the weather in Boston, calculate 125 * 16, and look up user-456 in the database'
    })
})
    .then((response) => response.json())
    .then((data) => console.log(data))
```

## 6. Understanding the Response

The API response includes:

```json
{
    "response": "The LLM's response to your query",
    "toolResults": [
        {
            "tool_call_id": "call_abc123",
            "name": "weather",
            "result": {
                "location": "Boston",
                "weather": "sunny",
                "temperature": "68°F",
                "humidity": "45%",
                "timestamp": "2023-06-15T12:34:56.789Z"
            },
            "executionTime": 1023
        },
        {
            "tool_call_id": "call_def456",
            "name": "calculator",
            "result": {
                "expression": "125 * 16",
                "result": 2000,
                "timestamp": "2023-06-15T12:34:56.789Z"
            },
            "executionTime": 702
        },
        {
            "tool_call_id": "call_ghi789",
            "name": "database",
            "result": {
                "result": {
                    "id": "user-456",
                    "name": "Jane Smith",
                    "email": "jane@example.com",
                    "role": "user"
                },
                "timestamp": "2023-06-15T12:34:56.789Z"
            },
            "executionTime": 1198
        }
    ],
    "usedTools": ["weather", "calculator", "database"],
    "graph": {
        "text": "Text representation of the execution graph",
        "mermaid": "Mermaid diagram code for visualizing the graph"
    }
}
```

## 7. Available Tools

-   **weather**: Get weather information for a location
-   **calculator**: Perform mathematical calculations
-   **database**: Look up entities in the mock database

## 8. Next Steps

-   Check out the full [README.md](README.md) for detailed information
-   Explore the [GUIDE.md](GUIDE.md) for advanced usage and extending the project
-   Try building your own tools or agents by following the patterns in the codebase

## 9. Troubleshooting

If you encounter any issues:

1. Verify your OpenAI API key is valid and has sufficient credits
2. Ensure you're using a Node.js version 16 or later
3. Check the console for error messages
4. Make sure your query is clear about which tools to use

Happy coding!
