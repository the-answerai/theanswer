import { In, Repository } from 'typeorm'
import { StatusCodes } from 'http-status-codes'
import { ChatFlow, ChatflowVisibility } from '../database/entities/ChatFlow'
import { Credential } from '../database/entities/Credential'
import { Organization } from '../database/entities/Organization'
import { User } from '../database/entities/User'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { getErrorMessage } from '../errors/utils'
import logger from '../utils/logger'
import { transformToCredentialEntity } from '../utils'
import { seedBaseline } from './baseline'
import { resolveInitialChatflowId } from './config'
import { ensureDataSource } from './dataSource'
import { loadTestEnvironment, validateScenarioAliases, resolveAuth0UserId } from './environment'
import { ensureTemplateChatflow } from './template'
import { SeedCredentialEntry, SeedTestConfig, SupportedDataSource } from './types'
import { getCredentialSeedDefinitions, normalizeCredentialEntries, resolveCredentialSeedDefinition } from './credentials'

const ensureFlowDataAssignment = (flow: any, credentialName: string, credentialId?: string): void => {
    logger.debug(`[test-utils] ensureFlowDataAssignment called - credentialName: ${credentialName}, credentialId: ${credentialId}`)

    if (!flow?.nodes) {
        logger.debug('[test-utils] No flow nodes found')
        return
    }

    logger.debug(`[test-utils] Processing ${flow.nodes.length} nodes`)

    let assignmentCount = 0
    flow.nodes.forEach((node: any, index: number) => {
        const nodeId = node.id || `node_${index}`
        const nodeName = node.data?.name || node.data?.label || 'Unknown'

        const inputParams = Array.isArray(node?.data?.inputParams) ? node.data.inputParams : []
        logger.debug(`[test-utils] Node ${nodeId} (${nodeName}): ${inputParams.length} input params`)

        const credentialParams = inputParams.filter(
            (param: any) =>
                param?.type === 'credential' && Array.isArray(param.credentialNames) && param.credentialNames.includes(credentialName)
        )

        logger.debug(`[test-utils] Node ${nodeId}: Found ${credentialParams.length} matching credential params for ${credentialName}`)

        if (credentialParams.length > 0) {
            credentialParams.forEach((param: any) => {
                logger.debug(`[test-utils] Credential param: ${param.name}, credentialNames: ${JSON.stringify(param.credentialNames)}`)
            })
        }

        if (!credentialParams.length) {
            return
        }

        if (!node.data) {
            node.data = {}
        }

        if (credentialId) {
            logger.debug(`[test-utils] Assigning credential ${credentialId} to node ${nodeId} (${nodeName})`)
            node.data.credential = credentialId
            node.data.inputs = node.data.inputs ? { ...node.data.inputs } : {}
            node.data.inputs.FLOWISE_CREDENTIAL_ID = credentialId

            credentialParams
                .filter((param: any) => typeof param?.name === 'string' && param.name.length > 0)
                .forEach((param: any) => {
                    logger.debug(`[test-utils] Setting ${param.name} = ${credentialId} in node ${nodeId}`)
                    node.data.inputs[param.name] = credentialId
                })

            assignmentCount++
        } else {
            logger.debug(`[test-utils] Clearing credential assignment from node ${nodeId} (${nodeName})`)
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

    logger.info(`[test-utils] ensureFlowDataAssignment applied ${assignmentCount} assignment(s) for ${credentialName}`)
}

const reuseOrCreateCredential = async (
    credentialRepo: Repository<Credential>,
    definition: { credentialName: string; defaultName: string; buildData: (overrides?: Record<string, any>) => Record<string, any> },
    user: User,
    organizationId: string,
    entry: SeedCredentialEntry,
    existingPool: Map<string, Credential[]>
): Promise<Credential> => {
    const desiredName = entry.name ?? definition.defaultName
    const typeKey = definition.credentialName.toLowerCase()
    const pool = existingPool.get(typeKey) || []

    const existingIndex = pool.findIndex((cred) => cred.name === desiredName)
    let credential: Credential | undefined

    if (existingIndex >= 0) {
        credential = pool.splice(existingIndex, 1)[0]
        existingPool.set(typeKey, pool)
    } else if (pool.length > 0) {
        credential = pool.shift()
        existingPool.set(typeKey, pool)
    }

    const credentialBody: Parameters<typeof transformToCredentialEntity>[0] = {
        name: desiredName,
        credentialName: definition.credentialName,
        plainDataObj: definition.buildData(entry.data),
        userId: user.id,
        organizationId
    }

    if (entry.visibility?.length) {
        credentialBody.visibility = entry.visibility as any
    }

    const transformed = await transformToCredentialEntity(credentialBody)

    if (credential) {
        credential.name = transformed.name
        credential.credentialName = transformed.credentialName
        credential.encryptedData = transformed.encryptedData
        credential.visibility = transformed.visibility
        return credentialRepo.save(credential)
    }

    return credentialRepo.save(transformed)
}

export const seedTestData = async (config: SeedTestConfig, providedDataSource?: SupportedDataSource): Promise<void> => {
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

        if (!config.user.auth0Id) {
            const existingUser = await userRepo.findOne({ where: { email: config.user.email } })

            if (existingUser?.auth0Id) {
                config.user.auth0Id = existingUser.auth0Id
            } else {
                const env = loadTestEnvironment()
                const matchingUser = Object.values(env.users).find((user) => user.email === config.user.email)

                if (matchingUser) {
                    config.user.auth0Id = await resolveAuth0UserId(matchingUser)
                } else {
                    throw new InternalFlowiseError(
                        StatusCodes.PRECONDITION_FAILED,
                        `Error: test-utils.seedTestData - auth0Id missing for ${config.user.email}. Provide TEST_USER_*_AUTH0_ID or ensure the user has already logged in so we can reuse the existing record.`
                    )
                }
            }
        }

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

        const existingCredentials = await credentialRepo.find({ where: { userId: user.id } })
        const existingPool = new Map<string, Credential[]>()
        existingCredentials.forEach((cred) => {
            const key = cred.credentialName.toLowerCase()
            const list = existingPool.get(key) || []
            list.push(cred)
            existingPool.set(key, list)
        })
        const retainedCredentialIds = new Set<string>()

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

                    const credential = await reuseOrCreateCredential(credentialRepo, definition, user, organization.id, entry, existingPool)

                    retainedCredentialIds.add(credential.id)

                    if (assigned) {
                        logger.debug(`[test-utils] Credential "${credential.name}" will be assigned to chatflow`)
                        assignedCredentialByType.set(definition.credentialName, credential.id)
                    } else {
                        logger.debug(`[test-utils] Credential "${credential.name}" created without assignment`)
                    }
                }
            }
        }

        const credentialsToRemove = existingCredentials.filter((cred) => !retainedCredentialIds.has(cred.id))
        if (credentialsToRemove.length) {
            await credentialRepo.delete({ id: In(credentialsToRemove.map((cred) => cred.id)) })
        }

        const preserveExistingChatflow = config.options?.preserveExistingChatflow === true

        let targetChatflow: ChatFlow | null = null

        if (preserveExistingChatflow) {
            if (user.defaultChatflowId) {
                targetChatflow = await chatflowRepo.findOne({ where: { id: user.defaultChatflowId } })
            }

            if (!targetChatflow) {
                targetChatflow = await chatflowRepo.findOne({
                    where: { userId: user.id },
                    order: { createdDate: 'DESC' }
                })
            }
        }

        let template: ChatFlow | null = null
        let flowData: any

        if (!targetChatflow) {
            await chatflowRepo.delete({ userId: user.id })

            template = await chatflowRepo.findOne({ where: { id: templateId } })

            if (!template) {
                throw new InternalFlowiseError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    `Error: test-utils.seedTestData - Template chatflow ${templateId} not found`
                )
            }

            logger.debug('[test-utils] Configuring chatflow with credential assignments...')
            flowData = JSON.parse(template.flowData)
        } else {
            logger.debug(`[test-utils] Updating existing chatflow: ${targetChatflow.id}`)
            flowData = targetChatflow.flowData ? JSON.parse(targetChatflow.flowData) : { nodes: [] }

            logger.debug('[test-utils] Configuring chatflow with credential assignments...')
        }

        logger.debug('[test-utils] Clearing existing credential assignments...')
        getCredentialSeedDefinitions().forEach((definition) => {
            logger.debug(`[test-utils] Clearing assignments for: ${definition.credentialName}`)
            ensureFlowDataAssignment(flowData, definition.credentialName, undefined)
        })

        const assignmentCount = assignedCredentialByType.size
        const assignedCredentialNames = Array.from(assignedCredentialByType.keys())

        try {
            if (assignmentCount > 0) {
                logger.debug(`[test-utils] Applying ${assignmentCount} credential assignment(s)`)
                assignedCredentialByType.forEach((credentialId, credentialName) => {
                    logger.debug(`[test-utils] Processing assignment: ${credentialName} = ${credentialId}`)
                    ensureFlowDataAssignment(flowData, credentialName, credentialId)
                })
            } else {
                logger.debug('[test-utils] No credential assignments to apply')
            }
        } catch (error) {
            logger.error(`[test-utils] ❌ Error during credential assignment: ${error}`)
            throw error
        }

        if (assignmentCount > 0) {
            logger.info(`[test-utils] Applied credential assignments for: ${assignedCredentialNames.join(', ')}`)
        } else {
            logger.debug('[test-utils] No credential assignments requested for this seed run')
        }

        let finalChatflowId: string | undefined
        if (!targetChatflow) {
            const chatflowName = config.chatflow?.name ?? template!.name ?? 'Seeded Chatflow'
            logger.debug(`[test-utils] Creating user chatflow: "${chatflowName}"`)

            const chatflowEntity = chatflowRepo.create({
                name: chatflowName,
                description: config.chatflow?.description ?? template!.description,
                flowData: JSON.stringify(flowData),
                deployed: template!.deployed ?? false,
                isPublic: template!.isPublic ?? false,
                chatbotConfig: template!.chatbotConfig,
                visibility: template!.visibility ?? [ChatflowVisibility.PRIVATE],
                answersConfig: template!.answersConfig,
                apiConfig: template!.apiConfig,
                analytic: template!.analytic,
                speechToText: template!.speechToText,
                followUpPrompts: template!.followUpPrompts,
                category: template!.category,
                type: template!.type,
                browserExtConfig: template!.browserExtConfig,
                parentChatflowId: templateId,
                userId: user.id,
                organizationId: organization.id,
                currentVersion: template!.currentVersion ?? 1
            })

            const savedChatflow = await chatflowRepo.save(chatflowEntity)
            finalChatflowId = savedChatflow.id

            user.defaultChatflowId = savedChatflow.id
            await userRepo.save(user)
        } else {
            const chatflowName = config.chatflow?.name
            if (chatflowName) {
                targetChatflow.name = chatflowName
            }

            if (config.chatflow && 'description' in config.chatflow) {
                targetChatflow.description = config.chatflow.description ?? targetChatflow.description
            }

            targetChatflow.flowData = JSON.stringify(flowData)
            await chatflowRepo.save(targetChatflow)
            finalChatflowId = targetChatflow.id
        }

        logger.info(
            `[test-utils] ✅ Test data seed complete - User: ${user.id}, Org: ${organization.id}, Chatflow: ${finalChatflowId ?? 'unknown'}`
        )
    } catch (error) {
        logger.error(`[test-utils] ❌ Test data seed failed: ${getErrorMessage(error)}`)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: test-utils.seedTestData - ${getErrorMessage(error)}`)
    }
}

const scenarioCredentialAliases: Record<string, string[]> = {
    baseline: [],
    'user-with-openai': ['openai'],
    'user-with-exa': ['exa'],
    'user-with-both-credentials': ['openai', 'exa'],
    'user-with-all-credentials': ['openai', 'exa', 'jira', 'confluence', 'github', 'contentful', 'slack'],
    'user-with-all-but-slack-assigned': ['openai', 'exa', 'jira', 'confluence', 'github', 'contentful', 'slack']
}

const buildScenarioSeedConfig = (scenario: string, user: SeedTestConfig['user']): SeedTestConfig | undefined => {
    switch (scenario) {
        case 'user-with-openai':
            return {
                user,
                credentials: {
                    openai: { name: 'Seed OpenAI', assigned: true }
                }
            }
        case 'user-with-exa':
            return {
                user,
                credentials: {
                    exa: { name: 'Seed Exa', assigned: true }
                }
            }
        case 'user-with-both-credentials':
            return {
                user,
                credentials: {
                    openai: { name: 'Seed OpenAI', assigned: true },
                    exa: { name: 'Seed Exa', assigned: true }
                }
            }
        case 'user-with-all-credentials':
            return {
                user,
                credentials: {
                    openai: { name: 'Seed OpenAI', assigned: true },
                    exa: { name: 'Seed Exa', assigned: true },
                    jira: { name: 'Seed Jira', assigned: false },
                    confluence: { name: 'Seed Confluence', assigned: false },
                    github: { name: 'Seed GitHub', assigned: false },
                    contentful: { name: 'Seed Contentful', assigned: false },
                    slack: { name: 'Seed Slack', assigned: false }
                }
            }
        case 'user-with-all-but-slack-assigned':
            return {
                user,
                credentials: {
                    openai: { name: 'Seed OpenAI', assigned: true },
                    exa: { name: 'Seed Exa', assigned: true },
                    jira: { name: 'Seed Jira', assigned: true },
                    confluence: { name: 'Seed Confluence', assigned: true },
                    github: { name: 'Seed GitHub', assigned: true },
                    contentful: { name: 'Seed Contentful', assigned: true },
                    slack: { name: 'Seed Slack', assigned: false }
                }
            }
        default:
            return undefined
    }
}

export const seedScenario = async (
    scenario: string,
    providedDataSource?: SupportedDataSource,
    options: { userEmail?: string } = {}
): Promise<void> => {
    logger.info(`[test-utils] 🎯 Starting scenario: "${scenario}"`)
    const ds = ensureDataSource(providedDataSource)

    try {
        const env = loadTestEnvironment()
        const testUsers = env.users
        const organization = env.organization

        const requestedEmail = options.userEmail
        const normalizedEmail = requestedEmail ? requestedEmail.replace(/\s+/g, '+') : testUsers.admin.email

        const userRepo = ds.getRepository(User)
        const organizationRepo = ds.getRepository(Organization)

        const aliases = scenarioCredentialAliases[scenario]
        if (aliases === undefined) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `Error: test-utils.seedScenario - Unknown scenario: ${scenario}`)
        }

        if (aliases.length) {
            validateScenarioAliases(aliases)
        }

        if (scenario === 'baseline') {
            await seedBaseline(ds)
            logger.info(`[test-utils] ✅ Baseline scenario completed successfully`)
            return
        }

        const candidateEmails = Array.from(
            new Set([normalizedEmail, normalizedEmail.replace(/\+/g, ' '), normalizedEmail.replace(/\s+/g, '+')].filter(Boolean))
        )

        let existingUser: User | null = null
        for (const candidate of candidateEmails) {
            // eslint-disable-next-line no-await-in-loop
            const found = await userRepo.findOne({ where: { email: candidate } })
            if (found) {
                existingUser = found
                if (candidate !== normalizedEmail) {
                    logger.debug(`[test-utils] Resolved user email "${normalizedEmail}" to stored value "${candidate}"`)
                }
                break
            }
        }

        if (!existingUser) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: test-utils.seedScenario - User ${normalizedEmail} not found. Ensure the user has logged in before seeding.`
            )
        }

        if (!existingUser.auth0Id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: test-utils.seedScenario - User ${normalizedEmail} is missing auth0Id. Ensure login completed successfully.`
            )
        }

        const existingOrg = existingUser.organizationId
            ? await organizationRepo.findOne({ where: { id: existingUser.organizationId } })
            : undefined

        const userConfig: SeedTestConfig['user'] = {
            auth0Id: existingUser.auth0Id,
            email: existingUser.email,
            name: existingUser.name ?? existingUser.email,
            organization: {
                auth0Id: existingOrg?.auth0Id ?? organization.auth0Id,
                name: existingOrg?.name ?? organization.name
            }
        }

        const scenarioConfig = buildScenarioSeedConfig(scenario, userConfig)

        if (!scenarioConfig) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `Error: test-utils.seedScenario - Unsupported scenario: ${scenario}`)
        }

        scenarioConfig.options = { preserveExistingChatflow: true }

        await seedTestData(scenarioConfig, ds)

        logger.info(`[test-utils] ✅ Scenario "${scenario}" applied for user ${existingUser.email}`)
    } catch (error) {
        logger.error(`[test-utils] ❌ Scenario "${scenario}" failed: ${getErrorMessage(error)}`)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: test-utils.seedScenario - ${getErrorMessage(error)}`)
    }
}

export { getAvailableTestUsers, getAvailableTestCredentials } from './environment'
