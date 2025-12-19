import { NextFunction, Request, Response } from 'express'
import { DataSource } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../../database/entities/User'
import { Organization } from '../../database/entities/Organization'
import { ensureStripeCustomerForUser } from './ensureStripeCustomerForUser'
import { findOrCreateDefaultChatflowsForUser } from './findOrCreateDefaultChatflowsForUser'
import { findOrCreateWorkspacesForUser } from './findOrCreateWorkspacesForUser'
import { enrichUserWithAAIData } from '../../aai/auth/enrichUserData'

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

            // STEP 4: Enrich user with AAI data using shared function
            const auth0Roles = passportUser.roles || []
            const enrichedData = await enrichUserWithAAIData(AppDataSource, updatedUser, organization, auth0Roles)

            // STEP 5: Enhance req.user with enriched data (full Flowise LoggedInUser parity)
            Object.assign(req.user, {
                ...enrichedData,
                // Override defaultChatflowId if we just created one
                defaultChatflowId: defaultChatflowId || enrichedData.defaultChatflowId,
                // Preserve workspace fields from passport if already set
                ...(!passportUser.activeWorkspaceId && {
                    activeWorkspaceId: enrichedData.activeWorkspaceId,
                    activeOrganizationId: enrichedData.activeOrganizationId,
                    activeWorkspace: enrichedData.activeWorkspace,
                    roleId: enrichedData.roleId,
                    isOrganizationAdmin: enrichedData.isOrganizationAdmin,
                    assignedWorkspaces: enrichedData.assignedWorkspaces
                })
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
 * Helper to validate UUID format
 */
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

export default aaiPostAuthMiddleware
