import { flatten } from 'lodash'
import type { Tool } from '@langchain/core/tools'
import type { BaseMessage } from '@langchain/core/messages'
import type { ChainValues } from '@langchain/core/utils/types'
import { RunnableSequence } from '@langchain/core/runnables'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    type PromptTemplate
} from '@langchain/core/prompts'
import { formatToOpenAIToolMessages } from 'langchain/agents/format_scratchpad/openai_tools'
import type { ToolsAgentStep } from 'langchain/agents/openai/output_parser'
import { extractOutputFromArray, getBaseClasses, removeInvalidImageMarkdown, transformBracesWithColon } from '../../../src/utils'
import type {
    FlowiseMemory,
    ICommonObject,
    INode,
    INodeData,
    INodeParams,
    IServerSideEventStreamer,
    IUsedTool,
    IVisionChatModal,
    IMessage,
    MessageType
} from '../../../src/Interface'
import { ConsoleCallbackHandler, CustomChainHandler, CustomStreamingHandler, additionalCallbacks } from '../../../src/handler'
import { AgentExecutor, ToolCallingAgentOutputParser } from '../../../src/agents'
import type { Moderation } from '../../moderation/Moderation'
import { checkInputs, streamResponse } from '../../moderation/Moderation'
import { formatResponse } from '../../outputparsers/OutputParserHelpers'
import { addImagesToMessages, llmSupportsVision } from '../../../src/multiModalUtils'
import { ChatOpenAI, type ChatOpenAIFields } from '@langchain/openai'
import { ChatAnthropic, type AnthropicInput } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatGroq } from '@langchain/groq'
import { ChatOpenAI as DeepSeekChat } from '@langchain/openai'
import { ChatBedrockConverse, type ChatBedrockConverseInput } from '@langchain/aws'
import { BufferMemory, type BufferMemoryInput } from 'langchain/memory'
import { Redis } from 'ioredis'
import { mapStoredMessageToChatMessage, AIMessage, HumanMessage } from '@langchain/core/messages'
import { convertBaseMessagetoIMessage, mapChatMessageToBaseMessage } from '../../../src/utils'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Custom memory implementation directly in this file
class BufferMemoryExtended extends BufferMemory implements FlowiseMemory {
    sessionId = ''
    windowSize?: number
    sessionTTL?: number
    redisOptions: string

    constructor(
        fields: BufferMemoryInput & {
            sessionId: string
            windowSize?: number
            sessionTTL?: number
            redisOptions: string
        }
    ) {
        super(fields)
        this.sessionId = fields.sessionId
        this.windowSize = fields.windowSize
        this.sessionTTL = fields.sessionTTL
        this.redisOptions = fields.redisOptions
    }

    private async withRedisClient<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
        const client = new Redis(this.redisOptions)
        try {
            return await fn(client)
        } catch (error) {
            console.error('❌ [AAIChatMemory]: Error during Redis Client initialization:', error)
            throw error
        } finally {
            await client.quit()
        }
    }

    async getChatMessages(
        overrideSessionId = '',
        returnBaseMessages = false,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]> {
        return this.withRedisClient(async (client) => {
            const id = overrideSessionId ? overrideSessionId : this.sessionId
            const rawStoredMessages = await client.lrange(id, this.windowSize ? this.windowSize * -1 : 0, -1)
            const orderedMessages = rawStoredMessages.reverse().map((message) => JSON.parse(message))
            const baseMessages = orderedMessages.map(mapStoredMessageToChatMessage)
            if (prependMessages?.length) {
                baseMessages.unshift(...(await mapChatMessageToBaseMessage(prependMessages)))
            }
            return returnBaseMessages ? baseMessages : convertBaseMessagetoIMessage(baseMessages)
        })
    }

    async addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId = ''): Promise<void> {
        await this.withRedisClient(async (client) => {
            const id = overrideSessionId ? overrideSessionId : this.sessionId
            const input = msgArray.find((msg) => msg.type === 'userMessage')
            const output = msgArray.find((msg) => msg.type === 'apiMessage')

            if (input) {
                const newInputMessage = new HumanMessage(input.text)
                const messageToAdd = [newInputMessage].map((msg) => msg.toDict())
                await client.lpush(id, JSON.stringify(messageToAdd[0]))
                if (this.sessionTTL) await client.expire(id, this.sessionTTL)
            }

            if (output) {
                const newOutputMessage = new AIMessage(output.text)
                const messageToAdd = [newOutputMessage].map((msg) => msg.toDict())
                await client.lpush(id, JSON.stringify(messageToAdd[0]))
                if (this.sessionTTL) await client.expire(id, this.sessionTTL)
            }
        })
    }

    async clearChatMessages(overrideSessionId = ''): Promise<void> {
        await this.withRedisClient(async (client) => {
            const id = overrideSessionId ? overrideSessionId : this.sessionId
            await client.del(id)
            await this.clear()
        })
    }
}

