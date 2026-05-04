/**
 * FiddlerGuardrailsService — plan-tier capability handling.
 *
 * These tests pin the behavior we ship for the freemium-PII bug:
 *   1. A Fiddler 404 with "not supported" body maps to FiddlerUnsupportedError.
 *   2. Unsupported endpoints are cached per (apiKey, endpoint) and short-circuit
 *      future calls without hitting the network or tripping the circuit breaker.
 *   3. Unsupported is reflected as ok=true, degraded=false (no per-message
 *      banner) and the merged stage status stays clean.
 *   4. Faithfulness uses the wire shape Fiddler actually accepts:
 *      `{ data: { prompt, response, context } }` (NOT { input, output }).
 */

const mockPost = jest.fn()

jest.mock('axios', () => ({
    create: jest.fn(() => ({
        post: mockPost
    })),
    default: {
        create: jest.fn(() => ({ post: mockPost }))
    }
}))

// Stub the express-app accessor and the config loader. FiddlerGuardrailsService
// imports both at module-load time; without these stubs, requiring the service
// boots the entire express app (including Auth0 jwt verifier setup) and fails.
jest.mock('../../../src/utils/getRunningExpressApp', () => ({
    getRunningExpressApp: () => ({ AppDataSource: { getRepository: () => ({}) } })
}))

jest.mock('../../../src/services/guardrails/config', () => ({
    getGuardrailsConfig: jest.fn()
}))

// Avoid pulling flowise-components (and transitively langfuse, which uses
// dynamic ESM imports that don't work under ts-jest) just to get
// decryptCredentialData. We don't exercise it here.
jest.mock('../../../src/utils', () => ({
    decryptCredentialData: jest.fn().mockResolvedValue({ fiddlerApiKey: 'stub', fiddlerApiUrl: 'stub' })
}))

jest.mock('../../../src/database/entities/Credential', () => ({
    Credential: class {},
    CredentialVisibility: { ORGANIZATION: 'Organization', PLATFORM: 'Platform' }
}))

// Suppress logger output during tests; we don't assert on log lines.
jest.mock('../../../src/utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        log: jest.fn()
    }
}))

import { FiddlerGuardrailsService } from '../../../src/services/guardrails/FiddlerGuardrailsService'
import { FiddlerUnsupportedError, FiddlerError } from '../../../src/services/guardrails/errors'
import type { GuardrailsConfig } from '../../../src/types/guardrails'

const baseConfig: GuardrailsConfig = {
    enabled: true,
    failureMode: 'open',
    safety: { enabled: true, threshold: 0.1, action: 'block' },
    pii: { enabled: true, confidenceThreshold: 0.8, action: 'redact' },
    faithfulness: { enabled: true, threshold: 0.005, action: 'warn' },
    circuitBreaker: { failureThreshold: 5, resetTimeout: 30_000, successThreshold: 3 }
}

const buildService = (apiKey = 'test-key') =>
    new FiddlerGuardrailsService({ apiKey, apiUrl: 'https://guardrails.cloud.fiddler.ai' }, baseConfig)

const freemium404 = (endpoint: string) => {
    const error: any = new Error(`Guardrail '${endpoint}' is not supported by the freemium guardrails API.`)
    error.isAxiosError = true
    error.config = { url: endpoint }
    error.response = {
        status: 404,
        data: {
            error: {
                code: 404,
                message: `Guardrail '${endpoint}' is not supported by the freemium guardrails API.`,
                errors: [{ reason: 'NotFound', message: 'Not supported', help: '' }]
            }
        }
    }
    return error
}

