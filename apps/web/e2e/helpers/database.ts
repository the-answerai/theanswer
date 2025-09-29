import { resetTestDb, seedTestData, resetAndSeed as dbResetAndSeed, seedScenario as seedScenarioApi } from './test-db'
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
    const payload = mergeSeedPayload(overrides)
    await dbResetAndSeed(payload)
}

export const seedScenario = async (scenario: string, userType: keyof typeof TEST_USERS = 'admin'): Promise<void> => {
    if (!scenario) {
        throw new Error('seedScenario requires a scenario name')
    }

    const user = TEST_USERS[userType]

    await seedScenarioApi(scenario, {
        userEmail: user.email
    })
}

/**
 * @deprecated Use resetAndSeed for custom payloads or seedScenario for
 * scenario aliases. This helper remains for backwards compatibility with existing
 * tests but still performs a full reset under the hood.
 */
export const seedOnly = async (overrides: SeedOverrides): Promise<void> => {
    const payload = mergeSeedPayload(overrides)
    await seedTestData(payload)
}

export const resetOnly = async (): Promise<void> => {
    await resetTestDb()
}

// Re-export base functions for compatibility
export { resetTestDb, seedTestData, dbResetAndSeed }
