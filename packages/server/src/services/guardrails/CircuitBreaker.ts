/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by:
 * 1. Tracking consecutive failures
 * 2. Opening circuit after threshold (fail-fast)
 * 3. Attempting recovery after timeout
 * 4. Closing circuit after successful requests
 */

export enum CircuitState {
    CLOSED = 'CLOSED', // Normal operation
    OPEN = 'OPEN', // Failing fast (not making calls)
    HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
    failureThreshold: number // Consecutive failures before opening
    successThreshold: number // Successes needed to close from half-open
    resetTimeout: number // ms to wait before attempting half-open
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED
    private failureCount: number = 0
    private successCount: number = 0
    private nextAttempt: number = Date.now()
    private config: CircuitBreakerConfig

    constructor(config: CircuitBreakerConfig) {
        this.config = config
    }

    /**
     * Check if circuit allows request
     */
    public canExecute(): boolean {
        if (this.state === CircuitState.CLOSED) {
            return true
        }

        if (this.state === CircuitState.OPEN) {
            // Check if timeout has elapsed
            if (Date.now() >= this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN
                this.successCount = 0
                return true
            }
            return false
        }

        // HALF_OPEN: Allow limited requests
        return true
    }

    /**
     * Record successful execution
     */
    public recordSuccess(): void {
        this.failureCount = 0

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++
            if (this.successCount >= this.config.successThreshold) {
                this.close()
            }
        }
    }

    /**
     * Record failed execution
     */
    public recordFailure(): void {
        this.failureCount++
        this.successCount = 0

        if (this.failureCount >= this.config.failureThreshold) {
            this.open()
        }
    }

    /**
     * Open circuit (start failing fast)
     */
    private open(): void {
        this.state = CircuitState.OPEN
        this.nextAttempt = Date.now() + this.config.resetTimeout
    }

    /**
     * Close circuit (resume normal operation)
     */
    private close(): void {
        this.state = CircuitState.CLOSED
        this.failureCount = 0
        this.successCount = 0
    }

    /**
     * Get current circuit state
     */
    public getState(): CircuitState {
        return this.state
    }

    /**
     * Get circuit statistics
     */
    public getStats() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            nextAttempt: this.nextAttempt
        }
    }

    /**
     * Manually reset circuit (for testing or emergency)
     */
    public reset(): void {
        this.state = CircuitState.CLOSED
        this.failureCount = 0
        this.successCount = 0
        this.nextAttempt = Date.now()
    }
}
