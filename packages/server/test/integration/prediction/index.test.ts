/**
 * Integration test for optional auth on /api/v1/prediction (local only).
 *
 * Real: RS256 token verification (express-oauth2-jwt-bearer against a local issuer), Postgres with the
 * app's own migrations, user/org/workspace provisioning, chatflow lookup. Mocked: getRunningExpressApp
 * (no full server), buildChatflow (records req.user instead of running a flow) and the streaming check.
 *
 * Run: docker run --rm -d --name pred-it-pg -e POSTGRES_PASSWORD=test -p 127.0.0.1::5432 postgres:16
 *      docker port pred-it-pg   # -> 127.0.0.1:<port>
 *      NODE_OPTIONS=--experimental-vm-modules TEST_PG_URL=postgres://postgres:test@127.0.0.1:<port>/postgres \
 *        pnpm exec jest test/integration/prediction
 * NODE_OPTIONS is needed because langfuse-core (loaded through flowise-components) runs a dynamic import() at load.
 */
import crypto from 'node:crypto'
import http from 'node:http'
import { AddressInfo } from 'node:net'
import express from 'express'
import supertest from 'supertest'
import { DataSource } from 'typeorm'

const mockApp: { AppDataSource?: DataSource } = {}
jest.mock('../../../src/utils/getRunningExpressApp', () => ({
    getRunningExpressApp: () => mockApp
}))
const mockBuildChatflow = jest.fn()
jest.mock('../../../src/services/predictions', () => ({
    __esModule: true,
    default: { buildChatflow: (...args: any[]) => mockBuildChatflow(...args) }
}))

const PG = process.env.TEST_PG_URL
const d = PG ? describe : describe.skip

const AUDIENCE = 'https://api.test.local'
const ORG = 'org_ias'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

