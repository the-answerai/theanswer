/* eslint-disable no-console */
/**
 * Shared Workspace Data Population
 *
 * Populates workspace context on req.user for Flowise 3.0.11 LoggedInUser type.
 * Used by both verifyAAIToken (Auth0 JWT) and aaiPostAuthMiddleware (Passport SSO).
 */
import { DataSource, IsNull } from 'typeorm'
import { User } from '../../database/entities/User'
import { WorkspaceUser } from '../../enterprise/database/entities/workspace-user.entity'
import { Workspace } from '../../enterprise/database/entities/workspace.entity'
import { Role, GeneralRole } from '../../enterprise/database/entities/role.entity'
import { IAssignedWorkspace } from '../../enterprise/Interface.Enterprise'

export interface WorkspaceData {
    activeWorkspaceId?: string
    activeOrganizationId?: string
    activeWorkspace?: string
    roleId?: string
    isOrganizationAdmin?: boolean
    assignedWorkspaces?: IAssignedWorkspace[]
}

/**
 * Populate workspace data for a user.
 * Returns workspace context required by Flowise 3.0.11 LoggedInUser type.
 */
export async function populateWorkspaceData(AppDataSource: DataSource, user: User, organizationId: string): Promise<WorkspaceData> {
    const workspaceUsers = await AppDataSource.getRepository(WorkspaceUser)
        .createQueryBuilder('wu')
        .leftJoinAndSelect('wu.workspace', 'workspace')
        .leftJoinAndSelect('wu.role', 'role')
        .where('wu.userId = :userId', { userId: user.id })
        .andWhere('workspace.organizationId = :organizationId', { organizationId })
        .getMany()

    if (!workspaceUsers.length) {
        // FALLBACK: Find or create a workspace even without membership
        // This ensures activeWorkspaceId is ALWAYS returned for Flowise 3.0.11 compatibility
        const workspaceRepo = AppDataSource.getRepository(Workspace)

        // Try to find any workspace in the organization
        let fallbackWorkspace = await workspaceRepo.findOne({
            where: { organizationId }
        })

        // If no workspace exists, create one
        if (!fallbackWorkspace) {
            fallbackWorkspace = workspaceRepo.create({
                name: 'Default Workspace',
                organizationId,
                createdBy: user.id,
                updatedBy: user.id
            })
            await workspaceRepo.save(fallbackWorkspace)
            console.log(`[populateWorkspaceData] Created fallback workspace for org ${organizationId}`)
        }

        console.warn(`[populateWorkspaceData] User ${user.id} has no workspace memberships - using fallback ${fallbackWorkspace.id}`)

        return {
            activeWorkspaceId: fallbackWorkspace.id,
            activeOrganizationId: organizationId,
            activeWorkspace: fallbackWorkspace.name,
            isOrganizationAdmin: false,
            assignedWorkspaces: [
                {
                    id: fallbackWorkspace.id,
                    name: fallbackWorkspace.name,
                    role: 'member',
                    organizationId
                }
            ]
        }
    }

    // Build assigned workspaces list
    const assignedWorkspaces: IAssignedWorkspace[] = workspaceUsers.map((wu) => ({
        id: wu.workspaceId,
        name: wu.workspace?.name || '',
        role: wu.role?.name || 'member',
        organizationId: wu.workspace?.organizationId || organizationId
    }))

    // Use workspace with most recent lastLogin (respects user's workspace switch)
    // Falls back to "Personal Workspace" or first workspace if no lastLogin set
    const sortedByLastLogin = [...workspaceUsers].sort((a, b) => {
        const aTime = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
        const bTime = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
        return bTime - aTime // Most recent first
    })

    // If no lastLogin exists on any workspace, prefer Personal Workspace
    const hasAnyLastLogin = sortedByLastLogin.some((wu) => wu.lastLogin)
    let activeWu: WorkspaceUser

    if (hasAnyLastLogin) {
        activeWu = sortedByLastLogin[0]
    } else {
        const personalWs = workspaceUsers.find((wu) => wu.workspace?.name === 'Personal Workspace')
        activeWu = personalWs || workspaceUsers[0]
    }

    // Check if user is organization admin using role ID comparison (Flowise parity)
    // Enterprise Flowise uses: workspaceUser.roleId === ownerRole.id
    // We need to find the owner role and compare by ID, not name
    let isOrganizationAdmin = false
    try {
        const ownerRole = await AppDataSource.getRepository(Role).findOne({
            where: { name: GeneralRole.OWNER, organizationId: IsNull() }
        })
        if (ownerRole) {
            // Use role ID comparison (robust)
            isOrganizationAdmin = workspaceUsers.some((wu) => wu.roleId === ownerRole.id)
        } else {
            // Fallback: role name comparison (for backwards compatibility)
            isOrganizationAdmin = workspaceUsers.some((wu) => wu.role?.name === GeneralRole.OWNER)
        }
    } catch (error) {
        // Fallback: role name comparison if Role entity query fails
        console.warn('[populateWorkspaceData] Error fetching owner role, using name comparison:', error)
        isOrganizationAdmin = workspaceUsers.some((wu) => wu.role?.name === GeneralRole.OWNER)
    }

    return {
        activeWorkspaceId: activeWu.workspaceId,
        activeOrganizationId: activeWu.workspace?.organizationId || organizationId,
        activeWorkspace: activeWu.workspace?.name,
        roleId: activeWu.roleId,
        isOrganizationAdmin,
        assignedWorkspaces
    }
}

export default populateWorkspaceData
