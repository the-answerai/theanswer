import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * AAI Migration: Restore Data and Create Workspaces
 *
 * This migration runs AFTER RefactorEnterpriseDatabase1737076223692.
 * It combines two operations:
 *
 * PART 1: Restore AAI-specific columns (auth0Id, stripeCustomerId, etc.)
 * that were backed up before the enterprise migration recreated tables.
 *
 * PART 2: Create default workspaces for AAI organizations and link users.
 * - "Default Workspace" (org-wide shared workspace)
 * - "Personal Workspace" for each user
 */
export class AAIRestoreDataAndCreateWorkspaces1737076223693 implements MigrationInterface {
    name = 'AAIRestoreDataAndCreateWorkspaces1737076223693'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // =====================================================================
        // PART 1: Restore AAI Data
        // =====================================================================
        await this.restoreAAIData(queryRunner)

        // =====================================================================
        // PART 2: Create Workspaces
        // =====================================================================
        await this.createWorkspaces(queryRunner)
    }

    // =========================================================================
    // PART 1: Restore AAI Data (from RestoreAAIData migration)
    // =========================================================================
    private async restoreAAIData(queryRunner: QueryRunner): Promise<void> {
        console.log('Restoring AAI data from backup...')

        // Check if backup tables exist
        const userBackupExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'aai_user_backup'
        `)

        const orgBackupExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'aai_organization_backup'
        `)

        // Add AAI columns to new user table (idempotent)
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

        // Add AAI columns to new organization table (idempotent)
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

        console.log('AAI data restore completed')
    }

    // =========================================================================
    // PART 2: Create Workspaces (from CreateAAIWorkspaces migration)
    // =========================================================================
    private async createWorkspaces(queryRunner: QueryRunner): Promise<void> {
        console.log('Creating workspaces for AAI organizations...')

        // Get role IDs
        const roles = await queryRunner.query(`SELECT id, name FROM role`)
        const ownerRoleId = roles.find((r: { id: string; name: string }) => r.name === 'owner')?.id
        const memberRoleId = roles.find((r: { id: string; name: string }) => r.name === 'member')?.id
        const personalRoleId = roles.find((r: { id: string; name: string }) => r.name === 'personal workspace')?.id

        if (!memberRoleId || !personalRoleId) {
            console.log('Required roles not found - skipping workspace creation')
            console.log('Roles found:', roles.map((r: { name: string }) => r.name).join(', '))
            return
        }

        // Get all AAI organizations (those with auth0Id)
        const orgs = await queryRunner.query(`
            SELECT id FROM organization WHERE "auth0Id" IS NOT NULL
        `)
        console.log(`Found ${orgs.length} AAI organizations`)

        for (const org of orgs) {
            // Get users in this organization
            const users = await queryRunner.query(
                `SELECT id FROM "user" WHERE "organizationId" = $1`,
                [org.id]
            )

            if (users.length === 0) {
                console.log(`Organization ${org.id} has no users - skipping`)
                continue
            }

            const adminId = users[0].id
            console.log(`Processing organization ${org.id} with ${users.length} users`)

            // Check/create org-wide Default Workspace
            const existingOrgWs = await queryRunner.query(
                `SELECT id FROM workspace WHERE "organizationId" = $1 AND name = 'Default Workspace' LIMIT 1`,
                [org.id]
            )

            let orgWsId = existingOrgWs[0]?.id
            if (!orgWsId) {
                const result = await queryRunner.query(
                    `INSERT INTO workspace (id, name, "organizationId", "createdBy", "updatedBy", "createdDate", "updatedDate")
                     VALUES (uuid_generate_v4(), 'Default Workspace', $1, $2, $2, NOW(), NOW())
                     RETURNING id`,
                    [org.id, adminId]
                )
                orgWsId = result[0].id
                console.log(`Created Default Workspace ${orgWsId} for org ${org.id}`)
            } else {
                console.log(`Default Workspace ${orgWsId} already exists for org ${org.id}`)
            }

            // Link users to workspaces
            for (const user of users) {
                // Check if user is already in org workspace
                const existingOrgMembership = await queryRunner.query(
                    `SELECT 1 FROM workspace_user WHERE "workspaceId" = $1 AND "userId" = $2`,
                    [orgWsId, user.id]
                )

                if (!existingOrgMembership.length) {
                    const roleId = user.id === adminId ? (ownerRoleId || memberRoleId) : memberRoleId

                    await queryRunner.query(
                        `INSERT INTO workspace_user ("workspaceId", "userId", "roleId", status, "createdBy", "updatedBy", "createdDate", "updatedDate")
                         VALUES ($1, $2, $3, 'active', $4, $4, NOW(), NOW())`,
                        [orgWsId, user.id, roleId, adminId]
                    )
                    console.log(`Added user ${user.id} to Default Workspace ${orgWsId}`)
                }

                // Check if user already has a personal workspace
                const existingPersonalWs = await queryRunner.query(
                    `SELECT w.id FROM workspace w
                     JOIN workspace_user wu ON w.id = wu."workspaceId"
                     WHERE w."organizationId" = $1 AND w.name = 'Personal Workspace' AND wu."userId" = $2`,
                    [org.id, user.id]
                )

                if (!existingPersonalWs.length) {
                    // Create personal workspace
                    const personalWsResult = await queryRunner.query(
                        `INSERT INTO workspace (id, name, "organizationId", "createdBy", "updatedBy", "createdDate", "updatedDate")
                         VALUES (uuid_generate_v4(), 'Personal Workspace', $1, $2, $2, NOW(), NOW())
                         RETURNING id`,
                        [org.id, user.id]
                    )
                    const personalWsId = personalWsResult[0].id

                    // Link user to personal workspace
                    await queryRunner.query(
                        `INSERT INTO workspace_user ("workspaceId", "userId", "roleId", status, "createdBy", "updatedBy", "createdDate", "updatedDate")
                         VALUES ($1, $2, $3, 'active', $2, $2, NOW(), NOW())`,
                        [personalWsId, user.id, personalRoleId]
                    )
                    console.log(`Created Personal Workspace ${personalWsId} for user ${user.id}`)
                }
            }
        }

        console.log('AAI workspace creation completed')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove AAI columns (but don't delete workspaces or backup tables)
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

        // Don't delete workspaces on down - they may contain user data
        console.log('Down migration does not delete workspaces to preserve user data')
    }
}
