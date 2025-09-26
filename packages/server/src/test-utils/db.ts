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

// Test user roles mapped to environment variables
type TestUserRole = 'admin' | 'builder' | 'member'

// Test user configuration from environment
type EnvTestUser = {
    auth0Id?: string
    email: string
    name?: string
    role: TestUserRole
}

// Test credential configuration from environment
type EnvTestCredential = {
    name: string
    credentialName: string
    envKeys: Record<string, string> // Maps credential field to env var name
    defaultValues: Record<string, string> // Fallback values
}

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

/**
 * Get test user configuration from environment variables
 */
const getTestUsers = (): Record<TestUserRole, EnvTestUser> => {
    const requiredEnvVars = [
        'TEST_USER_ENTERPRISE_ADMIN_EMAIL',
        'TEST_USER_ENTERPRISE_BUILDER_EMAIL',
        'TEST_USER_ENTERPRISE_MEMBER_EMAIL',
        'TEST_USER_PASSWORD',
        'TEST_ENTERPRISE_AUTH0_ORG_ID',
        'TEST_ENTERPRISE_ORG_NAME'
    ]

    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])
    if (missing.length > 0) {
        throw new InternalFlowiseError(
            StatusCodes.PRECONDITION_FAILED,
            `Error: test-utils.getTestUsers - Missing required environment variables: ${missing.join(', ')}`
        )
    }

    return {
        admin: {
            auth0Id: process.env.TEST_USER_ENTERPRISE_ADMIN_AUTH0_ID,
            email: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!,
            name: process.env.TEST_USER_ENTERPRISE_ADMIN_NAME,
            role: 'admin'
        },
        builder: {
            auth0Id: process.env.TEST_USER_ENTERPRISE_BUILDER_AUTH0_ID,
            email: process.env.TEST_USER_ENTERPRISE_BUILDER_EMAIL!,
            name: process.env.TEST_USER_ENTERPRISE_BUILDER_NAME,
            role: 'builder'
        },
        member: {
            auth0Id: process.env.TEST_USER_ENTERPRISE_MEMBER_AUTH0_ID,
            email: process.env.TEST_USER_ENTERPRISE_MEMBER_EMAIL!,
            name: process.env.TEST_USER_ENTERPRISE_MEMBER_NAME,
            role: 'member'
        }
    }
}

/**
 * Get test organization configuration from environment variables
 */
const getTestOrganization = (): SeedOrganizationConfig => {
    if (!process.env.TEST_ENTERPRISE_AUTH0_ORG_ID || !process.env.TEST_ENTERPRISE_ORG_NAME) {
        throw new InternalFlowiseError(
            StatusCodes.PRECONDITION_FAILED,
            'Error: test-utils.getTestOrganization - TEST_ENTERPRISE_AUTH0_ORG_ID and TEST_ENTERPRISE_ORG_NAME are required'
        )
    }

    return {
        auth0Id: process.env.TEST_ENTERPRISE_AUTH0_ORG_ID,
        name: process.env.TEST_ENTERPRISE_ORG_NAME
    }
}

/**
 * Get test credential configurations from environment variables
 */
