# Requirements for AnswerAI Agent Node

## 1. Introduction

The primary goal is to create a new Flowise node named "AnswerAI Agent" (`answerAIAgent`). This node will consolidate the functionality of the existing `ToolAgent`, `AAIChatMemory` (as a default, internally managed memory), and `ChatPromptTemplate` (with its UI integrated into the new node's "Additional Settings"). It will also feature a built-in mechanism for selecting AI providers and their specific models, using predefined API keys.

This initiative aims to simplify the user experience by reducing the number of nodes required to build a common agent configuration.

## 2. File Creation and Structure

-   **New File Path**: `packages/components/nodes/agents/AnswerAIAgent/AnswerAIAgent.ts`
-   **Inspiration**: Use the structure of `packages/components/nodes/agents/ToolAgent/ToolAgent.ts` as a starting template for the new class.
-   **Class Definition**:
    -   Name: `AnswerAIAgent_Agents` (following convention)
    -   Implements: `INode`
-   **Node Properties**:
    -   `label`: "AnswerAI Agent"
    -   `name`: "answerAIAgent"
    -   `version`: 1 (or current versioning standard)
    -   `description`: "A consolidated agent that uses specified tools, a default chat memory, an integrated chat prompt template, and selected AI models via function calling."
    -   `type`: "AnswerAIAgent" (or a suitable unique type identifier)
    -   `icon`: A new icon (e.g., `answerAIAgent.png`) or an appropriate existing one.
    -   `category`: "Agents"
    -   `baseClasses`: Determine appropriate base classes, likely including `this.type` and potentially base classes from `AgentExecutor` if relevant (similar to `ToolAgent`).

## 3. Input Parameters (`INodeParams[]`)

The `inputs` array for the `AnswerAIAgent_Agents` class will be a combination of existing `ToolAgent` inputs, new inputs for AI model selection, and integrated inputs from `ChatPromptTemplate`.

### 3.1. Core Agent Inputs (Inherited/Adapted from `ToolAgent`)

-   **LLM (Now Internalized)**: The `llm` input from `ToolAgent` will be replaced by the AI Provider/Model selection mechanism detailed below.
-   **Tools**: `label: 'Tools'`, `name: 'tools'`, `type: 'Tool'`, `array: true` (Allow multiple tools).
-   **Allowed Tools**: `label: 'Allowed Tools'`, `name: 'allowedTools'`, `type: 'string'`, `array: true`, `description: 'Array of tool names to allow, blank if all tools are allowed'`, `optional: true`, `additionalParams: true`.
-   **Memory (Now Internalized)**: The `memory` input from `ToolAgent` will be handled internally by default using `AAIChatMemory`. If `AAIChatMemory` requires configurable parameters (e.g., Redis URL if not globally available via environment variables), these might need to be exposed or a strategy for `process.env` access documented. For this initial version, assume `AAIChatMemory`'s `initializeRedis` function can access necessary Redis configurations (e.g., from environment variables like `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_NAMESPACE`).
-   **Max Iterations**: `label: 'Max Iterations'`, `name: 'maxIterations'`, `type: 'number'`, `optional: true`, `additionalParams: true`, `default: 10`.
-   **Return Intermediate Steps**: `label: 'Return Intermediate Steps'`, `name: 'returnIntermediateSteps'`, `type: 'boolean'`, `optional: true`, `additionalParams: true`.
-   **Custom Output Function**: `label: 'Custom Output Function Code'`, `name: 'outputFunction'`, `type: 'code'`, `optional: true`, `additionalParams: true`, `description: 'Optional JS code to process the final output. Input: { output, intermediateSteps, usedTools }'`.
-   **Input Moderation**: `label: 'Input Moderation'`, `name: 'inputModeration'`, `type: 'Moderation'`, `optional: true`, `additionalParams: true`.
-   **Output Moderation**: `label: 'Output Moderation'`, `name: 'outputModeration'`, `type: 'Moderation'`, `optional: true`, `additionalParams: true`.

### 3.2. AI Model Selection

This section replaces the direct `llm` input.

-   **AI Provider**:
    -   `label`: "AI Provider"
    -   `name`: "aiProvider"
    -   `type`: "options"
    -   `options`:
        -   `{ label: 'OpenAI', name: 'openai' }`
        -   `{ label: 'Anthropic', name: 'anthropic' }`
        -   `{ label: 'Google Generative AI', name: 'google' }`
        -   `{ label: 'Groq', name: 'groq' }`
        -   `{ label: 'Deepseek', name: 'deepseek' }`
        -   `{ label: 'AWS Bedrock', name: 'aws' }`
    -   `default`: "openai"
-   **AI Model**:
    -   `label`: "AI Model"
    -   `name`: "aiModel"
    -   `type`: "options" (or string input if list is too dynamic/long, especially for Bedrock)
    -   `description`: "Model options will vary based on the selected AI Provider. For AWS Bedrock, enter the full model ID (e.g., anthropic.claude-3-sonnet-20240229-v1:0)."
    -   Options should dynamically update based on `aiProvider` if feasible in the UI framework. If not, provide guidance or expect manual input.
        -   **OpenAI Models**: e.g., `gpt-4-turbo`, `gpt-4o`, `gpt-3.5-turbo`
        -   **Anthropic Models**: e.g., `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
        -   **Google Models**: e.g., `gemini-pro`, `gemini-1.5-pro-latest`
        -   **Groq Models**: e.g., `llama3-8b-8192`, `mixtral-8x7b-32768`, `gemma-7b-it`
        -   **Deepseek Models**: e.g., `deepseek-chat`, `deepseek-coder`
        -   **AWS Bedrock**: This will likely be a text input for the Model ID. (e.g., `anthropic.claude-v2:1`, `ai21.j2-ultra-v1`, `amazon.titan-text-express-v1`).
-   **Credential Handling**:
    -   The node must internally map the selected `aiProvider` to specific environment variable names for API keys.
    -   OpenAI: `AAI_DEFAULT_OPENAI_API_KEY`
    -   Anthropic: `AAI_DEFAULT_ANTHROPIC_API_KEY` (Note: User provided `ANTHROPHIC` which is likely a typo for `ANTHROPIC`)
    -   Google: `AAI_DEFAULT_GOOGLE_GENERATIVE_AI_KEY`
    -   Groq: `AAI_DEFAULT_GROQ_API_KEY`
    -   Deepseek: `AAI_DEFAULT_DEEPSEEK_API_KEY`
    -   AWS Bedrock: `AAI_DEFAULT_AWS_BEDROCK_ACCESS_KEY`, `AAI_DEFAULT_AWS_BEDROCK_SECRET_KEY` (and potentially `AAI_DEFAULT_AWS_BEDROCK_REGION`).

### 3.3. Integrated Chat Prompt Template (Group under "Additional Settings")

These inputs are derived from `ChatPromptTemplate.ts`.

-   **System Message**:
    -   `label`: "System Message"
    -   `name`: "systemMessagePrompt"
    -   `type`: "string"
    -   `rows`: 4
    -   `default`: "You are a helpful AI assistant." (or similar default from `ToolAgent`)
    -   `description`: "The system message for the agent. This will be the primary system message used."
    -   `additionalParams`: true
-   **Human Message Template**:
    -   `label`: "Human Message Template"
    -   `name`: "humanMessagePrompt"
    -   `type`: "string"
    -   `rows`: 4
    -   `default`: "{input}" (or `{text}` if that's the standard variable from ToolAgent's input)
    -   `placeholder`: "{input}"
    -   `description`: "Template for the human message. Use {input} for the user's query."
    -   `additionalParams`: true
-   **Format Prompt Values**:
    -   `label`: "Format Prompt Values"
    -   `name`: "promptValues"
    -   `type`: "code"
    -   `rows`: 4
    -   `optional`: true
    -   `description`: "A JSON object of key-value pairs to customize the prompt. E.g., {\"persona\": \"pirate\"}. These will be available in system/human message templates."
    -   `additionalParams`: true

## 4. Constructor

-   Initialize node properties (label, name, version, description, type, icon, category, baseClasses).
-   Accept `fields?: { sessionId?: string }` if session handling is similar to `ToolAgent`. Store `this.sessionId = fields?.sessionId;`.

## 5. `init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any>` Method

This method will set up the agent by initializing the AI model, memory, and prompt template.

1.  **Retrieve Inputs**:
    -   Extract `aiProvider`, `aiModel`, `systemMessagePrompt`, `humanMessagePrompt`, `promptValues`, `tools`, etc., from `nodeData.inputs`.
    -   Extract `sessionId` from `this.sessionId` or `options.sessionId`.
    -   Extract `chatId` from `options.chatId`.
2.  **Initialize AI Model (Chat Model)**:
    -   Implement logic (e.g., a switch statement or a factory function) based on `aiProvider`.
    -   Fetch the corresponding API key(s) from `process.env` using the predefined names (e.g., `process.env.AAI_DEFAULT_OPENAI_API_KEY`).
    -   Instantiate the appropriate Langchain chat model class (e.g., `ChatOpenAI`, `ChatAnthropic`, `ChatGoogleGenerativeAI`, `ChatGroq`, custom classes for Deepseek if not directly supported by Langchain, `BedrockChat` for AWS).
    -   Pass the model name (`aiModel`) and API keys to the constructor. For AWS Bedrock, include region if necessary (e.g., from `process.env.AAI_DEFAULT_AWS_BEDROCK_REGION` or a fixed default).
    -   Handle cases where API keys are missing.
3.  **Initialize Memory (`AAIChatMemory`)**:
    -   The `AAIChatMemory` node uses `initializeRedis` which returns a `BufferMemory` (specifically `BufferMemoryExtended`).
    -   Adapt or directly use the `initializeRedis(nodeData)` function from `packages/components/nodes/memory/AAIChatMemory/AAIChatMemory.ts`.
        -   This function will require `nodeData` which might need to be partially mocked or constructed if `AnswerAIAgent` doesn't have all the inputs `AAIChatMemory`'s `initializeRedis` expects (like `redisCred`, `redisNamespace`). Ideally, `initializeRedis` should primarily rely on environment variables for Redis connection details if specific credential inputs are not exposed on `AnswerAIAgent`.
        -   Pass the `sessionId` to the memory instance after initialization if it's set via a method (e.g., `memory.sessionId = sessionId`). The `BufferMemoryExtended` constructor in `AAIChatMemory.ts` takes `sessionId` in its fields.
    -   The `nodeData` for `initializeRedis` should, at a minimum, point to relevant Redis connection details either through its `inputs` (if you decide to expose Redis config) or by ensuring `initializeRedis` can get them from `process.env`.
4.  **Construct Chat Prompt Template**:
    -   Adapt logic from `packages/components/nodes/prompts/ChatPromptTemplate/ChatPromptTemplate.ts` (its `init` method).
    -   Parse `promptValues` from string to a JSON object. Handle potential parsing errors.
    -   Create `SystemMessagePromptTemplate.fromTemplate(systemMessagePrompt)`.
    -   Create `HumanMessagePromptTemplate.fromTemplate(humanMessagePrompt)`.
    -   Combine these into a `ChatPromptTemplate.fromMessages([...])`. Include `MessagesPlaceholder('agent_scratchpad')` and a placeholder for memory variables (e.g., `MessagesPlaceholder('chat_history')`). The exact structure should align with what `ToolCallingAgentOutputParser` or the chosen agent type expects.
    -   Apply `promptValues` to format the templates if necessary, or ensure they are passed for runtime formatting.
5.  **Prepare Agent (AgentExecutor)**:
    -   Adapt the `prepareAgent` asynchronous function from `packages/components/nodes/agents/ToolAgent/ToolAgent.ts`.
    -   This function will require:
        -   The initialized chat model (from step 5.2).
        -   The list of tools (`nodeData.inputs.tools`).
        -   The constructed chat prompt template (from step 5.4).
        -   The initialized chat memory (from step 5.3).
        -   Other parameters like `maxIterations`, `returnIntermediateSteps`, `customOutputFunction`.
    -   The `prepareAgent` function sets up the agent runnable (e.g., using `model.bindTools(tools)`), prompt, and then creates an `AgentExecutor` instance.
    -   Store the created `AgentExecutor` instance (or the runnable agent itself) as a class member (e.g., `this.executor = agentExecutor`).
6.  Return the `this.executor` or a status indicating successful initialization.

## 6. `run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | ICommonObject>` Method

-   This method will largely mirror the functionality of `ToolAgent.ts#run`.
-   It will use the `this.executor` (initialized in the `init` method) to process the `input`.
-   Key steps to replicate/adapt:
    -   Handling `options.chatId`, `options.sessionId`.
    -   Setting up `CustomChainHandler` for streaming (`sseStreamer`) and callbacks, including `ConsoleCallbackHandler`.
    -   Input moderation (`checkInputs`).
    -   Invoking the agent: `this.executor.invoke({ input: processedInput, ...otherNecessaryContextForAgent }, runManagerConfig)`. Ensure `chat_history` and `agent_scratchpad` are correctly populated or handled by the agent setup.
    -   Handling streaming responses using `sseStreamer` if `options.stream` is true.
    -   Output moderation.
    -   Formatting the final response, potentially using the custom output function.
    -   Collecting source documents and used tools.
    -   Returning the final result as `string | ICommonObject`.

## 7. Code Reusability and Modularity

-   **Prioritize Imports**:
    -   Import and reuse helper functions and classes from existing nodes (`ToolAgent.ts`, `AAIChatMemory.ts`, `ChatPromptTemplate.ts`) whenever possible.
    -   Examples: `getBaseClasses`, `initializeRedis` (from `AAIChatMemory.ts`), utility functions for prompt formatting or message conversion.
    -   The core `prepareAgent` logic from `ToolAgent.ts` is a prime candidate for adaptation or making it a shared utility if it can be decoupled.
-   **Minimal Changes to Existing Files**:
    -   The existing node files (`ToolAgent.ts`, `AAIChatMemory.ts`, `ChatPromptTemplate.ts`) should remain unchanged if possible.
    -   If a helper function within these files is needed and not exported, consider exporting it. Avoid altering their core node functionality.
-   **Copy and Adapt with Care**:
    -   If direct import and reuse are not feasible (e.g., due to tight coupling with the original node's specific structure or inputs), carefully copy the relevant logic.
    -   Add comments indicating the origin of any copied code blocks.

## 8. Important Considerations

-   **Dynamic Model Lists**: Research and confirm the exact model names/IDs available for each AI provider that Langchain supports or that you intend to support. The UI for `aiModel` might need to be a text input for providers like AWS Bedrock if the list is extensive and frequently changing.
-   **Credential Security**: API keys **must** be loaded from environment variables (`process.env`) and never hardcoded or exposed in the node's configuration that gets saved.
-   **Error Handling**: Implement robust error handling for:
    -   Missing API keys.
    -   Invalid model names.
    -   Failures during AI model instantiation.
    -   Errors from the `initializeRedis` function.
    -   JSON parsing errors for `promptValues`.
-   **UI Grouping**: Use `additionalParams: true` (or the equivalent UI hint in your framework) to group less frequently used inputs like the Chat Prompt Template settings, moderation, etc.
-   **Langchain Version Compatibility**: Ensure that the chosen Langchain models and methods are compatible with the version of Langchain used in the project.
-   **Testing**: Thoroughly test the new `AnswerAIAgent` node with:
    -   Each AI provider and a sample model.
    -   Different tools.
    -   Various prompt configurations.
    -   Streaming and non-streaming modes.
    -   Session persistence with `AAIChatMemory`.

## 9. Linter/ESLint Compliance

-   Ensure the new file `AnswerAIAgent.ts` adheres to the project's ESLint rules. Pay attention to:
    -   Correct usage of `type` imports (e.g., `import type { ... } from '...'`).
    -   Avoiding unnecessary template literals (e.g., prefer `'string'` over `` `string` `` if no interpolation).
    -   Proper typing for variables and function return types (avoid `any` where possible).

This detailed plan should provide a solid foundation for your mid-level engineer to develop the `AnswerAIAgent` node.
