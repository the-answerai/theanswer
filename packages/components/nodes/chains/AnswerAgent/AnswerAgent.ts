import { BaseLanguageModel } from '@langchain/core/language_models/base'
import { LLMChain } from 'langchain/chains'
import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses, handleEscapeCharacters } from '../../../src/utils'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers'
import { jsonrepair } from 'jsonrepair'
import { checkInputs, Moderation, streamResponse } from '../../moderation/Moderation'
import { formatResponse } from '../../outputparsers/OutputParserHelpers'
import { additionalCallbacks, ConsoleCallbackHandler, CustomChainHandler } from '../../../src/handler'

// Assuming LLMChain_Chains exists and is a suitable base, or create a similar structure.
// If LLMChain_Chains is not directly inheritable or suitable, adapt from its structure.
// For now, let's define a class that implements INode and has a similar structure to LLMChain_Chains.

class AnswerAgent implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    baseClasses: string[]
    description: string
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]
    outputParser?: StructuredOutputParser<any>

    constructor() {
        this.label = 'Answer Agent'
        this.name = 'answerAgent'
        this.version = 1.0
        this.type = 'AnswerAgent'
        this.icon = 'answerai-square-black.png'
        this.category = 'Chains'
        this.description = 'An agent that combines prompt templating, LLM interaction, and structured output parsing into a single node.'
        this.baseClasses = [this.type, ...getBaseClasses(LLMChain)] // Assuming LLMChain is a relevant base
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                optional: true,
                placeholder: 'You are a helpful assistant.'
            },
            {
                label: 'Human Message',
                name: 'humanMessagePrompt',
                type: 'string',
                rows: 4,
                placeholder: '{question}' // Default placeholder
            },
            {
                label: 'Prompt Values',
                name: 'promptValues',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true,
                description:
                    'JSON object of key-value pairs to be injected into prompt templates. For example: {"input_language": "English", "output_language": "French"}'
            },
            {
                label: 'Zod Schema (for JSON output)',
                name: 'zodSchema',
                type: 'string',
                rows: 10,
                optional: true,
                placeholder: `z.object({\n  "answer": z.string().describe("The answer to the user's question"),\n  "sources": z.array(z.string()).describe("List of sources used to generate the answer")\n})`,
                description: 'Define a Zod schema if you want the output to be a JSON object. The LLM will try to match this schema.'
            },
            {
                label: 'Input Moderation',
                description: 'Detect text that could generate harmful output and prevent it from being sent to the language model',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                list: true
            }
        ]
        this.outputs = [
            {
                label: 'Answer Agent',
                name: 'answerAgent', // Corresponds to this.name
                description: 'Output the Answer Agent chain instance itself to be used in other nodes.',
                baseClasses: [this.type, ...getBaseClasses(LLMChain)]
            },
            {
                label: 'Output Prediction',
                name: 'outputPrediction', // The result of the run method
                description: 'The processed output from the LLM. This can be a string or a JSON object if a Zod schema was provided.',
                baseClasses: ['string', 'json']
            }
        ]
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const model = nodeData.inputs?.model as BaseLanguageModel
        const systemMessagePrompt = nodeData.inputs?.systemMessagePrompt as string
        let humanMessagePrompt = nodeData.inputs?.humanMessagePrompt as string // Make mutable
        const zodSchemaStr = nodeData.inputs?.zodSchema as string
        const promptValuesStr = nodeData.inputs?.promptValues as string | ICommonObject

        this.outputParser = undefined // Reset outputParser
        if (zodSchemaStr) {
            try {
                // Dynamically execute the Zod schema string to get the Zod object
                // This is a potential security risk and should be handled carefully in a production environment.
                const schema = eval(`(${zodSchemaStr})`)
                const outputParser = StructuredOutputParser.fromZodSchema(schema)
                this.outputParser = outputParser
                if (this.outputParser) {
                    // Add format instructions to the prompt
                    const formatInstructions = this.outputParser.getFormatInstructions()
                    humanMessagePrompt = `${humanMessagePrompt}\n${formatInstructions}`
                }
            } catch (e) {
                throw new Error(`Failed to parse Zod schema or inject output parser: ${e.message}`)
            }
        }

        const promptMessages = []
        if (systemMessagePrompt) {
            promptMessages.push(SystemMessagePromptTemplate.fromTemplate(systemMessagePrompt))
        }
        promptMessages.push(HumanMessagePromptTemplate.fromTemplate(humanMessagePrompt))

        const prompt = ChatPromptTemplate.fromMessages(promptMessages)

        // Handle promptValues
        let promptValuesObj: ICommonObject = {}
        if (promptValuesStr) {
            try {
                promptValuesObj = typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr)
            } catch (exception) {
                throw new Error('Invalid JSON in Prompt Values: ' + exception)
            }
        }
        // @ts-ignore
        prompt.promptValues = promptValuesObj

        const chain = new LLMChain({
            llm: model,
            prompt,
            outputParser: this.outputParser, // Pass the outputParser to the chain
            verbose: process.env.DEBUG === 'true'
        })

        const output = nodeData.outputs?.output as string

        if (output === this.name) {
            // 'answerAgent'
            return chain
        } else if (output === 'outputPrediction') {
            // The `run` method is designed to handle the prediction logic.
            // It already takes nodeData, input, and options.
            return await this.run(nodeData, input, options)
        }

        return chain // Default to returning the chain
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | object> {
        const chain = await this.init(nodeData, input, options) // this.outputParser is set here
        const inputModeration = nodeData.inputs?.inputModeration as Moderation
        const promptValuesStr = nodeData.inputs?.promptValues as string | ICommonObject

        // Initialize llmCallInputs with the main input, assuming it's the 'question' or primary human input.
        // The humanMessagePrompt should be templated to use this key (e.g. "{question}")
        const llmCallInputs: ICommonObject = {
            question: handleEscapeCharacters(input, true) // Main input becomes 'question'
        }

        // Process promptValues
        if (promptValuesStr) {
            let parsedPromptValues: ICommonObject = {}
            if (typeof promptValuesStr === 'string') {
                try {
                    parsedPromptValues = JSON.parse(promptValuesStr)
                } catch (e) {
                    throw new Error(`Failed to parse Prompt Values JSON: ${e.message}`)
                }
            } else {
                parsedPromptValues = promptValuesStr // Already an object
            }

            for (const key in parsedPromptValues) {
                if (Object.prototype.hasOwnProperty.call(parsedPromptValues, key)) {
                    if (typeof parsedPromptValues[key] === 'string') {
                        llmCallInputs[key] = handleEscapeCharacters(parsedPromptValues[key] as string, true)
                    } else {
                        llmCallInputs[key] = parsedPromptValues[key] // Keep non-string values as is
                    }
                }
            }
        }

        // The 'input' for the chain.call might need to be specifically the 'question' if the prompt expects that.
        // Or, if the prompt is more generic like {{input}}, then we can pass the main input directly.
        // For now, assuming human prompt uses {question} and other values are auto-populated from llmCallInputs.

        if (inputModeration) {
            try {
                await checkInputs([inputModeration], input)
            } catch (e) {
                await new Promise((resolve) => setTimeout(resolve, 500))
                streamResponse(options.socketIO, options.socketIOClientId, e.message)
                return formatResponse(e.message)
            }
        }

        const callbacks = await additionalCallbacks(nodeData, options)
        if (process.env.DEBUG === 'true') {
            callbacks.push(new ConsoleCallbackHandler(options.logger))
        }

        if (options.socketIO && options.socketIOClientId) {
            const handler = new CustomChainHandler(options.socketIO, options.socketIOClientId, options.workflowId, options.chatId)
            callbacks.push(handler) // Add CustomChainHandler to the list of callbacks
            const result = await chain.call(llmCallInputs, callbacks) // Pass the combined callbacks
            const fullResponse = result.text
            if (this.outputParser) {
                let parsedResponse = await this.outputParser.parse(fullResponse)
                if (typeof parsedResponse === 'string' && typeof this.outputParser.lc_kwargs.schema !== 'undefined') {
                    // try to repair json
                    parsedResponse = jsonrepair(parsedResponse)
                    parsedResponse = JSON.parse(parsedResponse)
                }
                return { output: parsedResponse, fullResponse }
            }
            return { output: fullResponse, fullResponse }
        } else {
            const result = await chain.call(llmCallInputs, callbacks) // Pass callbacks here too
            const fullResponse = result.text
            if (this.outputParser) {
                try {
                    let parsedResponse = await this.outputParser.parse(fullResponse)
                    if (typeof parsedResponse === 'string' && typeof this.outputParser.lc_kwargs.schema !== 'undefined') {
                        // try to repair json
                        parsedResponse = jsonrepair(parsedResponse)
                        parsedResponse = JSON.parse(parsedResponse)
                    }
                    return { output: parsedResponse, fullResponse }
                } catch (e) {
                    // Instantiate chain again to avoid error "Cannot read properties of undefined (reading 'llm')"
                    // when OutputFixingParser is called.
                    const reChain = await this.init(nodeData, input, options)
                    const fixParser = OutputFixingParser.fromLLM(reChain.llm, this.outputParser)
                    const fixedResponse = await fixParser.parse(fullResponse)
                    return { output: fixedResponse, fullResponse }
                }
            }
            return { output: fullResponse, fullResponse }
        }
    }
}

module.exports = { nodeClass: AnswerAgent }
