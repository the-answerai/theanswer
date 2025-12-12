import { NextFunction, Request, Response } from 'express'
import { DataSource } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../../database/entities/User'
import { Organization } from '../../database/entities/Organization'
import { Role } from '../../enterprise/database/entities/role.entity'
import { ensureStripeCustomerForUser } from './ensureStripeCustomerForUser'
import { findOrCreateDefaultChatflowsForUser } from './findOrCreateDefaultChatflowsForUser'
import { findOrCreateWorkspacesForUser } from './findOrCreateWorkspacesForUser'
import { populateWorkspaceData } from './populateWorkspaceData'
import { DEFAULT_CUSTOMER_ID, OVERRIDE_CUSTOMER_ID } from '../../aai-utils/billing/config'
import { mapAuth0RolesToPermissions } from '../../aai/rbac/permissions'

/**
 * Post-auth middleware that runs AFTER passport authentication.
 * Enhances req.user with AAI-specific data:
 * - Matches existing AAI users by email OR auth0Id
 * - Links Auth0 org membership
 * - Ensures Stripe customer exists
 * - Creates default chatflows
 * - Creates workspaces for new users
 * - Populates workspace data on req.user
 *
 * This middleware bridges the enterprise passport auth with AAI business logic.
 * It runs AFTER passport sets req.user, enhancing it with AAI fields.
 */
export const aaiPostAuthMiddleware = (AppDataSource: DataSource) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip if no user (not authenticated)
        if (!req.user) {
            return next()
        }

        try {
            const passportUser = req.user as any
            const userEmail = passportUser.email
            const passportUserId = passportUser.id

            // Skip if no email and no ID (can't identify user)
            if (!userEmail && !passportUserId) {
                return next()
            }

            // STEP 1: Check if organization exists first (handles chicken-egg problem)
            let organization = await findExistingAAIOrganization(AppDataSource, passportUser)

            let user: User
            if (organization) {
                // STEP 2a: Org exists - create user with org
                user = await findOrCreateAAIUser(AppDataSource, passportUser, organization.id)
            } else {
                // STEP 2b: Org doesn't exist - create user first, then org
                user = await findOrCreateAAIUser(AppDataSource, passportUser)
                organization = await findOrCreateAAIOrganization(AppDataSource, passportUser, user.id)
                // Link user to organization
                if (user.organizationId !== organization.id) {
                    const { updateUserOrganization } = await import('./findOrCreateUser')
                    await updateUserOrganization(AppDataSource, user.id, organization.id)
                    user.organizationId = organization.id
                }
            }

            // STEP 3: Run AAI business logic

            // Ensure Stripe customer exists
            const updatedUser = await ensureStripeCustomerForUser(
                AppDataSource,
                user,
                organization,
                user.auth0Id || '',
                user.email,
                user.name || ''
            )

            // Ensure user has workspaces
            await findOrCreateWorkspacesForUser(AppDataSource, updatedUser, organization.id)

            // Find/create default chatflows
            const defaultChatflowId = await findOrCreateDefaultChatflowsForUser(AppDataSource, updatedUser)

            // Populate workspace data
            const workspaceData = await populateWorkspaceData(AppDataSource, updatedUser, organization.id)

            // STEP 4: Apply billing customer override for organizational billing consolidation
            let stripeCustomerId = updatedUser.stripeCustomerId
            if (OVERRIDE_CUSTOMER_ID && DEFAULT_CUSTOMER_ID) {
                stripeCustomerId = DEFAULT_CUSTOMER_ID
            }

            // STEP 4.5: Load organization subscription data (Flowise parity)
            const subscriptionData = await loadOrganizationSubscriptionData(organization)

            // STEP 5: Determine permissions (hybrid approach for Flowise parity)
            // Priority 1: Use workspace role permissions (Flowise native)
            // Priority 2: Fall back to Auth0 role mapping
            // Priority 3: Admin override (add org:manage)
            const auth0Roles = passportUser.roles || []
            let permissions: string[] = []

            // Try to get permissions from workspace role first (Flowise native)
            if (workspaceData.roleId) {
                const role = await AppDataSource.getRepository(Role).findOne({
                    where: { id: workspaceData.roleId }
                })
                if (role?.permissions) {
                    try {
                        permissions = JSON.parse(role.permissions)
                    } catch (e) {
                        console.warn('[AAI Post-Auth] Failed to parse role permissions:', e)
                    }
                }
            }

            // Fall back to Auth0 role mapping if no workspace role permissions
            if (permissions.length === 0 && auth0Roles.length > 0) {
                permissions = mapAuth0RolesToPermissions(auth0Roles)
            }

            // Admin override: ensure org:manage permission for organization admins
            if (workspaceData.isOrganizationAdmin && !permissions.includes('org:manage')) {
                permissions.push('org:manage')
            }

            // STEP 6: Enhance req.user with AAI data (full Flowise LoggedInUser parity)
            Object.assign(req.user, {
                // User identity from DB
                id: updatedUser.id,

                // AAI fields
                auth0Id: updatedUser.auth0Id,
                stripeCustomerId: stripeCustomerId,
                organizationId: updatedUser.organizationId,
                defaultChatflowId: defaultChatflowId || updatedUser.defaultChatflowId,

                // RBAC fields
                roles: auth0Roles,
                permissions,

                // Subscription/billing fields (Flowise parity)
                activeOrganizationSubscriptionId: subscriptionData.subscriptionId,
                activeOrganizationCustomerId: subscriptionData.customerId,
                activeOrganizationProductId: subscriptionData.productId,
                features: subscriptionData.features,

                // Workspace fields (if not already set by passport)
                ...(!passportUser.activeWorkspaceId && workspaceData)
            })

            next()
        } catch (error) {
            console.error('[AAI Post-Auth] Error enhancing user:', error)
            // Don't fail the request, just log and continue
            next()
        }
    }
}

