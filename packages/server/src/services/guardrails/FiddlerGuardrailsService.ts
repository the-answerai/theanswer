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
import {
    GuardrailsConfig,
    SafetyAPIResponse,
    SafetyEvaluationResult,
    SafetyViolation,
    SafetyDimension,
    PIIAPIResponse,
    PIIDetectionResult,
    PIIDetection,
    PIIType,
    InputValidationResult
} from '../../types/guardrails'

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
     * Returns violations for dimensions exceeding threshold
     */
    public async evaluateSafety(text: string): Promise<SafetyEvaluationResult> {
        if (!this.config.safety.enabled) {
            return { violations: [], isUnsafe: false }
        }

        try {
            const apiResponse = await this.executeWithCircuitBreaker(
                async () => {
                    const response = await this.post<SafetyAPIResponse>('/v3/guardrails/ftl-safety', {
                        data: { input: text }
                    })
                    return response
                },
                (): SafetyAPIResponse => {
                    // Return empty scores for all dimensions
                    return {
                        fdl_harmful: 0,
                        fdl_violent: 0,
                        fdl_unethical: 0,
                        fdl_illegal: 0,
                        fdl_sexual: 0,
                        fdl_racist: 0,
                        fdl_jailbreaking: 0,
                        fdl_harassing: 0,
                        fdl_hateful: 0,
                        fdl_sexist: 0,
                        fdl_roleplaying: 0
                    }
                }
            )

            // Parse API response and evaluate per-dimension thresholds
            const violations: SafetyViolation[] = []
            const dimensions = Object.keys(apiResponse) as SafetyDimension[]

            for (const dimension of dimensions) {
                const score = apiResponse[dimension]

                // Get threshold: per-dimension override or global threshold
                const threshold = this.config.safety.dimensionThresholds?.[dimension] ?? this.config.safety.threshold

                if (score > threshold) {
                    // Get action: per-dimension override or global action
                    const action = this.config.safety.dimensionActions?.[dimension] ?? this.config.safety.action

                    violations.push({
                        dimension,
                        score,
                        threshold,
                        action
                    })
                }
            }

            return {
                violations,
                isUnsafe: violations.length > 0
            }
        } catch (error) {
            // Fail-open: return no violations on error
            return { violations: [], isUnsafe: false }
        }
    }

    /**
     * Detect PII (15+ types) with per-type filtering and redaction
     * Returns filtered detections and optionally redacted text
     */
    public async detectPII(text: string): Promise<PIIDetectionResult> {
        if (!this.config.pii.enabled) {
            return { detections: [], hasPII: false }
        }

        try {
            const apiResponse = await this.executeWithCircuitBreaker(
                async () => {
                    const response = await this.post<PIIAPIResponse>('/v3/guardrails/sensitive-information', {
                        data: { input: text }
                    })
                    return response
                },
                (): PIIAPIResponse => {
                    return { fdl_sensitive_information_scores: [] }
                }
            )

            // Filter detections by per-type confidence thresholds and enabled types
            const rawDetections = apiResponse.fdl_sensitive_information_scores || []
            const filteredDetections: PIIDetection[] = []

            for (const entity of rawDetections) {
                const entityLabel = entity.label as PIIType

                // Check if type is enabled (if enabledTypes is specified)
                if (this.config.pii.enabledTypes && !this.config.pii.enabledTypes.includes(entityLabel)) {
                    continue
                }

                // Get confidence threshold: per-type override or global threshold
                const threshold = this.config.pii.typeConfidenceThresholds?.[entityLabel] ?? this.config.pii.confidenceThreshold

                // Filter by confidence
                if (entity.score >= threshold) {
                    // Get action: per-type override or global action
                    const action = this.config.pii.typeActions?.[entityLabel] ?? this.config.pii.action

                    filteredDetections.push({
                        label: entityLabel,
                        score: entity.score,
                        start: entity.start,
                        end: entity.end,
                        text: entity.text,
                        action
                    })
                }
            }

            // Generate redacted text if any redact actions
            let redactedText: string | undefined
            const hasRedactActions = filteredDetections.some((d) => d.action === 'redact' || d.action === 'replace')

            if (hasRedactActions) {
                redactedText = this.redactPII(
                    text,
                    filteredDetections.filter((d) => d.action === 'redact' || d.action === 'replace')
                )
            }

            return {
                detections: filteredDetections,
                hasPII: filteredDetections.length > 0,
                redactedText
            }
        } catch (error) {
            // Fail-open: return no detections on error
            return { detections: [], hasPII: false }
        }
    }

    /**
     * Redact PII entities from text
     * Sorts entities in reverse order to preserve character positions
     */
    private redactPII(text: string, entities: PIIDetection[]): string {
        // Sort by start position in reverse order (end → start)
        const sorted = [...entities].sort((a, b) => b.start - a.start)

        let redacted = text
        for (const entity of sorted) {
            // Replace text[start:end] with [LABEL]
            redacted = redacted.slice(0, entity.start) + `[${entity.label}]` + redacted.slice(entity.end)
        }

        return redacted
    }

    /**
     * Validate input text (safety + PII checks in parallel)
     * Returns combined validation result with blocking/redaction logic
     */
    public async validateInput(text: string): Promise<InputValidationResult> {
        try {
            // Run safety and PII checks in parallel for best performance
            const [safetyResult, piiResult] = await Promise.all([this.evaluateSafety(text), this.detectPII(text)])

            // Determine if input should be blocked
            const shouldBlock =
                safetyResult.violations.some((v) => v.action === 'block') || piiResult.detections.some((d) => d.action === 'block')

            // Determine if input should be redacted
            const shouldRedact = piiResult.redactedText !== undefined

            // Build result
            const result: InputValidationResult = {
                blocked: shouldBlock,
                redacted: shouldRedact,
                redactedText: piiResult.redactedText,
                violations: {
                    safety: safetyResult.violations.length > 0 ? safetyResult.violations : undefined,
                    pii: piiResult.detections.length > 0 ? piiResult.detections : undefined
                }
            }

            // Add block message if blocked (combine both safety and PII)
            if (shouldBlock) {
                const safetyBlocks = safetyResult.violations.filter((v) => v.action === 'block')
                const piiBlocks = piiResult.detections.filter((d) => d.action === 'block')

                const messages: string[] = []
                if (safetyBlocks.length > 0) {
                    messages.push(`Safety: ${safetyBlocks.map((v) => v.dimension).join(', ')}`)
                }
                if (piiBlocks.length > 0) {
                    messages.push(`PII: ${piiBlocks.map((d) => d.label).join(', ')}`)
                }

                result.message = `Content blocked - ${messages.join('; ')}`
            }

            return result
        } catch (error) {
            // Fail-open: on error, allow the input to pass through
            return {
                blocked: false,
                redacted: false,
                violations: {}
            }
        }
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
