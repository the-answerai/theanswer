import { DataSource } from 'typeorm'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { User } from '../../database/entities/User'

/**
 * Result object for the findOrCreateDefaultChatflowsForUser operation
 */
export interface DefaultChatflowResult {
    success: boolean
    error?: Error
    defaultChatflowId?: string
    chatflowsCreated?: number
}

/**
 * Finds or creates default chatflows for a user based on INITIAL_CHATFLOW_IDS environment variable.
 * This function is idempotent - multiple calls will not create duplicate chatflows.
 *
 * @param AppDataSource - The TypeORM data source
 * @param user - The user to create default chatflows for
 * @returns A result object indicating success/failure and any created chatflows
 *
 * @description
 * This function performs the following operations:
 * 1. Checks if the user already has a defaultChatflowId set in their appSettings
 * 2. Fetches existing chatflows that were created from the initial templates
 * 3. If user doesn't have a default chatflow but has existing ones, sets the first as default
 * 4. Creates copies of template chatflows that the user doesn't already have
 * 5. If user still doesn't have a default after creation, sets the first created as default
 *
 * The INITIAL_CHATFLOW_IDS environment variable should contain comma-separated chatflow template IDs
 * that will be copied for each new user.
 */
export const findOrCreateDefaultChatflowsForUser = async (AppDataSource: DataSource, user: User): Promise<DefaultChatflowResult> => {
    if (!user) {
        return {
            success: false,
            error: new Error('User is required')
        }
    }

    // If user already has a defaultChatflowId, return early
    if (user.defaultChatflowId) return

    const rawIds = process.env.INITIAL_CHATFLOW_IDS ?? ''
    const ids = rawIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

    if (!ids.length) {
        return {
            success: true,
            chatflowsCreated: 0
        }
    }

    // Only use the first ID from the list
    const firstId = ids[0]

    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
        const chatFlowRepo = queryRunner.manager.getRepository(ChatFlow)
        const userRepo = queryRunner.manager.getRepository(User)

        // Check if the user already has this specific chatflow
        const existingChatflow = await chatFlowRepo.findOne({
            where: {
                userId: user.id,
                parentChatflowId: firstId
            }
        })

        // If user already has this chatflow, update their defaultChatflowId if not set
        if (existingChatflow) {
            if (!user.defaultChatflowId) {
                await userRepo.update(user.id, { defaultChatflowId: existingChatflow.id })
            }
            await queryRunner.commitTransaction()
            await queryRunner.release()
            return
        }

        // Fetch the template for the first ID
        const template = await chatFlowRepo.findOne({
            where: { id: firstId }
        })

        if (template) {
            const templateCopy = { ...template }
            delete (templateCopy as any).id

            const chatflowToImport = {
                ...templateCopy,
                parentChatflowId: firstId,
                userId: user.id,
                organizationId: user.organizationId
            }

            // Insert the new chatflow
            const insertResult = await chatFlowRepo.insert(chatflowToImport)

            // Get the newly created chatflow ID
            const newChatflowId = insertResult.identifiers[0]?.id

            if (newChatflowId) {
                // Update the user's defaultChatflowId
                await userRepo.update(user.id, { defaultChatflowId: newChatflowId })
            }
        }

        await queryRunner.commitTransaction()

        return {
            success: true,
            defaultChatflowId: currentSettings.defaultChatflowId,
            chatflowsCreated: chatflowsToImport.length
        }
    } catch (err) {
        await queryRunner.rollbackTransaction()
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[findOrCreateDefaultChatflowsForUser] Error in transaction:', error)

        return {
            success: false,
            error,
            chatflowsCreated: 0
        }
    } finally {
        await queryRunner.release()
    }
}
