import { FollowUpPromptConfig, FollowUpPromptProvider, ICommonObject } from './Interface'
import { getCredentialData } from './utils'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatMistralAI } from '@langchain/mistralai'
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ChatGroq } from '@langchain/groq'
import { Ollama } from 'ollama'
import { CallbackHandler } from 'langfuse-langchain'

const FollowUpPromptType = z
    .object({
        questions: z.array(z.string())
    })
    .describe('Generate Follow Up Prompts')

/**
 * Creates Langfuse callback handlers for follow-up prompts tracking
 * Extracted to reduce merge conflicts and improve maintainability
 */
const createLangfuseCallbacks = (options: ICommonObject, followUpPromptsConfig: FollowUpPromptConfig, providerConfig: any): any[] => {
    const parentLangfuseTrace = options.parentLangfuseTrace
    const messageId = options.messageId // The message this follow-up is for

    // Check if Langfuse is configured via env vars
    if (!process.env.LANGFUSE_SECRET_KEY) {
        return []
    }

    try {
        // Build metadata matching the exact structure from handler.ts (lines 646-663)
        // This ensures billing sync works correctly
        // Note: billingStripeCustomerId comes from billedUserId pattern (req.user?.id || chatflow.userId)
        // This is who gets billed, which may differ from the authenticated user
        const metadata: any = {
            chatId: options.chatId,
            chatflowid: options.chatflowid,
            sessionId: options.sessionId,
            messageId: messageId,
            // User/billing information - CRITICAL for billing sync
            // userId and organizationId represent the actual user/context
            userId: options?.user?.id || options.userId,
            organizationId: options?.user?.organizationId || options.organizationId,
            // Billing fields - who gets charged (may be chatflow owner if no authenticated user)
            customerId: options.billingStripeCustomerId,
            stripeCustomerId: options.billingStripeCustomerId,
            // Follow-up prompt specific fields
            component: 'follow-up-prompts',
            provider: followUpPromptsConfig.selectedProvider,
            modelName: providerConfig.modelName,
            forMessageId: messageId,
            traceType: 'follow-up-generation',
            // Tracking metadata (spread with tracking_ prefix, matching handler.ts)
            ...(options.trackingMetadata &&
                Object.keys(options.trackingMetadata).reduce((acc, key) => {
                    acc[`tracking_${key}`] = options.trackingMetadata![key]
                    return acc
                }, {} as Record<string, any>))
        }

        const handlerConfig: any = {
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com',
            sessionId: options.sessionId,
            userId: options?.user?.id || options.userId,
            metadata,
            tags: ['follow-up-prompts', `chat:${options.chatId}`, messageId ? `message:${messageId}` : null].filter(Boolean)
        }

        // For agentflows: nest under parent trace
        // For chatflows: create standalone trace linked by sessionId + metadata
        if (parentLangfuseTrace) {
            handlerConfig.root = parentLangfuseTrace
            handlerConfig.updateRoot = false
        }

        const handler = new CallbackHandler(handlerConfig)
        return [handler]
    } catch (error) {
        console.warn('Failed to create Langfuse handler for follow-up prompts:', error)
        return []
    }
}

