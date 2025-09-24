import fs from 'fs'
import path from 'path'
import { DataSource } from 'typeorm'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { getErrorMessage } from '../errors/utils'
import logger from '../utils/logger'
import { Organization } from '../database/entities/Organization'
import { User } from '../database/entities/User'
import { ChatFlow, ChatflowVisibility } from '../database/entities/ChatFlow'
import { Credential, CredentialVisibility } from '../database/entities/Credential'
import { transformToCredentialEntity } from '../utils'

type SupportedDataSource = DataSource

type ScenarioOptions = {
    skipReset?: boolean
}

type SeedOrganizationConfig = {
    auth0Id: string
    name: string
}

type SeedUserConfig = {
    auth0Id: string
    email: string
    name?: string
    organization: SeedOrganizationConfig
}

type SeedCredentialEntry = {
    /**
     * Friendly name to store for the credential
     */
    name?: string
    /**
     * When true, the generated credential will be pre-assigned in the seeded flow
     */
    assigned?: boolean
    /**
     * Override default visibility. Defaults to ['Private']
     */
    visibility?: CredentialVisibility[]
    /**
     * Override default field values for the credential component
     */
    data?: Record<string, any>
    /**
     * When false, skips credential creation but still removes any assignment
     */
    create?: boolean
}

type SeedCredentialConfig = SeedCredentialEntry | SeedCredentialEntry[]

type SeedChatflowConfig = {
    /**
     * Use a custom template id instead of the default configured one
     */
    templateId?: string
    /**
     * Human readable name for the seeded chatflow
     */
    name?: string
    /**
     * Optional description override
     */
    description?: string
}

export type SeedTestConfig = {
    user: SeedUserConfig
    credentials?: Record<string, SeedCredentialConfig>
    chatflow?: SeedChatflowConfig
}

const IGNORED_TABLES = new Set(['migrations', 'typeorm_metadata'])

const ensureDataSource = (provided?: SupportedDataSource): SupportedDataSource => {
    if (provided) {
        return provided
    }

    const appServer = getRunningExpressApp()
    if (!appServer?.AppDataSource) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Error: test-utils.ensureDataSource - AppDataSource not initialized'
        )
    }

    return appServer.AppDataSource
}

const resolveInitialChatflowId = (): string => {
    const rawIds = process.env.INITIAL_CHATFLOW_IDS ?? ''
    const ids = rawIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

    if (!ids.length) {
        throw new InternalFlowiseError(
            StatusCodes.PRECONDITION_FAILED,
            'Error: test-utils.resolveInitialChatflowId - INITIAL_CHATFLOW_IDS not configured'
        )
    }

    return ids[0]
}

