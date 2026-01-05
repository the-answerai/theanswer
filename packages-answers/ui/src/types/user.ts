/**
 * Shared User Type Interface for Flowise UI
 *
 * This interface defines the user object structure used across:
 * - Redux authSlice (loginSuccess payload)
 * - Auth0Setup hook (backendUser state)
 * - authUtils.js (extractUser function)
 *
 * Aligned with server-side EnrichedUserData from:
 * packages/server/src/aai/auth/enrichUserData.ts
 */

export interface AssignedWorkspace {
    id: string
    name: string
    role: string
    organizationId: string
}

export interface FlowiseUser {
    // User identity
    id: string
    email: string
    name?: string
    auth0Id?: string

    // User status
    status: string
    isSSO: boolean
    lastLogin?: string

    // Roles and permissions
    role: string // Singular role (first from roles array)
    roles: string[] // Full array of roles from Auth0
    permissions: string[]

    // Organization context
    organizationId: string
    activeOrganizationId: string
    activeOrganizationSubscriptionId: string
    activeOrganizationCustomerId: string
    activeOrganizationProductId: string
    stripeCustomerId?: string

    // Workspace context
    activeWorkspaceId: string
    activeWorkspace?: string
    roleId?: string
    isOrganizationAdmin: boolean
    assignedWorkspaces: AssignedWorkspace[]

    // Subscription features
    features: Record<string, string>

    // AAI-specific
    defaultChatflowId?: string
    chatflowDomain?: string
}

/**
 * Auth state stored in Redux and localStorage
 */
export interface AuthState {
    user: FlowiseUser | null
    isAuthenticated: boolean
    isGlobal: boolean
    token: string | null
    permissions: string[] | null
    features: Record<string, string> | null
}

export default FlowiseUser
