export type PermissionName = string

export interface PermissionSource {
    roles?: unknown
    permissions?: unknown
    [key: string]: unknown
}

export interface PermissionManagerOptions {
    additionalPermissions?: PermissionName[]
}

const ROLE_PERMISSION_MAP: Record<string, PermissionName[]> = {
    Admin: ['org:manage', 'chatflow:manage', 'chatflow:use', 'enterprise_admin', 'developer_mode', 'delete_prompt'],
    Builder: ['chatflow:manage', 'chatflow:use', 'developer_mode', 'delete_prompt'],
    Member: ['chatflow:use'],
    'Enterprise Admin': ['enterprise_admin', 'org:manage', 'chatflow:manage', 'chatflow:use']
}

const ROLE_ALIASES: Record<string, string> = {
    administrator: 'Admin',
    admin: 'Admin',
    builder: 'Builder',
    member: 'Member'
}

type FeaturePredicate = (context: PermissionManager) => boolean

interface FeatureRule {
    anyPermissions?: PermissionName[]
    allPermissions?: PermissionName[]
    anyRoles?: string[]
    predicate?: FeaturePredicate
}

const FEATURE_RULES: Record<string, FeatureRule> = {
    'chatflow:use': { anyPermissions: ['chatflow:use', 'chatflow:manage', 'org:manage'] },
    'chatflow:manage': { anyPermissions: ['chatflow:manage', 'org:manage'] },
    'org:manage': { anyPermissions: ['org:manage'] },
    enterprise_admin: { anyPermissions: ['enterprise_admin', 'org:manage'], anyRoles: ['Admin'] },
    delete_prompt: { anyPermissions: ['chatflow:manage', 'org:manage', 'delete_prompt'] },
    developer_mode: { anyRoles: ['Admin', 'Builder'] },
    web_sync_status: { anyPermissions: ['org:manage'] },
    organization_override: { anyPermissions: ['org:manage'] },
    sync: { anyPermissions: ['chatflow:manage', 'org:manage'] },
    confluence: { anyPermissions: ['chatflow:manage', 'org:manage'] },
    'chatflow:share:internal': { anyPermissions: ['chatflow:manage', 'org:manage'] },
    'chatflow:share:external': { anyPermissions: ['org:manage', 'chatflow:share:external'] },
    sidekicks_system: { anyPermissions: ['chatflow:manage', 'org:manage', 'chatflow:use'] }
}

const potentialRoleKeys = ['roles', 'role', 'https://theanswer.ai/roles']
const potentialPermissionKeys = ['permissions', 'https://theanswer.ai/permissions']

const normalizeToArray = (value: unknown): string[] => {
    if (!value) return []
    if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item))
    if (typeof value === 'string') {
        if (!value.trim()) return []
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
    }
    return []
}

const normalizeRoles = (source: PermissionSource): string[] => {
    const roleValues = potentialRoleKeys.flatMap((key) => normalizeToArray(source[key]))
    const normalized = new Set<string>()
    roleValues.forEach((role) => {
        const canonical = ROLE_ALIASES[role.toLowerCase()] ?? role
        normalized.add(canonical)
    })
    return Array.from(normalized)
}

const normalizePermissions = (source: PermissionSource): PermissionName[] => {
    const permissionValues = potentialPermissionKeys.flatMap((key) => normalizeToArray(source[key]))
    return Array.from(new Set(permissionValues))
}

const derivePermissionSet = (roles: string[], explicitPermissions: PermissionName[], options?: PermissionManagerOptions) => {
    const permissionSet = new Set<PermissionName>()
    explicitPermissions.forEach((permission) => permissionSet.add(permission))
    roles.forEach((role) => {
        ROLE_PERMISSION_MAP[role]?.forEach((permission) => permissionSet.add(permission))
    })
    options?.additionalPermissions?.forEach((permission) => permissionSet.add(permission))
    return permissionSet
}

export interface PermissionManager {
    roles: string[]
    permissions: PermissionName[]
    hasRole: (role: string) => boolean
    hasAnyRole: (roles: string[]) => boolean
    hasPermission: (permission: PermissionName) => boolean
    hasAnyPermission: (permissions: PermissionName[]) => boolean
    hasAllPermissions: (permissions: PermissionName[]) => boolean
    hasFeature: (feature: string) => boolean
}

export const createPermissionManager = (
    source: PermissionSource | null | undefined,
    options?: PermissionManagerOptions
): PermissionManager => {
    const roles = normalizeRoles(source ?? {})
    const explicitPermissions = normalizePermissions(source ?? {})
    const permissionSet = derivePermissionSet(roles, explicitPermissions, options)

    const hasRole = (role: string) => {
        if (!role) return false
        return roles.includes(role) || roles.map((item) => item.toLowerCase()).includes(role.toLowerCase())
    }

    const hasAnyRole = (requestedRoles: string[]) => {
        if (!requestedRoles?.length) return false
        return requestedRoles.some((role) => hasRole(role))
    }

    const hasPermission = (permission: PermissionName) => permissionSet.has(permission)

    const hasAnyPermission = (permissions: PermissionName[]) => {
        if (!permissions?.length) return false
        return permissions.some((permission) => hasPermission(permission))
    }

    const hasAllPermissions = (permissions: PermissionName[]) => {
        if (!permissions?.length) return false
        return permissions.every((permission) => hasPermission(permission))
    }

    const evaluateFeature = (feature: string, evaluator: PermissionManager): boolean => {
        if (!feature) return false
        const rule = FEATURE_RULES[feature]
        if (!rule) return evaluator.hasPermission(feature)
        if (rule.anyPermissions && evaluator.hasAnyPermission(rule.anyPermissions)) return true
        if (rule.allPermissions && evaluator.hasAllPermissions(rule.allPermissions)) return true
        if (rule.anyRoles && evaluator.hasAnyRole(rule.anyRoles)) return true
        if (rule.predicate) return rule.predicate(evaluator)
        return false
    }

    const manager: PermissionManager = {
        roles,
        permissions: Array.from(permissionSet),
        hasRole,
        hasAnyRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasFeature: () => false
    }

    manager.hasFeature = (feature: string) => evaluateFeature(feature, manager)

    return manager
}

export type PermissionEvaluator = ReturnType<typeof createPermissionManager>
