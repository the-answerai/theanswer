import { flatten } from 'lodash'
import { Tool } from '@langchain/core/tools'
import { BaseMessage } from '@langchain/core/messages'
import { ChainValues } from '@langchain/core/utils/types'
import { RunnableSequence } from '@langchain/core/runnables'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    PromptTemplate
} from '@langchain/core/prompts'
import { formatToOpenAIToolMessages } from 'langchain/agents/format_scratchpad/openai_tools'
import { type ToolsAgentStep } from 'langchain/agents/openai/output_parser'
import {
    extractOutputFromArray,
    getBaseClasses,
    handleEscapeCharacters,
    removeInvalidImageMarkdown,
    transformBracesWithColon
} from '../../../src/utils'
import {
    FlowiseMemory,
    ICommonObject,
    INode,
    INodeData,
    INodeParams,
    IServerSideEventStreamer,
    IUsedTool,
    IVisionChatModal
} from '../../../src/Interface'
import { ConsoleCallbackHandler, CustomChainHandler, CustomStreamingHandler, additionalCallbacks } from '../../../src/handler'
import { AgentExecutor, ToolCallingAgentOutputParser } from '../../../src/agents'
import { Moderation, checkInputs, streamResponse } from '../../moderation/Moderation'
import { formatResponse } from '../../outputparsers/OutputParserHelpers'
import { addImagesToMessages, llmSupportsVision } from '../../../src/multiModalUtils'
import { ChatOpenAI, type ChatOpenAIFields } from '@langchain/openai'
import { ChatAnthropic, type AnthropicInput } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatGroq } from '@langchain/groq'
import { ChatOpenAI as DeepSeekChat } from '@langchain/openai'
import { BedrockChat, type ChatBedrockConverseInput } from '@langchain/aws'
import { initializeRedis } from '../../memory/AAIChatMemory/AAIChatMemory'

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
        this.description = 'A consolidated agent that uses specified tools, a default chat memory, an integrated chat prompt template, and selected AI models via function calling.'
        this.baseClasses = [this.type, ...getBaseClasses(AgentExecutor)]
        this.inputs = [
            {
                label: 'Tools',
                name: 'tools',
                type: 'Tool',
                list: true
            },
            {
                label: 'Allowed Tools',
                name: 'allowedTools',
                type: 'string',
                list: true,
                description: 'Array of tool names to allow, blank if all tools are allowed',
                optional: true,
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
                type: 'string',
                description: 'Model options will vary based on the selected AI Provider. For AWS Bedrock, enter the full model ID.'
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
                description: 'Template for the human message. Use {input} for the user\'s query.',
                additionalParams: true
            },
            {
                label: 'Format Prompt Values',
                name: 'promptValues',
                type: 'code',
                rows: 4,
                optional: true,
                description: 'A JSON object of key-value pairs to customize the prompt. E.g., {"persona": "pirate"}. These will be available in system/human message templates.',
                additionalParams: true
            }
        ]
        this.sessionId = fields?.sessionId
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const provider = (nodeData.inputs?.aiProvider as string) || 'openai'
        const modelName = nodeData.inputs?.aiModel as string
        const systemMessagePrompt = (nodeData.inputs?.systemMessagePrompt as string) || 'You are a helpful AI assistant.'
        const humanMessagePrompt = (nodeData.inputs?.humanMessagePrompt as string) || '{input}'
        const promptValuesRaw = nodeData.inputs?.promptValues
        const tools = nodeData.inputs?.tools
        const maxIterations = nodeData.inputs?.maxIterations as string
        const returnIntermediate = nodeData.inputs?.returnIntermediateSteps as boolean
        const allowedTools = nodeData.inputs?.allowedTools
        const sessionId = this.sessionId || options.sessionId
        const chatId = options.chatId

        let promptValues: ICommonObject = {}
        if (promptValuesRaw) {
            try {
                const sanitized = typeof promptValuesRaw === 'string' ? promptValuesRaw.replace(/\n/g, '\\n') : promptValuesRaw
                promptValues = typeof sanitized === 'object' ? sanitized : JSON.parse(sanitized)
            } catch (e) {
                throw new Error('Invalid JSON in prompt values: ' + e)
            }
        }

        const llm = this.getModel(provider, modelName)
        const memoryNodeData: INodeData = { id: '', name: '', type: '', label: '', version: 1, category: '', icon: '', baseClasses: [], inputs: { sessionId } }
        const memory = (await initializeRedis(memoryNodeData)) as FlowiseMemory

        const memoryKey = memory.memoryKey ? memory.memoryKey : 'chat_history'
        const inputKey = memory.inputKey ? memory.inputKey : 'input'

        let prompt = ChatPromptTemplate.fromMessages([
            SystemMessagePromptTemplate.fromTemplate(transformBracesWithColon(systemMessagePrompt)),
            new MessagesPlaceholder(memoryKey),
            HumanMessagePromptTemplate.fromTemplate(transformBracesWithColon(humanMessagePrompt)),
            new MessagesPlaceholder('agent_scratchpad')
        ])

        if (Object.keys(promptValues).length) {
            for (const val in promptValues) {
                prompt.promptValues = { ...(prompt.promptValues as ICommonObject), [val]: () => promptValues[val] }
            }
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

        let toolList = flatten(tools)
        if (allowedTools && Array.isArray(allowedTools) && allowedTools.length) {
            toolList = toolList.filter((t: Tool) => allowedTools.includes(t.name))
        }

        const modelWithTools = llm.bindTools(toolList)

        const runnableAgent = RunnableSequence.from([
            {
                [inputKey]: (i: { input: string; steps: ToolsAgentStep[] }) => i.input,
                agent_scratchpad: (i: { input: string; steps: ToolsAgentStep[] }) => formatToOpenAIToolMessages(i.steps),
                [memoryKey]: async (_: { input: string; steps: ToolsAgentStep[] }) => {
                    const messages = (await memory.getChatMessages(sessionId, true, options.prependMessages)) as BaseMessage[]
                    return messages ?? []
                },
                ...(prompt.promptValues as ICommonObject)
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
            maxIterations: maxIterations ? parseFloat(maxIterations) : undefined,
            returnIntermediateSteps: returnIntermediate
        })

        ;(this.executor as any).memory = memory
        return this.executor
    }



    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | ICommonObject> {
        const executor = this.executor ?? (await this.init(nodeData, input, options))
        const memory: FlowiseMemory = (executor as any).memory
        const moderations = nodeData.inputs?.inputModeration as Moderation[]
        const outputModerations = nodeData.inputs?.outputModeration as Moderation[]
        const shouldStreamResponse = options.shouldStreamResponse
        const sseStreamer: IServerSideEventStreamer = options.sseStreamer as IServerSideEventStreamer
        const chatId = options.chatId

        if (moderations && moderations.length > 0) {
            try {
                input = await checkInputs(moderations, input)
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

        res = await executor.invoke({ input }, { callbacks: allCallbacks })
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
        if (res.usedTools && res.usedTools.length) {
            let inputTools = nodeData.inputs?.tools
            inputTools = flatten(inputTools)
            for (const tool of res.usedTools) {
                const inputTool = inputTools.find((inputTool: Tool) => inputTool.name === tool.tool)
                if (inputTool && inputTool.returnDirect && shouldStreamResponse) {
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
                { text: input, type: 'userMessage' },
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
                const apiKey = process.env.AAI_DEFAULT_ANTHROPHIC_API_KEY || process.env.AAI_DEFAULT_ANTHROPHIC
                if (!apiKey) throw new Error('AAI_DEFAULT_ANTHROPHIC_API_KEY environment variable is not set')
                const params: AnthropicInput = { modelName, anthropicApiKey: apiKey }
                return new ChatAnthropic(params)
            }
            case 'google': {
                const apiKey = process.env.AAI_DEFAULT_GOOGLE_GENERATIVE_AI_KEY
                if (!apiKey) throw new Error('AAI_DEFAULT_GOOGLE_GENERATIVE_AI_KEY environment variable is not set')
                return new ChatGoogleGenerativeAI({ modelName, apiKey })
            }
            case 'groq': {
                const apiKey = process.env.AAI_DEFAULT_GROQ_API_KEY
                if (!apiKey) throw new Error('AAI_DEFAULT_GROQ_API_KEY environment variable is not set')
                return new ChatGroq({ modelName, apiKey })
            }
            case 'deepseek': {
                const apiKey = process.env.AAI_DEFAULT_DEEPSEEK_API_KEY
                if (!apiKey) throw new Error('AAI_DEFAULT_DEEPSEEK_API_KEY environment variable is not set')
                return new DeepSeekChat({ modelName, openAIApiKey: apiKey, configuration: { baseURL: 'https://api.deepseek.com' } })
            }
            case 'aws': {
                const accessKey = process.env.AAI_DEFAULT_AWS_BEDROCK_ACCESS_KEY
                const secretKey = process.env.AAI_DEFAULT_AWS_BEDROCK_SECRET_KEY
                const region = process.env.AAI_DEFAULT_AWS_BEDROCK_REGION || 'us-east-1'
                if (!accessKey || !secretKey) {
                    throw new Error('AWS Bedrock credentials are not set in environment variables')
                }
                const params: ChatBedrockConverseInput = { model: modelName, region, credentials: { accessKeyId: accessKey, secretAccessKey: secretKey } }
                return new BedrockChat('', params)
            }
            default:
                throw new Error('Unsupported AI provider')
        }
    }
}

module.exports = { nodeClass: AnswerAIAgent_Agents }
