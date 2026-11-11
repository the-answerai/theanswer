/**
 * RateLimiterManager default limiter — real express-rate-limit (memory store), real manager.
 * Queue mode is checked only for how the Redis store is built (ioredis, bullmq and rate-limit-redis mocked).
 */
const mockRedisStore = jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    increment: jest.fn().mockResolvedValue({ totalHits: 1, resetTime: undefined }),
    decrement: jest.fn(),
    resetKey: jest.fn()
}))
jest.mock('rate-limit-redis', () => ({ RedisStore: mockRedisStore }))
jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({ call: jest.fn() })))
jest.mock('bullmq', () => ({ QueueEvents: jest.fn(), QueueEventsProducer: jest.fn() }))

import express, { NextFunction, Request, Response } from 'express'
import supertest from 'supertest'
import { RateLimiterManager, rateLimitKey } from '../../../src/utils/rateLimit'

const ENV = { ...process.env }
afterEach(() => {
    process.env = { ...ENV }
})

const asUser = (req: Request, _res: Response, next: NextFunction) => {
    const id = req.header('x-test-user')
    if (id) (req as any).user = { id, email: `${id}@example.com` }
    next()
}

const appFor = (mgr: RateLimiterManager, withDefault = true) => {
    const app = express()
    const limiter = withDefault ? mgr.getRateLimiter({ withDefault: true }) : mgr.getRateLimiter()
    app.post(['/p', '/p/:id'], asUser, limiter, (_req, res) => res.json({ ok: true }))
    return app
}

const statuses = async (app: express.Express, path: string, n: number, user?: string) => {
    const out: number[] = []
    for (let i = 0; i < n; i++) {
        const r = supertest(app).post(path)
        if (user) r.set('x-test-user', user)
        out.push((await r).status)
    }
    return out
}

describe('RateLimiterManager default limiter', () => {
    it('no DEFAULT_RATE_LIMIT_MAX → unlimited chatflow stays unlimited', async () => {
        delete process.env.DEFAULT_RATE_LIMIT_MAX
        expect(await statuses(appFor(new RateLimiterManager()), '/p/a', 5)).toEqual([200, 200, 200, 200, 200])
    })

    it.each(['0', '-1', '1.5', 'abc'])('DEFAULT_RATE_LIMIT_MAX=%s is ignored → unlimited', async (value) => {
        process.env.DEFAULT_RATE_LIMIT_MAX = value
        expect(await statuses(appFor(new RateLimiterManager()), '/p/a', 3)).toEqual([200, 200, 200])
    })

    it('DEFAULT_RATE_LIMIT_MAX=2 → 3rd call to an unlimited chatflow is 429 with the default message', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        const app = appFor(new RateLimiterManager())
        expect(await statuses(app, '/p/a', 2)).toEqual([200, 200])
        const third = await supertest(app).post('/p/a')
        expect(third.status).toBe(429)
        expect(third.text).toBe('Too many requests, please try again later.')
    })

    it('default counts per chatflow', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        const app = appFor(new RateLimiterManager())
        expect(await statuses(app, '/p/a', 2)).toEqual([200, 200])
        expect(await statuses(app, '/p/b', 1)).toEqual([200])
    })

    it('two users on one IP get separate default buckets', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        const app = appFor(new RateLimiterManager())
        expect(await statuses(app, '/p/a', 3, 'u1')).toEqual([200, 200, 429])
        expect(await statuses(app, '/p/a', 1, 'u2')).toEqual([200])
    })

    it('anonymous callers on one IP share one default bucket per chatflow', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        expect(await statuses(appFor(new RateLimiterManager()), '/p/a', 3)).toEqual([200, 200, 429])
    })

    it('configured chatflow limit wins over the default', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        const mgr = new RateLimiterManager()
        await mgr.addRateLimiter('a', 60, 4, 'configured')
        expect(await statuses(appFor(mgr), '/p/a', 5)).toEqual([200, 200, 200, 200, 429])
    })

    it('configured chatflow limit still keys by IP', async () => {
        const mgr = new RateLimiterManager()
        await mgr.addRateLimiter('a', 60, 2, 'configured')
        const app = appFor(mgr)
        expect(await statuses(app, '/p/a', 2, 'u1')).toEqual([200, 200])
        expect(await statuses(app, '/p/a', 1, 'u2')).toEqual([429])
    })

    it('getRateLimiter() without withDefault ignores the default', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        expect(await statuses(appFor(new RateLimiterManager(), false), '/p/a', 4)).toEqual([200, 200, 200, 200])
    })

    it('no id → keyed under empty chatflow id, no throw', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        expect(await statuses(appFor(new RateLimiterManager()), '/p', 3)).toEqual([200, 200, 429])
    })

    it('DEFAULT_RATE_LIMIT_WINDOW_SECONDS sets the window', async () => {
        process.env.DEFAULT_RATE_LIMIT_MAX = '1'
        process.env.DEFAULT_RATE_LIMIT_WINDOW_SECONDS = '120'
        const res = await supertest(appFor(new RateLimiterManager())).post('/p/a')
        expect(res.status).toBe(200)
        expect(Number(res.headers['ratelimit-reset'])).toBeGreaterThan(60)
    })

    it('queue mode → default limiter built with RedisStore prefix rl:default:', () => {
        process.env.MODE = 'queue'
        process.env.REDIS_URL = 'redis://127.0.0.1:1'
        process.env.DEFAULT_RATE_LIMIT_MAX = '2'
        mockRedisStore.mockClear()
        new RateLimiterManager()
        expect(mockRedisStore).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'rl:default:' }))
    })
})

describe('rateLimitKey', () => {
    it('uses chatflow id and user id when the caller is identified', () => {
        expect(rateLimitKey({ params: { id: 'cf' }, ip: '1.1.1.1', user: { id: 'u1' } } as any)).toBe('cf:user:u1')
    })

    it('falls back to chatflow id and IP', () => {
        expect(rateLimitKey({ params: { id: 'cf' }, ip: '1.1.1.1' } as any)).toBe('cf:ip:1.1.1.1')
    })

    it('rateLimitKey never contains email', () => {
        const key = rateLimitKey({ params: { id: 'cf' }, ip: '1.1.1.1', user: { id: 'u1', email: 'a@b.c' } } as any)
        expect(key).not.toContain('a@b.c')
    })
})
