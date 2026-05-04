/**
 * Typed errors for Fiddler guardrail evaluation failures.
 *
 * These exist so the runtime can distinguish "guardrail said content is unsafe"
 * (a real block) from "guardrail could not be evaluated" (a degraded state whose
 * handling depends on failureMode). Previously the service swallowed every
 * failure and returned fake-safe results, which is how enforcement silently
 * degraded in production when a key rotated or the upstream returned 401.
 */

import { GuardrailHealthReason } from '../../types/guardrails'

export class FiddlerError extends Error {
    public readonly reason: GuardrailHealthReason
    public readonly httpStatus?: number

    constructor(reason: GuardrailHealthReason, message: string, httpStatus?: number) {
        super(message)
        this.name = 'FiddlerError'
        this.reason = reason
        this.httpStatus = httpStatus
    }
}

export class FiddlerAuthError extends FiddlerError {
    constructor(message: string = 'Fiddler rejected the API key (401)', httpStatus: number = 401) {
        super('auth_error', message, httpStatus)
        this.name = 'FiddlerAuthError'
    }
}

export class FiddlerUpstreamError extends FiddlerError {
    constructor(message: string, httpStatus?: number) {
        super('api_error', message, httpStatus)
        this.name = 'FiddlerUpstreamError'
    }
}

/**
 * Thrown when Fiddler responds with HTTP 404 + a body indicating that the
 * requested guardrail endpoint is not included in the caller's plan tier
 * (e.g. PII detection on the freemium API). This is a stable capability
 * gap — the API responded normally, it just told us we don't have access.
 *
 * Treated as `ok=true, degraded=false` upstream (per-message) so end users
 * are not spammed with a banner on every chat for a config-level constraint.
 * The admin UI surfaces this once via the selftest capability matrix.
 */
export class FiddlerUnsupportedError extends FiddlerError {
    public readonly endpoint: string

    constructor(message: string, endpoint: string, httpStatus: number = 404) {
        super('unsupported', message, httpStatus)
        this.name = 'FiddlerUnsupportedError'
        this.endpoint = endpoint
    }
}

export class FiddlerTimeoutError extends FiddlerError {
    constructor(message: string = 'Fiddler request timed out') {
        super('timeout', message)
        this.name = 'FiddlerTimeoutError'
    }
}

export class FiddlerNetworkError extends FiddlerError {
    constructor(message: string) {
        super('network_error', message)
        this.name = 'FiddlerNetworkError'
    }
}

export class FiddlerCircuitOpenError extends FiddlerError {
    constructor(message: string = 'Fiddler circuit breaker is open') {
        super('circuit_open', message)
        this.name = 'FiddlerCircuitOpenError'
    }
}

/**
 * Classify an arbitrary thrown value into a FiddlerError. Idempotent: if the
 * input is already a FiddlerError it is returned as-is.
 */
export const toFiddlerError = (err: unknown): FiddlerError => {
    if (err instanceof FiddlerError) return err

    // axios errors
    const axiosLike = err as any
    if (axiosLike?.isAxiosError) {
        const status: number | undefined = axiosLike.response?.status
        const body = axiosLike.response?.data
        const message: string = body?.error?.message || axiosLike.message || 'Fiddler upstream error'
        const errorReason: string | undefined = body?.error?.errors?.[0]?.reason
        const requestPath: string = axiosLike.config?.url || ''

        if (axiosLike.code === 'ECONNABORTED' || axiosLike.code === 'ETIMEDOUT') {
            return new FiddlerTimeoutError(message)
        }
        if (axiosLike.code === 'ECONNREFUSED' || axiosLike.code === 'ENOTFOUND' || axiosLike.code === 'EAI_AGAIN') {
            return new FiddlerNetworkError(message)
        }
        if (status === 401 || status === 403) {
            return new FiddlerAuthError(message, status)
        }
        // Plan-tier capability gap: Fiddler returns 404 with a "not supported"
        // body for endpoints the caller's plan doesn't include (e.g. freemium
        // PII detection). Distinguish from generic 4xx so we can short-circuit
        // future calls and avoid spamming users with degraded banners.
        if (status === 404 && (errorReason === 'NotFound' || /not supported/i.test(message))) {
            return new FiddlerUnsupportedError(message, requestPath, status)
        }
        if (status !== undefined) {
            return new FiddlerUpstreamError(message, status)
        }
        return new FiddlerNetworkError(message)
    }

    const msg = err instanceof Error ? err.message : String(err)
    return new FiddlerError('unexpected', msg)
}
