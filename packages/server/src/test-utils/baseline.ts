import { IsNull, Repository } from 'typeorm'
import { StatusCodes } from 'http-status-codes'
import { Credential, CredentialVisibility } from '../database/entities/Credential'
import { ChatFlow } from '../database/entities/ChatFlow'
import { Organization } from '../database/entities/Organization'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { getErrorMessage } from '../errors/utils'
import logger from '../utils/logger'
import { transformToCredentialEntity } from '../utils'
import { buildCredentialData, loadTestEnvironment } from './environment'
import { ensureDataSource } from './dataSource'
import { ensureTemplateChatflow } from './template'
import { resolveInitialChatflowId } from './config'
import { SupportedDataSource } from './types'

const ensureOrphanedCredential = async (
    repo: Repository<Credential>,
    definition: { name: string; credentialName: string },
    plainData: Record<string, any>,
    visibility?: CredentialVisibility[]
): Promise<Credential> => {
    const existing = await repo.findOne({
        where: {
            credentialName: definition.credentialName,
            name: definition.name,
            userId: IsNull(),
            organizationId: IsNull()
        }
    })

    const transformed = await transformToCredentialEntity({
        name: definition.name,
        credentialName: definition.credentialName,
        plainDataObj: plainData
    })

    if (visibility) {
        transformed.visibility = visibility
    }

    if (existing) {
        existing.encryptedData = transformed.encryptedData
        if (visibility) {
            existing.visibility = visibility
        }
        return repo.save(existing)
    }

    return repo.save(transformed)
}

export const seedBaseline = async (providedDataSource?: SupportedDataSource): Promise<void> => {
    logger.info('[test-utils] 🌱 Starting baseline seed...')
    const ds = ensureDataSource(providedDataSource)
    const templateId = resolveInitialChatflowId()

    await ensureTemplateChatflow(ds, templateId)

    const env = loadTestEnvironment()
    const organizationRepo = ds.getRepository(Organization)
    const credentialRepo = ds.getRepository(Credential)

    logger.info(`[test-utils] 🏢 Setting up organization: ${env.organization.name}`)
    let organization = await organizationRepo.findOne({ where: { auth0Id: env.organization.auth0Id } })
    if (!organization) {
        organization = organizationRepo.create(env.organization)
    } else {
        organization.name = env.organization.name
    }
    organization = await organizationRepo.save(organization)

    const baselineCredentials = ['openai', 'exa'] as const
    for (const key of baselineCredentials) {
        const credConfig = env.credentials[key]
        logger.info(`[test-utils] 🔑 Ensuring baseline credential: ${credConfig.name}`)
        await ensureOrphanedCredential(credentialRepo, credConfig, buildCredentialData(credConfig))
    }

    logger.info(`[test-utils] ✅ Baseline seed complete - Org: ${organization.id}`)
}

export const createOrphanedTestData = async (providedDataSource?: SupportedDataSource): Promise<void> => {
    logger.info('[test-utils] 🏗️ Starting orphaned test data creation...')
    const ds = ensureDataSource(providedDataSource)
    const env = loadTestEnvironment()
    const templateId = resolveInitialChatflowId()

    try {
        const chatflowRepo = ds.getRepository(ChatFlow)
        await chatflowRepo.delete({ id: templateId })
        await ensureTemplateChatflow(ds, templateId)

        const credentialRepo = ds.getRepository(Credential)

        const visibility: CredentialVisibility[] = [
            CredentialVisibility.PRIVATE,
            CredentialVisibility.PLATFORM,
            CredentialVisibility.ORGANIZATION
        ]
        const orphanedKeys = ['openai', 'exa'] as const

        for (const key of orphanedKeys) {
            const credConfig = env.credentials[key]
            logger.info(`[test-utils] 🔑 Ensuring orphaned credential: ${credConfig.name}`)
            await ensureOrphanedCredential(credentialRepo, credConfig, buildCredentialData(credConfig), visibility)
        }

        logger.info(`[test-utils] ✅ Orphaned test data created - Chatflow: ${templateId}`)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: test-utils.createOrphanedTestData - ${getErrorMessage(error)}`
        )
    }
}