/**
 * Find OR CREATE AAI user.
 * Supports multiple auth methods:
 * 1. Auth0 JWT (has sub/auth0Id) - uses existing findOrCreateUser
 * 2. Passport SSO/local (has email) - finds by email or creates new
 *
 * SINGLE USER TABLE - no duplication, supports auth0Id, stripe, etc.
 */
async function findOrCreateAAIUser(
    AppDataSource: DataSource,
    passportUser: any,
    organizationId?: string // CHANGED: Now optional for chicken-egg problem
): Promise<User> {
    const userRepo = AppDataSource.getRepository(User)
    const auth0Id = passportUser.sub || passportUser.auth0Id
    const email = passportUser.email
    const name = passportUser.name || passportUser.displayName || email

    // Strategy 1: Auth0 user - use existing findOrCreateUser (handles race conditions)
    if (auth0Id) {
        const { findOrCreateUser } = await import('./findOrCreateUser')
        return findOrCreateUser(AppDataSource, auth0Id, email, name, organizationId)
    }

    // Strategy 2: Non-Auth0 user (passport SSO/local) - find by email or ID
    let user: User | null = null

    // Try to find by passport ID first (if it's a valid UUID)
    if (passportUser.id && isValidUUID(passportUser.id)) {
        user = await userRepo.findOne({ where: { id: passportUser.id } })
    }

    // Fall back to email lookup
    if (!user && email) {
        user = await userRepo.findOne({ where: { email } })
    }

    // If found, update org link if needed
    if (user) {
        let changed = false
        if (organizationId && !user.organizationId) {
            user.organizationId = organizationId
            changed = true
        }
        if (changed) {
            user.updatedBy = user.id
            await userRepo.save(user)
        }
        return user
    }

    // CREATE new user (passport user without existing AAI record)
    // Pre-generate UUID for self-reference audit fields
    const userId = uuidv4()

    // IMPORTANT: Use AppDataSource.manager.create(Entity, data) - TypeORM respects manually-set IDs this way
    const newUser = AppDataSource.manager.create(User, {
        id: userId,
        email,
        name,
        organizationId: organizationId || undefined,
        status: 'active',
        createdBy: userId,
        updatedBy: userId
        // auth0Id will be null for non-Auth0 users
    })
    return AppDataSource.manager.save(User, newUser)
}