describe('FiddlerGuardrailsService — unsupported plan-tier handling', () => {
    beforeEach(() => {
        mockPost.mockReset()
        FiddlerGuardrailsService.__resetUnsupportedCacheForTests()
    })

    it('classifies a "not supported by freemium" 404 as unsupported (ok=true, degraded=false)', async () => {
        mockPost.mockRejectedValueOnce(freemium404('/v3/guardrails/sensitive-information'))

        const svc = buildService()
        const { status } = await svc.detectPII('hello world')

        expect(status.reason).toBe('unsupported')
        expect(status.degraded).toBe(false)
        expect(status.ok).toBe(true)
        expect(status.httpStatus).toBe(404)
    })

    it('caches unsupported endpoint per (apiKey, endpoint) and short-circuits on subsequent calls', async () => {
        mockPost.mockRejectedValueOnce(freemium404('/v3/guardrails/sensitive-information'))

        const svc = buildService('cache-key')

        const first = await svc.detectPII('hi')
        const second = await svc.detectPII('hi again')
        const third = await svc.detectPII('and again')

        // First call hit the network, the next two short-circuited via cache.
        expect(mockPost).toHaveBeenCalledTimes(1)

        // All three return the same unsupported status shape.
        for (const r of [first.status, second.status, third.status]) {
            expect(r.reason).toBe('unsupported')
            expect(r.degraded).toBe(false)
        }

        expect(svc.isEndpointUnsupported('/v3/guardrails/sensitive-information')).toBe(true)
    })

    it('separates the unsupported cache by API key (different orgs / plan tiers)', async () => {
        // Org A: PII unsupported.
        mockPost.mockRejectedValueOnce(freemium404('/v3/guardrails/sensitive-information'))
        const orgA = buildService('org-a-key')
        await orgA.detectPII('hello')
        expect(orgA.isEndpointUnsupported('/v3/guardrails/sensitive-information')).toBe(true)

        // Org B: same endpoint, different key, must not inherit Org A's cache miss.
        const orgB = buildService('org-b-key')
        expect(orgB.isEndpointUnsupported('/v3/guardrails/sensitive-information')).toBe(false)
    })

    it('does NOT trip the circuit breaker when an endpoint is plan-unsupported', async () => {
        // Even if the cache did not short-circuit, repeated unsupported responses
        // are treated as breaker SUCCESS — the API answered, the caller's plan
        // just doesn't include the endpoint. Penalizing the breaker on these
        // would trip it and break sibling endpoints (e.g. safety) on the same
        // Fiddler account.
        for (let i = 0; i < 7; i++) {
            mockPost.mockRejectedValueOnce(freemium404('/v3/guardrails/sensitive-information'))
        }

        const svc = buildService('breaker-key')
        await svc.detectPII('a')
        await svc.detectPII('b')
        await svc.detectPII('c')

        expect(svc.getCircuitStatus().state).toBe('CLOSED')
    })

    it('uses the correct faithfulness payload shape: { data: { prompt, response, context } }', async () => {
        mockPost.mockResolvedValueOnce({ data: { fdl_faithful_score: 0.985 } })

        const svc = buildService('faith-key')
        await svc.evaluateFaithfulness('Paris is the capital.', 'The capital of France is Paris.', 'What is the capital of France?')

        expect(mockPost).toHaveBeenCalledTimes(1)
        const [endpoint, body] = mockPost.mock.calls[0]
        expect(endpoint).toBe('/v3/guardrails/ftl-response-faithfulness')
        expect(body).toEqual({
            data: {
                prompt: 'What is the capital of France?',
                response: 'Paris is the capital.',
                context: 'The capital of France is Paris.'
            }
        })
    })

    it('skips faithfulness without a prompt (Fiddler requires all three fields)', async () => {
        // Stub safety + pii so validateOutput's parallel calls resolve cleanly.
        mockPost.mockResolvedValueOnce({ data: { fdl_harmful: 0.01 } }) // safety
        mockPost.mockResolvedValueOnce({ data: { fdl_sensitive_information_scores: [] } }) // pii

        const svc = buildService('skip-key')
        const result = await svc.validateOutput(
            'Some response',
            'Some context',
            undefined as unknown as string // simulate caller that did not plumb prompt
        )

        // Only safety + pii hit the network; faithfulness was skipped because
        // Fiddler's faithfulness endpoint requires all three of {prompt, response, context}.
        expect(mockPost).toHaveBeenCalledTimes(2)
        expect(result.violations.faithfulness).toBeUndefined()
        expect(result.status.degraded).toBe(false)
    })

    it('exports FiddlerUnsupportedError as a FiddlerError subclass', () => {
        const err = new FiddlerUnsupportedError('nope', '/v3/guardrails/sensitive-information')
        expect(err).toBeInstanceOf(FiddlerError)
        expect(err.reason).toBe('unsupported')
        expect(err.endpoint).toBe('/v3/guardrails/sensitive-information')
    })
})

describe('FiddlerGuardrailsService — capabilityMatrix', () => {
    beforeEach(() => {
        mockPost.mockReset()
        FiddlerGuardrailsService.__resetUnsupportedCacheForTests()
    })

    it('reports per-endpoint plan capability (ok / unsupported / degraded)', async () => {
        // safety: 200, pii: 404 unsupported, faithfulness: 200
        mockPost.mockResolvedValueOnce({ data: { fdl_harmful: 0.01 } })
        mockPost.mockRejectedValueOnce(freemium404('/v3/guardrails/sensitive-information'))
        mockPost.mockResolvedValueOnce({ data: { fdl_faithful_score: 0.9 } })

        const svc = buildService('cap-key')
        const matrix = await svc.capabilityMatrix()

        expect(matrix.safety.reason).toBe('ok')
        expect(matrix.pii.reason).toBe('unsupported')
        expect(matrix.faithfulness.reason).toBe('ok')
    })
})