// Initialize Redis memory function
const initializeRedis = async (nodeData: INodeData): Promise<FlowiseMemory> => {
    const sessionTTL = nodeData.inputs?.sessionTTL as number
    const memoryKey = nodeData.inputs?.memoryKey as string
    const sessionId = nodeData.inputs?.sessionId as string
    const windowSize = nodeData.inputs?.windowSize as number

    // Get Redis URL from environment variable
    const redisUrl = process.env.AAI_DEFAULT_REDIS_URL

    if (!redisUrl) {
        throw new Error('AAI_DEFAULT_REDIS_URL environment variable is not set')
    }

    const memory = new BufferMemoryExtended({
        memoryKey: memoryKey ?? 'chat_history',
        sessionId,
        windowSize,
        sessionTTL,
        redisOptions: redisUrl
    })

    return memory
}

// Type definition for model data structure
interface ModelData {
    name: string
    models: Array<{
        label: string
        name: string
        description?: string
        input_cost?: number
        output_cost?: number
    }>
}

interface ModelOption {
    label: string
    name: string
}

// Load available models from models.json
const loadAvailableModels = (): Record<string, ModelOption[]> => {
    try {
        // Try multiple possible paths to find the models.json file
        const possiblePaths = [
            path.join(__dirname, '../../../models.json'),
            path.join(__dirname, '../../../../models.json'),
            path.join(process.cwd(), 'packages/components/models.json'),
            path.join(process.cwd(), 'models.json')
        ]

        let modelsData = null

        for (const modelPath of possiblePaths) {
            try {
                if (fs.existsSync(modelPath)) {
                    modelsData = JSON.parse(fs.readFileSync(modelPath, 'utf8'))
                    console.log(`Loaded models from ${modelPath}`)
                    break
                }
            } catch (innerError) {
                // Continue to the next path
            }
        }

        if (!modelsData) {
            console.error('Could not find models.json in any of the expected locations')
            return {}
        }

        // Convert modelsData to expected format
        const result: Record<string, ModelOption[]> = {}

        if (modelsData.chat && Array.isArray(modelsData.chat)) {
            // Organize models by provider
            for (const provider of modelsData.chat) {
                if (provider.models && Array.isArray(provider.models)) {
                    result[provider.name.toLowerCase()] = provider.models.map((model: { label: string; name: string }) => ({
                        label: model.label,
                        name: model.name
                    }))
                }
            }
        }

        return result
    } catch (error) {
        console.error('Error loading models.json:', error)
        return {}
    }
}

// Cache the model options to avoid repeated disk reads
let modelOptionsCache: Record<string, ModelOption[]> | null = null

// Get model options for a specific provider
const getModelOptions = (providerName: string): ModelOption[] => {
    if (!modelOptionsCache) {
        modelOptionsCache = loadAvailableModels()
    }
    // Return only models for the requested provider
    return modelOptionsCache[providerName] || []
}

