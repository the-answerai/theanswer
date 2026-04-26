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
        const message: string = axiosLike.response?.data?.error?.message || axiosLike.message || 'Fiddler upstream error'
        if (axiosLike.code === 'ECONNABORTED' || axiosLike.code === 'ETIMEDOUT') {
            return new FiddlerTimeoutError(message)
        }
        if (axiosLike.code === 'ECONNREFUSED' || axiosLike.code === 'ENOTFOUND' || axiosLike.code === 'EAI_AGAIN') {
            return new FiddlerNetworkError(message)
        }
        if (status === 401 || status === 403) {
            return new FiddlerAuthError(message, status)
        }
        if (status !== undefined) {
            return new FiddlerUpstreamError(message, status)
        }
        return new FiddlerNetworkError(message)
    }

    const msg = err instanceof Error ? err.message : String(err)
    return new FiddlerError('unexpected', msg)
}
