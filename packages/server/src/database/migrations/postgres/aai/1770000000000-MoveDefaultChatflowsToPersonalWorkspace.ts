/* eslint-disable no-console */
import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * AGENT-674: Move default sidekick chatflows to Personal Workspaces
 *
 * When 'member' and 'personal workspace' roles were missing from the DB,
 * findOrCreateWorkspacesForUser silently failed. This caused:
 * 1. No Personal Workspaces created for users
 * 2. Default sidekick chatflows placed in Default Workspace (fallback)
 * 3. All users in Default Workspace see ALL chatflows (no userId filter)
 *
 * This migration:
 * 1. Ensures required roles exist
 * 2. Creates missing Personal Workspaces for users
 * 3. Moves default sidekick chatflows from Default Workspace to Personal Workspace
 */
export class MoveDefaultChatflowsToPersonalWorkspace1770000000000 implements MigrationInterface {
    name = 'MoveDefaultChatflowsToPersonalWorkspace1770000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('[AGENT-674] Starting: Move default chatflows to Personal Workspaces')

        // Step 1: Ensure required roles exist
        await this.ensureRolesExist(queryRunner)

        // Step 2: Create missing Personal Workspaces
        await this.createMissingPersonalWorkspaces(queryRunner)

        // Step 3: Move default sidekick chatflows to Personal Workspaces
        await this.moveDefaultChatflows(queryRunner)

        console.log('[AGENT-674] Completed')
    }

    private async ensureRolesExist(queryRunner: QueryRunner): Promise<void> {
        const memberRole = await queryRunner.query(`SELECT id FROM role WHERE name = 'member' LIMIT 1`)
        if (!memberRole.length) {
            await queryRunner.query(`
                INSERT INTO role (name, description, permissions)
                VALUES ('member', 'Has limited control over the organization.', '[]')
            `)
            console.log('[AGENT-674] Created missing "member" role')
        }

        const personalRole = await queryRunner.query(`SELECT id FROM role WHERE name = 'personal workspace' LIMIT 1`)
        if (!personalRole.length) {
            await queryRunner.query(`
                INSERT INTO role (name, description, permissions)
                VALUES ('personal workspace', 'Has full control over the personal workspace',
                '[ "chatflows:view", "chatflows:create", "chatflows:update", "chatflows:duplicate", "chatflows:delete", "chatflows:export", "chatflows:import", "chatflows:config", "chatflows:domains", "agentflows:view", "agentflows:create", "agentflows:update", "agentflows:duplicate", "agentflows:delete", "agentflows:export", "agentflows:import", "agentflows:config", "agentflows:domains", "tools:view", "tools:create", "tools:update", "tools:delete", "tools:export", "assistants:view", "assistants:create", "assistants:update", "assistants:delete", "credentials:view", "credentials:create", "credentials:update", "credentials:delete", "credentials:share", "variables:view", "variables:create", "variables:update", "variables:delete", "apikeys:view", "apikeys:create", "apikeys:update", "apikeys:delete", "apikeys:import", "documentStores:view", "documentStores:create", "documentStores:update", "documentStores:delete", "documentStores:add-loader", "documentStores:delete-loader", "documentStores:preview-process", "documentStores:upsert-config", "datasets:view", "datasets:create", "datasets:update", "datasets:delete", "evaluators:view", "evaluators:create", "evaluators:update", "evaluators:delete", "evaluations:view", "evaluations:create", "evaluations:update", "evaluations:delete", "evaluations:run", "templates:marketplace", "templates:custom", "templates:custom-delete", "templates:toolexport", "templates:flowexport", "templates:custom-share", "workspace:export", "workspace:import", "executions:view", "executions:delete" ]')
            `)
            console.log('[AGENT-674] Created missing "personal workspace" role')
        }
    }

    private async createMissingPersonalWorkspaces(queryRunner: QueryRunner): Promise<void> {
        const personalRoleResult = await queryRunner.query(`SELECT id FROM role WHERE name = 'personal workspace' LIMIT 1`)
        const personalRoleId = personalRoleResult[0]?.id
        if (!personalRoleId) {
            console.log('[AGENT-674] personal workspace role not found - cannot create workspaces')
            return
        }

        // Find users who have an organizationId but no Personal Workspace
        const usersWithoutPersonalWs = await queryRunner.query(`
            SELECT u.id, u."organizationId"
            FROM "user" u
            WHERE u."organizationId" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM workspace w
                  JOIN workspace_user wu ON w.id = wu."workspaceId"
                  WHERE w."organizationId" = u."organizationId"
                    AND w.name = 'Personal Workspace'
                    AND wu."userId" = u.id
              )
        `)

        console.log(`[AGENT-674] Found ${usersWithoutPersonalWs.length} users without Personal Workspace`)

        for (const user of usersWithoutPersonalWs) {
            const result = await queryRunner.query(
                `INSERT INTO workspace (id, name, "organizationId", "createdBy", "updatedBy", "createdDate", "updatedDate")
                 VALUES (uuid_generate_v4(), 'Personal Workspace', $1, $2, $2, NOW(), NOW())
                 RETURNING id`,
                [user.organizationId, user.id]
            )
            const personalWsId = result[0].id

            await queryRunner.query(
                `INSERT INTO workspace_user ("workspaceId", "userId", "roleId", status, "createdBy", "updatedBy", "createdDate", "updatedDate")
                 VALUES ($1, $2, $3, 'active', $2, $2, NOW(), NOW())`,
                [personalWsId, user.id, personalRoleId]
            )
            console.log(`[AGENT-674] Created Personal Workspace ${personalWsId} for user ${user.id}`)
        }
    }

    private async moveDefaultChatflows(queryRunner: QueryRunner): Promise<void> {
        // Move default sidekick chatflows (parentChatflowId IS NOT NULL) from Default Workspace
        // to the user's Personal Workspace
        const result = await queryRunner.query(`
            UPDATE chat_flow cf
            SET "workspaceId" = pw.ws_id
            FROM (
                SELECT DISTINCT ON (wu."userId") w.id AS ws_id, wu."userId"
                FROM workspace w
                JOIN workspace_user wu ON w.id = wu."workspaceId"
                WHERE w.name = 'Personal Workspace'
            ) pw
            WHERE cf."parentChatflowId" IS NOT NULL
              AND cf."userId" = pw."userId"
              AND cf."workspaceId" IN (SELECT id FROM workspace WHERE name = 'Default Workspace')
        `)

        const count = result[1] || 0
        console.log(`[AGENT-674] Moved ${count} default chatflows to Personal Workspaces`)
    }

    public async down(): Promise<void> {
        // Don't reverse — chatflows should stay in Personal Workspaces
        console.log('[AGENT-674] Down migration is a no-op (chatflows stay in Personal Workspaces)')
    }
}