const ensureTemplateChatflow = async (ds: SupportedDataSource, templateId: string): Promise<void> => {
    const chatflowRepo = ds.getRepository(ChatFlow)
    const existingTemplate = await chatflowRepo.findOne({ where: { id: templateId } })

    if (existingTemplate && !existingTemplate.userId && !existingTemplate.organizationId) {
        return
    }

    if (existingTemplate) {
        await chatflowRepo.delete({ id: templateId })
    }

    // Try to find the file in both src and dist directories
    let templatePath = path.join(__dirname, '..', 'fixtures', 'default-sidekick.json')
    if (!fs.existsSync(templatePath)) {
        // Fallback for dist directory structure
        templatePath = path.join(__dirname, '..', '..', 'src', 'fixtures', 'default-sidekick.json')
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const template = JSON.parse(templateContent)

    // Set visibility to Private and Platform for orphaned chatflows
    const visibility = [ChatflowVisibility.PRIVATE, ChatflowVisibility.ANSWERAI]

    const templateEntity = chatflowRepo.create()

    templateEntity.id = templateId
    templateEntity.name = template.name
    templateEntity.description = template.description ?? ''
    templateEntity.flowData = template.flowData
    templateEntity.deployed = false
    templateEntity.isPublic = false
    templateEntity.visibility = visibility
    templateEntity.currentVersion = template.currentVersion ?? 1
    templateEntity.category = template.category ?? ''
    templateEntity.type = template.type ?? 'CHATFLOW'
    // Ensure orphaned chatflow (no userId or organizationId)
    templateEntity.userId = null as any
    templateEntity.organizationId = null as any

    if (typeof template.chatbotConfig === 'string') {
        templateEntity.chatbotConfig = template.chatbotConfig
    }

    if (typeof template.answersConfig === 'string') {
        templateEntity.answersConfig = template.answersConfig
    }

    if (typeof template.apiConfig === 'string') {
        templateEntity.apiConfig = template.apiConfig
    }

    if (typeof template.analytic === 'string') {
        templateEntity.analytic = template.analytic
    }

    if (typeof template.speechToText === 'string') {
        templateEntity.speechToText = template.speechToText
    }

    if (typeof template.followUpPrompts === 'string') {
        templateEntity.followUpPrompts = template.followUpPrompts
    }

    if (typeof template.browserExtConfig === 'string') {
        templateEntity.browserExtConfig = template.browserExtConfig
    }

    await chatflowRepo.save(templateEntity)
}

const fetchTableNames = async (ds: SupportedDataSource): Promise<string[]> => {
    const dbType = String(ds.options.type)

    if (dbType === 'postgres') {
        const rows = await ds.query(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (${[...IGNORED_TABLES]
                .map((table) => `'${table}'`)
                .join(', ')})`
        )
        return rows.map((row: { tablename: string }) => row.tablename)
    }

    if (dbType === 'mysql' || dbType === 'mariadb') {
        const rows = await ds.query(`SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = DATABASE()`)
        return rows.map((row: { tableName: string }) => row.tableName).filter((tableName: string) => !IGNORED_TABLES.has(tableName))
    }

    if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
        const rows = await ds.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
        return rows.map((row: { name: string }) => row.name).filter((tableName: string) => !IGNORED_TABLES.has(tableName))
    }

    throw new InternalFlowiseError(StatusCodes.NOT_IMPLEMENTED, `Error: test-utils.fetchTableNames - Unsupported database type: ${dbType}`)
}

export async function resetDatabase(providedDataSource?: SupportedDataSource): Promise<void> {
    const ds = ensureDataSource(providedDataSource)
    const dbType = String(ds.options.type)

    const tables = await fetchTableNames(ds)
    if (!tables.length) {
        return
    }

    if (dbType === 'postgres') {
        const identifiers = tables.map((table) => `"public"."${table}"`).join(', ')
        await ds.query(`TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`)
        return
    }

    if (dbType === 'mysql' || dbType === 'mariadb') {
        await ds.query('SET FOREIGN_KEY_CHECKS = 0')
        for (const table of tables) {
            await ds.query(`TRUNCATE TABLE \`${table}\``)
        }
        await ds.query('SET FOREIGN_KEY_CHECKS = 1')
        return
    }

    if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
        for (const table of tables) {
            await ds.query(`DELETE FROM ${table}`)
        }
        const quotedTables = tables.map((table) => `'${table}'`).join(', ')
        if (quotedTables.length) {
            await ds.query(`DELETE FROM sqlite_sequence WHERE name IN (${quotedTables})`)
        }
        return
    }

    throw new InternalFlowiseError(StatusCodes.NOT_IMPLEMENTED, `Error: test-utils.resetDatabase - Unsupported database type: ${dbType}`)
}

export async function seedBaseline(providedDataSource?: SupportedDataSource): Promise<void> {
    const ds = ensureDataSource(providedDataSource)
    const templateId = resolveInitialChatflowId()

    await ensureTemplateChatflow(ds, templateId)

    const organizationRepo = ds.getRepository(Organization)
    const userRepo = ds.getRepository(User)

    const organization = organizationRepo.create({
        auth0Id: process.env.TEST_ENTERPRISE_AUTH0_ORG_ID ?? 'org_unQ8OLmTNsxVTJCT',
        name: process.env.TEST_ENTERPRISE_ORG_NAME ?? 'local-dev'
    })
    await organizationRepo.save(organization)

    const credentialRepo = ds.getRepository(Credential)

    const openAICredential = await credentialRepo.save(
        await transformToCredentialEntity({
            name: 'E2E OpenAI Key',
            credentialName: 'openAIApi',
            plainDataObj: {
                openAIApiKey: process.env.TEST_OPENAI_API_KEY ?? 'sk-test-openai'
            }
        })
    )

    const exaCredential = await credentialRepo.save(
        await transformToCredentialEntity({
            name: 'E2E Exa Key',
            credentialName: 'exaSearchApi',
            plainDataObj: {
                exaSearchApiKey: process.env.TEST_EXASEARCH_API_KEY ?? 'exa-test-key'
            }
        })
    )

    logger.info(`[test-utils] Seeded baseline data.`)
}

