/* eslint-disable no-console */
import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Ensure that the source template chatflows identified by INITIAL_CHATFLOW_IDS /
 * INITIAL_CHATFLOW_ID are assigned to the Default Workspace of their organization.
 *
 * Root cause: when the template chatflow is created via the normal POST /chatflows
 * endpoint the workspaceId is set to whatever the admin's activeWorkspaceId was at
 * that moment (often a Personal Workspace or an ad-hoc workspace). The
 * getChatflowById controller then gates access by workspace_user membership, so
 * any admin whose assignedWorkspaces does not include that workspace gets a
 * misleading "not found" error even though the row exists.
 *
 * The controller is also fixed in this PR (admin bypass via org check), but this
 * migration repairs the data so the template lives in a predictable, shared location.
 *
 * Idempotent: only moves chatflows that are NOT already in a Default Workspace.
 */
export class FixTemplateSourceChatflowWorkspace1770000000003 implements MigrationInterface {
    name = 'FixTemplateSourceChatflowWorkspace1770000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('[FixTemplateSourceChatflowWorkspace] Starting')

        // Read template IDs from environment (same logic as the server at runtime)
        const rawIds = process.env.INITIAL_CHATFLOW_IDS ?? process.env.INITIAL_CHATFLOW_ID ?? ''
        const templateIds = rawIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)

        if (!templateIds.length) {
            console.log('[FixTemplateSourceChatflowWorkspace] No INITIAL_CHATFLOW_IDS configured — skipping')
            return
        }

        console.log(`[FixTemplateSourceChatflowWorkspace] Template IDs: ${templateIds.join(', ')}`)

        for (const templateId of templateIds) {
            const result = await queryRunner.query(
                `
                UPDATE chat_flow cf
                SET    "workspaceId" = dw.id,
                       "updatedDate" = NOW()
                FROM   workspace dw
                WHERE  dw."organizationId" = cf."organizationId"
                  AND  dw.name             = 'Default Workspace'
                  AND  cf.id               = $1
                  AND  cf."deletedDate"    IS NULL
                  AND  cf."workspaceId"   NOT IN (
                           SELECT id FROM workspace WHERE name = 'Default Workspace'
                       )
                RETURNING cf.id, cf.name, cf."workspaceId" AS new_workspace_id
                `,
                [templateId]
            )

            const moved = Array.isArray(result) ? result[0]?.length ?? 0 : 0
            if (moved > 0) {
                console.log(`[FixTemplateSourceChatflowWorkspace] Moved template ${templateId} to Default Workspace`)
            } else {
                console.log(
                    `[FixTemplateSourceChatflowWorkspace] Template ${templateId} already in correct workspace or not found — no change`
                )
            }
        }

        console.log('[FixTemplateSourceChatflowWorkspace] Done')
    }

    public async down(): Promise<void> {
        console.log('[FixTemplateSourceChatflowWorkspace] Down migration is a no-op')
    }
}
