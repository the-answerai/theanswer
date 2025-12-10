import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * This migration MUST run AFTER RefactorEnterpriseDatabase1737076223692
 * It restores AAI-specific columns (auth0Id, stripeCustomerId, etc.) that were lost
 * when the enterprise migration recreated the user and organization tables.
 */
export class RestoreAAIData1737076223693 implements MigrationInterface {
    name = 'RestoreAAIData1737076223693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if backup tables exist
        const userBackupExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'aai_user_backup'
        `)

        const orgBackupExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'aai_organization_backup'
        `)

        // Add AAI columns to new user table
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "auth0Id" varchar(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(100),
            ADD COLUMN IF NOT EXISTS "organizationId" uuid,
            ADD COLUMN IF NOT EXISTS "trialPlanId" uuid,
            ADD COLUMN IF NOT EXISTS "defaultChatflowId" uuid;
        `)
        console.log('AAI columns added to user table')

        // Restore user data from backup if exists
        if (userBackupExists.length > 0) {
            const backupCount = await queryRunner.query(`SELECT COUNT(*) as count FROM "aai_user_backup"`)
            console.log(`Restoring ${backupCount[0].count} users from backup`)

            // Cast UUID fields from varchar (backup) to uuid (new table)
            await queryRunner.query(`
                UPDATE "user" u
                SET
                    "auth0Id" = b."auth0Id",
                    "stripeCustomerId" = b."stripeCustomerId",
                    "organizationId" = b."organizationId"::uuid,
                    "trialPlanId" = b."trialPlanId"::uuid,
                    "defaultChatflowId" = b."defaultChatflowId"::uuid
                FROM "aai_user_backup" b
                WHERE u.id = b.id;
            `)
            console.log('User data restored from backup')
        } else {
            console.log('No user backup found - skipping user data restore')
        }

        // Add AAI columns to new organization table
        await queryRunner.query(`
            ALTER TABLE "organization"
            ADD COLUMN IF NOT EXISTS "auth0Id" varchar(255),
            ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(100),
            ADD COLUMN IF NOT EXISTS "billingPoolEnabled" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "currentPaidPlanId" uuid,
            ADD COLUMN IF NOT EXISTS "enabledIntegrations" jsonb;
        `)
        console.log('AAI columns added to organization table')

        // Restore organization data from backup if exists
        if (orgBackupExists.length > 0) {
            const orgBackupCount = await queryRunner.query(`SELECT COUNT(*) as count FROM "aai_organization_backup"`)
            console.log(`Restoring ${orgBackupCount[0].count} organizations from backup`)

            // Cast UUID fields from varchar (backup) to uuid (new table)
            await queryRunner.query(`
                UPDATE "organization" o
                SET
                    "auth0Id" = b."auth0Id",
                    "stripeCustomerId" = b."stripeCustomerId",
                    "billingPoolEnabled" = COALESCE(b."billingPoolEnabled", false),
                    "currentPaidPlanId" = b."currentPaidPlanId"::uuid,
                    "enabledIntegrations" = b."enabledIntegrations"
                FROM "aai_organization_backup" b
                WHERE o.id = b.id;
            `)
            console.log('Organization data restored from backup')
        } else {
            console.log('No organization backup found - skipping organization data restore')
        }

        // Note: We keep backup tables for safety. Uncomment to drop:
        // await queryRunner.query(`DROP TABLE IF EXISTS "aai_user_backup"`)
        // await queryRunner.query(`DROP TABLE IF EXISTS "aai_organization_backup"`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove AAI columns (but don't drop backup tables - they're our safety net)
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN IF EXISTS "auth0Id",
            DROP COLUMN IF EXISTS "stripeCustomerId",
            DROP COLUMN IF EXISTS "organizationId",
            DROP COLUMN IF EXISTS "trialPlanId",
            DROP COLUMN IF EXISTS "defaultChatflowId";
        `)

        await queryRunner.query(`
            ALTER TABLE "organization"
            DROP COLUMN IF EXISTS "auth0Id",
            DROP COLUMN IF EXISTS "stripeCustomerId",
            DROP COLUMN IF EXISTS "billingPoolEnabled",
            DROP COLUMN IF EXISTS "currentPaidPlanId",
            DROP COLUMN IF EXISTS "enabledIntegrations";
        `)
    }
}
