import { ICommonObject, removeFolderFromStorage } from 'flowise-components'
import { StatusCodes } from 'http-status-codes'
import { In } from 'typeorm'
import { ChatflowType, IReactFlowObject, IUser } from '../../Interface'
import { FLOWISE_COUNTER_STATUS, FLOWISE_METRIC_COUNTERS } from '../../Interface.Metrics'
import { UsageCacheManager } from '../../UsageCacheManager'
import { ChatFlow, ChatflowVisibility, EnumChatflowType } from '../../database/entities/ChatFlow'
import { ChatMessage } from '../../database/entities/ChatMessage'
import { ChatMessageFeedback } from '../../database/entities/ChatMessageFeedback'
import { UpsertHistory } from '../../database/entities/UpsertHistory'
import { Workspace } from '../../enterprise/database/entities/workspace.entity'
import { getWorkspaceSearchOptions } from '../../enterprise/utils/ControllerServiceUtils'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import documentStoreService from '../../services/documentstore'
import { constructGraphs, getAppVersion, getEndingNodes, getTelemetryFlowObj, isFlowValidForStream } from '../../utils'
import { containsBase64File, updateFlowDataWithFilePaths } from '../../utils/fileRepository'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { utilGetUploadsConfig } from '../../utils/getUploadsConfig'
import logger from '../../utils/logger'
import { updateStorageUsage } from '../../utils/quotaUsage'
import chatflowStorageService from '../chatflow-storage'
import { Chat } from '../../database/entities/Chat'
import checkOwnership from '../../utils/checkOwnership'
import { Organization } from '../../database/entities/Organization'
export const enum ChatflowErrorMessage {
    INVALID_CHATFLOW_TYPE = 'Invalid Chatflow Type'
}

export function validateChatflowType(type: ChatflowType | undefined) {
    if (!Object.values(EnumChatflowType).includes(type as EnumChatflowType))
        throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, ChatflowErrorMessage.INVALID_CHATFLOW_TYPE)
}

// Check if chatflow valid for streaming
const checkIfChatflowIsValidForStreaming = async (chatflowId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        //**
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
            id: chatflowId
        })

        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }

        /* Check for post-processing settings, if available isStreamValid is always false */
        let chatflowConfig: ICommonObject = {}
        if (chatflow.chatbotConfig) {
            chatflowConfig = JSON.parse(chatflow.chatbotConfig)
            if (chatflowConfig?.postProcessing?.enabled === true) {
                return { isStreaming: false }
            }
        }

        if (chatflow.type === 'AGENTFLOW') {
            return { isStreaming: true }
        }

        /*** Get Ending Node with Directed Graph  ***/
        const flowData = chatflow.flowData
        const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
        const nodes = parsedFlowData.nodes
        const edges = parsedFlowData.edges
        const { graph, nodeDependencies } = constructGraphs(nodes, edges)

        const endingNodes = getEndingNodes(nodeDependencies, graph, nodes)

        let isStreaming = false
        for (const endingNode of endingNodes) {
            const endingNodeData = endingNode.data
            const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode'
            // Once custom function ending node exists, flow is always unavailable to stream
            if (isEndingNode) {
                return { isStreaming: false }
            }
            isStreaming = isFlowValidForStream(nodes, endingNodeData)
        }

        // If it is a Multi/Sequential Agents, always enable streaming
        if (endingNodes.filter((node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents').length > 0) {
            return { isStreaming: true }
        }

        const dbResponse = { isStreaming: isStreaming }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.checkIfChatflowIsValidForStreaming - ${getErrorMessage(error)}`
        )
    }
}

// Check if chatflow valid for uploads
const checkIfChatflowIsValidForUploads = async (chatflowId: string): Promise<any> => {
    try {
        const dbResponse = await utilGetUploadsConfig(chatflowId)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.checkIfChatflowIsValidForUploads - ${getErrorMessage(error)}`
        )
    }
}

