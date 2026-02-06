/* eslint-disable no-console */
import { DataSource, QueryFailedError } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../../database/entities/User'

export const findOrCreateUser = async (
    AppDataSource: DataSource,
    auth0Id: string,
    email: string,
    name: string,
    organizationId?: string // CHANGED: Now optional for chicken-egg problem
): Promise<User> => {
    const userRepo = AppDataSource.getRepository(User)

    // FAST PATH: Check if user exists (idempotent)
    let user = await userRepo.findOneBy({ auth0Id })
    if (user) {
        // Update user if needed and return
        let changed = false
        if (user.email !== email) {
            user.email = email
            changed = true
        }
        if (user.name !== name) {
            user.name = name
            changed = true
        }
        if (changed) {
            user.updatedBy = user.id
            await userRepo.save(user)
        }
        return user
    }

    // SLOW PATH: Create with transaction and retry logic
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
        const queryRunner = AppDataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            // Check again inside transaction to prevent race condition
            const existingUser = await queryRunner.manager.findOneBy(User, { auth0Id })
            if (existingUser) {
                await queryRunner.release()
                return existingUser
            }

            // Pre-generate UUID for self-reference audit fields
            const userId = uuidv4()

            // Create new user with self-reference audit fields
            // IMPORTANT: Use queryRunner.manager.create(Entity, data) - TypeORM respects manually-set IDs this way
            const newUser = queryRunner.manager.create(User, {
                id: userId,
                auth0Id,
                email,
                name,
                organizationId: organizationId || undefined,
                status: 'active',
                createdBy: userId,
                updatedBy: userId
            })
            const savedUser = await queryRunner.manager.save(User, newUser)

            await queryRunner.commitTransaction()
            await queryRunner.release()

            console.log(`[findOrCreateUser] Created user: ${savedUser.id}`)
            return savedUser
        } catch (error) {
            await queryRunner.rollbackTransaction()
            await queryRunner.release()

            // If duplicate key error, retry after a short delay
            if (error instanceof QueryFailedError && error.message.includes('duplicate key')) {
                retryCount++
                console.log(`[findOrCreateUser] Retry ${retryCount}/${maxRetries}`)
                await new Promise((resolve) => setTimeout(resolve, 100 * retryCount)) // Exponential backoff

                // Try to get the user that was created in parallel
                user = await userRepo.findOneBy({ auth0Id })
                if (user) {
                    return user
                }
                continue
            }
            throw error
        }
    }

    // Final attempt to find user after retries
    user = await userRepo.findOneBy({ auth0Id })
    if (user) {
        return user
    }

    throw new Error(`Failed to create user after ${maxRetries} retries`)
}

// Helper to update user's organizationId
export const updateUserOrganization = async (AppDataSource: DataSource, userId: string, organizationId: string): Promise<void> => {
    const userRepo = AppDataSource.getRepository(User)
    await userRepo.update(userId, { organizationId, updatedBy: userId })
}
