import { StatusCodes } from 'http-status-codes'
import { IUser } from '../../Interface'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { Chat } from '../../database/entities/Chat'

interface PaginationOptions {
    limit?: number
    cursor?: string
}

const getAllChats = async (user: IUser, options: PaginationOptions = {}) => {
    const { limit = 20, cursor } = options

    // Validate cursor date if provided
    if (cursor) {
        const cursorDate = new Date(cursor)
        if (isNaN(cursorDate.getTime())) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Invalid cursor date format')
        }
    }

    try {
        const appServer = getRunningExpressApp()

        // Get user's assigned workspace IDs for workspace-based access
        const workspaceIds = user.assignedWorkspaces?.map((ws) => ws.id) || []

        // Build query to fetch chats accessible via:
        // 1. Workspace membership (chatflow.workspaceId in user's workspaces)
        // 2. Legacy userId ownership (ownerId matches user.id)
        const queryBuilder = appServer.AppDataSource.getRepository(Chat)
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.chatflow', 'chatflow')
            .where('chat.chatflowChatId IS NOT NULL')
            .andWhere('chat.organizationId = :organizationId', { organizationId: user.organizationId })

        // Access control: workspace membership OR legacy userId ownership
        if (workspaceIds.length > 0) {
            queryBuilder.andWhere(
                '(chatflow.workspaceId IN (:...workspaceIds) OR chat.ownerId = :userId)',
                { workspaceIds, userId: user.id }
            )
        } else {
            // Fallback to legacy userId-only access if no workspaces assigned
            queryBuilder.andWhere('chat.ownerId = :userId', { userId: user.id })
        }

        // Apply cursor-based pagination
        if (cursor) {
            queryBuilder.andWhere('chat.createdDate < :cursor', { cursor: new Date(cursor) })
        }

        queryBuilder.orderBy('chat.createdDate', 'DESC').take(limit)

        const chats = await queryBuilder.getMany()
        const parsedChats = JSON.parse(JSON.stringify(chats))
        return parsedChats
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatsService.getAllChats - ${getErrorMessage(error)}`)
    }
}

const getChatById = async (chatId: string, user: IUser) => {
    try {
        const appServer = getRunningExpressApp()

        // Get user's assigned workspace IDs for workspace-based access
        const workspaceIds = user.assignedWorkspaces?.map((ws) => ws.id) || []

        // Build query with workspace-based OR legacy userId access control
        const queryBuilder = appServer.AppDataSource.getRepository(Chat)
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.chatflow', 'chatflow')
            .where('chat.id = :chatId', { chatId })
            .andWhere('chat.organizationId = :organizationId', { organizationId: user.organizationId })

        // Access control: workspace membership OR legacy userId ownership
        if (workspaceIds.length > 0) {
            queryBuilder.andWhere(
                '(chatflow.workspaceId IN (:...workspaceIds) OR chat.ownerId = :userId)',
                { workspaceIds, userId: user.id }
            )
        } else {
            // Fallback to legacy userId-only access if no workspaces assigned
            queryBuilder.andWhere('chat.ownerId = :userId', { userId: user.id })
        }

        const chat = await queryBuilder.getOne()

        if (!chat) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chat ${chatId} not found`)
        }

        return JSON.parse(JSON.stringify(chat))
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatsService.getChatById - ${getErrorMessage(error)}`)
    }
}

export default {
    getAllChats,
    getChatById
}
