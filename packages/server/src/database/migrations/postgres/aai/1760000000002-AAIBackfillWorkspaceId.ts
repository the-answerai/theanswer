import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * This migration runs AFTER CreateAAIWorkspaces1737076223694
 * It backfills the workspaceId column for existing resources that were created
 * before Flowise 3.0.11's workspace system.
 *
 * Logic for tables WITH visibility column (chat_flow, credential, variable, tool):
 * 1. Resources with visibility containing 'Organization' or 'Marketplace' → Default Workspace (shared)
 * 2. Resources with ONLY 'Private' visibility AND userId → Personal Workspace (user's private)
 * 3. Remaining resources → Default Workspace (fallback)
 *
 * Logic for tables WITHOUT visibility column (assistant, document_store, apikey):
 * 1. Resources with userId → Personal Workspace
 * 2. Remaining resources → Default Workspace (fallback)
 *
 * Special handling for chat_message table:
 * - ChatMessage doesn't have workspaceId (auth comes from parent chatflow per Flowise design)
 * - Backfills userId and organizationId from parent chatflow
 * - Required for getChatMessage userId filter to work on legacy messages
 */
export class AAIBackfillWorkspaceId1760000000002 implements MigrationInterface {
    name = 'AAIBackfillWorkspaceId1760000000002'

    // Tables that have a visibility column
    private tablesWithVisibility = ['chat_flow', 'credential', 'variable', 'tool', 'custom_template']

    // Tables without visibility column
    private tablesWithoutVisibility = ['assistant', 'document_store', 'apikey', 'execution', 'evaluation', 'evaluator', 'dataset']

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Starting workspace ID backfill for existing resources...')

        // Backfill tables WITH visibility (use visibility-aware logic)
        for (const table of this.tablesWithVisibility) {
            await this.backfillTableWithVisibility(queryRunner, table)
        }

        // Backfill tables WITHOUT visibility (use simple userId logic)
        for (const table of this.tablesWithoutVisibility) {
            await this.backfillTableWithoutVisibility(queryRunner, table)
        }

        // Backfill chat_message userId and organizationId from parent chatflow
        // (chat_message doesn't have workspaceId - auth comes from chatflow)
        await this.backfillChatMessageUserScoping(queryRunner)

        console.log('Workspace ID backfill completed')
    }

    /**
     * Backfill tables that have a visibility column.
     * Organization/Marketplace shared → Default Workspace
     * Private only → Personal Workspace
     * Fallback → Default Workspace
     */
    private async backfillTableWithVisibility(queryRunner: QueryRunner, tableName: string): Promise<void> {
        console.log(`\nBackfilling ${tableName} (with visibility)...`)

        // Check if table exists
        const tableExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = '${tableName}'
        `)
        if (!tableExists.length) {
            console.log(`${tableName}: Table does not exist - skipping`)
            return
        }

        // Check if workspaceId column exists
        const hasWorkspaceId = await queryRunner.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_name = '${tableName}' AND column_name = 'workspaceId'
        `)
        if (!hasWorkspaceId.length) {
            console.log(`${tableName}: No workspaceId column - skipping`)
            return
        }

        // Count records missing workspaceId
        const countResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM "${tableName}" WHERE "workspaceId" IS NULL`
        )
        const totalMissing = parseInt(countResult[0].count)

        if (totalMissing === 0) {
            console.log(`${tableName}: No records missing workspaceId`)
            return
        }

        console.log(`${tableName}: Found ${totalMissing} records missing workspaceId`)

        // Step 1: Assign organization-shared resources to Default Workspace
        // These have visibility containing 'Organization' or 'Marketplace'
        const orgSharedUpdate = await queryRunner.query(`
            UPDATE "${tableName}" t
            SET "workspaceId" = dw.id
            FROM (
                SELECT DISTINCT ON (w."organizationId") w.id, w."organizationId"
                FROM workspace w
                WHERE w.name = 'Default Workspace'
            ) dw
            WHERE t."organizationId" = dw."organizationId"
              AND t."workspaceId" IS NULL
              AND (t.visibility LIKE '%Organization%' OR t.visibility LIKE '%Marketplace%')
        `)
        console.log(`${tableName}: Assigned ${orgSharedUpdate[1] || 0} org-shared records to Default Workspaces`)

        // Step 2: Assign private-only resources to Personal Workspace
        // These have visibility NOT containing 'Organization' or 'Marketplace'
        const privateUpdate = await queryRunner.query(`
            UPDATE "${tableName}" t
            SET "workspaceId" = pw.id
            FROM (
                SELECT DISTINCT ON (wu."userId") w.id, wu."userId"
                FROM workspace w
                JOIN workspace_user wu ON w.id = wu."workspaceId"
                WHERE w.name = 'Personal Workspace'
            ) pw
            WHERE t."userId" = pw."userId"
              AND t."workspaceId" IS NULL
              AND (t.visibility IS NULL OR (t.visibility NOT LIKE '%Organization%' AND t.visibility NOT LIKE '%Marketplace%'))
        `)
        console.log(`${tableName}: Assigned ${privateUpdate[1] || 0} private records to Personal Workspaces`)

        // Step 3: Fallback - assign remaining to Default Workspace based on organizationId
        const defaultWsUpdate = await queryRunner.query(`
            UPDATE "${tableName}" t
            SET "workspaceId" = dw.id
            FROM (
                SELECT DISTINCT ON (w."organizationId") w.id, w."organizationId"
                FROM workspace w
                WHERE w.name = 'Default Workspace'
            ) dw
            WHERE t."organizationId" = dw."organizationId"
              AND t."workspaceId" IS NULL
        `)
        console.log(`${tableName}: Assigned ${defaultWsUpdate[1] || 0} records to Default Workspaces (fallback)`)

        // Step 4: For records with userId but no organizationId, try to get org from user
        const userOrgUpdate = await queryRunner.query(`
            UPDATE "${tableName}" t
            SET "workspaceId" = dw.id
            FROM "user" u
            JOIN (
                SELECT DISTINCT ON (w."organizationId") w.id, w."organizationId"
                FROM workspace w
                WHERE w.name = 'Default Workspace'
            ) dw ON u."organizationId" = dw."organizationId"
            WHERE t."userId" = u.id
              AND t."workspaceId" IS NULL
        `)
        console.log(`${tableName}: Assigned ${userOrgUpdate[1] || 0} records via user's organization`)

        await this.logRemaining(queryRunner, tableName)
    }

    /**
     * Backfill tables that don't have a visibility column.
     * userId → Personal Workspace
     * Fallback → Default Workspace
     */
    private async backfillTableWithoutVisibility(queryRunner: QueryRunner, tableName: string): Promise<void> {
        console.log(`\nBackfilling ${tableName} (without visibility)...`)

        // Check if table exists
        const tableExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = '${tableName}'
        `)
        if (!tableExists.length) {
            console.log(`${tableName}: Table does not exist - skipping`)
            return
        }

        // Check if workspaceId column exists
        const hasWorkspaceId = await queryRunner.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_name = '${tableName}' AND column_name = 'workspaceId'
        `)
        if (!hasWorkspaceId.length) {
            console.log(`${tableName}: No workspaceId column - skipping`)
            return
        }

        // Count records missing workspaceId
        const countResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM "${tableName}" WHERE "workspaceId" IS NULL`
        )
        const totalMissing = parseInt(countResult[0].count)

        if (totalMissing === 0) {
            console.log(`${tableName}: No records missing workspaceId`)
            return
        }

        console.log(`${tableName}: Found ${totalMissing} records missing workspaceId`)

        // Step 1: Assign to Personal Workspace for records with userId
        const personalWsUpdate = await queryRunner.query(`
            UPDATE "${tableName}" t
            SET "workspaceId" = pw.id
            FROM (
                SELECT DISTINCT ON (wu."userId") w.id, wu."userId"
                FROM workspace w
                JOIN workspace_user wu ON w.id = wu."workspaceId"
                WHERE w.name = 'Personal Workspace'
            ) pw
            WHERE t."userId" = pw."userId"
              AND t."workspaceId" IS NULL
        `)
        console.log(`${tableName}: Assigned ${personalWsUpdate[1] || 0} records to Personal Workspaces`)

        // Step 2: Assign remaining to Default Workspace based on organizationId
        const defaultWsUpdate = await queryRunner.query(`
            UPDATE "${tableName}" t
            SET "workspaceId" = dw.id
            FROM (
                SELECT DISTINCT ON (w."organizationId") w.id, w."organizationId"
                FROM workspace w
                WHERE w.name = 'Default Workspace'
            ) dw
            WHERE t."organizationId" = dw."organizationId"
              AND t."workspaceId" IS NULL
        `)
        console.log(`${tableName}: Assigned ${defaultWsUpdate[1] || 0} records to Default Workspaces`)

        // Step 3: For records with userId but no organizationId, try to get org from user
        const userOrgUpdate = await queryRunner.query(`
            UPDATE "${tableName}" t
            SET "workspaceId" = dw.id
            FROM "user" u
            JOIN (
                SELECT DISTINCT ON (w."organizationId") w.id, w."organizationId"
                FROM workspace w
                WHERE w.name = 'Default Workspace'
            ) dw ON u."organizationId" = dw."organizationId"
            WHERE t."userId" = u.id
              AND t."workspaceId" IS NULL
        `)
        console.log(`${tableName}: Assigned ${userOrgUpdate[1] || 0} records via user's organization`)

        await this.logRemaining(queryRunner, tableName)
    }

    /**
     * Log any remaining records that couldn't be assigned a workspace
     */
    private async logRemaining(queryRunner: QueryRunner, tableName: string): Promise<void> {
        const remainingResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM "${tableName}" WHERE "workspaceId" IS NULL`
        )
        const remaining = parseInt(remainingResult[0].count)

        if (remaining > 0) {
            console.log(`${tableName}: WARNING - ${remaining} records still missing workspaceId`)

            // Log details for debugging
            const orphans = await queryRunner.query(`
                SELECT id, "userId", "organizationId"
                FROM "${tableName}"
                WHERE "workspaceId" IS NULL
                LIMIT 10
            `)
            console.log(`${tableName}: Sample orphaned records:`, orphans)
        } else {
            console.log(`${tableName}: All records now have workspaceId`)
        }
    }

    /**
     * Backfill chat_message userId and organizationId from parent chatflow.
     * ChatMessage doesn't have workspaceId - authorization comes from the parent chatflow.
     * This ensures old messages have proper user scoping for the getChatMessage userId filter.
     */
    private async backfillChatMessageUserScoping(queryRunner: QueryRunner): Promise<void> {
        console.log('\nBackfilling chat_message userId and organizationId from parent chatflows...')

        // Check if chat_message table exists
        const tableExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'chat_message'
        `)
        if (!tableExists.length) {
            console.log('chat_message: Table does not exist - skipping')
            return
        }

        // Count messages missing userId
        const missingUserIdResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM chat_message WHERE "userId" IS NULL`
        )
        const missingUserId = parseInt(missingUserIdResult[0].count)

        // Count messages missing organizationId
        const missingOrgIdResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM chat_message WHERE "organizationId" IS NULL`
        )
        const missingOrgId = parseInt(missingOrgIdResult[0].count)

        console.log(`chat_message: ${missingUserId} records missing userId, ${missingOrgId} missing organizationId`)

        if (missingUserId === 0 && missingOrgId === 0) {
            console.log('chat_message: All records already have userId and organizationId')
            return
        }

        // Backfill userId from parent chatflow
        if (missingUserId > 0) {
            const userIdUpdate = await queryRunner.query(`
                UPDATE chat_message cm
                SET "userId" = cf."userId"
                FROM chat_flow cf
                WHERE cm.chatflowid = cf.id
                  AND cm."userId" IS NULL
                  AND cf."userId" IS NOT NULL
            `)
            console.log(`chat_message: Backfilled userId for ${userIdUpdate[1] || 0} records from parent chatflow`)
        }

        // Backfill organizationId from parent chatflow
        if (missingOrgId > 0) {
            const orgIdUpdate = await queryRunner.query(`
                UPDATE chat_message cm
                SET "organizationId" = cf."organizationId"
                FROM chat_flow cf
                WHERE cm.chatflowid = cf.id
                  AND cm."organizationId" IS NULL
                  AND cf."organizationId" IS NOT NULL
            `)
            console.log(`chat_message: Backfilled organizationId for ${orgIdUpdate[1] || 0} records from parent chatflow`)
        }

        // Log remaining
        const remainingUserIdResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM chat_message WHERE "userId" IS NULL`
        )
        const remainingUserId = parseInt(remainingUserIdResult[0].count)

        const remainingOrgIdResult = await queryRunner.query(
            `SELECT COUNT(*) as count FROM chat_message WHERE "organizationId" IS NULL`
        )
        const remainingOrgId = parseInt(remainingOrgIdResult[0].count)

        if (remainingUserId > 0 || remainingOrgId > 0) {
            console.log(`chat_message: WARNING - ${remainingUserId} still missing userId, ${remainingOrgId} still missing organizationId`)

            // Log sample orphans for debugging
            const orphans = await queryRunner.query(`
                SELECT cm.id, cm.chatflowid, cm."userId", cm."organizationId"
                FROM chat_message cm
                WHERE cm."userId" IS NULL OR cm."organizationId" IS NULL
                LIMIT 10
            `)
            console.log('chat_message: Sample records still missing user scoping:', orphans)
        } else {
            console.log('chat_message: All records now have userId and organizationId')
        }
    }

    public async down(): Promise<void> {
        // Note: We don't null out workspaceId on down because:
        // 1. New records created after this migration will have workspaceId set
        // 2. Nulling would break the system
        console.log('Down migration does not remove workspaceId values to preserve data integrity')
    }
}
