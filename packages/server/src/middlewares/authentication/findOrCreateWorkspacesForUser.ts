import { DataSource } from 'typeorm'
import { User } from '../../database/entities/User'
import { Workspace } from '../../enterprise/database/entities/workspace.entity'
import { WorkspaceUser } from '../../enterprise/database/entities/workspace-user.entity'
import { Role } from '../../enterprise/database/entities/role.entity'

/**
 * Find or create workspaces for a user.
 * Called during authentication to ensure users have workspace access.
 *
 * Creates:
 * 1. Default Workspace (org-wide) - adds user as 'member'
 * 2. Personal Workspace (user-specific) - adds user as 'personal workspace'
 *
 * Idempotent - safe to call multiple times.
 */
export const findOrCreateWorkspacesForUser = async (
    AppDataSource: DataSource,
    user: User,
    organizationId: string
): Promise<void> => {
    const workspaceUserRepo = AppDataSource.getRepository(WorkspaceUser)
    const workspaceRepo = AppDataSource.getRepository(Workspace)
    const roleRepo = AppDataSource.getRepository(Role)

    // Check if user already has any workspace membership
    const existingMembership = await workspaceUserRepo.findOne({
        where: { userId: user.id }
    })

    if (existingMembership) {
        // User already has workspaces - nothing to do
        return
    }

    // Get role IDs for workspace membership
    const memberRole = await roleRepo.findOne({ where: { name: 'member' } })
    const personalRole = await roleRepo.findOne({ where: { name: 'personal workspace' } })

    if (!memberRole || !personalRole) {
        console.warn(`[Auth] Roles not found - skipping workspace creation for user ${user.id}`)
        return
    }

    try {
        // Find or create Default Workspace for the organization
        let defaultWorkspace = await workspaceRepo.findOne({
            where: { organizationId, name: 'Default Workspace' }
        })

        if (!defaultWorkspace) {
            defaultWorkspace = workspaceRepo.create({
                name: 'Default Workspace',
                organizationId,
                createdBy: user.id,
                updatedBy: user.id
            })
            await workspaceRepo.save(defaultWorkspace)
            console.log(`[Auth] Created Default Workspace for org ${organizationId}`)
        }

        // Add user to Default Workspace as member
        const defaultMembership = workspaceUserRepo.create({
            workspaceId: defaultWorkspace.id,
            userId: user.id,
            roleId: memberRole.id,
            status: 'active',
            createdBy: user.id,
            updatedBy: user.id
        })
        await workspaceUserRepo.save(defaultMembership)

        // Personal workspaces can be disabled for custom deployments via AAI_DISABLE_PERSONAL_WORKSPACES=true
        // When disabled, users only have access to org-wide workspaces (e.g., Default Workspace)
        if (process.env.AAI_DISABLE_PERSONAL_WORKSPACES !== 'true') {
            const personalWorkspace = workspaceRepo.create({
                name: 'Personal Workspace',
                organizationId,
                createdBy: user.id,
                updatedBy: user.id
            })
            await workspaceRepo.save(personalWorkspace)

            // Add user to Personal Workspace
            const personalMembership = workspaceUserRepo.create({
                workspaceId: personalWorkspace.id,
                userId: user.id,
                roleId: personalRole.id,
                status: 'active',
                createdBy: user.id,
                updatedBy: user.id
            })
            await workspaceUserRepo.save(personalMembership)
        }

        console.log(`[Auth] Created workspaces for new user ${user.id}`)
    } catch (error) {
        // Log the actual error for debugging - don't fail authentication
        // The fallback in populateWorkspaceData will handle this case
        console.error(`[Auth] Error creating workspaces for user ${user.id}:`, error)
        console.error(`[Auth] Error details - organizationId: ${organizationId}, memberRoleId: ${memberRole?.id}, personalRoleId: ${personalRole?.id}`)
    }
}
