'use client'
import React, { SetStateAction, createContext, useCallback, useContext, useRef, useState, useEffect, ChangeEvent } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { cloneDeep } from 'lodash'
// @ts-ignore
import { deepmerge } from '@utils/deepmerge'
import { clearEmptyValues } from './clearEmptyValues'

import predictionApi from '@/api/prediction'
import chatflowApi from '@/api/chatflows'
import attachmentsApi from '@/api/attachments'
import vectorstoreApi from '@/api/vectorstore'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { AllowedUploads, ChatbotConfig, FileUpload, FlowData, UploadedFile } from './types'
import chatmessagefeedbackApi from '@/api/chatmessagefeedback'

import { AnswersFilters, AppSettings, Chat, Journey, Message, Prompt, Sidekick, User, SidekickListItem, FeedbackPayload } from 'types'

// import { useUserPlans } from './hooks/useUserPlan';
import { v4 as uuidv4 } from 'uuid'
import { prepareFilesForAPI } from './utils/processFile'
import { isFileAllowedForUpload } from './utils/isFileAllowedForUpload'

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
    handleDrag: (e: React.DragEvent) => void
    handleDrop: (e: React.DragEvent) => Promise<void>
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    handleUploadClick: () => void
    clearPreviews: () => void
    fileUploadRef: React.RefObject<HTMLInputElement> | null
    handleDeletePreview: (index: number) => void
    allowedUploads: AllowedUploads
    previews: FileUpload[]
    uploadedFiles: UploadedFile[]
    isDragActive: boolean
    feedbackId: string
    setFeedbackId: (id: string) => void
    showFeedbackContentDialog: boolean
    setShowFeedbackContentDialog: (show: boolean) => void
    submitFeedbackContent: (text: string) => Promise<void>
}
// ====================== Context Initialization ================================
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
    handleDrop: async () => {},
    handleDrag: () => {},
    handleFileChange: async () => {},
    handleUploadClick: () => {},
    clearPreviews: () => {},
    fileUploadRef: null,

    handleDeletePreview: () => {},
    allowedUploads: {
        fileUploadSizeAndTypes: [],
        imgUploadSizeAndTypes: [],
        isImageUploadAllowed: false,
        isRAGFileUploadAllowed: false,
        isSpeechToTextEnabled: false
    },
    previews: [],
    uploadedFiles: [],
    isDragActive: false,
    feedbackId: '',
    setFeedbackId: () => {},
    showFeedbackContentDialog: false,
    setShowFeedbackContentDialog: () => {},
    submitFeedbackContent: async () => {}
})

// ====================== Context Hook =====================================
export function useAnswers() {
    const context = useContext(AnswersContext)

    return {
        ...context
    }
}

