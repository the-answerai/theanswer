import { ChatMessageFeedback } from '../database/entities/ChatMessageFeedback'
import { IChatMessageFeedback } from '../Interface'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'

/**
 * Method that add chat message feedback.
 * @param {Partial<IChatMessageFeedback>} chatMessageFeedback
 */

export const utilAddChatMessageFeedback = async (chatMessageFeedback: Partial<IChatMessageFeedback>): Promise<ChatMessageFeedback> => {
    try {
        const appServer = getRunningExpressApp()
        const newChatMessageFeedback = new ChatMessageFeedback()
        Object.assign(newChatMessageFeedback, chatMessageFeedback)
        const feedback = await appServer.AppDataSource.getRepository(ChatMessageFeedback).create(newChatMessageFeedback)
        return await appServer.AppDataSource.getRepository(ChatMessageFeedback).save(feedback)
    } catch (error) {
        console.log('[FEEDBACK DEBUG] DB save error:', JSON.stringify({
            code: (error as any).code,
            detail: (error as any).detail,
            constraint: (error as any).constraint,
            driverError: (error as any).driverError?.message,
            messageId: chatMessageFeedback.messageId,
            chatId: chatMessageFeedback.chatId,
            rating: chatMessageFeedback.rating
        }, null, 2))
        throw error
    }
}
