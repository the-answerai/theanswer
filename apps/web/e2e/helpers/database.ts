import { resetTestDb, seedTestData, resetAndSeed as dbResetAndSeed, seedScenario as seedScenarioApi, resetDatabase } from './test-db'
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
        auth0Id?: string
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
// Use the centralized test user definition from auth.ts - STRICT .env.test only
export const DEFAULT_TEST_USER = {
    email: TEST_USERS.admin.email,
    organizationAuth0Id: TEST_USERS.admin.organizationId!,
    organizationName: TEST_USERS.admin.organizationName!,
    name: TEST_USERS.admin.email
}

const mergeSeedPayload = (overrides: SeedOverrides): SeedPayload => {
    const baseUser = DEFAULT_TEST_USER

    const mergedUser = {
        auth0Id: overrides.user?.auth0Id,
        email: overrides.user?.email ?? baseUser.email,
        name: overrides.user?.name ?? baseUser.name,
        organization: {
            auth0Id: overrides.user?.organization?.auth0Id ?? process.env.TEST_ENTERPRISE_AUTH0_ORG_ID ?? baseUser.organizationAuth0Id,
            name: overrides.user?.organization?.name ?? baseUser.organizationName
        }
    }

    return {
        user: mergedUser,
        credentials: overrides.credentials,
        chatflow: overrides.chatflow
    }
}

/**
 * Full reset + custom seed. Use when you need to specify exact credential payloads
 * for a test scenario.
 */
export const resetAndSeed = async (overrides: SeedOverrides): Promise<void> => {
    try {
        const payload = mergeSeedPayload(overrides)
        await dbResetAndSeed(payload)
        console.log('✅ Successfully reset database and seeded with custom data')
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to reset and seed database: ${errorMessage}`)
    }
}

export const seedScenario = async (scenario: string, userType: keyof typeof TEST_USERS = 'admin'): Promise<void> => {
    // Validation: Scenario name is required
    if (!scenario) {
        throw new Error('seedScenario requires a scenario name')
    }

    // Validation: userType must be valid
    const validUserTypes = ['admin', 'builder', 'member'] as const
    if (!validUserTypes.includes(userType)) {
        throw new Error(`Invalid userType "${userType}". Must be one of: ${validUserTypes.join(', ')}`)
    }

    const user = TEST_USERS[userType]

    // Validation: User must have an email configured
    if (!user || !user.email) {
        throw new Error(
            `Missing configuration for ${userType} user. Check TEST_USER_ENTERPRISE_${userType.toUpperCase()}_EMAIL in .env.test`
        )
    }

    try {
        await seedScenarioApi(scenario, {
            userEmail: user.email
        })
        console.log(`✅ Successfully seeded scenario "${scenario}" for ${userType} user (${user.email})`)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to seed scenario "${scenario}" for ${userType} user (${user.email}): ${errorMessage}`)
    }
}

export const resetOnly = async (): Promise<void> => {
    await resetTestDb()
}

// Re-export base functions for compatibility
export { resetTestDb, seedTestData, resetAndSeed as dbResetAndSeed, resetDatabase } from './test-db'