const deleteChatflow = async (chatflowId: string, orgId: string, workspaceId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()

        await getChatflowById(chatflowId, workspaceId)

        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).delete({ id: chatflowId })

        // Update document store usage
        await documentStoreService.updateDocumentStoreUsage(chatflowId, undefined, workspaceId)

        // Delete all chat messages
        await appServer.AppDataSource.getRepository(ChatMessage).delete({ chatflowid: chatflowId })

        // Delete all chat feedback
        await appServer.AppDataSource.getRepository(ChatMessageFeedback).delete({ chatflowid: chatflowId })

        // Delete all upsert history
        await appServer.AppDataSource.getRepository(UpsertHistory).delete({ chatflowid: chatflowId })

        try {
            // Delete all uploads corresponding to this chatflow
            const { totalSize } = await removeFolderFromStorage(orgId, chatflowId)
            await updateStorageUsage(orgId, workspaceId, totalSize, appServer.usageCacheManager)
        } catch (e) {
            logger.error(`[server]: Error deleting file storage for chatflow ${chatflowId}`)
        }

        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.deleteChatflow - ${getErrorMessage(error)}`
        )
    }
}

const getAllChatflows = async (type?: ChatflowType, workspaceId?: string, page: number = -1, limit: number = -1) => {
    try {
        console.log('getAllChatflows', { type, workspaceId, page, limit })
        const appServer = getRunningExpressApp()

        const queryBuilder = appServer.AppDataSource.getRepository(ChatFlow)
            .createQueryBuilder('chat_flow')
            .orderBy('chat_flow.updatedDate', 'DESC')

        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit)
            queryBuilder.take(limit)
        }
        if (type === 'MULTIAGENT') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'MULTIAGENT' })
        } else if (type === 'AGENTFLOW') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'AGENTFLOW' })
        } else if (type === 'ASSISTANT') {
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'ASSISTANT' })
        } else if (type === 'CHATFLOW') {
            // fetch all chatflows that are not agentflow
            queryBuilder.andWhere('chat_flow.type = :type', { type: 'CHATFLOW' })
        }
        if (workspaceId) queryBuilder.andWhere('chat_flow.workspaceId = :workspaceId', { workspaceId })
        const [data, total] = await queryBuilder.getManyAndCount()
        console.log('getAllChatflows queryBuilder', queryBuilder.getQueryAndParameters())
        console.log('getAllChatflows', { data, total })
        if (page > 0 && limit > 0) {
            return { data, total }
        } else {
            return data
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getAllChatflows - ${getErrorMessage(error)}`
        )
    }
}

async function getAllChatflowsCountByOrganization(type: ChatflowType, organizationId: string): Promise<number> {
    try {
        const appServer = getRunningExpressApp()

        const workspaces = await appServer.AppDataSource.getRepository(Workspace).findBy({ organizationId })
        const workspaceIds = workspaces.map((workspace) => workspace.id)
        const chatflowsCount = await appServer.AppDataSource.getRepository(ChatFlow).countBy({
            type,
            workspaceId: In(workspaceIds)
        })

        return chatflowsCount
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getAllChatflowsCountByOrganization - ${getErrorMessage(error)}`
        )
    }
}

const getAllChatflowsCount = async (type?: ChatflowType, workspaceId?: string): Promise<number> => {
    try {
        const appServer = getRunningExpressApp()
        if (type) {
            const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).countBy({
                type,
                ...getWorkspaceSearchOptions(workspaceId)
            })
            return dbResponse
        }
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).countBy(getWorkspaceSearchOptions(workspaceId))
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getAllChatflowsCount - ${getErrorMessage(error)}`
        )
    }
}

const getChatflowByApiKey = async (apiKeyId: string, keyonly?: unknown): Promise<any> => {
    try {
        // Here we only get chatflows that are bounded by the apikeyid and chatflows that are not bounded by any apikey
        const appServer = getRunningExpressApp()
        let query = appServer.AppDataSource.getRepository(ChatFlow)
            .createQueryBuilder('cf')
            .where('cf.apikeyid = :apikeyid', { apikeyid: apiKeyId })
        if (keyonly === undefined) {
            query = query.orWhere('cf.apikeyid IS NULL').orWhere('cf.apikeyid = ""')
        }

        const dbResponse = await query.orderBy('cf.name', 'ASC').getMany()
        if (dbResponse.length < 1) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow not found in the database!`)
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getChatflowByApiKey - ${getErrorMessage(error)}`
        )
    }
}

