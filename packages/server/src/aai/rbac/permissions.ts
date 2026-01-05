/**
 * AAI Role-Based Access Control (RBAC) Permissions
 *
 * Maps Auth0 roles (from custom claims) to Flowise resource permissions.
 * This provides a translation layer between Auth0's role system and
 * Flowise's permission-based access control.
 *
 * Permission format: {resource}:{action}
 * - chatflows:view, chatflows:create, chatflows:update, chatflows:delete
 * - credentials:view, credentials:create, credentials:update, credentials:delete
 * - etc.
 *
 * Special permissions:
 * - '*' = full access to everything
 * - 'org:manage' = organization admin capabilities
 *
 * Permission strings are aligned with Flowise enterprise Permissions.ts
 */

// Flowise resource types (aligned with enterprise Permissions.ts)
export const FLOWISE_RESOURCES = [
    'chatflows',
    'agentflows',
    'tools',
    'assistants',
    'credentials',
    'variables',
    'apikeys',
    'documentStores',
    'datasets',
    'executions',
    'evaluators',
    'evaluations',
    'templates',
    'workspace',
    'logs',
    'loginActivity'
] as const

// Permission actions
export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete'] as const

// Role to permissions mapping (aligned with Flowise enterprise permissions)
export const AAI_ROLE_PERMISSIONS: Record<string, string[]> = {
    // Full access roles
    Admin: ['*'],
    Owner: ['*'],

    // Editor - can create and modify, but not delete or manage org
    Editor: [
        // Chatflows
        'chatflows:view',
        'chatflows:create',
        'chatflows:update',
        'chatflows:duplicate',
        'chatflows:export',
        'chatflows:import',
        'chatflows:config',
        'chatflows:domains',

        // Agentflows
        'agentflows:view',
        'agentflows:create',
        'agentflows:update',
        'agentflows:duplicate',
        'agentflows:export',
        'agentflows:import',
        'agentflows:config',
        'agentflows:domains',

        // Assistants
        'assistants:view',
        'assistants:create',
        'assistants:update',

        // Credentials
        'credentials:view',
        'credentials:create',
        'credentials:update',
        'credentials:share',

        // Tools
        'tools:view',
        'tools:create',
        'tools:update',
        'tools:export',

        // Variables
        'variables:view',
        'variables:create',
        'variables:update',

        // Document Stores
        'documentStores:view',
        'documentStores:create',
        'documentStores:update',
        'documentStores:add-loader',
        'documentStores:delete-loader',
        'documentStores:preview-process',
        'documentStores:upsert-config',

        // API Keys
        'apikeys:view',
        'apikeys:create',
        'apikeys:update',
        'apikeys:import',

        // Datasets
        'datasets:view',
        'datasets:create',
        'datasets:update',

        // Executions
        'executions:view',

        // Evaluators
        'evaluators:view',
        'evaluators:create',
        'evaluators:update',

        // Evaluations
        'evaluations:view',
        'evaluations:create',
        'evaluations:update',
        'evaluations:run',

        // Templates
        'templates:marketplace',
        'templates:custom',
        'templates:toolexport',
        'templates:flowexport',

        // Workspace
        'workspace:view',

        // Logs
        'logs:view'
    ],

    // Member - can create basic resources
    Member: [
        // Chatflows
        'chatflows:view',
        'chatflows:create',
        'chatflows:update',
        'chatflows:duplicate',
        'chatflows:config',

        // Agentflows
        'agentflows:view',
        'agentflows:create',
        'agentflows:update',
        'agentflows:duplicate',
        'agentflows:config',

        // Assistants
        'assistants:view',
        'assistants:create',

        // Credentials
        'credentials:view',
        'credentials:create',

        // Tools
        'tools:view',
        'tools:create',

        // Variables
        'variables:view',
        'variables:create',

        // Document Stores
        'documentStores:view',
        'documentStores:create',
        'documentStores:add-loader',
        'documentStores:preview-process',

        // API Keys
        'apikeys:view',

        // Datasets
        'datasets:view',
        'datasets:create',

        // Executions
        'executions:view',

        // Evaluators
        'evaluators:view',

        // Evaluations
        'evaluations:view',
        'evaluations:create',

        // Templates
        'templates:marketplace',
        'templates:custom',

        // Workspace
        'workspace:view'
    ],

    // Viewer - read-only access
    Viewer: [
        'chatflows:view',
        'agentflows:view',
        'assistants:view',
        'credentials:view',
        'tools:view',
        'variables:view',
        'documentStores:view',
        'apikeys:view',
        'datasets:view',
        'executions:view',
        'evaluators:view',
        'evaluations:view',
        'templates:marketplace',
        'templates:custom',
        'workspace:view'
    ]
}

/**
 * Map Auth0 roles to Flowise permissions.
 * Combines permissions from all roles the user has.
 */
export const mapAuth0RolesToPermissions = (roles: string[]): string[] => {
    const permissions = new Set<string>()

    for (const role of roles) {
        const rolePerms = AAI_ROLE_PERMISSIONS[role]
        if (rolePerms) {
            rolePerms.forEach((p) => permissions.add(p))
        }
    }

    return Array.from(permissions)
}

/**
 * Check if user has a specific permission.
 */
export const hasPermission = (userPermissions: string[], required: string, isOrgAdmin: boolean = false): boolean => {
    // Org admins have full access
    if (isOrgAdmin) return true

    // Check for wildcard permission
    if (userPermissions.includes('*')) return true

    // Check for exact permission
    if (userPermissions.includes(required)) return true

    // Check for resource wildcard (e.g., 'chatflows:*' grants all chatflow permissions)
    const [resource] = required.split(':')
    if (userPermissions.includes(`${resource}:*`)) return true

    return false
}

/**
 * Check if user has any of the specified permissions.
 */
export const hasAnyPermission = (
    userPermissions: string[],
    required: string[],
    isOrgAdmin: boolean = false
): boolean => {
    return required.some((perm) => hasPermission(userPermissions, perm, isOrgAdmin))
}

/**
 * Check if user has all of the specified permissions.
 */
export const hasAllPermissions = (
    userPermissions: string[],
    required: string[],
    isOrgAdmin: boolean = false
): boolean => {
    return required.every((perm) => hasPermission(userPermissions, perm, isOrgAdmin))
}

/**
 * Get all permissions for a resource.
 */
export const getResourcePermissions = (resource: string): string[] => {
    return PERMISSION_ACTIONS.map((action) => `${resource}:${action}`)
}

export default {
    AAI_ROLE_PERMISSIONS,
    mapAuth0RolesToPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getResourcePermissions
}