export async function createOrphanedTestData(providedDataSource?: SupportedDataSource): Promise<void> {
    const ds = ensureDataSource(providedDataSource)
    const templateId = resolveInitialChatflowId()

    try {
        const chatflowRepo = ds.getRepository(ChatFlow)

        // Remove existing orphaned template to avoid duplicate key errors and recreate clean template
        await chatflowRepo.delete({ id: templateId })

        // Create orphaned chatflow
        await ensureTemplateChatflow(ds, templateId)

        // Create orphaned credentials
        const credentialRepo = ds.getRepository(Credential)

        await credentialRepo.delete({ name: 'Test OpenAI Key', credentialName: 'openAIApi' })
        await credentialRepo.delete({ name: 'Test Exa Key', credentialName: 'exaSearchApi' })

        // OpenAI credential
        const openAICredential = await credentialRepo.save(
            await transformToCredentialEntity({
                name: 'Test OpenAI Key',
                credentialName: 'openAIApi',
                plainDataObj: {
                    openAIApiKey: process.env.TEST_OPENAI_API_KEY ?? 'sk-test-openai'
                },
                visibility: ['Private', 'Platform', 'Organization'] as any
            })
        )

        // Exa credential
        const exaCredential = await credentialRepo.save(
            await transformToCredentialEntity({
                name: 'Test Exa Key',
                credentialName: 'exaSearchApi',
                plainDataObj: {
                    exaSearchApiKey: process.env.TEST_EXASEARCH_API_KEY ?? 'exa-test-key'
                },
                visibility: ['Private', 'Platform', 'Organization'] as any
            })
        )

        logger.info(
            `[test-utils] Created orphaned test data - Chatflow: ${templateId}, Credentials: ${openAICredential.id}, ${exaCredential.id}`
        )
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: test-utils.createOrphanedTestData - ${getErrorMessage(error)}`
        )
    }
}

export async function seedScenario(scenario: string, providedDataSource?: SupportedDataSource, options?: ScenarioOptions): Promise<void> {
    const ds = ensureDataSource(providedDataSource)
    const shouldSkipReset = options?.skipReset ?? false

    try {
        if (!shouldSkipReset) {
            await resetDatabase(ds)
        }

        const buildUserConfig = () => ({
            auth0Id: process.env.TEST_USER_ENTERPRISE_ADMIN_AUTH0_ID ?? 'auth0|seed-e2e-user',
            email: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL ?? 'seed-e2e-user@example.com',
            name: process.env.TEST_USER_ENTERPRISE_ADMIN_NAME ?? 'Seed E2E User',
            organization: {
                auth0Id: process.env.TEST_ENTERPRISE_AUTH0_ORG_ID ?? 'org_seed_e2e',
                name: process.env.TEST_ENTERPRISE_ORG_NAME ?? 'Seed Org'
            }
        })

        switch (scenario) {
            case 'baseline':
                await seedBaseline(ds)
                break
            case 'user-with-openai':
                await seedTestData(
                    {
                        user: buildUserConfig(),
                        credentials: {
                            openai: { name: 'Seed OpenAI', assigned: true }
                        }
                    },
                    ds
                )
                break
            case 'user-with-exa':
                await seedTestData(
                    {
                        user: buildUserConfig(),
                        credentials: {
                            exa: { name: 'Seed Exa', assigned: true }
                        }
                    },
                    ds
                )
                break
            case 'user-with-both-credentials':
                await seedTestData(
                    {
                        user: buildUserConfig(),
                        credentials: {
                            openai: { name: 'Seed OpenAI', assigned: true },
                            exa: { name: 'Seed Exa', assigned: true }
                        }
                    },
                    ds
                )
                break
            default:
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `Error: test-utils.seedScenario - Unknown scenario: ${scenario}`)
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: test-utils.seedScenario - ${getErrorMessage(error)}`)
    }
}

type CredentialSeedDefinition = {
    credentialName: string
    aliases: string[]
    defaultName: string
    buildData: (overrides?: Record<string, any>) => Record<string, any>
}