const getChatflowById = async (chatflowId: string, workspaceId?: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).findOne({
            where: {
                id: chatflowId,
                ...(workspaceId ? { workspaceId } : {})
            }
        })
        if (!dbResponse) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found in the database!`)
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getChatflowById - ${getErrorMessage(error)}`
        )
    }
}

const saveChatflow = async (
    newChatFlow: ChatFlow,
    orgId: string,
    workspaceId: string,
    subscriptionId: string,
    usageCacheManager: UsageCacheManager
): Promise<any> => {
    validateChatflowType(newChatFlow.type)
    const appServer = getRunningExpressApp()

    let dbResponse: ChatFlow
    if (containsBase64File(newChatFlow)) {
        // we need a 2-step process, as we need to save the chatflow first and then update the file paths
        // this is because we need the chatflow id to create the file paths

        // step 1 - save with empty flowData
        const incomingFlowData = newChatFlow.flowData
        newChatFlow.flowData = JSON.stringify({})
        const chatflow = appServer.AppDataSource.getRepository(ChatFlow).create(newChatFlow)
        const step1Results = await appServer.AppDataSource.getRepository(ChatFlow).save(chatflow)

        // step 2 - convert base64 to file paths and update the chatflow
        step1Results.flowData = await updateFlowDataWithFilePaths(
            step1Results.id,
            incomingFlowData,
            orgId,
            workspaceId,
            subscriptionId,
            usageCacheManager
        )
        await _checkAndUpdateDocumentStoreUsage(step1Results, newChatFlow.workspaceId)
        dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).save(step1Results)
    } else {
        const chatflow = appServer.AppDataSource.getRepository(ChatFlow).create(newChatFlow)
        dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).save(chatflow)
    }

    const productId = await appServer.identityManager.getProductIdFromSubscription(subscriptionId)

    await appServer.telemetry.sendTelemetry(
        'chatflow_created',
        {
            version: await getAppVersion(),
            chatflowId: dbResponse.id,
            flowGraph: getTelemetryFlowObj(JSON.parse(dbResponse.flowData)?.nodes, JSON.parse(dbResponse.flowData)?.edges),
            productId,
            subscriptionId
        },
        orgId
    )

    appServer.metricsProvider?.incrementCounter(
        dbResponse?.type === 'MULTIAGENT' ? FLOWISE_METRIC_COUNTERS.AGENTFLOW_CREATED : FLOWISE_METRIC_COUNTERS.CHATFLOW_CREATED,
        { status: FLOWISE_COUNTER_STATUS.SUCCESS }
    )

    return dbResponse
}

const updateChatflow = async (
    chatflow: ChatFlow,
    updateChatFlow: ChatFlow,
    orgId: string,
    workspaceId: string,
    subscriptionId: string
): Promise<any> => {
    const appServer = getRunningExpressApp()
    if (updateChatFlow.flowData && containsBase64File(updateChatFlow)) {
        updateChatFlow.flowData = await updateFlowDataWithFilePaths(
            chatflow.id,
            updateChatFlow.flowData,
            orgId,
            workspaceId,
            subscriptionId,
            appServer.usageCacheManager
        )
    }
    if (updateChatFlow.type || updateChatFlow.type === '') {
        validateChatflowType(updateChatFlow.type)
    } else {
        updateChatFlow.type = chatflow.type
    }
    const newDbChatflow = appServer.AppDataSource.getRepository(ChatFlow).merge(chatflow, updateChatFlow)
    await _checkAndUpdateDocumentStoreUsage(newDbChatflow, chatflow.workspaceId)
    const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).save(newDbChatflow)

    return dbResponse
}

