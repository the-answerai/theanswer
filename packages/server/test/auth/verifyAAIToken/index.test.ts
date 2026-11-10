/**
 * verifyAAIToken unit tests — optional mode (public /prediction) and strict mode (unchanged).
 */

const mockJwtMiddleware = jest.fn()
jest.mock('express-oauth2-jwt-bearer', () => ({
    auth: () => mockJwtMiddleware
}))

const mockVerifyToken = jest.fn()
jest.mock('../../../src/enterprise/middleware/passport', () => ({
    verifyToken: (...args: any[]) => mockVerifyToken(...args)
}))
jest.mock('../../../src/utils/quotaUsage', () => ({
    ENTERPRISE_FEATURE_FLAGS: []
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateOrganization', () => ({
    findOrCreateOrganization: jest.fn()
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateUser', () => ({
    findOrCreateUser: jest.fn(),
    updateUserOrganization: jest.fn()
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateWorkspacesForUser', () => ({
    findOrCreateWorkspacesForUser: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('../../../src/middlewares/authentication/populateWorkspaceData', () => ({
    populateWorkspaceData: jest.fn().mockResolvedValue({ activeWorkspaceId: 'ws-1' })
}))

import { Request, Response } from 'express'
import { DataSource } from 'typeorm'
import { verifyAAIToken, isBearerJWT } from '../../../src/middlewares/authentication/verifyAAIToken'
import { findOrCreateUser } from '../../../src/middlewares/authentication/findOrCreateUser'

const AUTH0_ORG = 'org_valid123'
process.env.AUTH0_ORGANIZATION_ID = AUTH0_ORG

const dataSource = {
    getRepository: jest.fn(() => ({ findOneBy: jest.fn().mockResolvedValue({ id: 'org-db-1', auth0Id: AUTH0_ORG }) }))
} as unknown as DataSource

const makeReq = (authorization?: string, user?: any) => ({ headers: authorization ? { authorization } : {}, user } as unknown as Request)

const makeRes = () => {
    const res: any = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res as Response & { status: jest.Mock; json: jest.Mock }
}

// Resolves when the middleware either calls next() or sends a response.
const run = (mw: ReturnType<typeof verifyAAIToken>, req: Request, res: ReturnType<typeof makeRes>) =>
    new Promise<jest.Mock>((resolve) => {
        const next: jest.Mock = jest.fn(() => resolve(next))
        res.json.mockImplementation(() => {
            resolve(next)
            return res
        })
        mw(req, res, next)
    })

const jwtSucceeds = (payload: Record<string, any>) =>
    mockJwtMiddleware.mockImplementation((req: any, _res: any, next: any) => {
        req.auth = { payload }
        next()
    })

const validPayload = { sub: 'auth0|u1', email: 'a@b.c', org_id: AUTH0_ORG }

beforeEach(() => {
    jest.clearAllMocks()
    ;(findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'a@b.c', name: 'A', organizationId: 'org-db-1' })
})

describe('isBearerJWT', () => {
    it('is true only for Bearer with three dot-separated segments', () => {
        expect(isBearerJWT(makeReq('Bearer a.b.c'))).toBe(true)
        expect(isBearerJWT(makeReq('Bearer abc123'))).toBe(false)
        expect(isBearerJWT(makeReq('Basic a.b.c'))).toBe(false)
        expect(isBearerJWT(makeReq())).toBe(false)
    })
})

describe('verifyAAIToken optional mode', () => {
    const mw = verifyAAIToken(dataSource, { optional: true })

    it('optional: no header skips jwtCheck', async () => {
        const req = makeReq()
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(mockJwtMiddleware).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledTimes(1)
        expect(req.user).toBeUndefined()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('optional: api key is not treated as JWT', async () => {
        const req = makeReq('Bearer abc123')
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(mockJwtMiddleware).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledTimes(1)
        expect(req.user).toBeUndefined()
    })

    it('optional: valid token sets req.user', async () => {
        jwtSucceeds(validPayload)
        const req = makeReq('Bearer a.b.c')
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(next).toHaveBeenCalledTimes(1)
        expect((req.user as any).id).toBe('user-1')
        expect((req.user as any).activeWorkspaceId).toBe('ws-1')
        expect(res.status).not.toHaveBeenCalled()
    })

    it('optional: disallowed org continues anonymous', async () => {
        jwtSucceeds({ ...validPayload, org_id: 'org_other' })
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const req = makeReq('Bearer a.b.c')
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(next).toHaveBeenCalledTimes(1)
        expect(req.user).toBeUndefined()
        expect(res.status).not.toHaveBeenCalled()
        expect(findOrCreateUser).not.toHaveBeenCalled()
        expect(JSON.stringify(warn.mock.calls)).not.toContain('a@b.c')
        warn.mockRestore()
    })

    it('optional: invalid token continues anonymous', async () => {
        mockJwtMiddleware.mockImplementation((_req: any, _res: any, next: any) => next(new Error('invalid_token')))
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const req = makeReq('Bearer a.b.c')
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith()
        expect(req.user).toBeUndefined()
        expect(res.status).not.toHaveBeenCalled()
        expect(mockVerifyToken).not.toHaveBeenCalled()
    })

    it('optional: user sync error continues anonymous', async () => {
        jwtSucceeds(validPayload)
        ;(findOrCreateUser as jest.Mock).mockRejectedValue(new Error('db down'))
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const req = makeReq('Bearer a.b.c')
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(next).toHaveBeenCalledTimes(1)
        expect(req.user).toBeUndefined()
        expect(res.status).not.toHaveBeenCalled()
        expect(mockVerifyToken).not.toHaveBeenCalled()
    })

    it('optional: existing req.user is kept', async () => {
        const existing = { id: 'session-user' }
        const req = makeReq('Bearer a.b.c', existing)
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(mockJwtMiddleware).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledTimes(1)
        expect(req.user).toBe(existing)
    })
})

describe('verifyAAIToken strict mode', () => {
    const mw = verifyAAIToken(dataSource)

    it('strict: invalid token still returns 401', async () => {
        mockJwtMiddleware.mockImplementation((_req: any, _res: any, next: any) => next(new Error('invalid_token')))
        mockVerifyToken.mockImplementation((_req: any, _res: any, cb: any) => cb(new Error('no passport user')))
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const req = makeReq('Bearer a.b.c')
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('strict: disallowed org still returns 401', async () => {
        jwtSucceeds({ ...validPayload, org_id: 'org_other' })
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const req = makeReq('Bearer a.b.c')
        const res = makeRes()
        const next = await run(mw, req, res)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })
})