const CREDENTIAL_DEFINITIONS: CredentialSeedDefinition[] = [
    {
        credentialName: 'openAIApi',
        aliases: ['openai', 'openaiapi', 'open_ai'],
        defaultName: 'Seeded OpenAI API Key',
        buildData: (overrides: Record<string, any> = {}) => ({
            openAIApiKey: overrides.openAIApiKey ?? overrides.apiKey ?? 'sk-test-openai'
        })
    },
    {
        credentialName: 'exaSearchApi',
        aliases: ['exa', 'exasearch'],
        defaultName: 'Seeded Exa API Key',
        buildData: (overrides: Record<string, any> = {}) => ({
            exaSearchApiKey: overrides.exaSearchApiKey ?? overrides.apiKey ?? 'exa-test-key'
        })
    },
    {
        credentialName: 'JiraApi',
        aliases: ['jira', 'jiraapi'],
        defaultName: 'Seeded Jira Credential',
        buildData: (overrides: Record<string, any> = {}) => ({
            accessToken: overrides.accessToken ?? 'test-jira-token',
            username: overrides.username ?? 'jira-bot@example.com',
            host: overrides.host ?? 'https://example.atlassian.net'
        })
    },
    {
        credentialName: 'confluenceCloudApi',
        aliases: ['confluence', 'confluencecloud', 'confluenceapi'],
        defaultName: 'Seeded Confluence Credential',
        buildData: (overrides: Record<string, any> = {}) => ({
            accessToken: overrides.accessToken ?? 'test-confluence-token',
            username: overrides.username ?? 'confluence-bot@example.com',
            baseURL: overrides.baseURL ?? 'https://example.atlassian.net/wiki'
        })
    }
]

const resolveCredentialSeedDefinition = (key: string): CredentialSeedDefinition | undefined => {
    const normalized = key.trim()
    const lower = normalized.toLowerCase()

    return CREDENTIAL_DEFINITIONS.find((definition) => {
        if (definition.credentialName === normalized || definition.credentialName.toLowerCase() === lower) {
            return true
        }

        return definition.aliases.some((alias) => alias === normalized || alias.toLowerCase() === lower)
    })
}

const normalizeCredentialEntries = (config?: SeedCredentialConfig): SeedCredentialEntry[] => {
    if (!config) {
        return []
    }

    if (Array.isArray(config)) {
        return config
    }

    return [config]
}

const mapCredentialToChatflowVisibility = (values: CredentialVisibility[]): ChatflowVisibility[] => {
    const mapped = new Set<ChatflowVisibility>()

    values.forEach((value) => {
        switch (value) {
            case CredentialVisibility.ORGANIZATION:
                mapped.add(ChatflowVisibility.ORGANIZATION)
                break
            case CredentialVisibility.PRIVATE:
                mapped.add(ChatflowVisibility.PRIVATE)
                break
            case CredentialVisibility.PLATFORM:
                mapped.add(ChatflowVisibility.ANSWERAI)
                break
            default:
                mapped.add(ChatflowVisibility.PRIVATE)
                break
        }
    })

    return Array.from(mapped)
}

const ensureFlowDataAssignment = (flow: any, credentialName: string, credentialId?: string): void => {
    if (!flow?.nodes) {
        return
    }

    flow.nodes.forEach((node: any) => {
        const inputParams = Array.isArray(node?.data?.inputParams) ? node.data.inputParams : []
        const credentialParams = inputParams.filter(
            (param: any) =>
                param?.type === 'credential' && Array.isArray(param.credentialNames) && param.credentialNames.includes(credentialName)
        )

        if (!credentialParams.length) {
            return
        }

        if (!node.data) {
            node.data = {}
        }

        if (credentialId) {
            node.data.credential = credentialId
            node.data.inputs = node.data.inputs ? { ...node.data.inputs } : {}
            node.data.inputs.FLOWISE_CREDENTIAL_ID = credentialId

            credentialParams
                .filter((param: any) => typeof param?.name === 'string' && param.name.length > 0)
                .forEach((param: any) => {
                    node.data.inputs[param.name] = credentialId
                })
        } else {
            if (node.data.credential) {
                delete node.data.credential
            }

            if (node.data.inputs) {
                delete node.data.inputs.FLOWISE_CREDENTIAL_ID
                credentialParams
                    .filter((param: any) => typeof param?.name === 'string' && param.name.length > 0)
                    .forEach((param: any) => {
                        if (param.name in node.data.inputs) {
                            delete node.data.inputs[param.name]
                        }
                    })
            }
        }
    })
}