// Get specific chatflow chatbotConfig via id (PUBLIC endpoint, used to retrieve config for embedded chat)
// Safe as public endpoint as chatbotConfig doesn't contain sensitive credential
const getSinglePublicChatbotConfig = async (chatflowId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
            id: chatflowId
        })
        if (!dbResponse) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }
        const uploadsConfig = await utilGetUploadsConfig(chatflowId)
        // even if chatbotConfig is not set but uploads are enabled
        // send uploadsConfig to the chatbot
        if (dbResponse.chatbotConfig || uploadsConfig) {
            try {
                const parsedConfig = dbResponse.chatbotConfig ? JSON.parse(dbResponse.chatbotConfig) : {}
                const ttsConfig =
                    typeof dbResponse.textToSpeech === 'string' ? JSON.parse(dbResponse.textToSpeech) : dbResponse.textToSpeech

                let isTTSEnabled = false
                if (ttsConfig) {
                    Object.keys(ttsConfig).forEach((provider) => {
                        if (provider !== 'none' && ttsConfig?.[provider]?.status) {
                            isTTSEnabled = true
                        }
                    })
                }
                delete parsedConfig.allowedOrigins
                delete parsedConfig.allowedOriginsError
                return { ...parsedConfig, uploads: uploadsConfig, flowData: dbResponse.flowData, isTTSEnabled }
            } catch (e) {
                throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error parsing Chatbot Config for Chatflow ${chatflowId}`)
            }
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getSinglePublicChatbotConfig - ${getErrorMessage(error)}`
        )
    }
}

const _checkAndUpdateDocumentStoreUsage = async (chatflow: ChatFlow, workspaceId?: string) => {
    const parsedFlowData: IReactFlowObject = JSON.parse(chatflow.flowData)
    const nodes = parsedFlowData.nodes
    // from the nodes array find if there is a node with name == documentStore)
    const node = nodes.length > 0 && nodes.find((node) => node.data.name === 'documentStore')
    if (!node || !node.data || !node.data.inputs || node.data.inputs['selectedStore'] === undefined) {
        await documentStoreService.updateDocumentStoreUsage(chatflow.id, undefined, workspaceId)
    } else {
        await documentStoreService.updateDocumentStoreUsage(chatflow.id, node.data.inputs['selectedStore'], workspaceId)
    }
}

const checkIfChatflowHasChanged = async (chatflowId: string, lastUpdatedDateTime: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        //**
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
            id: chatflowId
        })
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }
        // parse the lastUpdatedDateTime as a date and
        //check if the updatedDate is the same as the lastUpdatedDateTime
        return { hasChanged: chatflow.updatedDate.toISOString() !== lastUpdatedDateTime }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.checkIfChatflowHasChanged - ${getErrorMessage(error)}`
        )
    }
}

const upsertChat = async ({
    id,
    user,
    filters = {},
    prompt,
    chatflowChatId,
    chatflowId
}: {
    id?: string
    user?: IUser
    filters?: object
    prompt: string
    chatflowChatId: string
    chatflowId: string
}): Promise<Chat> => {
    try {
        const appServer = getRunningExpressApp()
        const chatRepository = appServer.AppDataSource.getRepository(Chat)

        const chatProperties = {
            id: chatflowChatId,
            title: prompt,
            chatflowChatId,
            filters,
            owner: { id: user?.id },
            organization: { id: user?.organizationId },
            chatflow: { id: chatflowId }
        }

        let chat: Chat | undefined
        if (chatflowChatId) {
            const existingChat = await chatRepository.findOneBy({ chatflowChatId })
            if (existingChat) chat = chatRepository.merge(existingChat, chatProperties)
        }
        if (!chat) {
            // Create new chat
            chat = chatRepository.create(chatProperties)
        }
        if (chat) {
            const updatedChat = await chatRepository.save(chat)
            return updatedChat
        } else {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chat ${id} not found`)
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.upsertChat - ${getErrorMessage(error)}`)
    }
}

const getDefaultChatflowTemplate = async (): Promise<{ id: string; name: string } | null> => {
    try {
        // Get the default template ID from environment variable
        const rawIds = process.env.INITIAL_CHATFLOW_IDS ?? process.env.INITIAL_CHATFLOW_ID ?? ''
        const ids = rawIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)

        if (!ids.length) {
            return null
        }

        // Use the first ID as the default template
        const templateId = ids[0]

        const appServer = getRunningExpressApp()
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)

        // Get the template chatflow
        const template = await chatFlowRepository.findOne({
            where: { id: templateId },
            select: ['id', 'name']
        })

        return template ? { id: template.id, name: template.name } : null
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getDefaultChatflowTemplate - ${getErrorMessage(error)}`
        )
    }
}

