export interface Message {
    id?: string
    role: string
    content: string
    isLoading?: boolean
    sourceDocuments?: any[]
    usedTools?: any[]
    fileAnnotations?: any[]
    agentReasoning?: any[]
    action?: any
    fileUploads?: any[]
    feedback?: any
    type?: string
    chat?: any
}

export interface ChatbotConfig {
    starterPrompts?: any
    chatFeedback?: {
        status: boolean
    }
    fullFileUpload?: {
        status: boolean
    }
    chatLinksInNewTab?: {
        status: boolean
    }
    leads?: any
}

export interface FlowData {
    [key: string]: any
}

export interface UploadTypesAndSize {
    fileTypes: string[]
    maxUploadSize: number
}

export interface AllowedUploads {
    fileUploadSizeAndTypes: UploadTypesAndSize[] | []
    imgUploadSizeAndTypes: UploadTypesAndSize[] | []
    isImageUploadAllowed: boolean
    isRAGFileUploadAllowed: boolean
    isSpeechToTextEnabled: boolean
}

export interface FileUpload {
    data: string
    preview: string
    type: string
    name: string
    mime: string
}

export interface UploadedFile {
    file: File
    type: 'file:full' | 'file:rag'
}