const getTestCredentials = (): Record<string, EnvTestCredential> => {
    return {
        openai: {
            name: 'E2E OpenAI Key',
            credentialName: 'openAIApi',
            envKeys: {
                openAIApiKey: 'TEST_OPENAI_API_KEY'
            },
            defaultValues: {
                openAIApiKey: 'sk-test-openai'
            }
        },
        exa: {
            name: 'E2E Exa Search Key',
            credentialName: 'exaSearchApi',
            envKeys: {
                exaSearchApiKey: 'TEST_EXASEARCH_API_KEY'
            },
            defaultValues: {
                exaSearchApiKey: 'exa-test-key'
            }
        },
        jira: {
            name: 'E2E Jira Credential',
            credentialName: 'JiraApi',
            envKeys: {
                accessToken: 'TEST_JIRA_ACCESS_TOKEN',
                username: 'TEST_JIRA_USERNAME',
                host: 'TEST_JIRA_HOST'
            },
            defaultValues: {
                accessToken: 'test-jira-token',
                username: 'jira-bot@example.com',
                host: 'https://example.atlassian.net'
            }
        },
        confluence: {
            name: 'E2E Confluence Credential',
            credentialName: 'confluenceCloudApi',
            envKeys: {
                accessToken: 'TEST_CONFLUENCE_ACCESS_TOKEN',
                username: 'TEST_CONFLUENCE_USERNAME',
                baseURL: 'TEST_CONFLUENCE_BASE_URL'
            },
            defaultValues: {
                accessToken: 'test-confluence-token',
                username: 'confluence-bot@example.com',
                baseURL: 'https://example.atlassian.net/wiki'
            }
        },
        github: {
            name: 'E2E GitHub Credential',
            credentialName: 'githubApi',
            envKeys: {
                accessToken: 'TEST_GITHUB_API_TOKEN'
            },
            defaultValues: {
                accessToken: 'test-github-token'
            }
        },
        slack: {
            name: 'E2E Slack Credential',
            credentialName: 'slackApi',
            envKeys: {
                botToken: 'TEST_SLACK_BOT_TOKEN'
            },
            defaultValues: {
                botToken: 'xoxb-test-slack-bot-token'
            }
        },
        contentful: {
            name: 'E2E Contentful Credential',
            credentialName: 'contentfulManagementApi',
            envKeys: {
                managementToken: 'TEST_CONTENTFUL_MANAGEMENT_TOKEN',
                spaceId: 'TEST_CONTENTFUL_SPACE_ID'
            },
            defaultValues: {
                managementToken: 'test-contentful-management-token',
                spaceId: 'test-space-id'
            }
        }
    }
}

/**
 * Build credential data from environment or defaults
 */
const buildCredentialData = (credConfig: EnvTestCredential): Record<string, any> => {
    const data: Record<string, any> = {}

    for (const [fieldName, envVarName] of Object.entries(credConfig.envKeys)) {
        data[fieldName] = process.env[envVarName] || credConfig.defaultValues[fieldName]
    }

    return data
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
    logger.info('[test-utils] 🔄 Starting database reset...')
    const ds = ensureDataSource(providedDataSource)
    const dbType = String(ds.options.type)

    const tables = await fetchTableNames(ds)
    if (!tables.length) {
        logger.info('[test-utils] ✅ Database reset complete (no tables found)')
        return
    }

    logger.info(`[test-utils] 📋 Resetting ${tables.length} tables (${dbType})`)

    if (dbType === 'postgres') {
        const identifiers = tables.map((table) => `"public"."${table}"`).join(', ')
        await ds.query(`TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`)
        logger.info('[test-utils] ✅ Database reset complete (PostgreSQL)')
        return
    }

    if (dbType === 'mysql' || dbType === 'mariadb') {
        await ds.query('SET FOREIGN_KEY_CHECKS = 0')
        for (const table of tables) {
            await ds.query(`TRUNCATE TABLE \`${table}\``)
        }
        await ds.query('SET FOREIGN_KEY_CHECKS = 1')
        logger.info('[test-utils] ✅ Database reset complete (MySQL/MariaDB)')
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
        logger.info('[test-utils] ✅ Database reset complete (SQLite)')
        return
    }

    throw new InternalFlowiseError(StatusCodes.NOT_IMPLEMENTED, `Error: test-utils.resetDatabase - Unsupported database type: ${dbType}`)
}

export async function seedBaseline(providedDataSource?: SupportedDataSource): Promise<void> {
    logger.info('[test-utils] 🌱 Starting baseline seed...')
    const ds = ensureDataSource(providedDataSource)
    const templateId = resolveInitialChatflowId()

    await ensureTemplateChatflow(ds, templateId)

    const organizationRepo = ds.getRepository(Organization)
    const organizationConfig = getTestOrganization()

    logger.info(`[test-utils] 🏢 Creating organization: ${organizationConfig.name}`)
    const organization = organizationRepo.create(organizationConfig)
    await organizationRepo.save(organization)

    const credentialRepo = ds.getRepository(Credential)
    const testCredentials = getTestCredentials()

    logger.info('[test-utils] 🔑 Creating baseline credentials (orphaned)...')
    // Create OpenAI and Exa credentials for baseline (orphaned - no user/org assignment)
    const openAICredential = await credentialRepo.save(
        await transformToCredentialEntity({
            name: testCredentials.openai.name,
            credentialName: testCredentials.openai.credentialName,
            plainDataObj: buildCredentialData(testCredentials.openai)
        })
    )

    const exaCredential = await credentialRepo.save(
        await transformToCredentialEntity({
            name: testCredentials.exa.name,
            credentialName: testCredentials.exa.credentialName,
            plainDataObj: buildCredentialData(testCredentials.exa)
        })
    )

    logger.info(
        `[test-utils] ✅ Baseline seed complete - Org: ${organization.id}, Credentials: ${openAICredential.id}, ${exaCredential.id}`
    )
}

