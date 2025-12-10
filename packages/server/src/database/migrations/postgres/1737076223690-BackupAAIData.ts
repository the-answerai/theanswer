import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * This migration MUST run BEFORE RefactorEnterpriseDatabase1737076223692
 * It backs up AAI-specific columns (auth0Id, stripeCustomerId, etc.) that will be lost
 * when the enterprise migration recreates the user and organization tables.
 */
export class BackupAAIData1737076223690 implements MigrationInterface {
    name = 'BackupAAIData1737076223690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if user table has auth0Id column (indicates AAI data exists)
        const hasAuth0Id = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'auth0Id'
        `)

        if (hasAuth0Id.length > 0) {
            // Backup AAI user columns
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "aai_user_backup" AS
                SELECT
                    id,
                    "auth0Id",
                    "stripeCustomerId",
                    "organizationId",
                    "trialPlanId",
                    "defaultChatflowId"
                FROM "user"
                WHERE "auth0Id" IS NOT NULL;
            `)
            console.log('AAI User backup created')
        } else {
            console.log('No auth0Id column found in user table - skipping user backup')
        }

        // Check if organization table has auth0Id column
        const orgHasAuth0Id = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'organization' AND column_name = 'auth0Id'
        `)

        if (orgHasAuth0Id.length > 0) {
            // Backup AAI organization columns
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "aai_organization_backup" AS
                SELECT
                    id,
                    "auth0Id",
                    "stripeCustomerId",
                    "billingPoolEnabled",
                    "currentPaidPlanId",
                    "enabledIntegrations"
                FROM "organization"
                WHERE "auth0Id" IS NOT NULL;
            `)
            console.log('AAI Organization backup created')
        } else {
            console.log('No auth0Id column found in organization table - skipping organization backup')
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "aai_user_backup"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "aai_organization_backup"`)
    }
}