const bulkUpdateChatflows = async (chatflowIds: string[], user: IUser): Promise<{ updated: number; errors: string[] }> => {
    try {
        const appServer = getRunningExpressApp()
        const { id: userId, organizationId } = user
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)

        // Get default template
        const defaultTemplate = await getDefaultChatflowTemplate()
        if (!defaultTemplate) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'No default template found')
        }

        // Get template chatflow with full data
        const templateChatflow = await chatFlowRepository.findOne({
            where: { id: defaultTemplate.id }
        })

        if (!templateChatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Template chatflow not found')
        }

        // Get target chatflows that belong to the admin's organization and are outdated
        const targetChatflows = await chatFlowRepository.find({
            where: {
                id: In(chatflowIds),
                organizationId,
                parentChatflowId: defaultTemplate.id
            }
        })

        if (targetChatflows.length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'No valid chatflows found for update')
        }

        const results = { updated: 0, errors: [] as string[] }
        const updatedChatflows: any[] = []

        // Use transaction for bulk updates
        const queryRunner = appServer.AppDataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            for (const targetChatflow of targetChatflows) {
                try {
                    // Create updated chatflow by copying template data but preserving key fields
                    const updatedChatflow = {
                        ...templateChatflow,
                        id: targetChatflow.id,
                        name: targetChatflow.name, // Preserve original name
                        description: targetChatflow.description, // Preserve original description
                        userId: targetChatflow.userId, // Preserve original owner
                        organizationId: targetChatflow.organizationId, // Preserve original organization
                        parentChatflowId: targetChatflow.parentChatflowId, // Preserve parent relationship
                        createdDate: targetChatflow.createdDate, // Preserve creation date
                        currentVersion: (targetChatflow.currentVersion || 1) + 1, // Increment version
                        s3Location: targetChatflow.s3Location || `ChatFlows/${targetChatflow.id}/`
                        // updatedDate will be set automatically by TypeORM
                    }

                    // Remove template-specific fields that shouldn't be copied
                    delete (updatedChatflow as any).templateId

                    const savedChatflow = await queryRunner.manager.save(ChatFlow, updatedChatflow)
                    updatedChatflows.push(savedChatflow)
                    results.updated++
                } catch (error) {
                    results.errors.push(`Failed to update chatflow ${targetChatflow.id}: ${getErrorMessage(error)}`)
                }
            }

            await queryRunner.commitTransaction()

            // Save updated chatflows to S3 storage after successful database transaction
            for (const chatflow of updatedChatflows) {
                try {
                    // Create version record with the admin who made the bulk update
                    const versionRecord = {
                        ...chatflow,
                        versionMetadata: {
                            originalUserId: chatflow.userId, // Preserve original owner
                            editedByUserId: user.id, // Track who made this change
                            editedByName: user.name || 'Unknown User',
                            editedByEmail: user.email
                        }
                    }
                    await chatflowStorageService.saveVersionedChatflow(chatflow.id, chatflow.currentVersion || 1, versionRecord)
                } catch (s3Error) {
                    // Log S3 errors but don't fail the entire operation
                    results.errors.push(`Failed to save chatflow ${chatflow.id} to S3: ${getErrorMessage(s3Error)}`)
                }
            }
        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }

        return results
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.bulkUpdateChatflows - ${getErrorMessage(error)}`
        )
    }
}

const getChatflowVersions = async (chatflowId: string, user: IUser): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)

        // Get the chatflow
        const chatflow = await chatFlowRepository.findOne({ where: { id: chatflowId } })
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }

        // Check ownership
        if (!(await checkOwnership(chatflow, user))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }

        // Get versions from S3
        const versions = await chatflowStorageService.listChatflowVersions(chatflowId)

        // Get user information for each version
        const userRepository = appServer.AppDataSource.getRepository('User')
        const versionsWithUserInfo = []

        for (const v of versions) {
            let userName = 'Unknown User'
            let userEmail = ''

            // Check for version metadata first (tracks who actually made the change)
            if (v.record && v.record.versionMetadata) {
                // Use the metadata if available (new format)
                userName = v.record.versionMetadata.editedByName || 'Unknown User'
                userEmail = v.record.versionMetadata.editedByEmail || ''
            } else if (v.record && v.record.userId) {
                // Fall back to original user lookup (backward compatibility)
                try {
                    const user = await userRepository.findOne({ where: { id: v.record.userId } })
                    if (user) {
                        userName = user.name || 'Unknown User'
                        userEmail = user.email || ''
                    }
                } catch (error) {
                    // If user lookup fails, use fallback
                    userName = 'Unknown User'
                }
            }

            versionsWithUserInfo.push({
                version: v.version,
                timestamp: v.timestamp,
                metadata: {
                    ...v.metadata,
                    // Include rollback information if available
                    isRollback: v.record?.versionMetadata?.isRollback,
                    rolledBackFromVersion: v.record?.versionMetadata?.rolledBackFromVersion
                },
                user: {
                    name: userName,
                    email: userEmail
                }
            })
        }

        return {
            chatflowId,
            currentVersion: chatflow.currentVersion,
            versions: versionsWithUserInfo
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getChatflowVersions - ${getErrorMessage(error)}`
        )
    }
}

