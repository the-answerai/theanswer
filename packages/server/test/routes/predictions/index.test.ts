/**
 * /api/v1/prediction router tests — real verifyAAIToken in optional mode, real controller.
 * Only the JWT library, DB helpers and downstream services are mocked.
 */

const mockJwtMiddleware = jest.fn()
jest.mock('express-oauth2-jwt-bearer', () => ({
    auth: () => mockJwtMiddleware
}))
jest.mock('../../../src/enterprise/middleware/passport', () => ({
    verifyToken: jest.fn()
}))
jest.mock('../../../src/utils/quotaUsage', () => ({
    ENTERPRISE_FEATURE_FLAGS: []
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateOrganization', () => ({
    findOrCreateOrganization: jest.fn()
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateUser', () => ({
    findOrCreateUser: jest.fn().mockResolvedValue({ id: 'user-1', email: 'a@b.c', name: 'A', organizationId: 'org-db-1' }),
    updateUserOrganization: jest.fn()
}))
jest.mock('../../../src/middlewares/authentication/findOrCreateWorkspacesForUser', () => ({
    findOrCreateWorkspacesForUser: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('../../../src/middlewares/authentication/populateWorkspaceData', () => ({
    populateWorkspaceData: jest.fn().mockResolvedValue({ activeWorkspaceId: 'ws-personal' })
}))
jest.mock('../../../src/utils', () => ({
    getMulterStorage: () => ({ array: () => (_req: any, _res: any, next: any) => next() })
}))
const mockLimiter: { opts?: any; seenUser?: any } = {}
jest.mock('../../../src/utils/rateLimit', () => ({
    RateLimiterManager: {
        getInstance: () => ({
            getRateLimiter: (opts: any) => (req: any, _res: any, next: any) => {
                mockLimiter.opts = opts
                mockLimiter.seenUser = req.user
                next()
            }
        })
    }
}))
jest.mock('../../../src/utils/getRunningExpressApp', () => ({
    getRunningExpressApp: () => ({
        AppDataSource: { getRepository: () => ({ findOneBy: jest.fn().mockResolvedValue({ id: 'org-db-1', auth0Id: 'org_valid123' }) }) }
    })
}))
jest.mock('../../../src/services/chatflows', () => ({
    __esModule: true,
    default: {
        getChatflowById: jest.fn().mockResolvedValue({ id: 'cf-1', chatbotConfig: null }),
        checkIfChatflowIsValidForStreaming: jest.fn().mockResolvedValue({ isStreaming: false })
    }
}))
jest.mock('../../../src/services/predictions', () => ({
    __esModule: true,
    default: { buildChatflow: jest.fn() }
}))

import express from 'express'
import supertest from 'supertest'
import router from '../../../src/routes/predictions'
import chatflowsService from '../../../src/services/chatflows'
import predictionsServices from '../../../src/services/predictions'

process.env.AUTH0_ORGANIZATION_ID = 'org_valid123'

const app = express()
app.use(express.json())
app.use('/api/v1/prediction', router)

let seenUser: any
beforeEach(() => {
    jest.clearAllMocks()
    seenUser = 'not-called'
    ;(predictionsServices.buildChatflow as jest.Mock).mockImplementation(async (req: any) => {
        seenUser = req.user
        return { text: 'ok' }
    })
})

describe('POST /api/v1/prediction/:id', () => {
    it('createPrediction does not scope by activeWorkspaceId', async () => {
        mockJwtMiddleware.mockImplementation((req: any, _res: any, next: any) => {
            req.auth = { payload: { sub: 'auth0|u1', email: 'a@b.c', org_id: 'org_valid123' } }
            next()
        })
        await supertest(app).post('/api/v1/prediction/cf-1').set('Authorization', 'Bearer a.b.c').send({ question: 'hi' }).expect(200)
        expect(seenUser.id).toBe('user-1')
        expect(chatflowsService.getChatflowById).toHaveBeenCalledWith('cf-1')
        expect((chatflowsService.getChatflowById as jest.Mock).mock.calls[0]).toHaveLength(1)
    })

    it('runs optional auth before the rate limiter', async () => {
        mockJwtMiddleware.mockImplementation((req: any, _res: any, next: any) => {
            req.auth = { payload: { sub: 'auth0|u1', email: 'a@b.c', org_id: 'org_valid123' } }
            next()
        })
        mockLimiter.seenUser = 'not-called'
        await supertest(app).post('/api/v1/prediction/cf-1').set('Authorization', 'Bearer a.b.c').send({ question: 'hi' }).expect(200)
        expect(mockLimiter.seenUser?.id).toBe('user-1')
        expect(mockLimiter.opts).toEqual({ withDefault: true })
    })

    it('no header stays anonymous', async () => {
        await supertest(app).post('/api/v1/prediction/cf-1').send({ question: 'hi' }).expect(200)
        expect(seenUser).toBeUndefined()
        expect(mockJwtMiddleware).not.toHaveBeenCalled()
    })
})
