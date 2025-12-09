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
import { getGuardrailsConfig } from './config'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Credential } from '../../database/entities/Credential'
import { decryptCredentialData } from '../../utils'
import { IUser } from '../../Interface'
import {
    GuardrailsConfig,
    GuardrailAction,
    SafetyAPIResponse,
    SafetyEvaluationResult,
    SafetyViolation,
    SafetyDimension,
    PIIAPIResponse,
    PIIDetectionResult,
    PIIDetection,
    PIIType,
    InputValidationResult,
    OutputValidationResult
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
            timeout: 30_000, // 10 second timeout
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
     * Factory method to create FiddlerGuardrailsService from chatflow context
     * Handles config loading, credential resolution, and service initialization
     *
     * @param chatflowId - Chatflow ID for config hierarchy
     * @param user - User context for organization scoping
     * @returns Initialized service or null if disabled/no credentials
     *
     * @example
     * const service = await FiddlerGuardrailsService.createFromContext(chatflowId, user)
     * if (service) {
     *   const result = await service.validateInput(text)
     * }
     */
    public static async createFromContext(chatflowId: string, user: IUser): Promise<FiddlerGuardrailsService | null> {
        try {
            // 1. Load configuration (env → org → chatflow)
            const config = await getGuardrailsConfig(chatflowId, user)

            // 2. Check if guardrails are enabled
            if (!config.enabled) {
                return null
            }

            // 3. Load credentials with fallback chain
            const credentials = await this.loadCredentials(user.organizationId, config)
            if (!credentials) {
                console.warn(`Guardrails enabled but no credentials found for organization ${user.organizationId}`)
                return null
            }

            // 4. Initialize and return service
            return new FiddlerGuardrailsService(credentials, config)
        } catch (error) {
            // Fail-open: log error but don't throw
            console.error('Error initializing Fiddler Guardrails service (fail-open):', error)
            return null
        }
    }

    /**
     * Load Fiddler credentials with multi-tier fallback
     * Priority: Config credentialId → Org credential by name → Environment variables
     *
     * @param organizationId - Organization ID for scoping
     * @param config - Guardrails configuration
     * @returns Credentials or null if not found
     */
    private static async loadCredentials(organizationId: string, config: GuardrailsConfig): Promise<FiddlerCredentials | null> {
        try {
            const appServer = getRunningExpressApp()
            const credentialRepository = appServer.AppDataSource.getRepository(Credential)

            // Priority 1: Use credentialId from config (chatflow/org override)
            if (config.credentialId) {
                const credential = await credentialRepository.findOne({
                    where: {
                        id: config.credentialId,
                        organizationId
                    }
                })

                if (credential) {
                    const credentialData = await decryptCredentialData(credential.encryptedData)
                    return {
                        apiKey: credentialData.fiddlerApiKey,
                        apiUrl: credentialData.fiddlerApiUrl
                    }
                }
            }

            // Priority 2: Find org's Fiddler credential by name
            const credentials = await credentialRepository.find({
                where: {
                    credentialName: 'fiddlerApi',
                    organizationId
                }
            })

            if (credentials && credentials.length > 0) {
                const credentialData = await decryptCredentialData(credentials[0].encryptedData)
                return {
                    apiKey: credentialData.fiddlerApiKey,
                    apiUrl: credentialData.fiddlerApiUrl
                }
            }

            // Priority 3: Fallback to environment variables
            const envApiKey = process.env.FIDDLER_API_KEY
            const envApiUrl = process.env.FIDDLER_API_URL

            if (envApiKey && envApiUrl) {
                console.log(`Using Fiddler credentials from environment variables for organization ${organizationId}`)
                return {
                    apiKey: envApiKey,
                    apiUrl: envApiUrl
                }
            }

            // No credentials found
            return null
        } catch (error) {
            console.error('Error loading Fiddler credentials:', error)
            return null
        }
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
    public async evaluateSafety(text: string): Promise<Partial<SafetyEvaluationResult>> {
        if (!this.config.safety.enabled) {
            return { dimensions: [], violations: [], isUnsafe: false }
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
                ...apiResponse,
                violations,
                isUnsafe: violations.length > 0
            } as SafetyEvaluationResult
        } catch (error) {
            // Fail-open: return no violations on error
            return { dimensions: [], violations: [], isUnsafe: false }
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
                ...apiResponse,
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
                safetyResult.violations?.some((v) => v.action === 'block') || piiResult.detections.some((d) => d.action === 'block')

            // Determine if input should be redacted
            const shouldRedact = piiResult.redactedText !== undefined

            // Build result
            const result: InputValidationResult = {
                safetyResult,
                piiResult,
                blocked: shouldBlock,
                redacted: shouldRedact,
                redactedText: piiResult.redactedText,
                violations: {
                    safety: safetyResult.violations,
                    pii: piiResult.detections
                }
            }

            // Add block message if blocked (combine both safety and PII)
            if (shouldBlock) {
                const safetyBlocks = safetyResult.violations?.filter((v) => v.action === 'block')
                const piiBlocks = piiResult.detections.filter((d) => d.action === 'block')

                const messages: string[] = []
                if (safetyBlocks && safetyBlocks.length > 0) {
                    messages.push(`Safety: ${safetyBlocks?.map((v) => v.dimension).join(', ')}`)
                }
                if (piiBlocks && piiBlocks.length > 0) {
                    messages.push(`PII: ${piiBlocks.map((d) => d.label).join(', ')}`)
                }

                result.message = `Content blocked - ${messages.join('; ')}`
            }

            return result
        } catch (error) {
            // Fail-open: on error, allow the input to pass through
            return {
                safetyResult: { dimensions: [], violations: [], isUnsafe: false },
                piiResult: { detections: [], hasPII: false },
                blocked: false,
                redacted: false,
                violations: {}
            }
        }
    }

    /**
     * Evaluate faithfulness (RAG hallucination detection)
     * Uses Fiddler's Fast Faithfulness model to detect hallucinations
     *
     * Note: Fiddler faithfulness score uses inverted scale:
     * - Score < 0.005 = unfaithful (hallucination/inaccuracy)
     * - Score ≥ 0.005 = faithful (accurate response)
     *
     * @param text - AI-generated response to evaluate
     * @param context - Source context/documents to compare against
     * @returns Faithfulness evaluation with score and action
     */
    public async evaluateFaithfulness(
        text: string,
        context: string
    ): Promise<{
        score: number
        threshold: number
        action: GuardrailAction
    }> {
        if (!this.config.faithfulness.enabled) {
            return {
                score: 1.0,
                threshold: this.config.faithfulness.threshold,
                action: 'warn'
            }
        }

        try {
            const result = await this.executeWithCircuitBreaker(
                async () => {
                    const response = await this.post<{ fdl_faithful_score: number }>('/v3/guardrails/ftl-response-faithfulness', {
                        data: {
                            input: context,
                            output: text
                        }
                    })
                    return response
                },
                () => ({
                    fdl_faithful_score: 1.0 // Fail-open: assume faithful
                })
            )

            const score = result.fdl_faithful_score
            const threshold = this.config.faithfulness.threshold

            return {
                score,
                threshold,
                action: this.config.faithfulness.action
            }
        } catch (error) {
            // Fail-open: return high faithfulness score on error
            return {
                score: 1.0,
                threshold: this.config.faithfulness.threshold,
                action: 'warn'
            }
        }
    }

    /**
     * Validate output text (safety + PII + faithfulness checks in parallel)
     * Returns combined validation result
     *
     * Key Differences from Input Validation:
     * - Never blocks (always fail-open)
     * - Includes faithfulness check (if context provided)
     * - Default action is 'warn' instead of 'block'
     *
     * @param text - AI-generated output to validate
     * @param context - Optional RAG context for faithfulness checking
     * @returns Output validation result with all violations
     */
    public async validateOutput(text: string, context?: string): Promise<OutputValidationResult> {
        try {
            // Build array of check promises
            const checks: Promise<any>[] = [this.evaluateSafety(text), this.detectPII(text)]

            // Only add faithfulness check if context is provided
            if (context && this.config.faithfulness.enabled) {
                checks.push(this.evaluateFaithfulness(text, context))
            }

            // Run all checks in parallel for performance
            const results = await Promise.all(checks)
            const [safetyResult, piiResult, faithfulnessResult] = results

            // Output validation never replaces (Phase 5: warn only)
            const shouldReplace = false
            const shouldRedact = piiResult.redactedText !== undefined

            // Build result
            const result: OutputValidationResult = {
                replaced: shouldReplace,
                redacted: shouldRedact,
                redactedText: piiResult.redactedText,
                violations: {
                    safety: safetyResult.violations,
                    pii: piiResult.detections
                }
            }

            // Add faithfulness violations if checked
            if (faithfulnessResult) {
                result.violations.faithfulness = {
                    score: faithfulnessResult.score,
                    threshold: faithfulnessResult.threshold
                }
            }

            return result
        } catch (error) {
            // Fail-open: on error, allow the output unchanged
            return {
                replaced: false,
                redacted: false,
                violations: {}
            }
        }
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
