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

        // Build query to fetch chats accessible via:
        // 1. Active workspace (chatflow.workspaceId matches user's active workspace)
        // 2. Legacy userId ownership (ownerId matches user.id)
        const queryBuilder = appServer.AppDataSource.getRepository(Chat)
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.chatflow', 'chatflow')
            .where('chat.chatflowChatId IS NOT NULL')
            .andWhere('chat.organizationId = :organizationId', { organizationId: user.organizationId })

        // Access control: Filter by ACTIVE workspace only (security fix for cross-workspace leak)
        if (user.activeWorkspaceId) {
            // Show chats from active workspace OR user's own chats (legacy ownership)
            queryBuilder.andWhere(
                '(chatflow.workspaceId = :activeWorkspaceId OR chat.ownerId = :userId)',
                { activeWorkspaceId: user.activeWorkspaceId, userId: user.id }
            )
        } else {
            // Fallback to legacy userId-only access if no active workspace
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

        // Build query with active workspace OR legacy userId access control
        const queryBuilder = appServer.AppDataSource.getRepository(Chat)
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.chatflow', 'chatflow')
            .where('chat.id = :chatId', { chatId })
            .andWhere('chat.organizationId = :organizationId', { organizationId: user.organizationId })

        // Access control: Filter by ACTIVE workspace only (security fix for cross-workspace leak)
        if (user.activeWorkspaceId) {
            // Allow access to chat from active workspace OR user's own chat (legacy ownership)
            queryBuilder.andWhere(
                '(chatflow.workspaceId = :activeWorkspaceId OR chat.ownerId = :userId)',
                { activeWorkspaceId: user.activeWorkspaceId, userId: user.id }
            )
        } else {
            // Fallback to legacy userId-only access if no active workspace
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
