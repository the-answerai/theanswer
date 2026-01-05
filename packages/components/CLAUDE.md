# CLAUDE.md - Components Package

This file provides guidance for working with the Flowise Components package.

## Overview

The components package contains all Flowise node integrations - the building blocks for creating AI workflows. This includes chat models, agents, tools, vector stores, document loaders, and more.

## Package Structure

```
packages/components/
├── nodes/                    # All node implementations
│   ├── agents/              # LangChain agent nodes
│   ├── agentflow/           # Multi-agent workflow nodes
│   ├── chatmodels/          # LLM integrations (OpenAI, Anthropic, etc.)
│   ├── tools/               # Agent tools and integrations
│   ├── documentloaders/     # Data source loaders
│   ├── vectorstores/        # Vector database connectors
│   ├── embeddings/          # Embedding model integrations
│   ├── memory/              # Conversation memory implementations
│   ├── chains/              # LangChain chain implementations
│   ├── retrievers/          # Document retrieval nodes
│   ├── prompts/             # Prompt templates
│   ├── textsplitters/       # Document chunking strategies
│   ├── sequentialagents/    # Sequential agent implementations
│   ├── multiagents/         # Multi-agent orchestration
│   ├── llms/                # LLM provider integrations
│   ├── analytic/            # Analytics and tracking nodes
│   ├── cache/               # Caching implementations
│   ├── moderation/          # Content moderation
│   ├── outputparsers/       # Response parsing
│   ├── recordmanager/       # Record management
│   ├── responsesynthesizer/ # Response generation
│   ├── utilities/           # Utility nodes
│   └── custom-nodes/        # Custom node implementations
├── credentials/             # Credential definitions for API integrations
├── src/                     # Shared utilities and types
└── models.json              # Model configurations

```

## Development Commands

```bash
# From repository root
pnpm --filter flowise-components build      # Build components
pnpm --filter flowise-components dev        # Watch mode for development

# Testing specific components
pnpm --filter flowise-components test
```

## Creating a New Component

### 1. Component File Structure

Every component must implement the `INode` interface:

```typescript
import { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'

class YourComponent_Category implements INode {
    // REQUIRED: Display information
    label: string = 'Your Component Name'
    name: string = 'yourComponentName'           // Unique identifier (camelCase)
    version: number = 1.0                        // Semantic versioning
    type: string = 'YourComponent'               // Component type name
    icon: string = 'component-icon.svg'          // Icon filename (in nodes/{category}/)
    category: string = 'Category Name'           // Category for grouping
    description: string = 'What this component does'
    baseClasses: string[] = [this.type, ...getBaseClasses(LangChainClass)]

    // REQUIRED FOR THEANSWER: Tag all custom components
    tags: string[] = ['AAI']                     // Always include for TheAnswer components

    // OPTIONAL: Credential integration
    credential?: INodeParams = {
        label: 'Connect Credential',
        name: 'credential',
        type: 'credential',
        credentialNames: ['yourApiCredential']   // Must match credential name
    }

    // REQUIRED: Input parameters
    inputs: INodeParams[] = [
        {
            label: 'Parameter Label',
            name: 'parameterName',
            type: 'string',                      // string, number, boolean, options, json, etc.
            placeholder: 'Enter value...',
            optional: false,
            description: 'Parameter description'
        },
        {
            label: 'Select Option',
            name: 'option',
            type: 'options',
            options: [
                { label: 'Option 1', name: 'option1' },
                { label: 'Option 2', name: 'option2' }
            ]
        }
    ]

    // REQUIRED: Initialization method
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        // 1. Extract inputs
        const parameterName = nodeData.inputs?.parameterName as string
        const option = nodeData.inputs?.option as string

        // 2. Get credentials if needed
        const credentialData = await getCredentialData(
            nodeData.credential ?? '',
            options
        )
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

        // 3. Initialize and return component
        const instance = new YourLangChainClass({
            apiKey,
            // ... other config
        })

        return instance
    }
}

module.exports = { nodeClass: YourComponent_Category }
```

### 2. Component Naming Convention

**Class Name Pattern:** `{ComponentName}_{Category}`
- Example: `ChatOpenAI_ChatModels`, `VectorStoreRetriever_Retrievers`
- Category suffix must match the node category