d('POST /api/v1/prediction (integration)', () => {
    jest.setTimeout(180000)

    const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    const otherKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    let issuer = ''
    let issuerServer: http.Server
    let ds: DataSource
    let app: express.Express
    let entities: { User: any; Organization: any; Workspace: any; WorkspaceUser: any; ChatFlow: any }
    let userId = ''
    let chatflowId = ''

    const sign = (claims: Record<string, any>, key = keys.privateKey) => {
        const now = Math.floor(Date.now() / 1000)
        const head = b64({ alg: 'RS256', typ: 'JWT', kid: 'k1' })
        const body = b64({ iss: issuer, aud: AUDIENCE, iat: now, exp: now + 600, ...claims })
        const sig = crypto.sign('sha256', Buffer.from(`${head}.${body}`), key).toString('base64url')
        return `${head}.${body}.${sig}`
    }
    const alice = (extra: Record<string, any> = {}) =>
        sign({ sub: 'auth0|alice', email: 'alice@test.local', name: 'Alice', org_id: ORG, ...extra })

    const post = (id: string, authorization?: string) => {
        const req = supertest(app).post(`/api/v1/prediction/${id}`).send({ question: 'hi' })
        return authorization ? req.set('Authorization', authorization) : req
    }
    // Shows the error body when the status is not 200.
    const ok = (res: supertest.Response) => expect({ status: res.status, body: res.body }).toEqual({ status: 200, body: { text: 'ok' } })

    let seenUser: any
    const counts = async () => ({
        users: await ds.getRepository(entities.User).count(),
        orgs: await ds.getRepository(entities.Organization).count(),
        workspaces: await ds.getRepository(entities.Workspace).count()
    })

    beforeAll(async () => {
        const jwk = { ...keys.publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }
        issuerServer = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json')
            if (req.url === '/.well-known/openid-configuration') return res.end(JSON.stringify({ issuer, jwks_uri: `${issuer}jwks` }))
            if (req.url === '/jwks') return res.end(JSON.stringify({ keys: [jwk] }))
            res.statusCode = 404
            res.end('{}')
        })
        await new Promise<void>((resolve) => issuerServer.listen(0, '127.0.0.1', resolve))
        issuer = `http://127.0.0.1:${(issuerServer.address() as AddressInfo).port}/`

        const url = new URL(PG!)
        Object.assign(process.env, {
            AUTH0_ISSUER_BASE_URL: issuer,
            AUTH0_AUDIENCE: AUDIENCE,
            AUTH0_ORGANIZATION_ID: ORG,
            DATABASE_TYPE: 'postgres',
            DATABASE_HOST: url.hostname,
            DATABASE_PORT: url.port,
            DATABASE_USER: decodeURIComponent(url.username),
            DATABASE_PASSWORD: decodeURIComponent(url.password),
            DATABASE_NAME: url.pathname.slice(1)
        })

        // Imported after env is set: jwtCheck reads AUTH0_* at module load.
        const dsModule = await import('../../../src/DataSource')
        await dsModule.init()
        ds = dsModule.getDataSource()
        await ds.initialize()
        await ds.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        await ds.runMigrations({ transaction: 'each' })
        mockApp.AppDataSource = ds

        entities = {
            User: (await import('../../../src/database/entities/User')).User,
            Organization: (await import('../../../src/database/entities/Organization')).Organization,
            Workspace: (await import('../../../src/enterprise/database/entities/workspace.entity')).Workspace,
            WorkspaceUser: (await import('../../../src/enterprise/database/entities/workspace-user.entity')).WorkspaceUser,
            ChatFlow: (await import('../../../src/database/entities/ChatFlow')).ChatFlow
        }

        // The streaming check needs real flow nodes; it is not what this test is about.
        const chatflowsService = (await import('../../../src/services/chatflows')).default
        jest.spyOn(chatflowsService, 'checkIfChatflowIsValidForStreaming').mockResolvedValue({ isStreaming: false } as any)
        const router = (await import('../../../src/routes/predictions')).default
        app = express()
        app.use(express.json())
        app.use('/api/v1/prediction', router)
        app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
            res.status(err.statusCode || err.status || 500).json({ message: err.message })
        })

        // First signed-in request provisions alice like her first Studio login (user, org, Default + Personal).
        mockBuildChatflow.mockResolvedValue({ text: 'ok' })
        await post(crypto.randomUUID(), `Bearer ${alice()}`)

        const user = await ds.getRepository(entities.User).findOneByOrFail({ auth0Id: 'auth0|alice' })
        userId = user.id
        const memberships = await ds.getRepository(entities.WorkspaceUser).find({ where: { userId }, relations: ['workspace'] })
        const personal = memberships.find((m: any) => m.workspace.name === 'Personal Workspace')
        const shared = memberships.find((m: any) => m.workspace.name === 'Default Workspace')
        if (!personal || !shared)
            throw new Error(`expected Personal + Default memberships, got ${memberships.map((m: any) => m.workspace.name)}`)
        // Personal is the active workspace; the chatflow lives in the shared one.
        await ds
            .getRepository(entities.WorkspaceUser)
            .update({ workspaceId: personal.workspaceId, userId }, { lastLogin: new Date(Date.now() + 86400000).toISOString() })
        const chatflow = await ds.getRepository(entities.ChatFlow).save({
            name: 'Chief Sidekick',
            flowData: JSON.stringify({ nodes: [], edges: [] }),
            workspaceId: shared.workspaceId,
            userId
        })
        chatflowId = chatflow.id
    })

    afterAll(async () => {
        await ds?.destroy()
        await new Promise((resolve) => issuerServer?.close(resolve))
    })

    beforeEach(() => {
        seenUser = 'not-called'
        mockBuildChatflow.mockReset().mockImplementation(async (req: any) => {
            seenUser = req.user
            return { text: 'ok' }
        })
    })

    it('valid token identifies the seeded user, once', async () => {
        await post(chatflowId, `Bearer ${alice()}`).then(ok)
        expect(seenUser.id).toBe(userId)
        await post(chatflowId, `Bearer ${alice()}`).then(ok)
        expect(await ds.getRepository(entities.User).countBy({ auth0Id: 'auth0|alice' })).toBe(1)
    })

    it('chatflow in a non-active workspace answers', async () => {
        const res = await post(chatflowId, `Bearer ${alice()}`)
        expect(res.status).toBe(200)
        expect(seenUser.activeWorkspace).toBe('Personal Workspace')
    })

    it('no header stays anonymous', async () => {
        const before = await counts()
        const warn = jest.spyOn(console, 'warn')
        await post(chatflowId).then(ok)
        expect(seenUser).toBeUndefined()
        expect(await counts()).toEqual(before)
        expect(warn.mock.calls.flat().join(' ')).not.toContain('[verifyAAIToken]')
        warn.mockRestore()
    })

    it('expired token stays anonymous', async () => {
        const past = Math.floor(Date.now() / 1000) - 120
        await post(chatflowId, `Bearer ${alice({ iat: past - 600, exp: past })}`).then(ok)
        expect(seenUser).toBeUndefined()
    })

    it('forged token stays anonymous', async () => {
        const forged = sign({ sub: 'auth0|alice', email: 'alice@test.local', org_id: ORG }, otherKeys.privateKey)
        await post(chatflowId, `Bearer ${forged}`).then(ok)
        expect(seenUser).toBeUndefined()
    })

    it('wrong audience stays anonymous', async () => {
        await post(chatflowId, `Bearer ${alice({ aud: 'https://someone.else' })}`).then(ok)
        expect(seenUser).toBeUndefined()
    })

    it('disallowed org stays anonymous', async () => {
        const orgsBefore = await ds.getRepository(entities.Organization).count()
        await post(chatflowId, `Bearer ${sign({ sub: 'auth0|mallory', email: 'm@other.local', org_id: 'org_other' })}`).then(ok)
        expect(seenUser).toBeUndefined()
        expect(await ds.getRepository(entities.Organization).count()).toBe(orgsBefore)
        expect(await ds.getRepository(entities.User).countBy({ auth0Id: 'auth0|mallory' })).toBe(0)
    })

    it('api key is not treated as JWT', async () => {
        const warn = jest.spyOn(console, 'warn')
        await post(chatflowId, `Bearer ${crypto.randomBytes(32).toString('base64url')}`).then(ok)
        expect(seenUser).toBeUndefined()
        expect(warn.mock.calls.flat().join(' ')).not.toContain('[verifyAAIToken]')
        warn.mockRestore()
    })

    it('unknown chatflow: same status with and without token', async () => {
        const id = crypto.randomUUID()
        const anon = await post(id)
        const signedIn = await post(id, `Bearer ${alice()}`)
        expect(anon.status).not.toBe(200)
        expect(signedIn.status).toBe(anon.status)
        expect(mockBuildChatflow).not.toHaveBeenCalled()
    })
})
