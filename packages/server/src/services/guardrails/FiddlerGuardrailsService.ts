/**
 * Fiddler Guardrails Service
 *
 * Handles all communication with Fiddler AI Guardrails API
 * Features:
 * - Circuit breaker for reliability
 * - Connection pooling for performance
 * - Redis caching (optional)
 * - Fail-open by default
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { CircuitBreaker } from './CircuitBreaker'
import { GuardrailsConfig } from '../../types/guardrails'

export interface FiddlerCredentials {
    apiKey: string
    apiUrl: string
}

export class FiddlerGuardrailsService {
    private client: AxiosInstance
    private circuitBreaker: CircuitBreaker
    private config: GuardrailsConfig

    constructor(credentials: FiddlerCredentials, config: GuardrailsConfig) {
        this.config = config

        // Initialize HTTP client with connection pooling
        this.client = axios.create({
            baseURL: credentials.apiUrl,
            timeout: 10000, // 10 second timeout
            headers: {
                Authorization: `Bearer ${credentials.apiKey}`,
                'Content-Type': 'application/json'
            },
            // Connection pooling configuration
            maxRedirects: 5,
            maxContentLength: 10 * 1024 * 1024, // 10MB
            httpAgent: new (require('http').Agent)({
                keepAlive: true,
                maxSockets: 50
            }),
            httpsAgent: new (require('https').Agent)({
                keepAlive: true,
                maxSockets: 50
            })
        })

        // Initialize circuit breaker
        const circuitConfig = config.circuitBreaker || {
            failureThreshold: 5,
            resetTimeout: 30000,
            successThreshold: 3
        }
        this.circuitBreaker = new CircuitBreaker(circuitConfig)
    }

    /**
     * Execute request with circuit breaker protection
     */
    private async executeWithCircuitBreaker<T>(operation: () => Promise<T>, fallback?: () => T): Promise<T> {
        // Check if circuit allows execution
        if (!this.circuitBreaker.canExecute()) {
            if (fallback) {
                return fallback()
            }
            throw new InternalFlowiseError(
                StatusCodes.SERVICE_UNAVAILABLE,
                'Error: FiddlerGuardrailsService - Circuit breaker is open (service unavailable)'
            )
        }

        try {
            const result = await operation()
            this.circuitBreaker.recordSuccess()
            return result
        } catch (error) {
            this.circuitBreaker.recordFailure()

            // If we have a fallback, use it instead of throwing
            if (fallback) {
                return fallback()
            }

            throw error
        }
    }

    /**
     * Make POST request to Fiddler API
     */
    private async post<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await this.client.post<T>(endpoint, data)
            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError
                throw new InternalFlowiseError(
                    axiosError.response?.status || StatusCodes.INTERNAL_SERVER_ERROR,
                    `Error: FiddlerGuardrailsService.post - ${getErrorMessage(error)}`
                )
            }
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Error: FiddlerGuardrailsService.post - ${getErrorMessage(error)}`
            )
        }
    }

    /**
     * Evaluate safety (11 dimensions)
     * To be implemented in Phase 2
     */
    public async evaluateSafety(text: string): Promise<any> {
        if (!this.config.safety.enabled) {
            return { violations: [] }
        }

        return this.executeWithCircuitBreaker(
            async () => {
                return await this.post('/v3/guardrails/ftl-safety', {
                    prompt: text
                })
            },
            () => ({ violations: [] }) // Fail-open: return no violations
        )
    }

    /**
     * Detect PII (15+ types)
     * To be implemented in Phase 2
     */
    public async detectPII(text: string): Promise<any> {
        if (!this.config.pii.enabled) {
            return { detections: [] }
        }

        return this.executeWithCircuitBreaker(
            async () => {
                return await this.post('/v3/guardrails/sensitive-information', {
                    text
                })
            },
            () => ({ detections: [] }) // Fail-open: return no detections
        )
    }

    /**
     * Evaluate faithfulness (RAG hallucination detection)
     * To be implemented in Phase 5
     */
    public async evaluateFaithfulness(text: string, context: string): Promise<any> {
        if (!this.config.faithfulness.enabled) {
            return { score: 1.0 }
        }

        return this.executeWithCircuitBreaker(
            async () => {
                return await this.post('/v3/guardrails/ftl-response-faithfulness', {
                    response: text,
                    context
                })
            },
            () => ({ score: 1.0 }) // Fail-open: assume faithful
        )
    }

    /**
     * Get circuit breaker status
     */
    public getCircuitStatus() {
        return this.circuitBreaker.getStats()
    }

    /**
     * Reset circuit breaker (for testing or emergency)
     */
    public resetCircuit(): void {
        this.circuitBreaker.reset()
    }

    /**
     * Health check
     */
    public async healthCheck(): Promise<boolean> {
        try {
            // Simple test call to verify API connectivity
            await this.post('/v3/guardrails/ftl-safety', {
                prompt: 'test'
            })
            return true
        } catch (error) {
            return false
        }
    }
}
