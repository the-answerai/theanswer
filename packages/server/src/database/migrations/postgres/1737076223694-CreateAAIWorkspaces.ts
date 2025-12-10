import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * This migration runs AFTER RestoreAAIData1737076223693
 * It creates default workspaces for AAI organizations and links existing users to them.
 *
 * For each organization:
 * 1. Creates a "Default Workspace" (org-wide shared workspace)
 * 2. Creates a "Personal Workspace" for each user
 */
export class CreateAAIWorkspaces1737076223694 implements MigrationInterface {
    name = 'CreateAAIWorkspaces1737076223694'

    public async up(queryRunner: QueryRunner): Promise<void> {
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

        // Get all organizations (only those with auth0Id - AAI organizations)
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

            // Check/create org-wide workspace
            const existingOrgWs = await queryRunner.query(
                `SELECT id FROM workspace WHERE "organizationId" = $1 AND name = 'Default Workspace' LIMIT 1`,
                [org.id]
            )

            let orgWsId = existingOrgWs[0]?.id
            if (!orgWsId) {
                // Create org-wide workspace
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
                    // Determine role - first user gets owner, rest get member
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

                    // Link user to personal workspace as owner
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

    public async down(): Promise<void> {
        // Don't delete workspaces on down - they may contain user data
        console.log('Down migration does not delete workspaces to preserve user data')
    }
}