const getChatflowVersion = async (chatflowId: string, version: number | undefined, user: IUser): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)

        // Get the chatflow
        const chatflow = await chatFlowRepository.findOne({ where: { id: chatflowId } })
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }

        // Check ownership
        if (!(await checkOwnership(chatflow, user))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }

        // Get specific version or published version from S3
        const flowData = await chatflowStorageService.getChatflowVersion(chatflowId, version)
        if (!flowData) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Version ${version || 'published'} not found`)
        }

        return {
            ...chatflow,
            flowData
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getChatflowVersion - ${getErrorMessage(error)}`
        )
    }
}

const rollbackChatflowToVersion = async (chatflowId: string, version: number, user: IUser): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)

        // Get the chatflow
        const chatflow = await chatFlowRepository.findOne({ where: { id: chatflowId } })
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }

        // Check ownership
        if (!(await checkOwnership(chatflow, user))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }

        // Get the version content from S3
        const versionContent = await chatflowStorageService.getChatflowVersion(chatflowId, version)
        if (!versionContent) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Version ${version} not found`)
        }

        // Update database with the rolled-back flowData and increment version
        const newVersion = (chatflow.currentVersion || 1) + 1
        chatflow.flowData = versionContent.flowData
        chatflow.currentVersion = newVersion

        const dbResponse = await chatFlowRepository.save(chatflow)

        // Save to S3 as new version (this creates a new version with the rollback content)
        await chatflowStorageService.rollbackToVersion(chatflowId, version, user)

        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.rollbackChatflowToVersion - ${getErrorMessage(error)}`
        )
    }
}