export async function seedTestData(config: SeedTestConfig, providedDataSource?: SupportedDataSource): Promise<void> {
    const ds = ensureDataSource(providedDataSource)

    if (!config?.user) {
        throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: test-utils.seedTestData - user configuration is required')
    }

    const templateId = config.chatflow?.templateId ?? resolveInitialChatflowId()

    try {
        await ensureTemplateChatflow(ds, templateId)

        const organizationRepo = ds.getRepository(Organization)
        const userRepo = ds.getRepository(User)
        const credentialRepo = ds.getRepository(Credential)
        const chatflowRepo = ds.getRepository(ChatFlow)

        // Upsert organization
        let organization = await organizationRepo.findOne({ where: { auth0Id: config.user.organization.auth0Id } })
        if (!organization) {
            organization = organizationRepo.create({
                auth0Id: config.user.organization.auth0Id,
                name: config.user.organization.name
            })
        } else {
            organization.name = config.user.organization.name
        }
        organization = await organizationRepo.save(organization)

        // Upsert user
        let user = await userRepo.findOne({ where: { auth0Id: config.user.auth0Id } })
        if (!user) {
            user = userRepo.create({
                auth0Id: config.user.auth0Id,
                email: config.user.email,
                name: config.user.name ?? config.user.email,
                organizationId: organization.id
            })
        } else {
            user.email = config.user.email
            user.name = config.user.name ?? user.name ?? config.user.email
            user.organizationId = organization.id
        }
        user = await userRepo.save(user)

        // Clean up existing credentials and chatflows for deterministic state
        await credentialRepo.delete({ userId: user.id })
        await chatflowRepo.delete({ userId: user.id })

        const assignedCredentialByType = new Map<string, string>()

        if (config.credentials) {
            for (const [key, rawConfig] of Object.entries(config.credentials)) {
                const definition = resolveCredentialSeedDefinition(key)

                if (!definition) {
                    throw new InternalFlowiseError(
                        StatusCodes.BAD_REQUEST,
                        `Error: test-utils.seedTestData - Unknown credential alias: ${key}`
                    )
                }

                const entries = normalizeCredentialEntries(rawConfig)

                for (const entry of entries) {
                    const shouldCreate = entry.create !== false
                    const assigned = entry.assigned ?? false

                    if (!shouldCreate) {
                        if (!assigned) {
                            continue
                        }

                        throw new InternalFlowiseError(
                            StatusCodes.PRECONDITION_FAILED,
                            `Error: test-utils.seedTestData - Cannot assign credential '${definition.credentialName}' without creating it`
                        )
                    }

                    const credentialBody = {
                        name: entry.name ?? definition.defaultName,
                        credentialName: definition.credentialName,
                        plainDataObj: definition.buildData(entry.data),
                        userId: user.id,
                        organizationId: organization.id
                    } as Parameters<typeof transformToCredentialEntity>[0]

                    if (entry.visibility?.length) {
                        credentialBody.visibility = mapCredentialToChatflowVisibility(entry.visibility)
                    }

                    const credentialEntity = await transformToCredentialEntity(credentialBody)

                    const savedCredential = await credentialRepo.save(credentialEntity)

                    if (assigned) {
                        assignedCredentialByType.set(definition.credentialName, savedCredential.id)
                    }
                }
            }
        }

        const template = await chatflowRepo.findOne({ where: { id: templateId } })

        if (!template) {
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Error: test-utils.seedTestData - Template chatflow ${templateId} not found`
            )
        }

        const flowData = JSON.parse(template.flowData)

        // Always clear assignments for known credential types to guarantee deterministic state
        CREDENTIAL_DEFINITIONS.forEach((definition) => {
            ensureFlowDataAssignment(flowData, definition.credentialName, undefined)
        })

        // Apply configured assignments
        assignedCredentialByType.forEach((credentialId, credentialName) => {
            ensureFlowDataAssignment(flowData, credentialName, credentialId)
        })

        const chatflowEntity = chatflowRepo.create({
            name: config.chatflow?.name ?? template.name ?? 'Seeded Chatflow',
            description: config.chatflow?.description ?? template.description,
            flowData: JSON.stringify(flowData),
            deployed: template.deployed ?? false,
            isPublic: template.isPublic ?? false,
            chatbotConfig: template.chatbotConfig,
            visibility: template.visibility ?? [ChatflowVisibility.PRIVATE],
            answersConfig: template.answersConfig,
            apiConfig: template.apiConfig,
            analytic: template.analytic,
            speechToText: template.speechToText,
            followUpPrompts: template.followUpPrompts,
            category: template.category,
            type: template.type,
            browserExtConfig: template.browserExtConfig,
            parentChatflowId: templateId,
            userId: user.id,
            organizationId: organization.id,
            currentVersion: template.currentVersion ?? 1
        })

        const savedChatflow = await chatflowRepo.save(chatflowEntity)

        user.defaultChatflowId = savedChatflow.id
        await userRepo.save(user)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: test-utils.seedTestData - ${getErrorMessage(error)}`)
    }
}