export async function createOrphanedTestData(providedDataSource?: SupportedDataSource): Promise<void> {
    logger.info('[test-utils] 🏗️ Starting orphaned test data creation...')
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
        const testCredentials = getTestCredentials()

        logger.info('[test-utils] 🔑 Creating orphaned credentials with platform visibility...')
        await credentialRepo.delete({ name: testCredentials.openai.name, credentialName: 'openAIApi' })
        await credentialRepo.delete({ name: testCredentials.exa.name, credentialName: 'exaSearchApi' })

        // OpenAI credential
        const openAICredential = await credentialRepo.save(
            await transformToCredentialEntity({
                name: testCredentials.openai.name,
                credentialName: testCredentials.openai.credentialName,
                plainDataObj: buildCredentialData(testCredentials.openai),
                visibility: ['Private', 'Platform', 'Organization'] as any
            })
        )

        // Exa credential
        const exaCredential = await credentialRepo.save(
            await transformToCredentialEntity({
                name: testCredentials.exa.name,
                credentialName: testCredentials.exa.credentialName,
                plainDataObj: buildCredentialData(testCredentials.exa),
                visibility: ['Private', 'Platform', 'Organization'] as any
            })
        )

        logger.info(
            `[test-utils] ✅ Orphaned test data created - Chatflow: ${templateId}, Credentials: ${openAICredential.id}, ${exaCredential.id}`
        )
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: test-utils.createOrphanedTestData - ${getErrorMessage(error)}`
        )
    }
}

export async function seedScenario(scenario: string, providedDataSource?: SupportedDataSource, options?: ScenarioOptions): Promise<void> {
    logger.info(`[test-utils] 🎯 Starting scenario: "${scenario}"`)
    const ds = ensureDataSource(providedDataSource)
    const shouldSkipReset = options?.skipReset ?? false

    try {
        if (!shouldSkipReset) {
            await resetDatabase(ds)
        } else {
            logger.info('[test-utils] ⏭️ Skipping database reset')
        }

        const testUsers = getTestUsers()
        const organization = getTestOrganization()

        // Use admin user for all scenarios (can be made configurable later)
        const adminUser = testUsers.admin
        logger.info(`[test-utils] 👤 Using user: ${adminUser.email}`)

        const userConfig = {
            auth0Id: adminUser.auth0Id || `auth0|${adminUser.email}`,
            email: adminUser.email,
            name: adminUser.name || adminUser.email,
            organization
        }

        switch (scenario) {
            case 'baseline':
                await seedBaseline(ds)
                break
            case 'user-with-openai':
                logger.info('[test-utils] 🤖 Creating user with OpenAI credential...')
                await seedTestData(
                    {
                        user: userConfig,
                        credentials: {
                            openai: { name: 'Seed OpenAI', assigned: true }
                        }
                    },
                    ds
                )
                break
            case 'user-with-exa':
                logger.info('[test-utils] 🔍 Creating user with Exa credential...')
                await seedTestData(
                    {
                        user: userConfig,
                        credentials: {
                            exa: { name: 'Seed Exa', assigned: true }
                        }
                    },
                    ds
                )
                break
            case 'user-with-both-credentials':
                logger.info('[test-utils] 🤖🔍 Creating user with OpenAI + Exa credentials...')
                await seedTestData(
                    {
                        user: userConfig,
                        credentials: {
                            openai: { name: 'Seed OpenAI', assigned: true },
                            exa: { name: 'Seed Exa', assigned: true }
                        }
                    },
                    ds
                )
                break
            case 'user-with-all-credentials':
                logger.info('[test-utils] 🌟 Creating user with all available credentials...')
                await seedTestData(
                    {
                        user: userConfig,
                        credentials: {
                            openai: { name: 'Seed OpenAI', assigned: true },
                            exa: { name: 'Seed Exa', assigned: true },
                            jira: { name: 'Seed Jira', assigned: false },
                            confluence: { name: 'Seed Confluence', assigned: false },
                            github: { name: 'Seed GitHub', assigned: false },
                            contentful: { name: 'Seed Contentful', assigned: false },
                            slack: { name: 'Seed Slack', assigned: false }
                        }
                    },
                    ds
                )
                break
            case 'user-with-all-but-slack-assigned':
                logger.info('[test-utils] 🌟 Creating user with all credentials assigned except Slack...')
                await seedTestData(
                    {
                        user: userConfig,
                        credentials: {
                            openai: { name: 'Seed OpenAI', assigned: true },
                            exa: { name: 'Seed Exa', assigned: true },
                            jira: { name: 'Seed Jira', assigned: true },
                            confluence: { name: 'Seed Confluence', assigned: true },
                            github: { name: 'Seed GitHub', assigned: true },
                            contentful: { name: 'Seed Contentful', assigned: true },
                            slack: { name: 'Seed Slack', assigned: false }
                        }
                    },
                    ds
                )
                break
            default:
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `Error: test-utils.seedScenario - Unknown scenario: ${scenario}`)
        }

        logger.info(`[test-utils] ✅ Scenario "${scenario}" completed successfully`)
    } catch (error) {
        logger.error(`[test-utils] ❌ Scenario "${scenario}" failed: ${getErrorMessage(error)}`)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: test-utils.seedScenario - ${getErrorMessage(error)}`)
    }
}

