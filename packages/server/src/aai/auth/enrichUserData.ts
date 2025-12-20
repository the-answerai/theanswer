/**
 * Shared AAI User Enrichment
 *
 * Enriches a basic authenticated user with AAI-specific data:
 * - Workspace context (activeWorkspaceId, assignedWorkspaces)
 * - Permissions from workspace role or Auth0 roles
 * - Subscription features from Stripe
 * - Organization admin status
 *
 * Used by both /auth/me endpoint and aaiPostAuthMiddleware.
 */
import { DataSource } from 'typeorm'
import { User } from '../../database/entities/User'
import { Organization } from '../../database/entities/Organization'
import { Role } from '../../enterprise/database/entities/role.entity'
import { populateWorkspaceData, WorkspaceData } from '../../middlewares/authentication/populateWorkspaceData'
import { mapAuth0RolesToPermissions } from '../rbac/permissions'
import { DEFAULT_CUSTOMER_ID, OVERRIDE_CUSTOMER_ID } from '../../aai-utils/billing/config'
import { ENTERPRISE_FEATURE_FLAGS } from '../../utils/quotaUsage'

// Convert feature flags array to features object with all enabled
const getAllFeaturesEnabled = (): Record<string, string> => {
    const features: Record<string, string> = {}
    ENTERPRISE_FEATURE_FLAGS.forEach((flag) => {
        features[flag] = 'true'
    })
    return features
}

/**
 * Enriched user data structure returned by enrichUserWithAAIData
 */
export interface EnrichedUserData {
    // User identity from DB
    id: string
    auth0Id?: string
    email: string
    name?: string

    // Organization context
    organizationId: string
    stripeCustomerId?: string
    defaultChatflowId?: string

    // RBAC fields
    roles: string[]
    role: string // Singular role for Flowise parity (roles[0])
    permissions: string[]

    // User status fields (Flowise parity)
    status: string
    isSSO: boolean
    lastLogin: string

    // Subscription/billing fields (Flowise parity)
    activeOrganizationSubscriptionId: string
    activeOrganizationCustomerId: string
    activeOrganizationProductId: string
    features: Record<string, string>

    // Workspace fields
    activeWorkspaceId?: string
    activeOrganizationId?: string
    activeWorkspace?: string
    roleId?: string
    isOrganizationAdmin?: boolean
    assignedWorkspaces?: Array<{
        id: string
        name: string
        role: string
        organizationId: string
    }>
}

/**
 * Load organization subscription data for Flowise parity.
 * Returns subscriptionId, customerId, productId, and features.
 */
export async function loadOrganizationSubscriptionData(organization: Organization): Promise<{
    subscriptionId: string
    customerId: string
    productId: string
    features: Record<string, string>
}> {
    try {
        const { getRunningExpressApp } = await import('../../utils/getRunningExpressApp')
        const appServer = getRunningExpressApp()
        const identityManager = appServer?.identityManager

        const subscriptionId = organization.subscriptionId || ''
        const customerId = organization.customerId || organization.stripeCustomerId || ''

        let productId = ''
        let features: Record<string, string> = {}

        if (subscriptionId && identityManager) {
            try {
                productId = await identityManager.getProductIdFromSubscription(subscriptionId)
                features = await identityManager.getFeaturesByPlan(subscriptionId)
            } catch (error) {
                // Log but don't fail - Stripe may not be configured
                console.warn('[enrichUserData] Error fetching subscription data from Stripe:', error)
            }
        }

        return { subscriptionId, customerId, productId, features }
    } catch (error) {
        console.warn('[enrichUserData] Error loading subscription data:', error)
        return { subscriptionId: '', customerId: '', productId: '', features: {} }
    }
}

/**
 * Get permissions for a user based on their workspace role and Auth0 roles.
 *
 * Priority:
 * 1. Workspace role permissions (Flowise native)
 * 2. Auth0 role mapping (fallback)
 * 3. Admin override (add org:manage for org admins)
 */
