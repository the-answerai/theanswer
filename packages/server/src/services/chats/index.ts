import { StatusCodes } from 'http-status-codes'
import { IUser } from '../../Interface'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { Chat } from '../../database/entities/Chat'
import { Not, IsNull, LessThan } from 'typeorm'

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
        const chats = await appServer.AppDataSource.getRepository(Chat).find({
            where: {
                ownerId: user.id,
                organizationId: user.organizationId,
                chatflowChatId: Not(IsNull()),
                ...(cursor ? { createdDate: LessThan(new Date(cursor)) } : {})
            },
            order: {
                createdDate: 'DESC'
            },
            take: limit
        })
        return JSON.parse(JSON.stringify(chats))
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatsService.getAllChats - ${getErrorMessage(error)}`)
    }
}

const getChatById = async (chatId: string, user: IUser) => {
    try {
        const appServer = getRunningExpressApp()
        const chat = await appServer.AppDataSource.getRepository(Chat).findOne({
            where: {
                id: chatId,
                ownerId: user.id,
                organizationId: user.organizationId
            },
            relations: {
                chatflow: true
                // users: true,
                // messages: true
            },
            order: {
                updatedDate: 'DESC'
                // messages: {
                //     createdDate: 'ASC'
                // }
            }
        })

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