**File Name:** Match the component type
- File: `packages/components/nodes/chatmodels/ChatOpenAI/ChatOpenAI.ts`
- Class: `ChatOpenAI_ChatModels`

### 3. Input Parameter Types

```typescript
// Common input types:
type: 'string'          // Text input
type: 'number'          // Numeric input
type: 'password'        // Masked input
type: 'boolean'         // Checkbox
type: 'options'         // Dropdown select
type: 'json'            // JSON editor
type: 'code'            // Code editor
type: 'file'            // File upload
type: 'BaseLanguageModel'  // Model selector
type: 'VectorStore'     // Vector store selector

// Advanced configurations
{
    label: 'Advanced Parameter',
    name: 'advanced',
    type: 'string',
    optional: true,        // Makes parameter optional
    default: 'value',      // Default value
    rows: 4,              // For textarea
    acceptVariable: true,  // Allow {{variable}} syntax
    list: true,           // Accept array of values
    additionalParams: true // Show in advanced section
}
```

### 4. Credential Integration

If your component needs API credentials:

**Step 1:** Create credential definition in `credentials/`

```typescript
// credentials/YourApiCredential.credential.ts
import { INodeParams, INodeCredential } from '../src/Interface'

class YourApiCredential implements INodeCredential {
    label: string = 'Your API'
    name: string = 'yourApiCredential'
    version: number = 1.0
    description: string = 'API credentials for Your Service'

    inputs: INodeParams[] = [
        {
            label: 'API Key',
            name: 'apiKey',
            type: 'password',
            placeholder: 'your-api-key'
        },
        {
            label: 'API Secret',
            name: 'apiSecret',
            type: 'password',
            optional: true
        }
    ]
}

module.exports = { credClass: YourApiCredential }
```

**Step 2:** Reference in component

```typescript
credential: INodeParams = {
    label: 'Connect Credential',
    name: 'credential',
    type: 'credential',
    credentialNames: ['yourApiCredential']  // Must match credential name
}
```

**Step 3:** Access in init()

```typescript
const credentialData = await getCredentialData(nodeData.credential ?? '', options)
const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
const apiSecret = getCredentialParam('apiSecret', credentialData, nodeData)
```

## Component Categories

### Agents (`nodes/agents/`)
LangChain agent implementations that can use tools:
- ReAct agents
- Conversational agents
- OpenAI function agents
- Custom agent implementations

### Chat Models (`nodes/chatmodels/`)
LLM provider integrations:
- OpenAI (GPT-3.5, GPT-4)
- Anthropic (Claude)
- Azure OpenAI
- AWS Bedrock
- Google Vertex AI
- Custom model providers

**Always include:**
- Streaming support
- Temperature control
- Max tokens configuration
- Model version selection

### Tools (`nodes/tools/`)
External integrations and capabilities for agents:
- API integrations (Google, Salesforce, etc.)
- Custom tools
- MCP (Model Context Protocol) servers
- Calculators and utilities

**Tool Requirements:**
- Must extend LangChain's `Tool` class
- Implement `_call()` method
- Include clear descriptions for agent usage

### Document Loaders (`nodes/documentloaders/`)
Data source connectors:
- File loaders (PDF, CSV, JSON, etc.)
- API loaders
- Database connectors
- Web scrapers

### Vector Stores (`nodes/vectorstores/`)
Vector database integrations:
- Pinecone
- Chroma
- Qdrant
- FAISS
- Weaviate

**Must implement:**
- `addDocuments()` - Store vectors
- `similaritySearch()` - Query vectors
- Proper indexing configuration

## Error Handling

Always implement proper error handling:

```typescript
async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
    try {
        // Component initialization

        // Validate required inputs
        if (!parameterName) {
            throw new Error('Parameter Name is required')
        }

        // Initialize component
        const instance = new YourComponent({
            // config
        })

        return instance

    } catch (error) {
        // Provide helpful error messages
        throw new Error(`Failed to initialize YourComponent: ${error.message}`)
    }
}
```

## Testing Components

### Manual Testing
1. Build the component: `pnpm build`
2. Restart Flowise server
3. Component appears in UI under specified category
4. Test in a chatflow with various inputs

### Common Issues

**Component not appearing:**
- Check `module.exports = { nodeClass: YourComponent }` syntax
- Verify file is in correct category folder
- Rebuild: `pnpm --filter flowise-components build`

