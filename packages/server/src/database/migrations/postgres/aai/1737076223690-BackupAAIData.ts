import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * This migration MUST run BEFORE RefactorEnterpriseDatabase1737076223692
 * It backs up AAI-specific columns (auth0Id, stripeCustomerId, etc.) that will be lost
 * when the enterprise migration recreates the user and organization tables.
 *
 * NOTE: This migration dynamically detects which columns exist because some columns
 * (like defaultChatflowId) may be added by migrations with later timestamps.
 */
export class BackupAAIData1737076223690 implements MigrationInterface {
    name = 'BackupAAIData1737076223690'

    /**
     * Helper to check if a column exists in a table
     */
    private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = '${tableName}' AND column_name = '${columnName}'
        `)
        return result.length > 0
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if user table has auth0Id column (indicates AAI data exists)
        const hasAuth0Id = await this.columnExists(queryRunner, 'user', 'auth0Id')

        if (hasAuth0Id) {
            // Dynamically build the SELECT list based on which columns exist
            const userColumns = ['id', '"auth0Id"']

            if (await this.columnExists(queryRunner, 'user', 'stripeCustomerId')) {
                userColumns.push('"stripeCustomerId"')
            }
            if (await this.columnExists(queryRunner, 'user', 'organizationId')) {
                userColumns.push('"organizationId"')
            }
            if (await this.columnExists(queryRunner, 'user', 'trialPlanId')) {
                userColumns.push('"trialPlanId"')
            }
            if (await this.columnExists(queryRunner, 'user', 'defaultChatflowId')) {
                userColumns.push('"defaultChatflowId"')
            }

            // Backup AAI user columns that exist
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "aai_user_backup" AS
                SELECT ${userColumns.join(', ')}
                FROM "user"
                WHERE "auth0Id" IS NOT NULL;
            `)
            console.log(`AAI User backup created with columns: ${userColumns.join(', ')}`)
        } else {
            console.log('No auth0Id column found in user table - skipping user backup')
        }

        // Check if organization table has auth0Id column
        const orgHasAuth0Id = await this.columnExists(queryRunner, 'organization', 'auth0Id')

        if (orgHasAuth0Id) {
            // Dynamically build the SELECT list based on which columns exist
            const orgColumns = ['id', '"auth0Id"']

            if (await this.columnExists(queryRunner, 'organization', 'stripeCustomerId')) {
                orgColumns.push('"stripeCustomerId"')
            }
            if (await this.columnExists(queryRunner, 'organization', 'billingPoolEnabled')) {
                orgColumns.push('"billingPoolEnabled"')
            }
            if (await this.columnExists(queryRunner, 'organization', 'currentPaidPlanId')) {
                orgColumns.push('"currentPaidPlanId"')
            }
            if (await this.columnExists(queryRunner, 'organization', 'enabledIntegrations')) {
                orgColumns.push('"enabledIntegrations"')
            }

            // Backup AAI organization columns that exist
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "aai_organization_backup" AS
                SELECT ${orgColumns.join(', ')}
                FROM "organization"
                WHERE "auth0Id" IS NOT NULL;
            `)
            console.log(`AAI Organization backup created with columns: ${orgColumns.join(', ')}`)
        } else {
            console.log('No auth0Id column found in organization table - skipping organization backup')
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "aai_user_backup"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "aai_organization_backup"`)
    }
}