// ====================== Context Provider ===================================
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
    sidekicks,
    user,
    appSettings,
    children,
    prompts,
    useStreaming: initialUseStreaming = true,
    apiUrl = '/api'
}: AnswersProviderProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState('')
    const [allowedUploads, setAllowedUploads] = useState<AllowedUploads>({
        fileUploadSizeAndTypes: [],
        imgUploadSizeAndTypes: [],
        isImageUploadAllowed: false,
        isRAGFileUploadAllowed: false,
        isSpeechToTextEnabled: false
    })

    const [previews, setPreviews] = useState<FileUpload[]>([])
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isDragActive, setIsDragActive] = useState(false)
    const fileUploadRef = useRef<HTMLInputElement>(null)

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

    const [sidekick, setSidekick] = useState<SidekickListItem | undefined>(
        sidekicks?.find((s) => s.id === chat?.messages?.[chat?.messages?.length - 1]?.chatflowid || s.id === chat?.chatflowId)
    )
    const chatbotConfig = React.useMemo(() => sidekick?.chatbotConfig, [sidekick])
    const flowData = React.useMemo(() => sidekick?.flowData, [sidekick])
    const [messages, setMessages] = useState<Array<Message>>(chat?.messages ?? [])
    const [filters, setFilters] = useState<AnswersFilters>(deepmerge({}, appSettings?.filters, journey?.filters, chat?.filters))

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

    const regenerateAnswer = (retry?: boolean) => {
        if (!messages || messages.length === 0) return

        const [message] = messages.filter((m) => m.role === 'user').slice(-1) ?? []
        if (!message) return

        const fileUploads = message?.fileUploads || []

        sendMessage({
            content: message.content || '',
            retry: true,
            sidekick,
            gptModel,
            files: fileUploads
        })
    }

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

            setMessages((prevMessages) => {
                const allMessages = [...cloneDeep(prevMessages)]
                return allMessages.map((message) => {
                    if (message.id === messageId) {
                        return {
                            ...message,
                            feedback: { rating }
                        }
                    }
                    return message
                })
            })

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
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1]?.role === 'user') return allMessages
            allMessages[allMessages.length - 1].content += text
            return allMessages
        })
    }

    const updateLastMessageSourceDocuments = (sourceDocuments: any) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            allMessages[allMessages.length - 1].sourceDocuments = sourceDocuments
            return allMessages
        })
    }

    const updateLastMessageUsedTools = (usedTools: any) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            allMessages[allMessages.length - 1].usedTools = usedTools
            return allMessages
        })
    }

    const updateLastMessageFileAnnotations = (fileAnnotations: any) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            allMessages[allMessages.length - 1].fileAnnotations = fileAnnotations
            return allMessages
        })
    }

    const updateLastMessageAgentReasoning = (agentReasoning: any) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            allMessages[allMessages.length - 1].agentReasoning = agentReasoning
            return allMessages
        })
    }

    const updateLastMessageAction = (action: any) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            allMessages[allMessages.length - 1].action = action
            return allMessages
        })
    }

    const updateLastMessageNextAgent = (nextAgent: any) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            const lastAgentReasoning = allMessages[allMessages.length - 1].agentReasoning
            if (lastAgentReasoning && lastAgentReasoning.length > 0) {
                lastAgentReasoning.push({ nextAgent })
            }
            allMessages[allMessages.length - 1].agentReasoning = lastAgentReasoning
            return allMessages
        })
    }

    const updateLastMessageArtifacts = (artifacts: any) => {
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            allMessages[allMessages.length - 1].artifacts = artifacts
            return allMessages
        })
    }

    const abortMessage = () => {
        setIsMessageStopping(false)
        setMessages((prevMessages) => {
            let allMessages = [...cloneDeep(prevMessages)]
            if (allMessages[allMessages.length - 1].role === 'user') return allMessages
            const lastAgentReasoning = allMessages[allMessages.length - 1].agentReasoning
            if (lastAgentReasoning && lastAgentReasoning.length > 0) {
                allMessages[allMessages.length - 1].agentReasoning = lastAgentReasoning.filter(
                    (reasoning: { nextAgent?: any }) => !reasoning.nextAgent
                )
            }
            return allMessages
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

    const handleFileUploads = async (uploads: any[]) => {
        if (!uploadedFiles.length) return uploads

        if (chatbotConfig?.fullFileUpload?.status) {
            const filesWithFullUploadType = uploadedFiles.filter((file) => file.type === 'file:full')
            if (filesWithFullUploadType.length > 0) {
                const formData = new FormData()
                for (const file of filesWithFullUploadType) {
                    formData.append('files', file.file)
                }
                formData.append('chatId', chatId || '')

                try {
                    const response = await attachmentsApi.createAttachment(sidekick?.id!, chatId!, formData)
                    const data = response.data

                    for (const extractedFileData of data) {
                        const content = extractedFileData.content
                        const fileName = extractedFileData.name

                        // matching name in uploads to replace data with content
                        const uploadIndex = uploads.findIndex((upload) => upload.name === fileName)

                        if (uploadIndex !== -1) {
                            uploads[uploadIndex] = {
                                ...uploads[uploadIndex],
                                data: content,
                                name: fileName,
                                type: 'file:full'
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error creating attachment:', error)
                    throw new Error('Unable to upload documents')
                }
            }
        } else if (allowedUploads.isRAGFileUploadAllowed) {
            const filesWithRAGUploadType = uploadedFiles.filter((file) => file.type === 'file:rag')

            if (filesWithRAGUploadType.length > 0) {
                const formData = new FormData()
                for (const file of filesWithRAGUploadType) {
                    formData.append('files', file.file)
                }
                formData.append('chatId', chatId || '')

                try {
                    await vectorstoreApi.upsertVectorStoreWithFormData(sidekick?.id!, formData)

                    // Delay for vector store to be updated
                    await new Promise((resolve) => setTimeout(resolve, 2500))

                    uploads = uploads.map((upload) => {
                        return {
                            ...upload,
                            type: 'file:rag'
                        }
                    })
                } catch (error) {
                    console.error('Error upserting vector store:', error)
                    throw new Error('Unable to upload documents')
                }
            }
        }
        return uploads
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        if (!allowedUploads.isImageUploadAllowed && !(allowedUploads.isRAGFileUploadAllowed || chatbotConfig?.fullFileUpload?.status)) {
            return
        }
        e.preventDefault()
        setIsDragActive(false)
        let files: Promise<FileUpload>[] = []
        let uploadedFiles: UploadedFile[] = []

        if (e.dataTransfer.files.length > 0) {
            for (const file of Array.from(e.dataTransfer.files)) {
                if (isFileAllowedForUpload(file, allowedUploads, chatbotConfig?.fullFileUpload?.status) === false) {
                    return
                }
                // Only add files
                if (!file.type || !allowedUploads.imgUploadSizeAndTypes.some((allowed) => allowed.fileTypes.includes(file.type))) {
                    uploadedFiles.push({
                        file,
                        type: chatbotConfig?.fullFileUpload?.status ? 'file:full' : 'file:rag'
                    })
                }

                const reader = new FileReader()
                const { name } = file
                files.push(
                    new Promise<FileUpload>((resolve) => {
                        reader.onload = (evt: ProgressEvent<FileReader>) => {
                            if (!evt?.target?.result) {
                                return
                            }
                            const { result } = evt.target
                            let previewUrl: string
                            if (file.type && file.type.startsWith('audio/')) {
                                previewUrl = ''
                            } else {
                                previewUrl = URL.createObjectURL(file)
                            }
                            resolve({
                                data: result as string,
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
            setUploadedFiles(uploadedFiles)
            setPreviews((prevPreviews: FileUpload[]) => [...prevPreviews, ...newFiles])
        }

        if (e.dataTransfer.items) {
            Array.from(e.dataTransfer.items).forEach((item) => {
                if (item.kind === 'string' && item.type.match('^text/uri-list')) {
                    item.getAsString((s: string) => {
                        const upload: FileUpload = {
                            data: s,
                            preview: s,
                            type: 'url',
                            name: s ? s.substring(s.lastIndexOf('/') + 1) : '',
                            mime: 'text/uri-list'
                        }
                        setPreviews((prevPreviews) => [...prevPreviews, upload])
                    })
                } else if (item.kind === 'string' && item.type.match('^text/html')) {
                    item.getAsString((s: string) => {
                        if (s.indexOf('href') === -1) return
                        const start = s ? s.substring(s.indexOf('href') + 6) : ''
                        const hrefStr = start.substring(0, start.indexOf('"'))

                        const upload: FileUpload = {
                            data: hrefStr,
                            preview: hrefStr,
                            type: 'url',
                            name: hrefStr ? hrefStr.substring(hrefStr.lastIndexOf('/') + 1) : '',
                            mime: 'text/html'
                        }
                        setPreviews((prevPreviews) => [...prevPreviews, upload])
                    })
                }
            })
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

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return
        }

        const files: Promise<FileUpload>[] = []
        const uploaded: UploadedFile[] = []

        for (const file of Array.from(event.target.files)) {
            if (isFileAllowedForUpload(file, allowedUploads, chatbotConfig?.fullFileUpload?.status) === false) {
                return
            }
            // Only add files
            if (!file.type || !allowedUploads.imgUploadSizeAndTypes.some((allowed) => allowed.fileTypes.includes(file.type))) {
                uploaded.push({
                    file,
                    type: chatbotConfig?.fullFileUpload?.status ? 'file:full' : 'file:rag'
                })
            }

            const reader = new FileReader()
            const { name } = file
            files.push(
                new Promise<FileUpload>((resolve) => {
                    reader.onload = (evt: ProgressEvent<FileReader>) => {
                        if (!evt?.target?.result) {
                            return
                        }
                        const { result } = evt.target
                        resolve({
                            data: result as string,
                            preview: URL.createObjectURL(file),
                            type: 'file',
                            name: name,
                            mime: file.type || ''
                        })
                    }
                    reader.readAsDataURL(file)
                })
            )
        }

        const newFiles = await Promise.all(files)
        setUploadedFiles(uploaded)
        setPreviews((prevPreviews: FileUpload[]) => [...prevPreviews, ...newFiles])
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

    const handleDeletePreview = (index: number) => {
        const itemToDelete = previews[index]
        if (itemToDelete.type === 'file' && itemToDelete.preview) {
            URL.revokeObjectURL(itemToDelete.preview)
        }
        setPreviews(previews.filter((_, i) => i !== index))
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
            let fileUploads = files ?? (previews.length > 0 ? prepareFilesForAPI(previews) : undefined)

            if (!retry) {
                addMessage({ role: 'user', content, fileUploads } as Message)
            }
            setError(null)
            setIsLoading(true)

            try {
                if (fileUploads && fileUploads.length > 0) {
                    try {
                        fileUploads = await handleFileUploads(fileUploads)
                    } catch (error: any) {
                        setError(error.message || 'Error uploading files')
                        setIsLoading(false)
                        setMessages((prevMessages) => [
                            ...prevMessages,
                            { role: 'assistant', content: error.message || 'Error uploading files' } as Message
                        ])
                        return
                    }
                }

                const params = {
                    question: content,
                    chatId,
                    journeyId,
                    uploads: fileUploads,
                    audio,
                    socketIOClientId: isChatFlowAvailableToStream ? socketIOClientId : undefined,
                    chatType: 'ANSWERAI',
                    streaming: isChatFlowAvailableToStream,
                    action
                }

                if (isChatFlowAvailableToStream) {
                    // Use fetchEventSource for streaming
                    fetchResponseFromEventStream(sidekick?.id!, params)
                } else {
                    const response = await predictionApi.sendMessageAndGetPrediction(sidekick?.id!, params)
                    const data = response.data
                    setMessages((prevMessages) => {
                        let allMessages = [...cloneDeep(prevMessages)]
                        if (allMessages[allMessages.length - 1].type === 'apiMessage') {
                            allMessages[allMessages.length - 1].id = data?.chatMessageId
                        }
                        return allMessages
                    })
                    setChatId(data.chatId)

                    if (content === '' && data.question) {
                        // the response contains the question even if it was in an audio format
                        // so if input is empty but the response contains the question, update the user message to show the question
                        setMessages((prevMessages) => {
                            let allMessages = [...cloneDeep(prevMessages)]
                            if (allMessages[allMessages.length - 2].type === 'apiMessage') return allMessages
                            allMessages[allMessages.length - 2].content = data.question
                            return allMessages
                        })
                    }

                    let text = ''
                    if (data.text) text = data.text
                    else if (data.json) text = '```json\n' + JSON.stringify(data.json, null, 2)
                    else text = JSON.stringify(data, null, 2)

                    setMessages((prevMessages) => [
                        ...prevMessages,
                        {
                            role: 'assistant',
                            content: text,
                            id: data?.chatMessageId,
                            sourceDocuments: data?.sourceDocuments,
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

                if (fileUploads && fileUploads.length > 0) {
                    clearPreviews()
                }
            } catch (err: any) {
                const errorMessage = err.response?.data?.message || 'Error sending message'
                setError(errorMessage)
                setIsLoading(false)
                setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: errorMessage } as Message])
            }
        },
        [
            addMessage,
            chatId,
            journeyId,
            messages,
            isChatFlowAvailableToStream,
            setInputValue,
            setMessages,
            setChatId,
            setJourneyId,
            clearPreviews
        ]
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
                { role: 'assistant', content: '', isLoading: true, chatflowid: chatflowid, type: 'apiMessage' } as Message
            ])

            // Add retry logic for better reliability
            let retries = 0
            const maxRetries = 3

            const attemptFetch = async () => {
                try {
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
                                console.log('Connection established successfully')
                            } else {
                                throw new Error(`Failed to establish connection: ${response.status} ${response.statusText}`)
                            }
                        },
                        async onmessage(ev) {
                            const payload = JSON.parse(ev.data)
                            console.log('Event stream payload:', payload)

                            switch (payload.event) {
                                case 'start':
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
                                case 'metadata':
                                    if (payload.data.chatId) {
                                        setChatId(payload.data.chatId)
                                    }
                                    break
                                case 'error':
                                    setError(payload.data)

                                    setMessages((prevMessages) => {
                                        const allMessages = [...cloneDeep(prevMessages)]
                                        const lastMessage = allMessages[allMessages.length - 1]
                                        if (lastMessage?.role === 'user') return allMessages
                                        lastMessage.content = `Error: ${payload.data}`
                                        lastMessage.isLoading = false
                                        return allMessages
                                    })
                                    break
                                case 'abort':
                                    abortMessage()
                                    break
                                case 'end':
                                    setMessages((prevMessages) => {
                                        const allMessages = [...cloneDeep(prevMessages)]
                                        const lastMessage = allMessages[allMessages.length - 1]
                                        if (lastMessage?.role === 'user') return allMessages
                                        lastMessage.isLoading = false
                                        return allMessages
                                    })
                                    setIsLoading(false)
                                    break
                            }
                        },
                        async onclose() {
                            // Clean up on close
                            setIsLoading(false)
                        },
                        onerror(err) {
                            console.error('EventSource Error:', err)

                            if (retries < maxRetries) {
                                console.log(`Retry attempt ${retries + 1} of ${maxRetries}`)
                                retries++
                                setTimeout(attemptFetch, 1000 * retries)
                                return
                            }

                            setError('Error during streaming - connection failed')
                            setIsLoading(false)

                            // Update the message to show error
                            setMessages((prevMessages) => {
                                const allMessages = [...cloneDeep(prevMessages)]
                                const lastMessage = allMessages[allMessages.length - 1]
                                if (lastMessage?.role === 'user') return allMessages
                                lastMessage.content = `Error: Connection failed after multiple attempts`
                                lastMessage.isLoading = false
                                return allMessages
                            })
                        }
                    })
                } catch (error) {
                    if (retries < maxRetries) {
                        console.log(`Retry attempt ${retries + 1} of ${maxRetries} after error`)
                        retries++
                        setTimeout(attemptFetch, 1000 * retries)
                    } else {
                        throw error // Re-throw if we've exhausted retries
                    }
                }
            }

            await attemptFetch()
        } catch (error: any) {
            console.error('Stream error:', error)
            setError(error.message || 'Error during streaming')
            setIsLoading(false)

            // Update the last message to show the error
            setMessages((prevMessages) => {
                const allMessages = [...cloneDeep(prevMessages)]
                const lastMessage = allMessages[allMessages.length - 1]
                if (lastMessage?.role === 'user') {
                    allMessages.push({ role: 'assistant', content: `Error: ${error.message || 'Connection failed'}` } as Message)
                } else {
                    lastMessage.content = `Error: ${error.message || 'Connection failed'}`
                    lastMessage.isLoading = false
                }
                return allMessages
            })
        }
    }

    // Replace Socket.IO effect with event source availability check
    useEffect(() => {
        // Check if streaming is available for this chatflow
        if (sidekick?.id) {
            const checkStreamingAvailability = async () => {
                try {
                    // You might need to implement this method in your API to check if streaming is available
                    const streamable = await predictionApi.checkIfChatflowIsValidForStreaming(sidekick.id)
                    setIsChatFlowAvailableToStream(streamable?.isStreaming || false)
                } catch (error) {
                    console.error('Error checking streaming availability:', error)
                    setIsChatFlowAvailableToStream(false)
                }
            }

            const checkUploadCapabilities = async () => {
                try {
                    const response = await chatflowApi.getAllowChatflowUploads(sidekick.id)
                    const uploadCapabilities = response.data
                    console.log('UPLOAD CAPABILITIES =====', uploadCapabilities)
                    setAllowedUploads(uploadCapabilities)
                } catch (error) {
                    console.error('Error checking upload capabilities:', error)
                    setAllowedUploads({
                        fileUploadSizeAndTypes: [],
                        imgUploadSizeAndTypes: [],
                        isImageUploadAllowed: false,
                        isRAGFileUploadAllowed: false,
                        isSpeechToTextEnabled: false
                    })
                }
            }

            checkUploadCapabilities()
            checkStreamingAvailability()
        }

        return () => {
            // Clean up if needed
        }
    }, [sidekick?.id])

    React.useEffect(() => {
        setJourney(initialJourney)
        setFilters(deepmerge({}, initialJourney?.filters, chat?.filters))
    }, [chat, initialJourney, appSettings])

    const contextValue = {
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
        sidekick,
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
        handleDrop,
        handleDrag,
        handleFileChange,
        handleUploadClick,
        clearPreviews,
        fileUploadRef,
        handleDeletePreview,
        previews,
        allowedUploads,
        isDragActive,
        uploadedFiles,
        feedbackId,
        setFeedbackId,
        showFeedbackContentDialog,
        setShowFeedbackContentDialog,
        submitFeedbackContent
    }
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
