/* eslint-disable no-console */
import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Fix chatflows whose workspaceId was overwritten by bulkUpdateChatflows.
 *
 * Root cause: bulkUpdateChatflows spread the admin template entity (including its
 * workspaceId) onto each user's chatflow copy without overriding workspaceId.
 * This caused all chatflows updated via the enterprise "push template" feature to
 * land in the admin's workspace (typically 'Default Workspace') instead of each
 * user's own 'Personal Workspace'.
 *
 * Migration 1770000000000 fixed the initial seeding case. This migration fixes
 * the same class of breakage for chatflows re-corrupted by subsequent bulk updates
 * after that migration ran.
 *
 * Idempotent: only moves chatflows that are currently in a 'Default Workspace'.
 */
export class FixBulkUpdateChatflowWorkspace1770000000002 implements MigrationInterface {
    name = 'FixBulkUpdateChatflowWorkspace1770000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('[FixBulkUpdateChatflowWorkspace] Starting: re-assign template chatflows to Personal Workspaces')

        const result = await queryRunner.query(`
            UPDATE chat_flow cf
            SET "workspaceId" = pw.id,
                "updatedDate"  = NOW()
            FROM workspace pw, workspace cur
            WHERE cur.id        = cf."workspaceId"
              AND pw."organizationId" = cf."organizationId"
              AND pw.name       = 'Personal Workspace'
              AND pw."createdBy" = cf."userId"
              AND cf."deletedDate"      IS NULL
              AND cf."parentChatflowId" IS NOT NULL
              AND cur.name      = 'Default Workspace'
        `)

        const count = Array.isArray(result) ? result[1] ?? 0 : 0
        console.log(`[FixBulkUpdateChatflowWorkspace] Moved ${count} chatflows back to Personal Workspaces`)
        console.log('[FixBulkUpdateChatflowWorkspace] Done')
    }

    public async down(): Promise<void> {
        // Not reversible — chatflows should stay in Personal Workspaces
        console.log('[FixBulkUpdateChatflowWorkspace] Down migration is a no-op')
    }
}