class AnswerAIAgent_Agents implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    sessionId?: string
    executor?: AgentExecutor

    constructor(fields?: { sessionId?: string }) {
        this.label = 'AnswerAI Agent'
        this.name = 'answerAIAgent'
        this.version = 1.0
        this.type = 'AnswerAIAgent'
        this.category = 'Agents'
        this.icon = 'answerai-square-black.png'
        this.description =
            'A consolidated agent that uses specified tools, a default chat memory, an integrated chat prompt template, and selected AI models via function calling.'

        this.baseClasses = [this.type, ...getBaseClasses(AgentExecutor)]
        this.inputs = [
            {
                label: 'Tools',
                name: 'tools',
                type: 'Tool',
                list: true
            },
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                default: 'You are a helpful AI assistant.',
                description: 'The system message for the agent. This will be the primary system message used.',
                additionalParams: true
            },
            {
                label: 'Human Message Template',
                name: 'humanMessagePrompt',
                type: 'string',
                rows: 4,
                default: '{input}',
                placeholder: '{input}',
                description: "Template for the human message. Use {input} for the user's query.",
                additionalParams: true
            },
            {
                label: 'Max Iterations',
                name: 'maxIterations',
                type: 'number',
                optional: true,
                additionalParams: true,
                default: 10
            },
            {
                label: 'Return Intermediate Steps',
                name: 'returnIntermediateSteps',
                type: 'boolean',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Custom Output Function Code',
                name: 'outputFunction',
                type: 'code',
                optional: true,
                additionalParams: true,
                description: 'Optional JS code to process the final output. Input: { output, intermediateSteps, usedTools }'
            },
            {
                label: 'Input Moderation',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Output Moderation',
                name: 'outputModeration',
                type: 'Moderation',
                optional: true,
                additionalParams: true
            },
            {
                label: 'AI Provider',
                name: 'aiProvider',
                type: 'options',
                options: [
                    { label: 'OpenAI', name: 'openai' },
                    { label: 'Anthropic', name: 'anthropic' },
                    { label: 'Google Generative AI', name: 'google' },
                    { label: 'Groq', name: 'groq' },
                    { label: 'Deepseek', name: 'deepseek' },
                    { label: 'AWS Bedrock', name: 'aws' }
                ],
                default: 'openai'
            },
            {
                label: 'AI Model',
                name: 'aiModel',
                type: 'options',
                // Will be populated dynamically based on the selected provider
                options: [],
                default: '',
                description: 'Select a model for the chosen AI provider'
            },
            {
                label: 'Format Prompt Values',
                name: 'promptValues',
                type: 'code',
                rows: 4,
                optional: true,
                description:
                    'A JSON object of key-value pairs to customize the prompt. E.g., {"persona": "pirate"}. These will be available in system/human message templates.',
                additionalParams: true
            }
        ]
        this.sessionId = fields?.sessionId
    }

    async getModels(nodeData: INodeData): Promise<ModelOption[]> {
        const provider = nodeData.inputs?.aiProvider as string
        if (!provider) {
            return []
        }

        return getModelOptions(provider)
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<AgentExecutor> {
        // Get provider and model name
        const provider = (nodeData.inputs?.aiProvider as string) || 'openai'
        const modelName = nodeData.inputs?.aiModel as string
        const systemMessagePrompt = (nodeData.inputs?.systemMessagePrompt as string) || 'You are a helpful AI assistant.'
        const humanMessagePrompt = (nodeData.inputs?.humanMessagePrompt as string) || '{input}'
        const promptValuesRaw = nodeData.inputs?.promptValues
        const tools = nodeData.inputs?.tools
        const maxIterations = nodeData.inputs?.maxIterations as string
        const returnIntermediate = nodeData.inputs?.returnIntermediateSteps as boolean
        const sessionId = this.sessionId || options.sessionId
        const chatId = options.chatId

        let promptValues: ICommonObject = {}
        if (promptValuesRaw) {
            try {
                const sanitized = typeof promptValuesRaw === 'string' ? promptValuesRaw.replace(/\n/g, '\\n') : promptValuesRaw
                promptValues = typeof sanitized === 'object' ? sanitized : JSON.parse(sanitized)
            } catch (e) {
                throw new Error(`Invalid JSON in prompt values: ${e}`)
            }
        }

        const llm = this.getModel(provider, modelName)
        const memoryNodeData: INodeData = {
            id: '',
            name: '',
            type: '',
            label: '',
            version: 1,
            category: '',
            icon: '',
            baseClasses: [],
            inputs: { sessionId }
        }
        const memory = (await initializeRedis(memoryNodeData)) as FlowiseMemory

        const memoryKey = memory.memoryKey ? memory.memoryKey : 'chat_history'
        const inputKey = memory.inputKey ? memory.inputKey : 'input'

        const prompt = ChatPromptTemplate.fromMessages([
            SystemMessagePromptTemplate.fromTemplate(transformBracesWithColon(systemMessagePrompt)),
            new MessagesPlaceholder(memoryKey),
            HumanMessagePromptTemplate.fromTemplate(transformBracesWithColon(humanMessagePrompt)),
            new MessagesPlaceholder('agent_scratchpad')
        ])

        // Add prompt values to the template
        if (Object.keys(promptValues).length) {
            // @ts-ignore - promptValues is available but not in type definitions
            prompt.promptValues = { ...(prompt.promptValues || {}), ...promptValues }
        }

        if (llmSupportsVision(llm)) {
            const visionChatModel = llm as IVisionChatModal
            const messageContent = await addImagesToMessages(nodeData, options, llm.multiModalOption)
            if (messageContent?.length) {
                visionChatModel.setVisionModel()
                const placeholder = prompt.promptMessages.pop() as MessagesPlaceholder
                if (prompt.promptMessages.at(-1) instanceof HumanMessagePromptTemplate) {
                    const last = prompt.promptMessages.pop() as HumanMessagePromptTemplate
                    const template = (last.prompt as PromptTemplate).template as string
                    const msg = HumanMessagePromptTemplate.fromTemplate([...messageContent, { text: template }])
                    msg.inputVariables = last.inputVariables
                    prompt.promptMessages.push(msg)
                }
                prompt.promptMessages.push(placeholder)
            } else {
                visionChatModel.revertToOriginalModel()
            }
        }

        if (llm.bindTools === undefined) {
            throw new Error('This agent requires that the "bindTools()" method be implemented on the input model.')
        }

        // Process and deduplicate tools
        let toolList = flatten(tools) as Tool[]

        // Check for duplicate tool names and filter them out
        const uniqueToolNames = new Set<string>()
        toolList = toolList.filter((tool) => {
            if (uniqueToolNames.has(tool.name)) {
                return false
            }
            uniqueToolNames.add(tool.name)
            return true
        })

        const modelWithTools = llm.bindTools(toolList)

        const runnableAgent = RunnableSequence.from([
            {
                [inputKey]: (i: { input: string; steps: ToolsAgentStep[] }) => i.input,
                agent_scratchpad: (i: { input: string; steps: ToolsAgentStep[] }) => formatToOpenAIToolMessages(i.steps),
                [memoryKey]: async (_: { input: string; steps: ToolsAgentStep[] }) => {
                    const messages = (await memory.getChatMessages(sessionId, true, options.prependMessages)) as BaseMessage[]
                    return messages ?? []
                },
                // @ts-ignore - promptValues is available but not in type definitions
                ...(prompt.promptValues || {})
            },
            prompt,
            modelWithTools,
            new ToolCallingAgentOutputParser()
        ])

        this.executor = AgentExecutor.fromAgentAndTools({
            agent: runnableAgent,
            tools: toolList,
            sessionId,
            chatId,
            input,
            verbose: process.env.DEBUG === 'true',
            maxIterations: maxIterations ? Number.parseFloat(maxIterations) : undefined,
            returnIntermediateSteps: returnIntermediate
        })

        // Add memory to executor for later use
        // @ts-ignore - We're adding a custom property
        this.executor.memory = memory
        return this.executor
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | ICommonObject> {
        const executor = this.executor ?? (await this.init(nodeData, input, options))
        // @ts-ignore - We're accessing our custom property
        const memory: FlowiseMemory = executor.memory
        const moderations = nodeData.inputs?.inputModeration as Moderation[]
        const outputModerations = nodeData.inputs?.outputModeration as Moderation[]
        const shouldStreamResponse = options.shouldStreamResponse
        const sseStreamer: IServerSideEventStreamer = options.sseStreamer as IServerSideEventStreamer
        const chatId = options.chatId

        let processedInput = input
        if (moderations && moderations.length > 0) {
            try {
                processedInput = await checkInputs(moderations, input)
            } catch (e) {
                await new Promise((resolve) => setTimeout(resolve, 500))
                if (shouldStreamResponse) {
                    streamResponse(sseStreamer, chatId, e.message)
                }
                return formatResponse(e.message)
            }
        }

        const loggerHandler = new ConsoleCallbackHandler(options.logger)
        const callbacks = await additionalCallbacks(nodeData, options)
        const enableDetailedStreaming = false
        let customStreamingHandler = null
        if (enableDetailedStreaming && shouldStreamResponse) {
            customStreamingHandler = new CustomStreamingHandler(sseStreamer, chatId)
        }

        let res: ChainValues = {}
        let sourceDocuments: ICommonObject[] = []
        let usedTools: IUsedTool[] = []
        let artifacts = []
        const allCallbacks = shouldStreamResponse
            ? [loggerHandler, new CustomChainHandler(sseStreamer, chatId), ...callbacks]
            : [loggerHandler, ...callbacks]
        if (enableDetailedStreaming && customStreamingHandler) allCallbacks.push(customStreamingHandler)

        res = await executor.invoke({ input: processedInput }, { callbacks: allCallbacks })
        if (res.sourceDocuments) {
            if (shouldStreamResponse && sseStreamer) {
                sseStreamer.streamSourceDocumentsEvent(chatId, flatten(res.sourceDocuments))
            }
            sourceDocuments = res.sourceDocuments
        }
        if (res.usedTools) {
            if (shouldStreamResponse && sseStreamer) {
                sseStreamer.streamUsedToolsEvent(chatId, flatten(res.usedTools))
            }
            usedTools = res.usedTools
        }
        if (res.artifacts) {
            if (shouldStreamResponse && sseStreamer) {
                sseStreamer.streamArtifactsEvent(chatId, flatten(res.artifacts))
            }
            artifacts = res.artifacts
        }
        if (res.usedTools?.length) {
            let inputTools = nodeData.inputs?.tools
            inputTools = flatten(inputTools)
            for (const tool of res.usedTools) {
                const inputTool = inputTools.find((inputTool: Tool) => inputTool.name === tool.tool)
                if (inputTool?.returnDirect && shouldStreamResponse) {
                    sseStreamer.streamTokenEvent(chatId, tool.toolOutput)
                }
            }
        }

        let output = res?.output
        output = extractOutputFromArray(res?.output)
        output = removeInvalidImageMarkdown(output)

        if (outputModerations && outputModerations.length > 0) {
            try {
                output = await checkInputs(outputModerations, output)
            } catch (e) {
                return formatResponse(e.message)
            }
        }

        await memory.addChatMessages(
            [
                { text: processedInput, type: 'userMessage' },
                { text: output, type: 'apiMessage' }
            ],
            this.sessionId
        )

        let finalRes: string | ICommonObject = output
        if (sourceDocuments.length || usedTools.length || artifacts.length) {
            const obj: ICommonObject = { text: output }
            if (sourceDocuments.length) obj.sourceDocuments = flatten(sourceDocuments)
            if (usedTools.length) obj.usedTools = usedTools
            if (artifacts.length) obj.artifacts = artifacts
            finalRes = obj
        }
        return finalRes
    }

    private getModel(provider: string, modelName: string): BaseChatModel {
        switch (provider) {
            case 'openai': {
                const apiKey = process.env.AAI_DEFAULT_OPENAI_API_KEY
                if (!apiKey) throw new Error('AAI_DEFAULT_OPENAI_API_KEY environment variable is not set')
                const params: ChatOpenAIFields = { modelName, openAIApiKey: apiKey }
                return new ChatOpenAI(params)
            }
            case 'anthropic': {
                const apiKey = process.env.AAI_DEFAULT_ANTHROPHIC
                if (!apiKey) throw new Error('AAI_DEFAULT_ANTHROPHIC environment variable is not set')
                const params: AnthropicInput = {
                    modelName,
                    anthropicApiKey: apiKey,
                    temperature: 0.7,
                    maxTokens: 1024
                }
                return new ChatAnthropic(params)
            }
            case 'google': {
                const apiKey = process.env.AAI_DEFAULT_GOOGLE_GENERATIVE_AI_API_KEY
                if (!apiKey) throw new Error('AAI_DEFAULT_GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set')
                return new ChatGoogleGenerativeAI({ modelName, apiKey })
            }
            case 'groq': {
                const apiKey = process.env.AAI_DEFAULT_GROQ
                if (!apiKey) throw new Error('AAI_DEFAULT_GROQ environment variable is not set')
                return new ChatGroq({ modelName, apiKey })
            }
            case 'deepseek': {
                const apiKey = process.env.AAI_DEFAULT_DEEPSEEK
                if (!apiKey) throw new Error('AAI_DEFAULT_DEEPSEEK environment variable is not set')
                return new DeepSeekChat({ modelName, openAIApiKey: apiKey, configuration: { baseURL: 'https://api.deepseek.com' } })
            }
            case 'aws': {
                const accessKey = process.env.AAI_DEFAULT_AWS_BEDROCK_ACCESS_KEY
                const secretKey = process.env.AAI_DEFAULT_AWS_BEDROCK_SECRET_KEY
                const region = process.env.AAI_DEFAULT_AWS_BEDROCK_REGION || 'us-east-1'
                if (!accessKey || !secretKey) {
                    throw new Error('AWS Bedrock credentials are not set in environment variables')
                }
                const params: ChatBedrockConverseInput = {
                    model: modelName,
                    region,
                    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
                }
                return new ChatBedrockConverse(params)
            }
            default:
                throw new Error('Unsupported AI provider')
        }
    }
}

module.exports = { nodeClass: AnswerAIAgent_Agents }