const getChatflowForPrediction = async (chatflowId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)

        // Get the chatflow from database
        const chatflow = await chatFlowRepository.findOne({ where: { id: chatflowId } })
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }

        return chatflow
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getChatflowForPrediction - ${getErrorMessage(error)}`
        )
    }
}

const getAdminChatflows = async (user?: IUser, type?: ChatflowType, filter?: any): Promise<ChatFlow[]> => {
    try {
        const appServer = getRunningExpressApp()
        const { id: userId, organizationId, permissions } = user ?? {}
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)
        const queryBuilder = chatFlowRepository
            .createQueryBuilder('chatFlow')
            .leftJoin('User', 'user', 'user.id = chatFlow.userId')
            .addSelect(['user.id', 'user.name', 'user.email'])

        // Apply field selection if specified
        if (filter?.select && filter.select.length > 0) {
            // Always include id for proper entity mapping
            const selectFields = ['chatFlow.id', ...filter.select.map((field: any) => `chatFlow.${field}`)]
            queryBuilder.select(selectFields)
            queryBuilder.addSelect(['user.id', 'user.name', 'user.email'])
        }

        // Handle auth0_org_id filter for cross-org access
        let targetOrgId = organizationId
        if (filter?.auth0_org_id) {
            const org = await appServer.AppDataSource.getRepository(Organization).findOne({
                where: {
                    auth0Id: filter.auth0_org_id
                }
            })
            targetOrgId = org?.id ?? organizationId
        }

        // SECURITY: Always filter by organization first - users should never see chatflows from other orgs
        if (targetOrgId) {
            queryBuilder.where('chatFlow.organizationId = :organizationId', { organizationId: targetOrgId })
        }

        // ADMIN ACCESS: Admins can see all chatflows in their organization, regular users only see their own
        const isAdmin = user?.roles?.includes('Admin')
        if (!isAdmin) {
            queryBuilder.andWhere('chatFlow.userId = :userId', { userId })
        }

        // Apply additional visibility filtering if specified
        if (filter?.visibility) {
            const visibilityConditions = filter.visibility
                .split(',')
                .map((v: string) => (v === 'Organization' ? 'Private' : v))
                .map((v: string) => `chatFlow.visibility LIKE '%${v.trim()}%'`)
                .join(' OR ')

            queryBuilder.andWhere(`(${visibilityConditions})`)
        }

        // Get default template information for comparison
        const defaultTemplate = user ? await getDefaultChatflowTemplate() : null
        let templateChatflow = null
        if (defaultTemplate) {
            templateChatflow = await chatFlowRepository.findOne({
                where: { id: defaultTemplate.id },
                select: ['id', 'updatedDate']
            })
        }

        const rawResults = await queryBuilder.getRawAndEntities()
        const dbResponse = rawResults.entities.map((chatflow, index) => {
            const rawData = rawResults.raw[index]

            // Determine template derivation status
            const isFromTemplate = defaultTemplate && chatflow.parentChatflowId === defaultTemplate.id
            let templateStatus = 'not_from_template' // 'up_to_date', 'outdated', 'not_from_template'

            if (isFromTemplate && templateChatflow) {
                // Compare template's updatedDate with chatflow's updatedDate
                templateStatus = new Date(templateChatflow.updatedDate) > new Date(chatflow.updatedDate) ? 'outdated' : 'up_to_date'
            }

            return {
                ...chatflow,
                user: {
                    id: rawData.user_id,
                    name: rawData.user_name,
                    email: rawData.user_email
                },
                badge: chatflow?.visibility?.includes(ChatflowVisibility.MARKETPLACE)
                    ? 'SHARED'
                    : chatflow?.visibility?.includes(ChatflowVisibility.ORGANIZATION)
                    ? 'ORGANIZATION'
                    : '',
                isOwner: chatflow.userId === userId,
                canEdit: chatflow.userId === userId || permissions?.includes('org:manage'),
                parentTemplate:
                    isFromTemplate && defaultTemplate && templateChatflow
                        ? {
                              id: defaultTemplate.id,
                              name: defaultTemplate.name,
                              lastUpdated: templateChatflow.updatedDate
                          }
                        : null,
                templateStatus,
                isFromTemplate
            }
        })

        if (!(await checkOwnership(dbResponse, user))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }
        if (type === 'MULTIAGENT') {
            return dbResponse.filter((chatflow) => chatflow.type === 'MULTIAGENT')
        } else if (type === 'AGENTFLOW') {
            return dbResponse.filter((chatflow) => chatflow.type === 'AGENTFLOW')
        } else if (type === 'ASSISTANT') {
            return dbResponse.filter((chatflow) => chatflow.type === 'ASSISTANT')
        } else if (type === 'CHATFLOW') {
            // fetch all chatflows that are not agentflow
            return dbResponse.filter((chatflow) => chatflow.type === 'CHATFLOW' || !chatflow.type)
        }
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.getAllChatflows - ${getErrorMessage(error)}`
        )
    }
}

export default {
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getAdminChatflows,
    getAllChatflowsCount,
    getChatflowByApiKey,
    getChatflowById,
    saveChatflow,
    updateChatflow,
    getSinglePublicChatbotConfig,
    upsertChat,
    getDefaultChatflowTemplate,
    bulkUpdateChatflows,
    getChatflowVersions,
    getChatflowVersion,
    rollbackChatflowToVersion,
    getChatflowForPrediction,
    checkIfChatflowHasChanged,
    getAllChatflowsCountByOrganization
}
