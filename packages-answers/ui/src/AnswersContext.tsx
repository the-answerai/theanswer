'use client'
import React, { SetStateAction, createContext, useCallback, useContext, useRef, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
// @ts-ignore
import { deepmerge } from '@utils/deepmerge'
import { clearEmptyValues } from './clearEmptyValues'
import predictionApi from '@/api/prediction'
import chatmessagefeedbackApi from '@/api/chatmessagefeedback'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'

import { AnswersFilters, AppSettings, Chat, Journey, Message, Prompt, Sidekick, User, SidekickListItem, FeedbackPayload } from 'types'
import { ChatbotConfig } from './types'
import { FlowData } from './types'

// import { useUserPlans } from './hooks/useUserPlan';
import { v4 as uuidv4 } from 'uuid'
import { useSidekickData } from './SidekickSelect'
import { useSidekickDetails } from './SidekickSelect/hooks/useSidekickDetails'

interface PredictionParams {
    question: string
    chatId?: string
    journeyId?: string
    history?: { message: string; type: string }[]
    uploads?: string[]
    audio?: File | null
    socketIOClientId?: string
    streaming?: boolean
    action?: any
}

interface AnswersContextType {
    user: User
    appSettings: AppSettings
    error?: any
    chat?: Chat | null
    setChat: (action: SetStateAction<Chat>) => void
    journey?: Journey | null
    setJourney: (action: SetStateAction<Journey>) => void
    messages?: Array<Message>
    prompts?: Array<Prompt>
    chats?: Array<Chat>
    sendMessage: (args: {
        content: string
        isNewJourney?: boolean
        sidekick?: Sidekick | SidekickListItem
        gptModel?: string
        files?: string[]
        audio?: File | null
        action?: any
    }) => void
    clearMessages: () => void
    regenerateAnswer: () => void
    isLoading: boolean
    filters: AnswersFilters
    setFilters: (filters: SetStateAction<AnswersFilters>) => void
    updateFilter: (newFilter: AnswersFilters) => void
    useStreaming: boolean
    setUseStreaming: (useStreaming: boolean) => void
    showFilters?: boolean
    setShowFilters: (showFilters: boolean) => void
    inputValue: string
    setInputValue: (value: string) => void
    deleteChat: (id: string) => Promise<void>
    deletePrompt: (id: string) => Promise<void>
    deleteJourney: (id: string) => Promise<void>
    updateMessage: (message: Partial<Message>) => Promise<{ data: Message }>
    updateChat: (chat: Partial<Chat>) => Promise<{ data: Chat }>
    updatePrompt: (prompt: Partial<Prompt>) => Promise<{ data: Prompt }>
    upsertJourney: (journey: Partial<Journey>) => Promise<{ data: Journey }>
    startNewChat: () => void

    messageIdx: any
    setMessages: (arg: SetStateAction<Message[]>) => void
    journeyId: any
    chatId: any
    setIsLoading: any
    setError: any
    setChatId: any
    setJourneyId: any
    setSidekick: (arg: SetStateAction<Sidekick>) => void
    sidekick?: Sidekick | SidekickListItem
    chatbotConfig?: ChatbotConfig
    flowData?: FlowData
    gptModel: string
    setGptModel: (arg: SetStateAction<string>) => void
    sendMessageFeedback: (args: FeedbackPayload) => Promise<any>
    socketIOClientId?: string
    setSocketIOClientId: (id: string) => void
    isChatFlowAvailableToStream: boolean
    handleAbort: () => Promise<void>
    feedbackId: string
    setFeedbackId: (id: string) => void
    showFeedbackContentDialog: boolean
    setShowFeedbackContentDialog: (show: boolean) => void
    submitFeedbackContent: (text: string) => Promise<void>
    fullFileUpload: boolean
    fullFileUploadAllowedTypes: string
}
// @ts-ignore
const AnswersContext = createContext<AnswersContextType>({
    appSettings: {},
    error: null,
    messages: [],
    chats: [],
    prompts: [],
    filters: {},
    sidekick: undefined,
    updateFilter: () => {},
    sendMessage: () => {},
    regenerateAnswer: () => {},
    clearMessages: () => {},
    isLoading: false,
    inputValue: '',
    useStreaming: true,
    setUseStreaming: () => {},
    showFilters: false,
    setShowFilters: () => {},
    setInputValue: () => {},
    deleteChat: async () => {},
    deletePrompt: async () => {},
    deleteJourney: async () => {},
    startNewChat: async () => {},
    sendMessageFeedback: async () => {},
    socketIOClientId: '',
    setSocketIOClientId: () => {},
    isChatFlowAvailableToStream: false,
    handleAbort: async () => {},
    feedbackId: '',
    setFeedbackId: () => {},
    showFeedbackContentDialog: false,
    setShowFeedbackContentDialog: () => {},
    submitFeedbackContent: async () => {}
})

export function useAnswers() {
    const context = useContext(AnswersContext)

    return {
        ...context
    }
}

interface AnswersProviderProps {
    children: React.ReactNode
    user?: User
    appSettings: AppSettings
    apiUrl?: string
    useStreaming?: boolean
    chat?: Chat
    journey?: Journey
    prompts?: Prompt[]
    sidekicks?: SidekickListItem[]
    // chats?: Chat[];
}

export function AnswersProvider({
    chat,
    journey: initialJourney,
    // sidekicks,
    user,
    appSettings,
    children,
    prompts,
    useStreaming: initialUseStreaming = true,
    apiUrl = '/api'
}: AnswersProviderProps) {
    const router = useRouter()
    const { combinedSidekicks: sidekicks } = useSidekickData()
    const [error, setError] = useState(null)
    const [inputValue, setInputValue] = useState('')
    // const [chat, setChat] = useState<Chat | undefined>(chat);
    const [journey, setJourney] = useState<Journey | undefined>(initialJourney)
    const [isLoading, setIsLoading] = useState(false)
    const [feedbackId, setFeedbackId] = useState('')
    const [showFeedbackContentDialog, setShowFeedbackContentDialog] = useState(false)

    const [showFilters, setShowFilters] = useState(false)
    const [useStreaming, setUseStreaming] = useState(initialUseStreaming)

    const [journeyId, setJourneyId] = useState<string | undefined>(journey?.id)

    const [gptModel, setGptModel] = useState('gpt-3.5-turbo')
    const messageIdx = useRef(0)

    const [chatId, setChatId] = useState<string | undefined>(chat?.id ?? uuidv4())

    const [sidekick, setSidekick] = useState<SidekickListItem | undefined>()
    const flowData = React.useMemo(() => sidekick?.flowData, [sidekick])
    const [messages, setMessages] = useState<Array<Message>>(chat?.messages ?? [])
    const [filters, setFilters] = useState<AnswersFilters>(deepmerge({}, appSettings?.filters, journey?.filters, chat?.filters))
    const { data: selectedSidekickData, mutate: mutateSidekickDetails } = useSidekickDetails(sidekick?.id ?? null)
    const chatbotConfig = React.useMemo(() => selectedSidekickData?.chatbotConfig, [selectedSidekickData])
    // Refs for stable callbacks without message dependency
    const messagesRef = useRef(messages)
    const chatIdRef = useRef(chatId)
    const journeyIdRef = useRef(journeyId)
    const sidekickRef = useRef(sidekick)

    // Full file upload support
    const [fullFileUpload, setFullFileUpload] = useState(false)
    const [fullFileUploadAllowedTypes, setFullFileUploadAllowedTypes] = useState('*')

    // Keep refs in sync
    useEffect(() => {
        messagesRef.current = messages
        chatIdRef.current = chatId
        journeyIdRef.current = journeyId
        sidekickRef.current = sidekick
    }, [messages, chatId, journeyId, sidekick])

    useEffect(() => {
        if (sidekicks) {
            // Helper function to transform Sidekick to basic SidekickListItem structure
            const transformSidekick = (sourceSidekick: any, currentSidekick?: SidekickListItem): SidekickListItem =>
                ({
                    id: sourceSidekick.id,
                    chatbotConfig: sourceSidekick.chatflow?.chatbotConfig,
                    flowData: sourceSidekick.chatflow?.flowData || sourceSidekick.flowData,
                    // Add minimal required properties
                    isFavorite: false,
                    sharedWith: '',
                    tagString: '',
                    chatflowId: sourceSidekick.id,
                    answersConfig: sourceSidekick.chatflow?.answersConfig,
                    // PRESERVE existing constraints if they exist (to avoid race condition with fetch)
                    constraints:
                        currentSidekick?.id === sourceSidekick.id && currentSidekick?.constraints
                            ? currentSidekick.constraints
                            : {
                                  isSpeechToTextEnabled: false,
                                  isImageUploadAllowed: false,
                                  isRAGFileUploadAllowed: false,
                                  uploadSizeAndTypes: []
                              },
                    chatflow: sourceSidekick.chatflow,
                    placeholder: sourceSidekick.placeholder || '',
                    tags: sourceSidekick.tags || [],
                    aiModel: sourceSidekick.aiModel || '',
                    label: sourceSidekick.label || '',
                    chatflowDomain: sourceSidekick.chatflowDomain || ''
                } as SidekickListItem)

            // First, try to find sidekick from existing chat context
            const existingSidekick = sidekicks.find(
                (s) => s.id === chat?.messages?.[chat?.messages?.length - 1]?.chatflowid || s.id === chat?.chatflowId
            )

            if (existingSidekick) {
                setSidekick((current) => transformSidekick(existingSidekick, current))
            } else if (!chat && sidekicks.length > 0) {
                // If no chat exists, set the first available sidekick to enable starter prompts
                setSidekick((current) => transformSidekick(sidekicks[0], current))
            }
        }
    }, [sidekicks, chat])

    const addMessage = useCallback(
        (message: Message) => {
            setMessages((currentMessages) => {
                messageIdx.current = currentMessages.length + 1
                return [...currentMessages, message]
            })
        },
        [messageIdx, setMessages]
    )

    const updateFilter = React.useCallback(
        (newFilter: AnswersFilters) => {
            const mergedSettings = clearEmptyValues(deepmerge({}, filters, newFilter))

            setFilters(mergedSettings)
        },
        [filters]
    )

    const clearMessages = () => {
        setMessages([])
        setChatId(undefined)
        setError(null)
        setIsLoading(false)
        setSidekick(undefined as SidekickListItem | undefined)
        if (chatId) {
            router.push('/journey/' + journeyId)
        }
    }

    const deleteChat = async (id: string) => axios.delete(`${apiUrl}/chats?id=${id}`).then(() => router.refresh())

    const sendMessageFeedback = async (data: FeedbackPayload) => {
        const { chatflowid, messageId, rating } = data
        const response = await chatmessagefeedbackApi.addFeedback(chatflowid, { ...data })
        if (response.data) {
            const data = response.data
            let id = ''
            if (data && data.id) id = data.id

            setMessages((prevMessages) =>
                prevMessages.map((message) => (message.id === messageId ? { ...message, feedback: { rating } } : message))
            )

            setFeedbackId(id)
            setShowFeedbackContentDialog(true)
        }
    }

    const submitFeedbackContent = async (text: string) => {
        const body = {
            content: text
        }
        const result = await chatmessagefeedbackApi.updateFeedback(feedbackId, body)
        if (result.data) {
            setFeedbackId('')
            setShowFeedbackContentDialog(false)
        }
    }

    const deletePrompt = async (id: string) => axios.delete(`${apiUrl}/prompts?id=${id}`).then(() => router.refresh())
    const deleteJourney = async (id: string) => axios.delete(`${apiUrl}/journeys?id=${id}`).then(() => router.refresh())
    const updateChat = async (chat: Partial<Chat>) => axios.patch(`${apiUrl}/chats`, chat).then(() => router.refresh())
    const updatePrompt = async (prompt: Partial<Prompt>) => axios.patch(`${apiUrl}/prompts`, prompt).then(() => router.refresh())
    const upsertJourney = async (journey: Partial<Journey>) => axios.patch(`${apiUrl}/journeys`, journey)

    const updateMessage = async (message: Partial<Message>) => axios.patch(`${apiUrl}/messages`, message).then(() => router.refresh())

    const startNewChat = () => {
        if (journey) {
            router.push(`/journey/${journey.id}`)
            setJourneyId(journey.id)
            return
        }

        if (sidekick) {
            router.push(`/chat/${sidekick.id}`)
            setChatId(uuidv4())
            setMessages([])
            setFilters({})
            return
        }

        setChatId(undefined)
        setMessages([])
        setFilters({})
    }
    const [socketIOClientId, setSocketIOClientId] = useState('')
    const [isChatFlowAvailableToStream, setIsChatFlowAvailableToStream] = useState(false)
    const [isMessageStopping, setIsMessageStopping] = useState(false)

    const updateLastMessage = (text: string) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, index) => (index === prevMessages.length - 1 ? { ...msg, content: msg.content + text } : msg))
        })
    }

    const updateLastMessageSourceDocuments = (sourceDocuments: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, sourceDocuments } : msg))
        })
    }

    const updateLastMessageUsedTools = (usedTools: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => {
                if (idx !== prevMessages.length - 1) return msg
                // Smart replacement: Remove calledTools that have been replaced by usedTools
                const remainingCalledTools = msg.calledTools?.filter(
                    (calledTool: any) => !usedTools.some((usedTool: any) => usedTool.tool === calledTool.tool)
                )
                return {
                    ...msg,
                    usedTools,
                    calledTools: remainingCalledTools?.length ? remainingCalledTools : undefined
                }
            })
        })
    }

    const updateLastMessageFileAnnotations = (fileAnnotations: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, fileAnnotations } : msg))
        })
    }

    const updateLastMessageAgentReasoning = (agentReasoning: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, agentReasoning } : msg))
        })
    }

    const updateLastMessageAction = (action: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, action } : msg))
        })
    }

    const updateLastMessageNextAgent = (nextAgent: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => {
                if (idx !== prevMessages.length - 1) return msg
                const agentReasoning = msg.agentReasoning?.length ? [...msg.agentReasoning, { nextAgent }] : msg.agentReasoning
                return { ...msg, agentReasoning }
            })
        })
    }

    const updateLastMessageArtifacts = (artifacts: any) => {
        // Transform FILE-STORAGE:: references to API URLs
        if (Array.isArray(artifacts)) {
            artifacts.forEach((artifact: any) => {
                if ((artifact.type === 'png' || artifact.type === 'jpeg') && artifact.data?.startsWith?.('FILE-STORAGE::')) {
                    const baseURL = sessionStorage.getItem('baseURL') || ''
                    const fileName = artifact.data.replace('FILE-STORAGE::', '')
                    artifact.data = `${baseURL}/api/v1/get-upload-file?chatflowId=${sidekick?.id}&chatId=${chatId}&fileName=${fileName}`
                }
            })
        }

        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, artifacts } : msg))
        })
    }

    const updateLastMessageAgentFlowExecutedData = (data: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, agentFlowExecutedData: data } : msg))
        })
    }

    const updateLastMessageCalledTools = (tools: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            // Parse if string (backend sends JSON.stringify sometimes)
            let parsedTools = tools
            if (typeof tools === 'string') {
                try {
                    parsedTools = JSON.parse(tools)
                } catch (e) {
                    console.error('Failed to parse calledTools:', e)
                    parsedTools = []
                }
            }
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, calledTools: parsedTools } : msg))
        })
    }

    const cleanupCalledTools = () => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => {
                if (idx !== prevMessages.length - 1) return msg
                // Remove any remaining calledTools when the stream ends
                if (msg.calledTools?.length && !msg.usedTools?.length) {
                    return { ...msg, calledTools: undefined }
                }
                return msg
            })
        })
    }

    const updateLastMessageAgentFlowEvent = (event: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, agentFlowEvent: event } : msg))
        })
    }

    const updateLastMessageNextAgentFlow = (nextAgentFlow: any) => {
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => (idx === prevMessages.length - 1 ? { ...msg, nextAgentFlow } : msg))
        })
    }

    const abortMessage = () => {
        setIsMessageStopping(false)
        setMessages((prevMessages) => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
            return prevMessages.map((msg, idx) => {
                if (idx !== prevMessages.length - 1) return msg
                const agentReasoning = msg.agentReasoning?.filter((reasoning: { nextAgent?: any }) => !reasoning.nextAgent)
                return { ...msg, agentReasoning }
            })
        })
    }

    const handleAbort = async () => {
        setIsMessageStopping(true)
        try {
            if (sidekick?.id && chatId) {
                await predictionApi.abortMessage(sidekick.id, chatId)
            }
        } catch (error: any) {
            setIsMessageStopping(false)
            setError(error.response?.data?.message || 'Error aborting message')
        }
    }

    const sendMessage = useCallback(
        async ({
            content,
            sidekick,
            gptModel,
            retry,
            files,
            audio,
            action
        }: {
            content: string
            sidekick?: SidekickListItem
            gptModel?: string
            retry?: boolean
            files?: string[]
            audio?: File | null
            action?: any
        }) => {
            if (!retry) {
                const fileUploads = files
                addMessage({ role: 'user', content, fileUploads } as Message)
            }
            setError(null)
            setIsLoading(true)

            try {
                const params = {
                    question: content,
                    chatId: chatIdRef.current,
                    journeyId: journeyIdRef.current,
                    uploads: files,
                    audio,
                    socketIOClientId: isChatFlowAvailableToStream ? socketIOClientId : undefined,
                    chatType: 'ANSWERAI',
                    action,
                    trackingMetadata: {
                        url: typeof window !== 'undefined' ? window.location.href : undefined,
                        source: 'theanswer'
                    }
                }

                if (isChatFlowAvailableToStream) {
                    // Use fetchEventSource for streaming
                    fetchResponseFromEventStream(sidekick?.id!, params)
                } else {
                    const response = await predictionApi.sendMessageAndGetPrediction(sidekick?.id!, params)
                    const data = response.data
                    setMessages((prevMessages) =>
                        prevMessages.map((msg, idx) =>
                            idx === prevMessages.length - 1 && (msg as any).type === 'apiMessage'
                                ? { ...msg, id: data?.chatMessageId }
                                : msg
                        )
                    )
                    setChatId(data.chatId)

                    if (content === '' && data.question) {
                        // the response contains the question even if it was in an audio format
                        // so if input is empty but the response contains the question, update the user message to show the question
                        setMessages((prevMessages) =>
                            prevMessages.map((msg, idx) =>
                                idx === prevMessages.length - 2 && (msg as any).type !== 'apiMessage'
                                    ? { ...msg, content: data.question }
                                    : msg
                            )
                        )
                    }

                    let text = ''
                    if (data.text) text = data.text
                    else if (data.json) text = '```json\n' + JSON.stringify(data.json, null, 2)
                    else text = JSON.stringify(data, null, 2)

                    // Parse followUpPrompts safely - handle double-stringification from backend
                    let followUpPrompts = undefined
                    if (data?.followUpPrompts) {
                        try {
                            followUpPrompts = data.followUpPrompts
                            // First parse if it's a string
                            if (typeof followUpPrompts === 'string') {
                                followUpPrompts = JSON.parse(followUpPrompts)
                            }
                            // Second parse if still a string (backend double-stringifies)
                            if (typeof followUpPrompts === 'string') {
                                followUpPrompts = JSON.parse(followUpPrompts)
                            }
                            // Ensure it's an array
                            if (!Array.isArray(followUpPrompts)) {
                                followUpPrompts = undefined
                            }
                        } catch (e) {
                            console.error('Failed to parse followUpPrompts:', e)
                            followUpPrompts = undefined
                        }
                    }

                    setMessages((prevMessages) => [
                        ...prevMessages,
                        {
                            role: 'assistant',
                            content: text,
                            id: data?.chatMessageId,
                            sourceDocuments: data?.sourceDocuments,
                            followUpPrompts,
                            usedTools: data?.usedTools,
                            fileAnnotations: data?.fileAnnotations,
                            agentReasoning: data?.agentReasoning,
                            action: data?.action,
                            type: 'apiMessage',
                            feedback: null,
                            isLoading: false,
                            chat: data.chat
                        }
                    ])
                }

                setIsLoading(false)
                setInputValue('')
            } catch (err: any) {
                const errorMessage = err.response?.data?.message || 'Error sending message'
                setError(errorMessage)
                setIsLoading(false)
                setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: errorMessage } as Message])
            }
        },
        [addMessage, isChatFlowAvailableToStream, socketIOClientId]
    )
    const regenerateAnswer = useCallback(
        (retry?: boolean) => {
            const [message] = messagesRef.current?.filter((m) => m.role === 'user').slice(-1) ?? []
            sendMessage({ content: message?.content || '', retry, sidekick, gptModel })
        },
        [sendMessage, sidekick, gptModel]
    )

    // Add fetchResponseFromEventStream function
    const fetchResponseFromEventStream = async (chatflowid: string, params: PredictionParams) => {
        const baseURL = sessionStorage.getItem('baseURL') || ''
        const token = sessionStorage.getItem('access_token')
        // Set streaming flag
        params.streaming = true

        try {
            // Start with empty message that will be updated by streaming
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    role: 'assistant',
                    content: '',
                    isLoading: true,
                    chatflowid: chatflowid,
                    type: 'apiMessage'
                } as Message
            ])
            await fetchEventSource(`${baseURL}/api/v1/internal-prediction/${chatflowid}`, {
                openWhenHidden: true,
                method: 'POST',
                body: JSON.stringify(params),
                headers: {
                    'Content-Type': 'application/json',
                    'x-request-from': 'internal',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                async onopen(response) {
                    if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
                        setIsChatFlowAvailableToStream(true)
                    } else {
                        throw new Error('Failed to establish connection')
                    }
                },
                async onmessage(ev) {
                    const payload = JSON.parse(ev.data)
                    switch (payload.event) {
                        case 'start':
                            // Already created an empty message when starting the stream
                            break
                        case 'token':
                            updateLastMessage(payload.data)
                            break
                        case 'sourceDocuments':
                            updateLastMessageSourceDocuments(payload.data)
                            break
                        case 'usedTools':
                            updateLastMessageUsedTools(payload.data)
                            break
                        case 'fileAnnotations':
                            updateLastMessageFileAnnotations(payload.data)
                            break
                        case 'agentReasoning':
                            updateLastMessageAgentReasoning(payload.data)
                            break
                        case 'action':
                            updateLastMessageAction(payload.data)
                            break
                        case 'nextAgent':
                            updateLastMessageNextAgent(payload.data)
                            break
                        case 'artifacts':
                            updateLastMessageArtifacts(payload.data)
                            break
                        case 'agentFlowExecutedData':
                            updateLastMessageAgentFlowExecutedData(payload.data)
                            break
                        case 'calledTools':
                            updateLastMessageCalledTools(payload.data)
                            break
                        case 'agentFlowEvent':
                            updateLastMessageAgentFlowEvent(payload.data)
                            break
                        case 'nextAgentFlow':
                            updateLastMessageNextAgentFlow(payload.data)
                            break
                        case 'metadata':
                            if (payload.data.chatId) {
                                setChatId(payload.data.chatId)
                            }
                            setMessages((prevMessages) => {
                                if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
                                return prevMessages.map((msg, idx) => {
                                    if (idx !== prevMessages.length - 1) return msg
                                    return {
                                        ...msg,
                                        ...(payload.data.chatMessageId &&
                                            ({
                                                id: payload.data.chatMessageId,
                                                chatId: payload.data.chatId,
                                                chatflowid: chatflowid
                                            } as any)),
                                        ...(payload.data.followUpPrompts && { followUpPrompts: payload.data.followUpPrompts })
                                    }
                                })
                            })
                            break
                        case 'error':
                            setError(payload.data)
                            // Update the current assistant message to show the error
                            setMessages((prevMessages) => {
                                if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
                                return prevMessages.map((msg, idx) =>
                                    idx === prevMessages.length - 1
                                        ? ({ ...msg, content: `Error: ${payload.data}`, isLoading: false } as any)
                                        : msg
                                )
                            })
                            break
                        case 'abort':
                            abortMessage()
                            break
                        case 'end':
                            setMessages((prevMessages) => {
                                if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1]?.role === 'user') return prevMessages
                                return prevMessages.map((msg, idx) =>
                                    idx === prevMessages.length - 1
                                        ? ({ ...msg, isLoading: false, role: 'assistant', type: 'apiMessage' } as any)
                                        : msg
                                )
                            })
                            cleanupCalledTools()
                            setIsLoading(false)
                            break
                    }
                },
                async onclose() {
                    // Clean up on close
                    setIsLoading(false)
                },
                async onerror(err) {
                    console.error('EventSource Error: ', err)
                    setError('Error during streaming')
                    setIsLoading(false)
                    throw err
                }
            })
        } catch (error: any) {
            console.error('Stream error:', error)
            setError(error.message || 'Error during streaming')
            setIsLoading(false)
        }
    }

    // Replace Socket.IO effect with event source availability check
    useEffect(() => {
        // Check if streaming is available for this chatflow
        if (!sidekick?.id) return

        const abortController = new AbortController()

        const checkStreamingAvailability = async () => {
            try {
                // You might need to implement this method in your API to check if streaming is available
                const streamable = await predictionApi.checkIfChatflowIsValidForStreaming(sidekick.id)
                if (!abortController.signal.aborted) {
                    setIsChatFlowAvailableToStream(streamable?.isStreaming || false)
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.error('Error checking streaming availability:', error)
                    setIsChatFlowAvailableToStream(false)
                }
            }
        }

        const fetchUploadConstraints = async () => {
            try {
                const baseURL = sessionStorage.getItem('baseURL') || ''
                const token = sessionStorage.getItem('access_token')
                const response = await fetch(`${baseURL}/api/v1/chatflows-uploads/${sidekick.id}`, {
                    headers: {
                        'x-request-from': 'internal',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    signal: abortController.signal
                })

                if (response.ok && !abortController.signal.aborted) {
                    const data = await response.json()
                    const mimeTypes: Record<string, string> = {
                        '.pdf': 'application/pdf',
                        '.txt': 'text/plain',
                        '.csv': 'text/csv',
                        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        '.doc': 'application/msword'
                    }

                    const newConstraints = {
                        isSpeechToTextEnabled: data?.isSpeechToTextEnabled ?? false,
                        isImageUploadAllowed: data?.isImageUploadAllowed ?? false,
                        isRAGFileUploadAllowed: data?.isRAGFileUploadAllowed ?? false,
                        uploadSizeAndTypes: [
                            ...(data?.imgUploadSizeAndTypes || []),
                            ...(data?.fileUploadSizeAndTypes || []).map((item: any) => ({
                                fileTypes: item.fileTypes.map((ext: string) => mimeTypes[ext] || ext),
                                maxUploadSize: item.maxUploadSize
                            }))
                        ]
                    }

                    // Also update local state for immediate reactivity
                    setSidekick((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  constraints: newConstraints
                              }
                            : prev
                    )
                } else if (!response.ok && !abortController.signal.aborted) {
                    console.error('❌ Failed to fetch upload constraints, status:', response.status)
                }
            } catch (error: any) {
                if (error.name !== 'AbortError' && !abortController.signal.aborted) {
                    console.error('❌ Failed to fetch upload constraints:', error)
                }
            }
        }

        checkStreamingAvailability()
        fetchUploadConstraints()

        return () => {
            abortController.abort()
        }
    }, [sidekick?.id, mutateSidekickDetails])

    React.useEffect(() => {
        setJourney(initialJourney)
        setFilters(deepmerge({}, initialJourney?.filters, chat?.filters))
    }, [chat, initialJourney, appSettings])

    // Parse chatbotConfig for fullFileUpload settings
    React.useEffect(() => {
        if (chatbotConfig) {
            try {
                const config = typeof chatbotConfig === 'string' ? JSON.parse(chatbotConfig) : chatbotConfig
                if (config.fullFileUpload) {
                    setFullFileUpload(config.fullFileUpload.status ?? false)
                    if (config.fullFileUpload?.allowedUploadFileTypes) {
                        setFullFileUploadAllowedTypes(config.fullFileUpload.allowedUploadFileTypes)
                    }
                }
            } catch (error) {
                console.error('Error parsing chatbotConfig for fullFileUpload:', error)
            }
        }
    }, [chatbotConfig])

    const [previews, setPreviews] = useState<any[]>([])
    const [isDragActive, setIsDragActive] = useState(false)
    const fileUploadRef = useRef<HTMLInputElement>(null)

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(false)
        let files = []
        if (e.dataTransfer.files.length > 0) {
            for (const file of Array.from(e.dataTransfer.files)) {
                const reader = new FileReader()
                const { name } = file
                files.push(
                    new Promise((resolve) => {
                        reader.onload = (evt) => {
                            if (!evt?.target?.result) {
                                return
                            }
                            const { result } = evt.target
                            let previewUrl
                            if (file.type.startsWith('audio/')) {
                                previewUrl = '/audio-upload.svg' // You'll need to add this asset
                            } else if (file.type.startsWith('image/')) {
                                previewUrl = URL.createObjectURL(file)
                            }
                            resolve({
                                data: result,
                                preview: previewUrl,
                                type: 'file',
                                name: name,
                                mime: file.type
                            })
                        }
                        reader.readAsDataURL(file)
                    })
                )
            }

            const newFiles = await Promise.all(files)
            setPreviews((prevPreviews) => [...prevPreviews, ...newFiles])
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true)
        } else if (e.type === 'dragleave') {
            setIsDragActive(false)
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files && event.target.files[0]
        if (!fileObj) {
            return
        }
        let files = []
        if (event.target.files) {
            for (const file of Array.from(event.target.files)) {
                const reader = new FileReader()
                const { name } = file
                files.push(
                    new Promise((resolve) => {
                        reader.onload = (evt) => {
                            if (!evt?.target?.result) {
                                return
                            }
                            const { result } = evt.target
                            resolve({
                                data: result,
                                preview: URL.createObjectURL(file),
                                type: 'file',
                                name: name,
                                mime: file.type
                            })
                        }
                        reader.readAsDataURL(file)
                    })
                )
            }
        }

        const newFiles = await Promise.all(files)
        setPreviews((prevPreviews) => [...prevPreviews, ...newFiles])
        // Reset file input
        event.target.value = ''
    }

    const handleUploadClick = () => {
        fileUploadRef.current?.click()
    }

    const clearPreviews = () => {
        previews.forEach((file) => URL.revokeObjectURL(file.preview))
        setPreviews([])
    }

    const handleDeletePreview = (itemToDelete: any) => {
        if (itemToDelete.type === 'file') {
            URL.revokeObjectURL(itemToDelete.preview)
        }
        setPreviews(previews.filter((item) => item !== itemToDelete))
    }

    const contextValue = useMemo(
        () => ({
            user,
            appSettings,
            chat,
            journey,
            messages,
            setJourney,
            setMessages,
            prompts,
            filters,
            setFilters,
            isLoading,
            setIsLoading,
            useStreaming,
            setUseStreaming,
            error,
            setError,
            showFilters,
            setShowFilters,
            inputValue,
            setInputValue,
            chatId,
            setChatId,
            journeyId,
            setJourneyId,
            messageIdx,
            sidekick: {
                ...sidekick,
                ...selectedSidekickData,
                // IMPORTANT: Preserve fetched constraints - don't let selectedSidekickData overwrite them
                constraints: sidekick?.constraints || selectedSidekickData?.constraints
            },
            setSidekick,
            chatbotConfig,
            flowData,
            gptModel,
            setGptModel,
            sendMessage,
            clearMessages,
            regenerateAnswer,
            updateFilter,
            addMessage,
            deleteChat,
            deletePrompt,
            deleteJourney,
            updateChat,
            updatePrompt,
            upsertJourney,
            updateMessage,
            startNewChat,
            sendMessageFeedback,
            socketIOClientId,
            setSocketIOClientId,
            isChatFlowAvailableToStream,
            handleAbort,
            feedbackId,
            setFeedbackId,
            showFeedbackContentDialog,
            setShowFeedbackContentDialog,
            submitFeedbackContent,
            fullFileUpload,
            fullFileUploadAllowedTypes
        }),
        [
            user,
            appSettings,
            chat,
            journey,
            messages,
            prompts,
            filters,
            isLoading,
            useStreaming,
            error,
            showFilters,
            inputValue,
            chatId,
            journeyId,
            sidekick,
            selectedSidekickData,
            chatbotConfig,
            flowData,
            gptModel,
            sendMessage,
            clearMessages,
            regenerateAnswer,
            updateFilter,
            addMessage,
            socketIOClientId,
            isChatFlowAvailableToStream,
            feedbackId,
            showFeedbackContentDialog,
            fullFileUpload,
            fullFileUploadAllowedTypes
        ]
    )
    // @ts-ignore
    return <AnswersContext.Provider value={contextValue}>{children}</AnswersContext.Provider>
}

// Add a fallback implementation for checkIfChatflowIsValidForStreaming if it doesn't exist in predictionApi
if (!predictionApi.checkIfChatflowIsValidForStreaming) {
    predictionApi.checkIfChatflowIsValidForStreaming = async (chatflowId: string) => {
        const baseURL = sessionStorage.getItem('baseURL') || ''
        try {
            const response = await axios.get(`${baseURL}/api/v1/chatflows-streaming/${chatflowId}`)
            return response.data
        } catch (error) {
            console.error('Error checking if chatflow is valid for streaming:', error)
            return { isStreaming: false }
        }
    }
}