type CredentialSeedDefinition = {
    credentialName: string
    aliases: string[]
    defaultName: string
    buildData: (overrides?: Record<string, any>) => Record<string, any>
}

// Legacy credential definitions - now generated from getTestCredentials()
const getLegacyCredentialDefinitions = (): CredentialSeedDefinition[] => {
    const testCreds = getTestCredentials()

    return [
        {
            credentialName: testCreds.openai.credentialName,
            aliases: ['openai', 'openaiapi', 'open_ai'],
            defaultName: testCreds.openai.name,
            buildData: (overrides: Record<string, any> = {}) => {
                const data = buildCredentialData(testCreds.openai)
                return { ...data, ...overrides }
            }
        },
        {
            credentialName: testCreds.exa.credentialName,
            aliases: ['exa', 'exasearch'],
            defaultName: testCreds.exa.name,
            buildData: (overrides: Record<string, any> = {}) => {
                const data = buildCredentialData(testCreds.exa)
                return { ...data, ...overrides }
            }
        },
        {
            credentialName: testCreds.jira.credentialName,
            aliases: ['jira', 'jiraapi'],
            defaultName: testCreds.jira.name,
            buildData: (overrides: Record<string, any> = {}) => {
                const data = buildCredentialData(testCreds.jira)
                return { ...data, ...overrides }
            }
        },
        {
            credentialName: testCreds.confluence.credentialName,
            aliases: ['confluence', 'confluencecloud', 'confluenceapi'],
            defaultName: testCreds.confluence.name,
            buildData: (overrides: Record<string, any> = {}) => {
                const data = buildCredentialData(testCreds.confluence)
                return { ...data, ...overrides }
            }
        },
        {
            credentialName: testCreds.github.credentialName,
            aliases: ['github', 'githubapi'],
            defaultName: testCreds.github.name,
            buildData: (overrides: Record<string, any> = {}) => {
                const data = buildCredentialData(testCreds.github)
                return { ...data, ...overrides }
            }
        },
        {
            credentialName: testCreds.slack.credentialName,
            aliases: ['slack', 'slackapi'],
            defaultName: testCreds.slack.name,
            buildData: (overrides: Record<string, any> = {}) => {
                const data = buildCredentialData(testCreds.slack)
                return { ...data, ...overrides }
            }
        },
        {
            credentialName: testCreds.contentful.credentialName,
            aliases: ['contentful', 'contentfulapi', 'contentfulmanagement'],
            defaultName: testCreds.contentful.name,
            buildData: (overrides: Record<string, any> = {}) => {
                const data = buildCredentialData(testCreds.contentful)
                return { ...data, ...overrides }
            }
        }
    ]
}