**Credential not working:**
- Ensure credential file exports `{ credClass: YourCredential }`
- Verify `credentialNames` array matches credential name exactly
- Check credential definition in `credentials/` folder

**Input parameters not showing:**
- Verify `inputs` array is properly defined
- Check for TypeScript errors in parameter definitions
- Ensure `type` is a valid parameter type

## Best Practices

### 1. Component Design
- **Single Responsibility:** Each component should do one thing well
- **Clear Naming:** Use descriptive names that explain functionality
- **Documentation:** Include helpful descriptions and placeholders
- **Defaults:** Provide sensible default values where appropriate

### 2. Input Parameters
- **Required vs Optional:** Only mark truly optional parameters as `optional: true`
- **Validation:** Validate inputs in `init()` before use
- **Placeholders:** Provide example values in placeholders
- **Descriptions:** Explain what each parameter does

### 3. TheAnswer Components
- **Always tag:** Include `tags: ['AAI']` for all TheAnswer-specific components
- **Version properly:** Use semantic versioning (1.0, 1.1, 2.0)
- **Base on stable LangChain versions:** Pin to stable LangChain dependencies

### 4. Performance
- **Lazy Loading:** Only import heavy dependencies when needed
- **Caching:** Cache expensive operations where appropriate
- **Streaming:** Implement streaming for chat models when possible

### 5. Security
- **Never expose credentials:** Always use credential system
- **Validate inputs:** Sanitize user inputs to prevent injection
- **Error messages:** Don't leak sensitive info in error messages

## Integration with Tools (MCP)

For MCP (Model Context Protocol) server integrations:

```typescript
// Example: MCP Tool integration
import { MCPClient } from '@answerai/answeragent-mcp'

class MCPTool_Tools implements INode {
    // ... standard node config

    async init(nodeData: INodeData): Promise<any> {
        const serverUrl = nodeData.inputs?.serverUrl as string

        // Initialize MCP client
        const client = new MCPClient({
            serverUrl,
            // ... config
        })

        // Return tool that uses MCP
        return new DynamicStructuredTool({
            name: 'mcp_tool',
            description: 'Tool powered by MCP server',
            schema: z.object({
                // ... schema
            }),
            func: async (input) => {
                return await client.call(input)
            }
        })
    }
}
```

## Updating Existing Components

When modifying existing components:

1. **Increment version:** Update `version` number
2. **Maintain compatibility:** Avoid breaking changes when possible
3. **Test thoroughly:** Test with existing chatflows
4. **Document changes:** Update component description if behavior changes

## Component Checklist

Before submitting a new component:

- [ ] Implements `INode` interface correctly
- [ ] Includes `tags: ['AAI']` for TheAnswer components
- [ ] Has clear, descriptive `label` and `description`
- [ ] Proper `baseClasses` defined
- [ ] All required inputs defined with appropriate types
- [ ] Credential integration if needed (API keys, secrets)
- [ ] Error handling in `init()` method
- [ ] Tested manually in Flowise UI
- [ ] Follows naming conventions
- [ ] Icon file added (if custom icon)
- [ ] Version number set appropriately

## Advanced Topics

### Dynamic Input Parameters

Some components need dynamic inputs based on other selections:

```typescript
inputs: INodeParams[] = [
    {
        label: 'Model',
        name: 'model',
        type: 'options',
        options: [
            { label: 'GPT-4', name: 'gpt-4' },
            { label: 'GPT-3.5', name: 'gpt-3.5-turbo' }
        ]
    },
    {
        label: 'Temperature',
        name: 'temperature',
        type: 'number',
        default: 0.7,
        show: {  // Conditional display
            'model': ['gpt-4']
        }
    }
]
```

### Loading External Modules

For components that need external dependencies:

```typescript
async init(nodeData: INodeData): Promise<any> {
    // Dynamic import for heavy dependencies
    const { LargeLibrary } = await import('large-library')

    // Use the library
    const instance = new LargeLibrary({
        // config
    })

    return instance
}
```

## Resources

- **LangChain Documentation:** https://js.langchain.com/
- **Flowise Component Examples:** Explore existing nodes in `nodes/` directories
- **Interface Definitions:** See `src/Interface.ts` for all type definitions
- **Main Repository CLAUDE.md:** See root `CLAUDE.md` for overall architecture
