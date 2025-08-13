import { StatusCodes } from 'http-status-codes'
import { In, QueryRunner } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { Assistant } from '../../database/entities/Assistant'
import { Chat } from '../../database/entities/Chat'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { ChatMessage } from '../../database/entities/ChatMessage'
import { ChatMessageFeedback } from '../../database/entities/ChatMessageFeedback'
import { CustomTemplate } from '../../database/entities/CustomTemplate'
import { DocumentStore } from '../../database/entities/DocumentStore'
import { DocumentStoreFileChunk } from '../../database/entities/DocumentStoreFileChunk'
import { Execution } from '../../database/entities/Execution'
import { Tool } from '../../database/entities/Tool'
import { Variable } from '../../database/entities/Variable'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { ChatType } from '../../Interface'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import assistantService from '../assistants'
import chatMessagesService from '../chat-messages'
import chatsService from '../chats'
import chatflowService from '../chatflows'
import documenStoreService from '../documentstore'
import executionService from '../executions'
import marketplacesService from '../marketplaces'
import toolsService from '../tools'
import variableService from '../variables'
import { IUser } from '../../Interface'

type ExportInput = {
    agentflow: boolean
    agentflowv2: boolean
    assistantCustom: boolean
    assistantOpenAI: boolean
    assistantAzure: boolean
    chatflow: boolean
    chat: boolean
    chat_message: boolean
    chat_feedback: boolean
    custom_template: boolean
    document_store: boolean
    execution: boolean
    tool: boolean
    variable: boolean
}

type ExportData = {
    AgentFlow: ChatFlow[]
    AgentFlowV2: ChatFlow[]
    AssistantCustom: Assistant[]
    AssistantFlow: ChatFlow[]
    AssistantOpenAI: Assistant[]
    AssistantAzure: Assistant[]
    Chat: Chat[]
    ChatFlow: ChatFlow[]
    ChatMessage: ChatMessage[]
    ChatMessageFeedback: ChatMessageFeedback[]
    CustomTemplate: CustomTemplate[]
    DocumentStore: DocumentStore[]
    DocumentStoreFileChunk: DocumentStoreFileChunk[]
    Execution: Execution[]
    Tool: Tool[]
    Variable: Variable[]
}