const resolveCredentialSeedDefinition = (key: string): CredentialSeedDefinition | undefined => {
    const normalized = key.trim()
    const lower = normalized.toLowerCase()
    const definitions = getLegacyCredentialDefinitions()

    return definitions.find((definition) => {
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
    console.log(`[DEBUG] ensureFlowDataAssignment called - credentialName: ${credentialName}, credentialId: ${credentialId}`)
    logger.info(`[test-utils] 🔍 ensureFlowDataAssignment called - credentialName: ${credentialName}, credentialId: ${credentialId}`)

    if (!flow?.nodes) {
        console.log(`[DEBUG] No flow nodes found`)
        logger.info(`[test-utils] ❌ No flow nodes found`)
        return
    }

    logger.info(`[test-utils] 📊 Processing ${flow.nodes.length} nodes`)

    let assignmentCount = 0
    flow.nodes.forEach((node: any, index: number) => {
        const nodeId = node.id || `node_${index}`
        const nodeName = node.data?.name || node.data?.label || 'Unknown'

        const inputParams = Array.isArray(node?.data?.inputParams) ? node.data.inputParams : []
        logger.info(`[test-utils] 🔍 Node ${nodeId} (${nodeName}): ${inputParams.length} input params`)

        const credentialParams = inputParams.filter(
            (param: any) =>
                param?.type === 'credential' && Array.isArray(param.credentialNames) && param.credentialNames.includes(credentialName)
        )

        logger.info(`[test-utils] 🎯 Node ${nodeId}: Found ${credentialParams.length} matching credential params for ${credentialName}`)

        if (credentialParams.length > 0) {
            credentialParams.forEach((param: any) => {
                logger.info(`[test-utils] 📝 Credential param: ${param.name}, credentialNames: ${JSON.stringify(param.credentialNames)}`)
            })
        }

        if (!credentialParams.length) {
            return
        }

        if (!node.data) {
            node.data = {}
        }

        if (credentialId) {
            logger.info(`[test-utils] ✅ Assigning credential ${credentialId} to node ${nodeId} (${nodeName})`)
            node.data.credential = credentialId
            node.data.inputs = node.data.inputs ? { ...node.data.inputs } : {}
            node.data.inputs.FLOWISE_CREDENTIAL_ID = credentialId

            credentialParams
                .filter((param: any) => typeof param?.name === 'string' && param.name.length > 0)
                .forEach((param: any) => {
                    logger.info(`[test-utils] 🔗 Setting ${param.name} = ${credentialId} in node ${nodeId}`)
                    node.data.inputs[param.name] = credentialId
                })

            // Debug: Show the final node state after assignment
            console.log(`[DEBUG] Node ${nodeId} after assignment:`)
            console.log(`[DEBUG] - node.data.credential: ${node.data.credential}`)
            console.log(`[DEBUG] - node.data.inputs.FLOWISE_CREDENTIAL_ID: ${node.data.inputs.FLOWISE_CREDENTIAL_ID}`)
            console.log(`[DEBUG] - node.data.inputs.credential: ${node.data.inputs.credential}`)

            assignmentCount++
        } else {
            logger.info(`[test-utils] 🧹 Clearing credential assignment from node ${nodeId} (${nodeName})`)
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

    logger.info(`[test-utils] 📊 ensureFlowDataAssignment completed - ${assignmentCount} nodes assigned for ${credentialName}`)
}

export async function seedTestData(config: SeedTestConfig, providedDataSource?: SupportedDataSource): Promise<void> {
    logger.info('[test-utils] 🌱 Starting test data seed...')
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
        logger.info(`[test-utils] 🏢 Setting up organization: ${config.user.organization.name}`)
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
        logger.info(`[test-utils] 👤 Setting up user: ${config.user.email}`)
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
        logger.info('[test-utils] 🧹 Cleaning existing user data for fresh state...')
        await credentialRepo.delete({ userId: user.id })
        await chatflowRepo.delete({ userId: user.id })

        const assignedCredentialByType = new Map<string, string>()

        if (config.credentials) {
            const credentialCount = Object.keys(config.credentials).length
            logger.info(`[test-utils] 🔑 Creating ${credentialCount} credential type(s)...`)

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

                    const credentialName = entry.name ?? definition.defaultName
                    const credentialBody = {
                        name: credentialName,
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
                        logger.info(`[test-utils] 📌 Credential "${credentialName}" will be assigned to chatflow`)
                        assignedCredentialByType.set(definition.credentialName, savedCredential.id)
                    } else {
                        logger.info(`[test-utils] 📋 Credential "${credentialName}" created but not assigned`)
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

        logger.info('[test-utils] 🔧 Configuring chatflow with credential assignments...')
        const flowData = JSON.parse(template.flowData)

        // Always clear assignments for known credential types to guarantee deterministic state
        logger.info(`[test-utils] 🧹 Clearing existing credential assignments...`)
        getLegacyCredentialDefinitions().forEach((definition) => {
            logger.info(`[test-utils] 🗑️ Clearing assignments for: ${definition.credentialName}`)
            ensureFlowDataAssignment(flowData, definition.credentialName, undefined)
        })

        // Apply configured assignments
        console.log(`[DEBUG] About to check assignment count`)
        const assignmentCount = assignedCredentialByType.size
        console.log(`[DEBUG] assignmentCount: ${assignmentCount}`)
        console.log(`[DEBUG] assignedCredentialByType size: ${assignedCredentialByType.size}`)
        console.log(`[DEBUG] assignedCredentialByType type:`, typeof assignedCredentialByType)

        try {
            if (assignmentCount > 0) {
                console.log(`[DEBUG] About to apply ${assignmentCount} assignments`)
                logger.info(`[test-utils] 🔗 Applying ${assignmentCount} credential assignment(s)`)
                console.log(`[DEBUG] After log message, about to process map`)

                logger.info(`[test-utils] 📋 Assignment map contents:`)
                assignedCredentialByType.forEach((credentialId, credentialName) => {
                    console.log(`[DEBUG] Map entry: ${credentialName} -> ${credentialId}`)
                    logger.info(`[test-utils] 📌 ${credentialName} -> ${credentialId}`)
                })

                console.log(`[DEBUG] About to start assignment processing`)
                assignedCredentialByType.forEach((credentialId, credentialName) => {
                    console.log(`[DEBUG] Processing: ${credentialName} = ${credentialId}`)
                    logger.info(`[test-utils] 🔧 Processing assignment: ${credentialName} = ${credentialId}`)
                    ensureFlowDataAssignment(flowData, credentialName, credentialId)
                })
                console.log(`[DEBUG] Assignment processing completed`)
            } else {
                console.log(`[DEBUG] No assignments to apply - map is empty`)
                logger.info(`[test-utils] ❌ No credential assignments to apply`)
            }
        } catch (error) {
            console.log(`[DEBUG] ERROR in assignment section:`, error)
            logger.error(`[test-utils] ❌ Error during credential assignment: ${error}`)
            throw error
        }

        const chatflowName = config.chatflow?.name ?? template.name ?? 'Seeded Chatflow'
        logger.info(`[test-utils] 📋 Creating user chatflow: "${chatflowName}"`)

        const chatflowEntity = chatflowRepo.create({
            name: chatflowName,
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

        logger.info(`[test-utils] ✅ Test data seed complete - User: ${user.id}, Org: ${organization.id}, Chatflow: ${savedChatflow.id}`)
    } catch (error) {
        logger.error(`[test-utils] ❌ Test data seed failed: ${getErrorMessage(error)}`)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: test-utils.seedTestData - ${getErrorMessage(error)}`)
    }
}

// ===== NEW SIMPLIFIED API METHODS =====

/**
 * Seed a specific test user with optional credentials
 * This is the main method for E2E test scenarios
 */
export async function seedUserWithCredentials(
    userRole: TestUserRole = 'admin',
    credentialTypes: string[] = [],
    options?: { assignCredentials?: boolean; providedDataSource?: SupportedDataSource }
): Promise<{ userId: string; organizationId: string; chatflowId: string; credentialIds: Record<string, string> }> {
    logger.info(`[test-utils] 🚀 Starting seedUserWithCredentials for ${userRole} user with ${credentialTypes.length} credential type(s)`)
    const ds = ensureDataSource(options?.providedDataSource)
    const assignCredentials = options?.assignCredentials ?? true

    try {
        const testUsers = getTestUsers()
        const organization = getTestOrganization()
        const selectedUser = testUsers[userRole]

        const userConfig = {
            auth0Id: selectedUser.auth0Id || `auth0|${selectedUser.email}`,
            email: selectedUser.email,
            name: selectedUser.name || selectedUser.email,
            organization
        }

        // Build credentials config
        const credentialsConfig: Record<string, SeedCredentialEntry> = {}
        for (const credType of credentialTypes) {
            credentialsConfig[credType] = {
                assigned: assignCredentials
            }
        }

        const config: SeedTestConfig = {
            user: userConfig,
            credentials: credentialsConfig
        }

        await seedTestData(config, ds)

        // Return useful info for tests
        logger.info('[test-utils] 📊 Collecting seeded data information...')
        const organizationRepo = ds.getRepository(Organization)
        const userRepo = ds.getRepository(User)
        const chatflowRepo = ds.getRepository(ChatFlow)
        const credentialRepo = ds.getRepository(Credential)

        const org = await organizationRepo.findOne({ where: { auth0Id: organization.auth0Id } })
        const user = await userRepo.findOne({ where: { email: selectedUser.email } })
        const chatflow = await chatflowRepo.findOne({ where: { userId: user!.id } })

        const credentialIds: Record<string, string> = {}
        if (credentialTypes.length > 0) {
            const credentials = await credentialRepo.find({ where: { userId: user!.id } })
            for (const cred of credentials) {
                // Map back to test credential type
                const testCreds = getTestCredentials()
                for (const [key, config] of Object.entries(testCreds)) {
                    if (config.credentialName === cred.credentialName) {
                        credentialIds[key] = cred.id
                        break
                    }
                }
            }
        }

        const result = {
            userId: user!.id,
            organizationId: org!.id,
            chatflowId: chatflow!.id,
            credentialIds
        }

        logger.info(
            `[test-utils] ✅ seedUserWithCredentials complete - User: ${result.userId}, Org: ${result.organizationId}, Chatflow: ${result.chatflowId}`
        )
        return result
    } catch (error) {
        logger.error(`[test-utils] ❌ seedUserWithCredentials failed: ${getErrorMessage(error)}`)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: test-utils.seedUserWithCredentials - ${getErrorMessage(error)}`
        )
    }
}

/**
 * Get available test users from environment
 */
export function getAvailableTestUsers(): Record<TestUserRole, { email: string; name?: string }> {
    const users = getTestUsers()
    return {
        admin: { email: users.admin.email, name: users.admin.name },
        builder: { email: users.builder.email, name: users.builder.name },
        member: { email: users.member.email, name: users.member.name }
    }
}

/**
 * Get available test credentials from environment
 */
export function getAvailableTestCredentials(): Record<string, { name: string; credentialName: string; hasEnvVars: boolean }> {
    const creds = getTestCredentials()
    const result: Record<string, { name: string; credentialName: string; hasEnvVars: boolean }> = {}

    for (const [key, config] of Object.entries(creds)) {
        const hasEnvVars = Object.values(config.envKeys).some((envVar) => !!process.env[envVar])
        result[key] = {
            name: config.name,
            credentialName: config.credentialName,
            hasEnvVars
        }
    }

    return result
}

/**
 * Quick reset to clean state
 */
export async function quickReset(providedDataSource?: SupportedDataSource): Promise<void> {
    logger.info('[test-utils] ⚡ Starting quick reset to clean state...')
    await resetDatabase(providedDataSource)
    await createOrphanedTestData(providedDataSource)
    logger.info('[test-utils] ✅ Quick reset complete')
}
