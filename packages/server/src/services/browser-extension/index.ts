import { StatusCodes } from 'http-status-codes'
import { ChatFlow, ChatflowVisibility } from '../../database/entities/ChatFlow'
import { User } from '../../database/entities/User'
import { IUser } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import checkOwnership from '../../utils/checkOwnership'

/**
 * Get all public chatflows that are available for the browser extension
 * @param user - The authenticated user object
 * @returns An array of public chatflows available for the browser extension with isUserDefaultChatflow and isOwner flags
 */
const getBrowserExtensionChatflows = async (user: IUser): Promise<ChatFlow[]> => {
    try {
        const appServer = getRunningExpressApp()
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)
        const userRepository = appServer.AppDataSource.getRepository(User)

        // Get the user from database to access defaultChatflowId
        const dbUser = await userRepository.findOneBy({ id: user.id })
        if (!dbUser) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'User not found')
        }

        // Query chatflows that:
        // 1. Belong to the user, scoped to their active workspace, with Browser Extension visibility
        if (!user.activeWorkspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: browserExtensionService.getBrowserExtensionChatflows - activeWorkspaceId is required'
            )
        }

        const queryBuilder = chatFlowRepository
            .createQueryBuilder('chatflow')
            .where('chatflow.workspaceId = :workspaceId', { workspaceId: user.activeWorkspaceId })
            .andWhere('chatflow.visibility LIKE :ext', { ext: '%Browser Extension%' })
            .andWhere('(chatflow.userId = :userId OR chatflow.visibility LIKE :org)', {
                userId: user.id,
                org: '%Organization%'
            })

        // Return the complete chatflow objects with all fields
        const dbResponse = await queryBuilder.getMany()

        // Add isUserDefaultChatflow field to each chatflow
        const chatflowsWithDefaultFlag = dbResponse.map((chatflow) => ({
            ...chatflow,
            isUserDefaultChatflow: chatflow.userId === user.id && chatflow.id === dbUser.defaultChatflowId,
            isOwner: chatflow.userId === user.id
        }))

        // Return the chatflows with the default flag
        return chatflowsWithDefaultFlag
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: browserExtensionService.getBrowserExtensionChatflows - ${getErrorMessage(error)}`
        )
    }
}

/**
 * Update Browser Extension visibility for a specific chatflow
 * @param chatflowId - The ID of the chatflow to update
 * @param enabled - Whether to enable or disable Browser Extension visibility
 * @param user - The authenticated user object
 * @returns The updated chatflow object
 */
const updateBrowserExtensionVisibility = async (chatflowId: string, enabled: boolean, user: IUser): Promise<ChatFlow> => {
    try {
        const appServer = getRunningExpressApp()
        const chatFlowRepository = appServer.AppDataSource.getRepository(ChatFlow)

        if (!user.activeWorkspaceId) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: browserExtensionService.updateBrowserExtensionVisibility - activeWorkspaceId is required'
            )
        }

        const chatflow = await chatFlowRepository.findOneBy({
            id: chatflowId,
            workspaceId: user.activeWorkspaceId
        })

        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow with ID ${chatflowId} not found`)
        }

        // Check if user has permission to modify this chatflow
        if (!(await checkOwnership(chatflow, user))) {
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'You do not have permission to update this chatflow')
        }

        // Ensure visibility is an array
        const visibilityArray = Array.isArray(chatflow.visibility)
            ? [...chatflow.visibility]
            : chatflow.visibility
            ? [chatflow.visibility]
            : []

        // Add or remove "Browser Extension" from visibility
        if (enabled && !visibilityArray.includes(ChatflowVisibility.BROWSER_EXTENSION)) {
            visibilityArray.push(ChatflowVisibility.BROWSER_EXTENSION)
        } else if (!enabled) {
            // Filter out Browser Extension if it exists
            const index = visibilityArray.findIndex((v) => v === ChatflowVisibility.BROWSER_EXTENSION)
            if (index >= 0) {
                visibilityArray.splice(index, 1)
            }
        }

        // Update the chatflow
        chatflow.visibility = visibilityArray
        const updatedChatflow = await chatFlowRepository.save(chatflow)

        return updatedChatflow
    } catch (error) {
        if (error instanceof InternalFlowiseError) throw error
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: browserExtensionService.updateBrowserExtensionVisibility - ${getErrorMessage(error)}`
        )
    }
}

export default {
    getBrowserExtensionChatflows,
    updateBrowserExtensionVisibility
}
