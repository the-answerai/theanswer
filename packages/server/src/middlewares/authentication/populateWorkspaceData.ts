/**
 * Shared Workspace Data Population
 *
 * Populates workspace context on req.user for Flowise 3.0.11 LoggedInUser type.
 * Used by both verifyAAIToken (Auth0 JWT) and aaiPostAuthMiddleware (Passport SSO).
 */
import { DataSource, IsNull } from 'typeorm'
import { User } from '../../database/entities/User'
import { WorkspaceUser } from '../../enterprise/database/entities/workspace-user.entity'
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
export async function populateWorkspaceData(
    AppDataSource: DataSource,
    user: User,
    organizationId: string
): Promise<WorkspaceData> {
    const workspaceUsers = await AppDataSource.getRepository(WorkspaceUser)
        .createQueryBuilder('wu')
        .leftJoinAndSelect('wu.workspace', 'workspace')
        .leftJoinAndSelect('wu.role', 'role')
        .where('wu.userId = :userId', { userId: user.id })
        .andWhere('workspace.organizationId = :organizationId', { organizationId })
        .getMany()

    if (!workspaceUsers.length) {
        return {
            activeOrganizationId: organizationId,
            isOrganizationAdmin: false,
            assignedWorkspaces: []
        }
    }

    // Build assigned workspaces list
    const assignedWorkspaces: IAssignedWorkspace[] = workspaceUsers.map((wu) => ({
        id: wu.workspaceId,
        name: wu.workspace?.name || '',
        role: wu.role?.name || 'member',
        organizationId: wu.workspace?.organizationId || organizationId
    }))

    // Use first workspace as active (prefer Personal Workspace for AAI users)
    const personalWs = workspaceUsers.find((wu) => wu.workspace?.name === 'Personal Workspace')
    const activeWu = personalWs || workspaceUsers[0]

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
