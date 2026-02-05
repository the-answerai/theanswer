/* eslint-disable no-console */
import { DataSource, QueryFailedError } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { Organization } from '../../database/entities/Organization'

export const findOrCreateOrganization = async (
    AppDataSource: DataSource,
    auth0OrgId: string,
    orgName: string,
    createdByUserId: string // NEW: Required for creation
): Promise<Organization> => {
    const orgRepo = AppDataSource.getRepository(Organization)

    // FAST PATH: Check if org exists (idempotent)
    let organization = await orgRepo.findOneBy({ auth0Id: auth0OrgId })
    if (organization) {
        if (organization.name !== orgName) {
            organization.name = orgName
            organization.updatedBy = createdByUserId
            await orgRepo.save(organization)
        }
        return organization
    }

    // SLOW PATH: Create with transaction and retry
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
        const queryRunner = AppDataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            // Re-check inside transaction (race condition prevention)
            organization = await queryRunner.manager.findOneBy(Organization, { auth0Id: auth0OrgId })
            if (organization) {
                await queryRunner.release()
                return organization
            }

            // Create with audit fields
            // IMPORTANT: Use queryRunner.manager.create(Entity, data) - TypeORM respects manually-set values this way
            const newOrg = queryRunner.manager.create(Organization, {
                id: uuidv4(),
                auth0Id: auth0OrgId,
                name: orgName,
                createdBy: createdByUserId,
                updatedBy: createdByUserId
            })
            organization = await queryRunner.manager.save(Organization, newOrg)

            await queryRunner.commitTransaction()
            await queryRunner.release()

            console.log(`[findOrCreateOrganization] Created org: ${organization.id}`)
            return organization
        } catch (error) {
            await queryRunner.rollbackTransaction()
            await queryRunner.release()

            if (error instanceof QueryFailedError && error.message.includes('duplicate key')) {
                retryCount++
                console.log(`[findOrCreateOrganization] Retry ${retryCount}/${maxRetries}`)
                await new Promise((r) => setTimeout(r, 100 * retryCount))

                organization = await orgRepo.findOneBy({ auth0Id: auth0OrgId })
                if (organization) return organization
                continue
            }
            throw error
        }
    }

    // Final attempt
    organization = await orgRepo.findOneBy({ auth0Id: auth0OrgId })
    if (organization) return organization

    throw new Error(`Failed to create organization after ${maxRetries} retries`)
}
