import { resetTestDb, seedTestData, resetAndSeed as dbResetAndSeed } from './test-db'
import { TEST_USERS } from './auth'

/**
 * Enhanced database helpers for credential testing
 * Builds on existing test-db.ts functionality with credential-specific seeding
 */

export type CredentialSeedEntry = {
    name?: string
    assigned?: boolean
    visibility?: string[]
    data?: Record<string, unknown>
    create?: boolean
}

export type CredentialSeedConfig = CredentialSeedEntry | CredentialSeedEntry[]

export type SeedPayload = {
    user: {
        auth0Id: string
        email: string
        name?: string
        organization: {
            auth0Id: string
            name: string
        }
    }
    credentials?: Record<string, CredentialSeedConfig>
    chatflow?: {
        name?: string
        description?: string
    }
}

type SeedOverrides = Omit<SeedPayload, 'user'> & {
    user?: Partial<SeedPayload['user']>
}

// Use the centralized test user definition from auth.ts
export const DEFAULT_TEST_USER = {
    email: TEST_USERS.admin.email,
    auth0Id: TEST_USERS.admin.auth0Id || `auth0|seed-${TEST_USERS.admin.email.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
    organizationId: TEST_USERS.admin.organizationId!,
    organizationName: TEST_USERS.admin.organizationName!,
    name: TEST_USERS.admin.name || TEST_USERS.admin.email
}

const mergeSeedPayload = (overrides: SeedOverrides): SeedPayload => {
    const baseUser = DEFAULT_TEST_USER

    const mergedUser = {
        auth0Id: overrides.user?.auth0Id ?? baseUser.auth0Id,
        email: overrides.user?.email ?? baseUser.email,
        name: overrides.user?.name ?? baseUser.name,
        organization: {
            auth0Id: overrides.user?.organization?.auth0Id ?? baseUser.organizationId,
            name: overrides.user?.organization?.name ?? baseUser.organizationName
        }
    }

    return {
        user: mergedUser,
        credentials: overrides.credentials,
        chatflow: overrides.chatflow
    }
}

export const resetAndSeed = async (overrides: SeedOverrides): Promise<void> => {
    const payload = mergeSeedPayload(overrides)
    await dbResetAndSeed(payload)
}

export const seedOnly = async (overrides: SeedOverrides): Promise<void> => {
    const payload = mergeSeedPayload(overrides)
    await seedTestData(payload)
}

export const resetOnly = async (): Promise<void> => {
    await resetTestDb()
}

// Re-export base functions for compatibility
export { resetTestDb, seedTestData, dbResetAndSeed }