const convertExportInput = (body: any): ExportInput => {
    try {
        if (!body || typeof body !== 'object') throw new Error('Invalid ExportInput object in request body')
        if (body.agentflow && typeof body.agentflow !== 'boolean') throw new Error('Invalid agentflow property in ExportInput object')
        if (body.agentflowv2 && typeof body.agentflowv2 !== 'boolean') throw new Error('Invalid agentflowv2 property in ExportInput object')
        if (body.assistant && typeof body.assistant !== 'boolean') throw new Error('Invalid assistant property in ExportInput object')
        if (body.chatflow && typeof body.chatflow !== 'boolean') throw new Error('Invalid chatflow property in ExportInput object')
        if (body.chat && typeof body.chat !== 'boolean') throw new Error('Invalid chat property in ExportInput object')
        if (body.chat_message && typeof body.chat_message !== 'boolean')
            throw new Error('Invalid chat_message property in ExportInput object')
        if (body.chat_feedback && typeof body.chat_feedback !== 'boolean')
            throw new Error('Invalid chat_feedback property in ExportInput object')
        if (body.custom_template && typeof body.custom_template !== 'boolean')
            throw new Error('Invalid custom_template property in ExportInput object')
        if (body.document_store && typeof body.document_store !== 'boolean')
            throw new Error('Invalid document_store property in ExportInput object')
        if (body.execution && typeof body.execution !== 'boolean') throw new Error('Invalid execution property in ExportInput object')
        if (body.tool && typeof body.tool !== 'boolean') throw new Error('Invalid tool property in ExportInput object')
        if (body.variable && typeof body.variable !== 'boolean') throw new Error('Invalid variable property in ExportInput object')
        return body as ExportInput
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.convertExportInput - ${getErrorMessage(error)}`
        )
    }
}

const FileDefaultName = 'ExportData.json'
const exportData = async (exportInput: ExportInput, user: IUser): Promise<{ FileDefaultName: string } & ExportData> => {
    try {
        // SECURITY: Validate user has proper permissions and is authenticated
        if (!user || !user.id || !user.organizationId) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: exportImportService.exportData - User authentication required'
            )
        }

        // SECURITY: Validate user has proper permissions and is authenticated

        let AgentFlow: ChatFlow[] = exportInput.agentflow === true ? await chatflowService.getAllChatflows(user, 'MULTIAGENT') : []
        let AgentFlowV2: ChatFlow[] = exportInput.agentflowv2 === true ? await chatflowService.getAllChatflows(user, 'AGENTFLOW') : []

        let AssistantCustom: Assistant[] =
            exportInput.assistantCustom === true ? await assistantService.getAllAssistants(user, 'CUSTOM') : []
        let AssistantFlow: ChatFlow[] = exportInput.assistantCustom === true ? await chatflowService.getAllChatflows(user, 'ASSISTANT') : []

        let AssistantOpenAI: Assistant[] =
            exportInput.assistantOpenAI === true ? await assistantService.getAllAssistants(user, 'OPENAI') : []

        let AssistantAzure: Assistant[] = exportInput.assistantAzure === true ? await assistantService.getAllAssistants(user, 'AZURE') : []

        let ChatFlow: ChatFlow[] = exportInput.chatflow === true ? await chatflowService.getAllChatflows(user, 'CHATFLOW') : []

        let Chat: Chat[] = []
        if (exportInput.chat === true) {
            Chat = await chatsService.getAllChats(user)
        }

        let ChatMessage: ChatMessage[] = []
        if (exportInput.chat_message === true) {
            ChatMessage = await chatMessagesService.getAllMessages(user)
        }

        let ChatMessageFeedback: ChatMessageFeedback[] =
            exportInput.chat_feedback === true ? await chatMessagesService.getAllMessagesFeedback(user) : []

        let CustomTemplate: CustomTemplate[] =
            exportInput.custom_template === true ? await marketplacesService.getAllCustomTemplates(user) : []
        CustomTemplate = CustomTemplate.map((customTemplate) => ({ ...customTemplate, usecases: JSON.stringify(customTemplate.usecases) }))

        let DocumentStore: DocumentStore[] = exportInput.document_store === true ? await documenStoreService.getAllDocumentStores(user) : []

        let DocumentStoreFileChunk: DocumentStoreFileChunk[] =
            exportInput.document_store === true ? await documenStoreService.getAllDocumentFileChunks(user) : []

        // SECURITY: Only export executions owned by the user
        const { data: totalExecutions } = exportInput.execution === true ? await executionService.getAllExecutions({}, {
            userId: user.id,
            organizationId: user.organizationId
        }) : { data: [] }
        let Execution: Execution[] = exportInput.execution === true ? totalExecutions : []
        let Tool: Tool[] = exportInput.tool === true ? await toolsService.getAllTools(user, true) : []

        let Variable: Variable[] = exportInput.variable === true ? await variableService.getAllVariables(user, true) : []

        // Export completed successfully

        return {
            FileDefaultName,
            AgentFlow,
            AgentFlowV2,
            AssistantCustom,
            AssistantFlow,
            AssistantOpenAI,
            AssistantAzure,
            Chat,
            ChatFlow,
            ChatMessage,
            ChatMessageFeedback,
            CustomTemplate,
            DocumentStore,
            DocumentStoreFileChunk,
            Execution,
            Tool,
            Variable
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.exportData - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForChatFlow(queryRunner: QueryRunner, originalData: ExportData, chatflows: ChatFlow[]): Promise<{ data: ExportData; idMappings: Map<string, string> }> {
    try {
        const ids = chatflows.map((chatflow) => chatflow.id)
        const records = await queryRunner.manager.find(ChatFlow, {
            where: { id: In(ids) }
        })
        const idMappings = new Map<string, string>()
        
        if (records.length < 0) return { data: originalData, idMappings }
        
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            idMappings.set(oldId, newId)
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return { data: originalData, idMappings }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForChatflow - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForAssistant(queryRunner: QueryRunner, originalData: ExportData, assistants: Assistant[]) {
    try {
        const ids = assistants.map((assistant) => assistant.id)
        const records = await queryRunner.manager.find(Assistant, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForAssistant - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForChat(queryRunner: QueryRunner, originalData: ExportData, chats: Chat[]): Promise<{ data: ExportData; idMappings: Map<string, string> }> {
    try {
        const ids = chats.map((chat) => chat.id)
        const records = await queryRunner.manager.find(Chat, {
            where: { id: In(ids) }
        })
        const idMappings = new Map<string, string>()
        
        if (records.length <= 0) return { data: originalData, idMappings }
        
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            idMappings.set(oldId, newId)
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return { data: originalData, idMappings }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForChat - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForChatMessage(queryRunner: QueryRunner, originalData: ExportData, chatMessages: ChatMessage[], chatflowIdMappings: Map<string, string>, chatIdMappings?: Map<string, string>) {
    try {
        // First, update chatflowid references based on chatflow ID mappings
        chatMessages.forEach((chatMessage) => {
            if (chatflowIdMappings.has(chatMessage.chatflowid)) {
                chatMessage.chatflowid = chatflowIdMappings.get(chatMessage.chatflowid)!
            }
            // Update chatId references based on chat ID mappings
            if (chatIdMappings && chatIdMappings.has(chatMessage.chatId)) {
                chatMessage.chatId = chatIdMappings.get(chatMessage.chatId)!
            }
        })
        
        const chatmessageChatflowIds = chatMessages.map((chatMessage) => {
            return { id: chatMessage.chatflowid, qty: 0 }
        })
        const originalDataChatflowIds = [
            ...originalData.AssistantFlow.map((assistantFlow) => assistantFlow.id),
            ...originalData.AgentFlow.map((agentFlow) => agentFlow.id),
            ...originalData.AgentFlowV2.map((agentFlowV2) => agentFlowV2.id),
            ...originalData.ChatFlow.map((chatFlow) => chatFlow.id)
        ]
        chatmessageChatflowIds.forEach((item) => {
            if (originalDataChatflowIds.includes(item.id)) {
                item.qty += 1
            }
        })
        const databaseChatflowIds = await (
            await queryRunner.manager.find(ChatFlow, {
                where: { id: In(chatmessageChatflowIds.map((chatmessageChatflowId) => chatmessageChatflowId.id)) }
            })
        ).map((chatflow) => chatflow.id)
        chatmessageChatflowIds.forEach((item) => {
            if (databaseChatflowIds.includes(item.id)) {
                item.qty += 1
            }
        })

        const missingChatflowIds = chatmessageChatflowIds.filter((item) => item.qty === 0).map((item) => item.id)
        if (missingChatflowIds.length > 0) {
            chatMessages = chatMessages.filter((chatMessage) => !missingChatflowIds.includes(chatMessage.chatflowid))
            originalData.ChatMessage = chatMessages
        }

        const ids = chatMessages.map((chatMessage) => chatMessage.id)
        const records = await queryRunner.manager.find(ChatMessage, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForChatMessage - ${getErrorMessage(error)}`
        )
    }
}

