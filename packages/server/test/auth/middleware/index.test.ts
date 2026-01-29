/**
 * Auth middleware unit tests — validates fast path, slow path, and security logging.
 *
 * These tests mock TypeORM repositories and the JWT middleware to isolate
 * the authentication handler logic without requiring a running database.
 */

// Mock express-oauth2-jwt-bearer before imports
const mockJwtMiddleware = jest.fn()
jest.mock('express-oauth2-jwt-bearer', () => ({
    auth: () => mockJwtMiddleware
}))

// Mock downstream auth helpers
jest.mock('../../../src/middlewares/authentication/findOrCreateOrganization', () => ({
    findOrCreateOrganization: jest.fn()
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateUser', () => ({
    findOrCreateUser: jest.fn(),
    updateUserOrganization: jest.fn()
}))
jest.mock('../../../src/middlewares/authentication/ensureStripeCustomerForUser', () => ({
    ensureStripeCustomerForUser: jest.fn((_ds, user) => Promise.resolve(user))
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateDefaultChatflowsForUser', () => ({
    findOrCreateDefaultChatflowsForUser: jest.fn().mockResolvedValue(null)
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateWorkspacesForUser', () => ({
    findOrCreateWorkspacesForUser: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('../../../src/middlewares/authentication/populateWorkspaceData', () => ({
    populateWorkspaceData: jest.fn().mockResolvedValue({ activeWorkspaceId: 'ws-1' })
}))
jest.mock('../../../src/services/apikey', () => ({
    default: { verifyApiKey: jest.fn().mockResolvedValue(null) }
}))
jest.mock('../../../src/aai-utils/billing/config', () => ({
    DEFAULT_CUSTOMER_ID: undefined,
    OVERRIDE_CUSTOMER_ID: undefined
}))

import { Request, Response, NextFunction } from 'express'
import authenticationHandlerMiddleware from '../../../src/middlewares/authentication/index'
import { findOrCreateUser, updateUserOrganization } from '../../../src/middlewares/authentication/findOrCreateUser'
import { findOrCreateOrganization } from '../../../src/middlewares/authentication/findOrCreateOrganization'
import { User } from '../../../src/database/entities/User'
import { Organization } from '../../../src/database/entities/Organization'

// ---- Helpers ----

const AUTH0_ORG = 'org_valid123'
process.env.AUTH0_ORGANIZATION_ID = AUTH0_ORG

function makeUser(overrides: Record<string, any> = {}) {
    return {
        id: 'user-1',
        auth0Id: 'auth0|user1',
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'org-db-1',
        defaultChatflowId: null,
        stripeCustomerId: null,
        ...overrides
    }
}

function makeOrg(overrides: Record<string, any> = {}) {
    return {
        id: 'org-db-1',
        auth0Id: AUTH0_ORG,
        name: 'Test Org',
        ...overrides
    }
}

function makeMockRepos(userResult: any, orgResult: any) {
    const userRepo = {
        findOneBy: jest.fn().mockResolvedValue(userResult),
        findOne: jest.fn().mockResolvedValue(userResult),
        save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity })),
        update: jest.fn().mockResolvedValue(undefined)
    }
    const orgRepo = {
        findOneBy: jest.fn().mockResolvedValue(orgResult),
        findOne: jest.fn().mockResolvedValue(orgResult)
    }
    return {
        getRepository: jest.fn((entity: any) => {
            if (entity === User) return userRepo
            if (entity === Organization) return orgRepo
            return orgRepo
        }),
        userRepo,
        orgRepo
    }
}

function makeReqResNext() {
    const req = {
        url: '/api/v1/chatflows',
        method: 'GET',
        headers: { authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature' },
        cookies: {},
        auth: {
            payload: {
                sub: 'auth0|user1',
                email: 'test@example.com',
                name: 'Test User',
                org_id: AUTH0_ORG,
                org_name: 'Test Org',
                'https://theanswer.ai/roles': ['User']
            }
        }
    } as unknown as Request

    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn()
    } as unknown as Response

    const next = jest.fn() as NextFunction
    return { req, res, next }
}

/**
 * Simulate the JWT middleware calling through to the inner callback.
 * The real middleware wraps the handler — we just invoke it immediately.
 */
let jwtCallbackPromise: Promise<any>
function setupJwtPassthrough() {
    mockJwtMiddleware.mockImplementation((_req: any, _res: any, cb: Function) => {
        jwtCallbackPromise = cb()
    })
}

// ---- Tests ----

