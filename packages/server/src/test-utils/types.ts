// Shared TypeScript types for the test utilities. These definitions keep modules decoupled while
// ensuring seed/baseline helpers agree on the shapes they exchange.
import { DataSource } from 'typeorm'
import { CredentialVisibility } from '../database/entities/Credential'

export type SupportedDataSource = DataSource

export type SeedOrganizationConfig = {
    auth0Id: string
    name: string
}

export type SeedUserConfig = {
    auth0Id: string
    email: string
    name?: string
    organization: SeedOrganizationConfig
}

export type SeedCredentialEntry = {
    name?: string
    assigned?: boolean
    visibility?: CredentialVisibility[]
    data?: Record<string, any>
    create?: boolean
}

export type SeedCredentialConfig = SeedCredentialEntry | SeedCredentialEntry[]

export type SeedChatflowConfig = {
    templateId?: string
    name?: string
    description?: string
}

export type SeedTestConfig = {
    user: SeedUserConfig
    credentials?: Record<string, SeedCredentialConfig>
    chatflow?: SeedChatflowConfig
    options?: {
        preserveExistingChatflow?: boolean
    }
}

export type TestUserRole = 'admin' | 'builder' | 'member'

export type EnvTestUser = {
    auth0Id?: string
    email: string
    name?: string
    role: TestUserRole
}

export type EnvTestCredential = {
    name: string
    credentialName: string
    envKeys: Record<string, string>
    defaultValues: Record<string, string>
}

export type TestEnvironment = {
    organization: SeedOrganizationConfig
    users: Record<TestUserRole, EnvTestUser>
    credentials: Record<string, EnvTestCredential>
}
