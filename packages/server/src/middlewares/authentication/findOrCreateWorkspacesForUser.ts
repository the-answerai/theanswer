/* eslint-disable no-console */
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
export const findOrCreateWorkspacesForUser = async (AppDataSource: DataSource, user: User, organizationId: string): Promise<void> => {
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

    // Get role IDs for workspace membership, creating them if missing
    let memberRole = await roleRepo.findOne({ where: { name: 'member' } })
    let personalRole = await roleRepo.findOne({ where: { name: 'personal workspace' } })

    if (!memberRole) {
        memberRole = roleRepo.create({
            name: 'member',
            description: 'Has limited control over the organization.',
            permissions: '[]'
        })
        await roleRepo.save(memberRole)
        console.log(`[Auth] Created missing 'member' role`)
    }

    if (!personalRole) {
        personalRole = roleRepo.create({
            name: 'personal workspace',
            description: 'Has full control over the personal workspace',
            permissions:
                '[ "chatflows:view", "chatflows:create", "chatflows:update", "chatflows:duplicate", "chatflows:delete", "chatflows:export", "chatflows:import", "chatflows:config", "chatflows:domains", "agentflows:view", "agentflows:create", "agentflows:update", "agentflows:duplicate", "agentflows:delete", "agentflows:export", "agentflows:import", "agentflows:config", "agentflows:domains", "tools:view", "tools:create", "tools:update", "tools:delete", "tools:export", "assistants:view", "assistants:create", "assistants:update", "assistants:delete", "credentials:view", "credentials:create", "credentials:update", "credentials:delete", "credentials:share", "variables:view", "variables:create", "variables:update", "variables:delete", "apikeys:view", "apikeys:create", "apikeys:update", "apikeys:delete", "apikeys:import", "documentStores:view", "documentStores:create", "documentStores:update", "documentStores:delete", "documentStores:add-loader", "documentStores:delete-loader", "documentStores:preview-process", "documentStores:upsert-config", "datasets:view", "datasets:create", "datasets:update", "datasets:delete", "evaluators:view", "evaluators:create", "evaluators:update", "evaluators:delete", "evaluations:view", "evaluations:create", "evaluations:update", "evaluations:delete", "evaluations:run", "templates:marketplace", "templates:custom", "templates:custom-delete", "templates:toolexport", "templates:flowexport", "templates:custom-share", "workspace:export", "workspace:import", "executions:view", "executions:delete" ]'
        })
        await roleRepo.save(personalRole)
        console.log(`[Auth] Created missing 'personal workspace' role`)
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

        // Create Personal Workspace for the user
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

        console.log(`[Auth] Created workspaces for new user ${user.id}`)
    } catch (error) {
        // Log the actual error for debugging - don't fail authentication
        // The fallback in populateWorkspaceData will handle this case
        console.error(`[Auth] Error creating workspaces for user ${user.id}:`, error)
        console.error(
            `[Auth] Error details - organizationId: ${organizationId}, memberRoleId: ${memberRole?.id}, personalRoleId: ${personalRole?.id}`
        )
    }
}
