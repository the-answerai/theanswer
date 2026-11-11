/**
 * Integration test for the default rate limit on /api/v1/prediction (local only).
 *
 * Real: the predictions router (optional auth, then the rate limiter), RS256 token verification against a
 * local issuer, Postgres with the app's migrations, the RateLimiterManager with DEFAULT_RATE_LIMIT_MAX=2.
 * Mocked: getRunningExpressApp, buildChatflow and the streaming check.
 *
 * Run: same as test/integration/prediction, with `pnpm exec jest test/integration/rateLimit`.
 */
import crypto from 'node:crypto'
import express from 'express'
import supertest from 'supertest'
import { DataSource } from 'typeorm'
import { ORG, setupAuth0AndDb } from '../auth0Fixture'

const mockApp: { AppDataSource?: DataSource } = {}
jest.mock('../../../src/utils/getRunningExpressApp', () => ({
    getRunningExpressApp: () => mockApp
}))
jest.mock('../../../src/services/predictions', () => ({
    __esModule: true,
    default: { buildChatflow: async () => ({ text: 'ok' }) }
}))

const PG = process.env.TEST_PG_URL
const d = PG ? describe : describe.skip

d('default rate limit on /api/v1/prediction (integration)', () => {
    jest.setTimeout(180000)

    let fx: Awaited<ReturnType<typeof setupAuth0AndDb>>
    let app: express.Express
    let workspaceId = ''
    let ChatFlow: any
    let User: any
    const user = (name: string) => `Bearer ${fx.sign({ sub: `auth0|${name}`, email: `${name}@test.local`, name, org_id: ORG })}`

    const post = (id: string, authorization?: string) => {
        const req = supertest(app).post(`/api/v1/prediction/${id}`).send({ question: 'hi' })
        return authorization ? req.set('Authorization', authorization) : req
    }
    const statuses = async (id: string, authorization: string | undefined, n: number) => {
        const out: number[] = []
        for (let i = 0; i < n; i++) out.push((await post(id, authorization)).status)
        return out
    }
    // Each test gets its own chatflow, so buckets don't leak between tests.
    const newChatflow = async () =>
        (await fx.ds.getRepository(ChatFlow).save({ name: 'cf', flowData: JSON.stringify({ nodes: [], edges: [] }), workspaceId })).id

    beforeAll(async () => {
        // The manager is a lazy singleton: set before its first use.
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        fx = await setupAuth0AndDb(PG!)
        mockApp.AppDataSource = fx.ds
        ChatFlow = (await import('../../../src/database/entities/ChatFlow')).ChatFlow
        User = (await import('../../../src/database/entities/User')).User
        const WorkspaceUser = (await import('../../../src/enterprise/database/entities/workspace-user.entity')).WorkspaceUser

        const chatflowsService = (await import('../../../src/services/chatflows')).default
        jest.spyOn(chatflowsService, 'checkIfChatflowIsValidForStreaming').mockResolvedValue({ isStreaming: false } as any)
        const router = (await import('../../../src/routes/predictions')).default
        app = express()
        app.use(express.json())
        app.use('/api/v1/prediction', router)
        app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
            res.status(err.statusCode || err.status || 500).json({ message: err.message })
        })

        // Provision alice (first signed-in request), on a throwaway chatflow id so no test bucket is touched.
        await post(crypto.randomUUID(), user('alice'))
        const alice = await fx.ds.getRepository(User).findOneByOrFail({ auth0Id: 'auth0|alice' })
        workspaceId = (await fx.ds.getRepository(WorkspaceUser).findOneByOrFail({ userId: alice.id })).workspaceId
    })

    afterAll(async () => {
        delete process.env.DEFAULT_RATE_LIMIT_MAX
        await fx?.close()
    })

    it('one user hits the limit; another user on the same IP still gets through', async () => {
        const id = await newChatflow()
        expect(await statuses(id, user('alice'), 3)).toEqual([200, 200, 429])
        expect(await statuses(id, user('bob'), 1)).toEqual([200])
    })

    it('anonymous callers on one IP share one bucket', async () => {
        expect(await statuses(await newChatflow(), undefined, 3)).toEqual([200, 200, 429])
    })

    it('a forged token counts as anonymous and creates no user', async () => {
        const id = await newChatflow()
        const usersBefore = await fx.ds.getRepository(User).count()
        const forged = `Bearer ${fx.sign({ sub: 'auth0|mallory', email: 'm@test.local', org_id: ORG }, fx.otherKey)}`
        expect(await statuses(id, forged, 2)).toEqual([200, 200])
        expect(await statuses(id, undefined, 1)).toEqual([429])
        expect(await fx.ds.getRepository(User).count()).toBe(usersBefore)
    })
})