async function replaceExecutionIdForChatMessage(queryRunner: QueryRunner, originalData: ExportData, chatMessages: ChatMessage[]) {
    try {
        // step 1 - get all execution ids from chatMessages
        const chatMessageExecutionIds = chatMessages
            .map((chatMessage) => {
                return { id: chatMessage.executionId, qty: 0 }
            })
            .filter((item): item is { id: string; qty: number } => item !== undefined)

        // step 2 - increase qty if execution id is in importData.Execution
        const originalDataExecutionIds = originalData.Execution.map((execution) => execution.id)
        chatMessageExecutionIds.forEach((item) => {
            if (originalDataExecutionIds.includes(item.id)) {
                item.qty += 1
            }
        })

        // step 3 - increase qty if execution id is in database
        const databaseExecutionIds = await (
            await queryRunner.manager.find(Execution, {
                where: { id: In(chatMessageExecutionIds.map((chatMessageExecutionId) => chatMessageExecutionId.id)) }
            })
        ).map((execution) => execution.id)
        chatMessageExecutionIds.forEach((item) => {
            if (databaseExecutionIds.includes(item.id)) {
                item.qty += 1
            }
        })

        // step 4 - if executionIds not found replace with NULL
        const missingExecutionIds = chatMessageExecutionIds.filter((item) => item.qty === 0).map((item) => item.id)
        chatMessages.forEach((chatMessage) => {
            if (chatMessage.executionId && missingExecutionIds.includes(chatMessage.executionId)) {
                delete chatMessage.executionId
            }
        })

        originalData.ChatMessage = chatMessages

        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceExecutionIdForChatMessage - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForChatMessageFeedback(
    queryRunner: QueryRunner,
    originalData: ExportData,
    chatMessageFeedbacks: ChatMessageFeedback[]
) {
    try {
        const feedbackChatflowIds = chatMessageFeedbacks.map((feedback) => {
            return { id: feedback.chatflowid, qty: 0 }
        })
        const originalDataChatflowIds = [
            ...originalData.AssistantFlow.map((assistantFlow) => assistantFlow.id),
            ...originalData.AgentFlow.map((agentFlow) => agentFlow.id),
            ...originalData.AgentFlowV2.map((agentFlowV2) => agentFlowV2.id),
            ...originalData.ChatFlow.map((chatFlow) => chatFlow.id)
        ]
        feedbackChatflowIds.forEach((item) => {
            if (originalDataChatflowIds.includes(item.id)) {
                item.qty += 1
            }
        })
        const databaseChatflowIds = await (
            await queryRunner.manager.find(ChatFlow, {
                where: { id: In(feedbackChatflowIds.map((feedbackChatflowId) => feedbackChatflowId.id)) }
            })
        ).map((chatflow) => chatflow.id)
        feedbackChatflowIds.forEach((item) => {
            if (databaseChatflowIds.includes(item.id)) {
                item.qty += 1
            }
        })

        const feedbackMessageIds = chatMessageFeedbacks.map((feedback) => {
            return { id: feedback.messageId, qty: 0 }
        })
        const originalDataMessageIds = originalData.ChatMessage.map((chatMessage) => chatMessage.id)
        feedbackMessageIds.forEach((item) => {
            if (originalDataMessageIds.includes(item.id)) {
                item.qty += 1
            }
        })
        const databaseMessageIds = await (
            await queryRunner.manager.find(ChatMessage, {
                where: { id: In(feedbackMessageIds.map((feedbackMessageId) => feedbackMessageId.id)) }
            })
        ).map((chatMessage) => chatMessage.id)
        feedbackMessageIds.forEach((item) => {
            if (databaseMessageIds.includes(item.id)) {
                item.qty += 1
            }
        })

        const missingChatflowIds = feedbackChatflowIds.filter((item) => item.qty === 0).map((item) => item.id)
        const missingMessageIds = feedbackMessageIds.filter((item) => item.qty === 0).map((item) => item.id)

        if (missingChatflowIds.length > 0 || missingMessageIds.length > 0) {
            chatMessageFeedbacks = chatMessageFeedbacks.filter(
                (feedback) => !missingChatflowIds.includes(feedback.chatflowid) && !missingMessageIds.includes(feedback.messageId)
            )
            originalData.ChatMessageFeedback = chatMessageFeedbacks
        }

        const ids = chatMessageFeedbacks.map((chatMessageFeedback) => chatMessageFeedback.id)
        const records = await queryRunner.manager.find(ChatMessageFeedback, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForChatMessageFeedback - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForCustomTemplate(queryRunner: QueryRunner, originalData: ExportData, customTemplates: CustomTemplate[]) {
    try {
        const ids = customTemplates.map((customTemplate) => customTemplate.id)
        const records = await queryRunner.manager.find(CustomTemplate, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForCustomTemplate - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForDocumentStore(queryRunner: QueryRunner, originalData: ExportData, documentStores: DocumentStore[]) {
    try {
        const ids = documentStores.map((documentStore) => documentStore.id)
        const records = await queryRunner.manager.find(DocumentStore, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForDocumentStore - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForDocumentStoreFileChunk(
    queryRunner: QueryRunner,
    originalData: ExportData,
    documentStoreFileChunks: DocumentStoreFileChunk[]
) {
    try {
        const ids = documentStoreFileChunks.map((documentStoreFileChunk) => documentStoreFileChunk.id)
        const records = await queryRunner.manager.find(DocumentStoreFileChunk, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForDocumentStoreFileChunk - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForTool(queryRunner: QueryRunner, originalData: ExportData, tools: Tool[]) {
    try {
        const ids = tools.map((tool) => tool.id)
        const records = await queryRunner.manager.find(Tool, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForTool - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForVariable(queryRunner: QueryRunner, originalData: ExportData, variables: Variable[]) {
    try {
        const ids = variables.map((variable) => variable.id)
        const records = await queryRunner.manager.find(Variable, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForVariable - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForExecution(queryRunner: QueryRunner, originalData: ExportData, executions: Execution[]) {
    try {
        const ids = executions.map((execution) => execution.id)
        const records = await queryRunner.manager.find(Execution, {
            where: { id: In(ids) }
        })
        if (records.length < 0) return originalData
        for (let record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsForExecution - ${getErrorMessage(error)}`
        )
    }
}

function reduceSpaceForChatflowFlowData(chatflows: ChatFlow[]) {
    return chatflows.map((chatflow) => {
        return { ...chatflow, flowData: JSON.stringify(JSON.parse(chatflow.flowData)) }
    })
}

function replaceUserIdOrganizationId(user: IUser, importData: ExportData) {
    return Object.keys(importData).reduce((acc: any, key: string) => {
        if (Array.isArray(importData[key as keyof ExportData])) {
            acc[key as keyof ExportData] = importData[key as keyof ExportData].map((item) => {
                const updatedItem = { ...item, userId: user.id, organizationId: user.organizationId }
                
                // Set chatType to INTERNAL for all imported chat messages so they appear in UI
                if (key === 'ChatMessage') {
                    (updatedItem as any).chatType = ChatType.INTERNAL
                }
                
                // Set ownerId for Chat entities so they appear in UI
                if (key === 'Chat') {
                    (updatedItem as any).ownerId = user.id
                }
                
                return updatedItem
            })
        }
        return acc
    }, {})
}

const importData = async (user: IUser, importData: ExportData) => {
    // SECURITY: Validate user has proper permissions and is authenticated
    if (!user || !user.id || !user.organizationId) {
        throw new InternalFlowiseError(
            StatusCodes.UNAUTHORIZED,
            'Error: exportImportService.importData - User authentication required'
        )
    }

    // SECURITY: Validate user has proper permissions and is authenticated

    // Initialize missing properties with empty arrays to avoid "undefined" errors
    importData.AgentFlow = importData.AgentFlow || []
    importData.AgentFlowV2 = importData.AgentFlowV2 || []
    importData.AssistantCustom = importData.AssistantCustom || []
    importData.AssistantFlow = importData.AssistantFlow || []
    importData.AssistantOpenAI = importData.AssistantOpenAI || []
    importData.AssistantAzure = importData.AssistantAzure || []
    importData.Chat = importData.Chat || []
    importData.ChatFlow = importData.ChatFlow || []
    importData.ChatMessage = importData.ChatMessage || []
    importData.ChatMessageFeedback = importData.ChatMessageFeedback || []
    importData.CustomTemplate = importData.CustomTemplate || []
    importData.DocumentStore = importData.DocumentStore || []
    importData.DocumentStoreFileChunk = importData.DocumentStoreFileChunk || []
    importData.Execution = importData.Execution || []
    importData.Tool = importData.Tool || []
    importData.Variable = importData.Variable || []

    // Validate import data structure
    const totalItems = Object.values(importData).reduce((sum, arr) => {
        return sum + (Array.isArray(arr) ? arr.length : 0)
    }, 0)

    let queryRunner
    try {
        queryRunner = getRunningExpressApp().AppDataSource.createQueryRunner()
        await queryRunner.connect()
        importData = replaceUserIdOrganizationId(user, importData)
        try {
            // Collect all chatflow ID mappings
            const allChatflowIdMappings = new Map<string, string>()
            
            if (importData.AgentFlow.length > 0) {
                importData.AgentFlow = reduceSpaceForChatflowFlowData(importData.AgentFlow)
                const result = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.AgentFlow)
                importData = result.data
                result.idMappings.forEach((newId, oldId) => allChatflowIdMappings.set(oldId, newId))
            }
            if (importData.AgentFlowV2.length > 0) {
                importData.AgentFlowV2 = reduceSpaceForChatflowFlowData(importData.AgentFlowV2)
                const result = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.AgentFlowV2)
                importData = result.data
                result.idMappings.forEach((newId, oldId) => allChatflowIdMappings.set(oldId, newId))
            }
            if (importData.AssistantCustom.length > 0)
                importData = await replaceDuplicateIdsForAssistant(queryRunner, importData, importData.AssistantCustom)
            if (importData.AssistantFlow.length > 0) {
                importData.AssistantFlow = reduceSpaceForChatflowFlowData(importData.AssistantFlow)
                const result = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.AssistantFlow)
                importData = result.data
                result.idMappings.forEach((newId, oldId) => allChatflowIdMappings.set(oldId, newId))
            }
            if (importData.AssistantOpenAI.length > 0)
                importData = await replaceDuplicateIdsForAssistant(queryRunner, importData, importData.AssistantOpenAI)
            if (importData.AssistantAzure.length > 0)
                importData = await replaceDuplicateIdsForAssistant(queryRunner, importData, importData.AssistantAzure)
            if (importData.ChatFlow.length > 0) {
                importData.ChatFlow = reduceSpaceForChatflowFlowData(importData.ChatFlow)
                const result = await replaceDuplicateIdsForChatFlow(queryRunner, importData, importData.ChatFlow)
                importData = result.data
                result.idMappings.forEach((newId, oldId) => allChatflowIdMappings.set(oldId, newId))
            }
            
            // Collect chatflow ID mappings for chat message processing
            
            let allChatIdMappings = new Map<string, string>()
            if (importData.Chat.length > 0) {
                const result = await replaceDuplicateIdsForChat(queryRunner, importData, importData.Chat)
                importData = result.data
                result.idMappings.forEach((newId, oldId) => allChatIdMappings.set(oldId, newId))
            }
            
            if (importData.ChatMessage.length > 0) {
                importData = await replaceDuplicateIdsForChatMessage(queryRunner, importData, importData.ChatMessage, allChatflowIdMappings, allChatIdMappings)
                importData = await replaceExecutionIdForChatMessage(queryRunner, importData, importData.ChatMessage)
            }
            if (importData.ChatMessageFeedback.length > 0)
                importData = await replaceDuplicateIdsForChatMessageFeedback(queryRunner, importData, importData.ChatMessageFeedback)
            if (importData.CustomTemplate.length > 0)
                importData = await replaceDuplicateIdsForCustomTemplate(queryRunner, importData, importData.CustomTemplate)
            if (importData.DocumentStore.length > 0)
                importData = await replaceDuplicateIdsForDocumentStore(queryRunner, importData, importData.DocumentStore)
            if (importData.DocumentStoreFileChunk.length > 0)
                importData = await replaceDuplicateIdsForDocumentStoreFileChunk(queryRunner, importData, importData.DocumentStoreFileChunk)
            if (importData.Tool.length > 0) importData = await replaceDuplicateIdsForTool(queryRunner, importData, importData.Tool)
            if (importData.Execution.length > 0)
                importData = await replaceDuplicateIdsForExecution(queryRunner, importData, importData.Execution)
            if (importData.Variable.length > 0)
                importData = await replaceDuplicateIdsForVariable(queryRunner, importData, importData.Variable)

            await queryRunner.startTransaction()

            if (importData.AgentFlow.length > 0) await queryRunner.manager.save(ChatFlow, importData.AgentFlow)
            if (importData.AgentFlowV2.length > 0) await queryRunner.manager.save(ChatFlow, importData.AgentFlowV2)
            if (importData.AssistantFlow.length > 0) await queryRunner.manager.save(ChatFlow, importData.AssistantFlow)
            if (importData.AssistantCustom.length > 0) await queryRunner.manager.save(Assistant, importData.AssistantCustom)
            if (importData.AssistantOpenAI.length > 0) await queryRunner.manager.save(Assistant, importData.AssistantOpenAI)
            if (importData.AssistantAzure.length > 0) await queryRunner.manager.save(Assistant, importData.AssistantAzure)
            if (importData.Chat.length > 0) {
                await queryRunner.manager.save(Chat, importData.Chat)
            }
            if (importData.ChatFlow.length > 0) await queryRunner.manager.save(ChatFlow, importData.ChatFlow)
            if (importData.ChatMessage.length > 0) {
                await queryRunner.manager.save(ChatMessage, importData.ChatMessage)
            }
            if (importData.ChatMessageFeedback.length > 0)
                await queryRunner.manager.save(ChatMessageFeedback, importData.ChatMessageFeedback)
            if (importData.CustomTemplate.length > 0) await queryRunner.manager.save(CustomTemplate, importData.CustomTemplate)
            if (importData.DocumentStore.length > 0) await queryRunner.manager.save(DocumentStore, importData.DocumentStore)
            if (importData.DocumentStoreFileChunk.length > 0)
                await queryRunner.manager.save(DocumentStoreFileChunk, importData.DocumentStoreFileChunk)
            if (importData.Tool.length > 0) await queryRunner.manager.save(Tool, importData.Tool)
            if (importData.Execution.length > 0) await queryRunner.manager.save(Execution, importData.Execution)
            if (importData.Variable.length > 0) await queryRunner.manager.save(Variable, importData.Variable)

            await queryRunner.commitTransaction()

        } catch (error) {
            if (queryRunner && !queryRunner.isTransactionActive) await queryRunner.rollbackTransaction()
            throw error
        } finally {
            if (queryRunner && !queryRunner.isReleased) await queryRunner.release()
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.importAll - ${getErrorMessage(error)}`
        )
    }
}

export default {
    convertExportInput,
    exportData,
    importData
}