/**
 * Find existing AAI organization (WITHOUT creating).
 * Used to check if org exists before creating user (chicken-egg problem).
 */
async function findExistingAAIOrganization(
    AppDataSource: DataSource,
    passportUser: any
): Promise<Organization | null> {
    const orgRepo = AppDataSource.getRepository(Organization)
    const auth0OrgId = passportUser.org_id

    // Strategy 1: Auth0 org - check if exists
    if (auth0OrgId) {
        const org = await orgRepo.findOne({ where: { auth0Id: auth0OrgId } })
        if (org) return org
    }

    // Strategy 2: Use passport's activeOrganizationId
    if (passportUser.activeOrganizationId && isValidUUID(passportUser.activeOrganizationId)) {
        const org = await orgRepo.findOne({ where: { id: passportUser.activeOrganizationId } })
        if (org) return org
    }

    // Strategy 3: Check for existing default organization
    const defaultOrg = await orgRepo.findOne({ where: { name: 'Default Organization' } })
    return defaultOrg
}

/**
 * Find OR CREATE AAI organization.
 * Supports multiple auth methods:
 * 1. Auth0 JWT (has org_id) - uses existing findOrCreateOrganization
 * 2. Passport (has activeOrganizationId) - finds existing org
 * 3. Creates default org if needed
 *
 * SINGLE ORGANIZATION TABLE - no duplication, supports auth0Id, stripe, etc.
 */
async function findOrCreateAAIOrganization(
    AppDataSource: DataSource,
    passportUser: any,
    createdByUserId: string // NEW: Required for creation
): Promise<Organization> {
    const orgRepo = AppDataSource.getRepository(Organization)
    const auth0OrgId = passportUser.org_id
    const orgName = passportUser.org_name || 'Default Organization'

    // Strategy 1: Auth0 org - use existing findOrCreateOrganization
    if (auth0OrgId) {
        const { findOrCreateOrganization } = await import('./findOrCreateOrganization')
        return findOrCreateOrganization(AppDataSource, auth0OrgId, orgName, createdByUserId)
    }

    // Strategy 2: Use passport's activeOrganizationId (from enterprise login)
    if (passportUser.activeOrganizationId && isValidUUID(passportUser.activeOrganizationId)) {
        const org = await orgRepo.findOne({ where: { id: passportUser.activeOrganizationId } })
        if (org) return org
    }

    // Strategy 3: Find or create default organization
    // This handles new passport users without Auth0
    let defaultOrg = await orgRepo.findOne({ where: { name: 'Default Organization' } })
    if (!defaultOrg) {
        // IMPORTANT: Use AppDataSource.manager.create(Entity, data) - TypeORM respects manually-set values this way
        defaultOrg = AppDataSource.manager.create(Organization, {
            id: uuidv4(),
            name: 'Default Organization',
            createdBy: createdByUserId,
            updatedBy: createdByUserId
            // auth0Id will be null for non-Auth0 orgs
        })
        await AppDataSource.manager.save(Organization, defaultOrg)
    }
    return defaultOrg
}

/**
 * Load organization subscription data for Flowise parity.
 * Returns subscriptionId, customerId, productId, and features.
 */
async function loadOrganizationSubscriptionData(organization: Organization): Promise<{
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
                console.warn('[AAI Post-Auth] Error fetching subscription data from Stripe:', error)
            }
        }

        return { subscriptionId, customerId, productId, features }
    } catch (error) {
        console.warn('[AAI Post-Auth] Error loading subscription data:', error)
        return { subscriptionId: '', customerId: '', productId: '', features: {} }
    }
}

/**
 * Helper to validate UUID format
 */
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

export default aaiPostAuthMiddleware