describe('authenticationHandlerMiddleware', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        setupJwtPassthrough()
    })

    describe('Fast path', () => {
        it('returns user when existing user has valid org', async () => {
            const user = makeUser()
            const org = makeOrg()
            const { getRepository } = makeMockRepos(user, org)
            const AppDataSource = { getRepository } as any

            const middleware = authenticationHandlerMiddleware({
                whitelistURLs: [],
                AppDataSource
            })

            const { req, res, next } = makeReqResNext()
            await middleware(req, res, next)
            await jwtCallbackPromise

            expect(next).toHaveBeenCalled()
            expect((req as any).user).toBeDefined()
            expect((req as any).user.id).toBe('user-1')
        })

        it('applies email/name updates via save() not update()', async () => {
            const user = makeUser({ email: 'old@example.com', name: 'Old Name' })
            const org = makeOrg()
            const { getRepository, userRepo } = makeMockRepos(user, org)
            const AppDataSource = { getRepository } as any

            const middleware = authenticationHandlerMiddleware({
                whitelistURLs: [],
                AppDataSource
            })

            const { req, res, next } = makeReqResNext()
            await middleware(req, res, next)
            await jwtCallbackPromise

            // save() should be called (not update() + findOneBy())
            expect(userRepo.save).toHaveBeenCalled()
            expect(userRepo.update).not.toHaveBeenCalled()

            const savedEntity = userRepo.save.mock.calls[0][0]
            expect(savedEntity.email).toBe('test@example.com')
            expect(savedEntity.name).toBe('Test User')
        })

        it('skips save() when profile is unchanged', async () => {
            const user = makeUser()
            const org = makeOrg()
            const { getRepository, userRepo } = makeMockRepos(user, org)
            const AppDataSource = { getRepository } as any

            const middleware = authenticationHandlerMiddleware({
                whitelistURLs: [],
                AppDataSource
            })

            const { req, res, next } = makeReqResNext()
            await middleware(req, res, next)
            await jwtCallbackPromise

            expect(userRepo.save).not.toHaveBeenCalled()
            expect(userRepo.update).not.toHaveBeenCalled()
        })
    })

    describe('Slow path', () => {
        it('falls through for new user (no existing user)', async () => {
            const org = makeOrg()
            const newUser = makeUser()
            const { getRepository, userRepo, orgRepo } = makeMockRepos(null, org)
            const AppDataSource = { getRepository } as any

            ;(findOrCreateUser as jest.Mock).mockResolvedValue(newUser)

            const middleware = authenticationHandlerMiddleware({
                whitelistURLs: [],
                AppDataSource
            })

            const { req, res, next } = makeReqResNext()
            await middleware(req, res, next)
            await jwtCallbackPromise

            expect(findOrCreateUser).toHaveBeenCalled()
            expect(next).toHaveBeenCalled()
        })

        it('falls through on org mismatch and logs security warning', async () => {
            const user = makeUser()
            const mismatchedOrg = makeOrg({ auth0Id: 'org_DIFFERENT' })
            const correctOrg = makeOrg()
            const { getRepository, orgRepo } = makeMockRepos(user, null)
            const AppDataSource = { getRepository } as any

            // First call (fast path) returns mismatched org, second call (slow path) returns correct org
            orgRepo.findOneBy
                .mockResolvedValueOnce(mismatchedOrg)
                .mockResolvedValueOnce(correctOrg)

            ;(findOrCreateUser as jest.Mock).mockResolvedValue(user)

            const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

            const middleware = authenticationHandlerMiddleware({
                whitelistURLs: [],
                AppDataSource
            })

            const { req, res, next } = makeReqResNext()
            await middleware(req, res, next)
            await jwtCallbackPromise

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[Auth:Security] Org mismatch detected')
            )
            expect(findOrCreateUser).toHaveBeenCalled()

            warnSpy.mockRestore()
        })
    })

    describe('Security — deleted org', () => {
        it('falls to slow path when org is deleted (null)', async () => {
            const user = makeUser()
            const { getRepository, orgRepo } = makeMockRepos(user, null)
            const AppDataSource = { getRepository } as any

            // Fast path: org not found. Slow path: org found.
            orgRepo.findOneBy
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(makeOrg())

            ;(findOrCreateUser as jest.Mock).mockResolvedValue(user)

            const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

            const middleware = authenticationHandlerMiddleware({
                whitelistURLs: [],
                AppDataSource
            })

            const { req, res, next } = makeReqResNext()
            await middleware(req, res, next)
            await jwtCallbackPromise

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('db_org=deleted')
            )
            expect(findOrCreateUser).toHaveBeenCalled()

            warnSpy.mockRestore()
        })
    })
})