export async function getPermissionsForUser(
    AppDataSource: DataSource,
    roleId: string | undefined,
    auth0Roles: string[],
    isOrganizationAdmin: boolean
): Promise<string[]> {
    let permissions: string[] = []

    // Auth0 Admin role gets full access (wildcard permission) - check first
    if (auth0Roles?.includes('Admin')) {
        return ['*']
    }

    // Try to get permissions from workspace role (Flowise native)
    if (roleId) {
        try {
            const role = await AppDataSource.getRepository(Role).findOne({
                where: { id: roleId }
            })
            if (role?.permissions) {
                try {
                    permissions = JSON.parse(role.permissions)
                } catch (e) {
                    console.warn('[enrichUserData] Failed to parse role permissions:', e)
                }
            }
        } catch (error) {
            console.warn('[enrichUserData] Error fetching role:', error)
        }
    }

    // Fall back to Auth0 role mapping if no workspace role permissions
    if (permissions.length === 0 && auth0Roles.length > 0) {
        permissions = mapAuth0RolesToPermissions(auth0Roles)
    }

    // Admin override: ensure org:manage permission for organization admins
    if (isOrganizationAdmin && !permissions.includes('org:manage')) {
        permissions.push('org:manage')
    }

    return permissions
}

/**
 * Enriches a basic user with AAI-specific data.
 *
 * Called by:
 * - /auth/me endpoint (for frontend auth state)
 * - aaiPostAuthMiddleware (for API requests after passport auth)
 *
 * @param AppDataSource - TypeORM data source
 * @param user - Basic user from DB
 * @param organization - User's organization
 * @param auth0Roles - Roles from Auth0 (optional, defaults to [])
 * @returns Enriched user data with workspaces, permissions, features
 */
export async function enrichUserWithAAIData(
    AppDataSource: DataSource,
    user: User,
    organization: Organization,
    auth0Roles: string[] = []
): Promise<EnrichedUserData> {
    // Populate workspace data
    const workspaceData: WorkspaceData = await populateWorkspaceData(
        AppDataSource,
        user,
        organization.id
    )

    // Load subscription/features data
    const subscriptionData = await loadOrganizationSubscriptionData(organization)

    // Get permissions (role-based with Auth0 fallback)
    const permissions = await getPermissionsForUser(
        AppDataSource,
        workspaceData.roleId,
        auth0Roles,
        workspaceData.isOrganizationAdmin || false
    )

    // Apply billing customer override for organizational billing consolidation
    let stripeCustomerId = user.stripeCustomerId
    if (OVERRIDE_CUSTOMER_ID && DEFAULT_CUSTOMER_ID) {
        stripeCustomerId = DEFAULT_CUSTOMER_ID
    }

    return {
        // User identity from DB
        id: user.id,
        auth0Id: user.auth0Id,
        email: user.email,
        name: user.name,

        // Organization context
        organizationId: user.organizationId || organization.id,
        stripeCustomerId,
        defaultChatflowId: user.defaultChatflowId,

        // RBAC fields
        roles: auth0Roles,
        role: auth0Roles[0] || 'Member', // Singular role from first in array (Flowise parity)
        permissions,

        // User status fields (Flowise parity)
        status: (user as any).status || 'active',
        isSSO: false, // Default for Auth0 users
        lastLogin: user.updatedDate?.toISOString() || new Date().toISOString(),

        // Subscription/billing fields (Flowise parity)
        activeOrganizationSubscriptionId: subscriptionData.subscriptionId,
        activeOrganizationCustomerId: subscriptionData.customerId,
        activeOrganizationProductId: subscriptionData.productId,
        // Admin users get all features enabled, others get subscription features
        features: auth0Roles?.includes('Admin') ? getAllFeaturesEnabled() : subscriptionData.features,

        // Workspace fields
        activeWorkspaceId: workspaceData.activeWorkspaceId,
        activeOrganizationId: workspaceData.activeOrganizationId || organization.id,
        activeWorkspace: workspaceData.activeWorkspace,
        roleId: workspaceData.roleId,
        isOrganizationAdmin: workspaceData.isOrganizationAdmin || auth0Roles?.includes('Admin'),
        assignedWorkspaces: workspaceData.assignedWorkspaces
    }
}

export default enrichUserWithAAIData