export const generateFollowUpPrompts = async (
    followUpPromptsConfig: FollowUpPromptConfig,
    apiMessageContent: string,
    options: ICommonObject
) => {
    if (followUpPromptsConfig) {
        if (!followUpPromptsConfig.status) return undefined
        const providerConfig = followUpPromptsConfig[followUpPromptsConfig.selectedProvider]
        if (!providerConfig) return undefined
        const credentialId = providerConfig.credentialId as string
        const credentialData = await getCredentialData(credentialId ?? '', options)
        const followUpPromptsPrompt = providerConfig.prompt.replace('{history}', apiMessageContent)

        // Create Langfuse callback handlers for tracking
        const callbacks = createLangfuseCallbacks(options, followUpPromptsConfig, providerConfig)

        switch (followUpPromptsConfig.selectedProvider) {
            case FollowUpPromptProvider.ANTHROPIC: {
                const llm = new ChatAnthropic({
                    apiKey: credentialData.anthropicApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                // @ts-ignore
                const structuredLLM = llm.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.AZURE_OPENAI: {
                const azureOpenAIApiKey = credentialData['azureOpenAIApiKey']
                const azureOpenAIApiInstanceName = credentialData['azureOpenAIApiInstanceName']
                const azureOpenAIApiDeploymentName = credentialData['azureOpenAIApiDeploymentName']
                const azureOpenAIApiVersion = credentialData['azureOpenAIApiVersion']

                const llm = new AzureChatOpenAI({
                    azureOpenAIApiKey,
                    azureOpenAIApiInstanceName,
                    azureOpenAIApiDeploymentName,
                    azureOpenAIApiVersion,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                // use structured output parser because withStructuredOutput is not working
                const parser = StructuredOutputParser.fromZodSchema(FollowUpPromptType as any)
                const formatInstructions = parser.getFormatInstructions()
                const prompt = PromptTemplate.fromTemplate(`
                    ${providerConfig.prompt}
                                
                    {format_instructions}
                `)
                const chain = prompt.pipe(llm).pipe(parser)
                const structuredResponse = await chain.invoke(
                    {
                        history: apiMessageContent,
                        format_instructions: formatInstructions
                    },
                    callbacks.length ? { callbacks } : undefined
                )
                return structuredResponse
            }
            case FollowUpPromptProvider.GOOGLE_GENAI: {
                const model = new ChatGoogleGenerativeAI({
                    apiKey: credentialData.googleGenerativeAPIKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.MISTRALAI: {
                const model = new ChatMistralAI({
                    apiKey: credentialData.mistralAIAPIKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                // @ts-ignore
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.OPENAI: {
                const model = new ChatOpenAI({
                    apiKey: credentialData.openAIApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`),
                    useResponsesApi: true
                })
                // @ts-ignore
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.AAI_OPENAI: {
                const aaiOpenAIApiKey = process.env.AAI_DEFAULT_OPENAI_API_KEY
                if (!aaiOpenAIApiKey) {
                    throw new Error('AAI_DEFAULT_OPENAI_API_KEY environment variable is not set')
                }
                const model = new ChatOpenAI({
                    apiKey: aaiOpenAIApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`),
                    useResponsesApi: true
                })
                // @ts-ignore
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.AAI_ANTHROPIC: {
                const aaiAnthropicApiKey = process.env.AAI_DEFAULT_ANTHROPHIC
                if (!aaiAnthropicApiKey) {
                    throw new Error('AAI_DEFAULT_ANTHROPHIC environment variable is not set')
                }
                const llm = new ChatAnthropic({
                    apiKey: aaiAnthropicApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                // @ts-ignore
                const structuredLLM = llm.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.AAI_GOOGLE_GENAI: {
                const aaiGoogleGenAIApiKey = process.env.AAI_DEFAULT_GOOGLE_GENERATIVE_AI_API_KEY
                if (!aaiGoogleGenAIApiKey) {
                    throw new Error('AAI_DEFAULT_GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set')
                }
                const model = new ChatGoogleGenerativeAI({
                    apiKey: aaiGoogleGenAIApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                // @ts-ignore
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.AAI_GROQ: {
                const aaiGroqApiKey = process.env.AAI_DEFAULT_GROQ
                if (!aaiGroqApiKey) {
                    throw new Error('AAI_DEFAULT_GROQ environment variable is not set')
                }
                const llm = new ChatGroq({
                    apiKey: aaiGroqApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                const structuredLLM = llm.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.GROQ: {
                const llm = new ChatGroq({
                    apiKey: credentialData.groqApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                })
                const structuredLLM = llm.withStructuredOutput(FollowUpPromptType)
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt, callbacks.length ? { callbacks } : undefined)
                return structuredResponse
            }
            case FollowUpPromptProvider.OLLAMA: {
                const ollamaClient = new Ollama({
                    host: providerConfig.baseUrl || 'http://127.0.0.1:11434'
                })

                const response = await ollamaClient.chat({
                    model: providerConfig.modelName,
                    messages: [
                        {
                            role: 'user',
                            content: followUpPromptsPrompt
                        }
                    ],
                    format: {
                        type: 'object',
                        properties: {
                            questions: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                minItems: 3,
                                maxItems: 3,
                                description: 'Three follow-up questions based on the conversation history'
                            }
                        },
                        required: ['questions'],
                        additionalProperties: false
                    },
                    options: {
                        temperature: parseFloat(`${providerConfig.temperature}`)
                    }
                })
                const result = FollowUpPromptType.parse(JSON.parse(response.message.content))
                return result
            }
        }
    } else {
        return undefined
    }
}
