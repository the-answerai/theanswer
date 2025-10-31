export interface FileUpload {
    data: string
    preview: string
    type: 'file' | 'url' | 'audio'
    name: string
    mime?: string
    duration?: number
    isQuestion?: boolean
}

export interface Artifact {
    type: 'png' | 'jpeg' | 'html' | 'markdown' | 'csv' | 'json' | string
    name: string
    data: string
}

export interface AgentReasoning {
    agentName?: string
    nodeName?: string
    instructions?: string
    messages?: any[]
    usedTools?: any[]
    artifacts?: Artifact[]
    nextAgent?: string
    sourceDocuments?: any[]
    state?: any
}

export interface AgentFlowExecutionNode {
    nodeId: string
    nodeLabel: string
    status: 'FINISHED' | 'ERROR' | 'INPROGRESS' | 'STOPPED' | 'TERMINATED' | 'TIMEOUT'
    data: any
    previousNodeIds: string[]
    iterationIndex?: number
    iterationContext?: any
    parentNodeId?: string
}

export interface UsageMetadata {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    input_token_details?: {
        cached?: number
        text?: number
        audio?: number
    }
    output_token_details?: {
        text?: number
        reasoning?: number
    }
}

export interface Message {
    role: 'user' | 'assistant'
    content: string
    id?: string
    sourceDocuments?: any[]
    usedTools?: any[]
    fileAnnotations?: any[]
    agentReasoning?: AgentReasoning[]
    artifacts?: Artifact[]
    agentFlowExecutedData?: AgentFlowExecutionNode[]
    usageMetadata?: UsageMetadata
    calledTools?: any[]
    action?: any
    isLoading?: boolean
    fileUploads?: FileUpload[] | string
    chat?: any
    chatflowid?: string
    picture?: string
}

export interface ChatbotConfig {
    starterPrompts?: any[]
    displayMode?: string
    embeddedUrl?: string
    textInput?: {
        placeholder?: string
    }
}

export interface FlowData {
    nodes: any[]
    edges: any[]
}

export interface SendMessageParams {
    content: string
    sidekick?: SidekickListItem
    gptModel?: string
    retry?: boolean
    files?: FileUpload[]
    audio?: File | null
}

export interface DefaultPromptsProps {
    prompts?: any[]
    handleChange: (value: string) => void
    onPromptSelected: (value: string) => void
}

export interface SidekickListItem {
    id: string
    chatbotConfig?: ChatbotConfig
    flowData?: FlowData
}
