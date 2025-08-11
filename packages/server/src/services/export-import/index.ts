import { StatusCodes } from 'http-status-codes'
import { EntityTarget, In, QueryRunner } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { Assistant } from '../../database/entities/Assistant'
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
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import assistantService from '../assistants'
import chatMessagesService from '../chat-messages'
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
        const owned = <T extends { userId?: string | null; organizationId?: string | null }>(items: T[]): T[] =>
            items.filter((item) => item.userId === user.id && item.organizationId === user.organizationId)

        let AgentFlow: ChatFlow[] = exportInput.agentflow === true ? owned(await chatflowService.getAllChatflows(user, 'MULTIAGENT')) : []
        let AgentFlowV2: ChatFlow[] =
            exportInput.agentflowv2 === true ? owned(await chatflowService.getAllChatflows(user, 'AGENTFLOW')) : []

        let AssistantCustom: Assistant[] =
            exportInput.assistantCustom === true ? owned(await assistantService.getAllAssistants(user, 'CUSTOM')) : []
        let AssistantFlow: ChatFlow[] =
            exportInput.assistantCustom === true ? owned(await chatflowService.getAllChatflows(user, 'ASSISTANT')) : []

        let AssistantOpenAI: Assistant[] =
            exportInput.assistantOpenAI === true ? owned(await assistantService.getAllAssistants(user, 'OPENAI')) : []

        let AssistantAzure: Assistant[] =
            exportInput.assistantAzure === true ? owned(await assistantService.getAllAssistants(user, 'AZURE')) : []

        let ChatFlow: ChatFlow[] = exportInput.chatflow === true ? owned(await chatflowService.getAllChatflows(user, 'CHATFLOW')) : []

        let ChatMessage: ChatMessage[] = exportInput.chat_message === true ? owned(await chatMessagesService.getAllMessages(user)) : []

        let ChatMessageFeedback: ChatMessageFeedback[] =
            exportInput.chat_feedback === true ? owned(await chatMessagesService.getAllMessagesFeedback(user)) : []

        let CustomTemplate: CustomTemplate[] =
            exportInput.custom_template === true ? owned(await marketplacesService.getAllCustomTemplates(user)) : []
        CustomTemplate = CustomTemplate.map((customTemplate) => ({
            ...customTemplate,
            usecases: JSON.stringify(customTemplate.usecases)
        }))

        let DocumentStore: DocumentStore[] =
            exportInput.document_store === true ? owned(await documenStoreService.getAllDocumentStores(user)) : []

        let DocumentStoreFileChunk: DocumentStoreFileChunk[] =
            exportInput.document_store === true ? owned(await documenStoreService.getAllDocumentFileChunks(user)) : []

        const { data: totalExecutions } = exportInput.execution === true ? await executionService.getAllExecutions(user) : { data: [] }
        let Execution: Execution[] = exportInput.execution === true ? owned(totalExecutions) : []
        let Tool: Tool[] = exportInput.tool === true ? owned(await toolsService.getAllTools(user)) : []

        let Variable: Variable[] = exportInput.variable === true ? owned(await variableService.getAllVariables(user)) : []

        return {
            FileDefaultName,
            AgentFlow,
            AgentFlowV2,
            AssistantCustom,
            AssistantFlow,
            AssistantOpenAI,
            AssistantAzure,
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

async function replaceDuplicateIds<T extends { id: string }>(
    queryRunner: QueryRunner,
    user: IUser,
    originalData: ExportData,
    items: T[],
    entity: EntityTarget<T>,
    entityName: string
) {
    try {
        const ids = items.map((item) => item.id)
        const records = await queryRunner.manager.find(entity, {
            where: { id: In(ids), userId: user.id, organizationId: user.organizationId }
        })
        if (records.length === 0) return originalData
        for (const record of records) {
            const oldId = record.id
            const newId = uuidv4()
            originalData = JSON.parse(JSON.stringify(originalData).replaceAll(oldId, newId))
        }
        return originalData
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: exportImportService.replaceDuplicateIdsFor${entityName} - ${getErrorMessage(error)}`
        )
    }
}

async function replaceDuplicateIdsForChatMessage(
    queryRunner: QueryRunner,
    user: IUser,
    originalData: ExportData,
    chatMessages: ChatMessage[]
) {
    try {
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
                where: {
                    id: In(chatmessageChatflowIds.map((chatmessageChatflowId) => chatmessageChatflowId.id)),
                    userId: user.id,
                    organizationId: user.organizationId
                }
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
            where: { id: In(ids), userId: user.id, organizationId: user.organizationId }
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

async function replaceExecutionIdForChatMessage(
    queryRunner: QueryRunner,
    user: IUser,
    originalData: ExportData,
    chatMessages: ChatMessage[]
) {
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
                where: {
                    id: In(chatMessageExecutionIds.map((chatMessageExecutionId) => chatMessageExecutionId.id)),
                    userId: user.id,
                    organizationId: user.organizationId
                }
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
    user: IUser,
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
                where: {
                    id: In(feedbackChatflowIds.map((feedbackChatflowId) => feedbackChatflowId.id)),
                    userId: user.id,
                    organizationId: user.organizationId
                }
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
                where: {
                    id: In(feedbackMessageIds.map((feedbackMessageId) => feedbackMessageId.id)),
                    userId: user.id,
                    organizationId: user.organizationId
                }
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
            where: { id: In(ids), userId: user.id, organizationId: user.organizationId }
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

function reduceSpaceForChatflowFlowData(chatflows: ChatFlow[]) {
    return chatflows.map((chatflow) => {
        return { ...chatflow, flowData: JSON.stringify(JSON.parse(chatflow.flowData)) }
    })
}

function replaceUserIdOrganizationId(user: IUser, importData: ExportData) {
    return Object.keys(importData).reduce((acc: any, key: string) => {
        if (Array.isArray(importData[key as keyof ExportData])) {
            acc[key as keyof ExportData] = importData[key as keyof ExportData].map((item) => {
                return { ...item, userId: user.id, organizationId: user.organizationId }
            })
        }
        return acc
    }, {})
}

const importData = async (user: IUser, importData: ExportData) => {
    // Initialize missing properties with empty arrays to avoid "undefined" errors
    importData.AgentFlow = importData.AgentFlow || []
    importData.AgentFlowV2 = importData.AgentFlowV2 || []
    importData.AssistantCustom = importData.AssistantCustom || []
    importData.AssistantFlow = importData.AssistantFlow || []
    importData.AssistantOpenAI = importData.AssistantOpenAI || []
    importData.AssistantAzure = importData.AssistantAzure || []
    importData.ChatFlow = importData.ChatFlow || []
    importData.ChatMessage = importData.ChatMessage || []
    importData.ChatMessageFeedback = importData.ChatMessageFeedback || []
    importData.CustomTemplate = importData.CustomTemplate || []
    importData.DocumentStore = importData.DocumentStore || []
    importData.DocumentStoreFileChunk = importData.DocumentStoreFileChunk || []
    importData.Execution = importData.Execution || []
    importData.Tool = importData.Tool || []
    importData.Variable = importData.Variable || []

    let queryRunner
    try {
        queryRunner = getRunningExpressApp().AppDataSource.createQueryRunner()
        await queryRunner.connect()
        importData = replaceUserIdOrganizationId(user, importData)
        try {
            if (importData.AgentFlow.length > 0) {
                importData.AgentFlow = reduceSpaceForChatflowFlowData(importData.AgentFlow)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.AgentFlow, ChatFlow, 'ChatFlow')
            }
            if (importData.AgentFlowV2.length > 0) {
                importData.AgentFlowV2 = reduceSpaceForChatflowFlowData(importData.AgentFlowV2)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.AgentFlowV2, ChatFlow, 'ChatFlow')
            }
            if (importData.AssistantCustom.length > 0)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.AssistantCustom, Assistant, 'Assistant')
            if (importData.AssistantFlow.length > 0) {
                importData.AssistantFlow = reduceSpaceForChatflowFlowData(importData.AssistantFlow)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.AssistantFlow, ChatFlow, 'ChatFlow')
            }
            if (importData.AssistantOpenAI.length > 0)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.AssistantOpenAI, Assistant, 'Assistant')
            if (importData.AssistantAzure.length > 0)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.AssistantAzure, Assistant, 'Assistant')
            if (importData.ChatFlow.length > 0) {
                importData.ChatFlow = reduceSpaceForChatflowFlowData(importData.ChatFlow)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.ChatFlow, ChatFlow, 'ChatFlow')
            }
            if (importData.ChatMessage.length > 0) {
                importData = await replaceDuplicateIdsForChatMessage(queryRunner, user, importData, importData.ChatMessage)
                importData = await replaceExecutionIdForChatMessage(queryRunner, user, importData, importData.ChatMessage)
            }
            if (importData.ChatMessageFeedback.length > 0)
                importData = await replaceDuplicateIdsForChatMessageFeedback(queryRunner, user, importData, importData.ChatMessageFeedback)
            if (importData.CustomTemplate.length > 0)
                importData = await replaceDuplicateIds(
                    queryRunner,
                    user,
                    importData,
                    importData.CustomTemplate,
                    CustomTemplate,
                    'CustomTemplate'
                )
            if (importData.DocumentStore.length > 0)
                importData = await replaceDuplicateIds(
                    queryRunner,
                    user,
                    importData,
                    importData.DocumentStore,
                    DocumentStore,
                    'DocumentStore'
                )
            if (importData.DocumentStoreFileChunk.length > 0)
                importData = await replaceDuplicateIds(
                    queryRunner,
                    user,
                    importData,
                    importData.DocumentStoreFileChunk,
                    DocumentStoreFileChunk,
                    'DocumentStoreFileChunk'
                )
            if (importData.Tool.length > 0)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.Tool, Tool, 'Tool')
            if (importData.Execution.length > 0)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.Execution, Execution, 'Execution')
            if (importData.Variable.length > 0)
                importData = await replaceDuplicateIds(queryRunner, user, importData, importData.Variable, Variable, 'Variable')

            await queryRunner.startTransaction()

            if (importData.AgentFlow.length > 0) await queryRunner.manager.save(ChatFlow, importData.AgentFlow)
            if (importData.AgentFlowV2.length > 0) await queryRunner.manager.save(ChatFlow, importData.AgentFlowV2)
            if (importData.AssistantFlow.length > 0) await queryRunner.manager.save(ChatFlow, importData.AssistantFlow)
            if (importData.AssistantCustom.length > 0) await queryRunner.manager.save(Assistant, importData.AssistantCustom)
            if (importData.AssistantOpenAI.length > 0) await queryRunner.manager.save(Assistant, importData.AssistantOpenAI)
            if (importData.AssistantAzure.length > 0) await queryRunner.manager.save(Assistant, importData.AssistantAzure)
            if (importData.ChatFlow.length > 0) await queryRunner.manager.save(ChatFlow, importData.ChatFlow)
            if (importData.ChatMessage.length > 0) await queryRunner.manager.save(ChatMessage, importData.ChatMessage)
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
