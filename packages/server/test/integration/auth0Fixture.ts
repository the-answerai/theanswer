/**
 * Shared setup for local integration tests: a local Auth0-like issuer (RS256 + JWKS) and a Postgres
 * DataSource migrated with the app's own migrations. Call setupAuth0AndDb before importing anything
 * that reads AUTH0_* at module load (jwtCheck).
 */
import crypto from 'node:crypto'
import http from 'node:http'
import { AddressInfo } from 'node:net'
import { DataSource } from 'typeorm'

export const AUDIENCE = 'https://api.test.local'
export const ORG = 'org_ias'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

export const setupAuth0AndDb = async (pgUrl: string) => {
    const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    const otherKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    let issuer = ''
    const jwk = { ...keys.publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' }
    const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.url === '/.well-known/openid-configuration') return res.end(JSON.stringify({ issuer, jwks_uri: `${issuer}jwks` }))
        if (req.url === '/jwks') return res.end(JSON.stringify({ keys: [jwk] }))
        res.statusCode = 404
        res.end('{}')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`

    const sign = (claims: Record<string, any>, key = keys.privateKey) => {
        const now = Math.floor(Date.now() / 1000)
        const head = b64({ alg: 'RS256', typ: 'JWT', kid: 'k1' })
        const body = b64({ iss: issuer, aud: AUDIENCE, iat: now, exp: now + 600, ...claims })
        const sig = crypto.sign('sha256', Buffer.from(`${head}.${body}`), key).toString('base64url')
        return `${head}.${body}.${sig}`
    }

    const url = new URL(pgUrl)
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

    const dsModule = await import('../../src/DataSource')
    await dsModule.init()
    const ds: DataSource = dsModule.getDataSource()
    await ds.initialize()
    await ds.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await ds.runMigrations({ transaction: 'each' })

    const close = async () => {
        await ds.destroy()
        await new Promise((resolve) => server.close(resolve))
    }
    return { ds, sign, otherKey: otherKeys.privateKey, close }
}
