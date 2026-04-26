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

import axios, { AxiosInstance } from 'axios'
import { In } from 'typeorm'
import { CircuitBreaker } from './CircuitBreaker'
import { getGuardrailsConfig } from './config'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Credential, CredentialVisibility } from '../../database/entities/Credential'
import { decryptCredentialData } from '../../utils'
import logger from '../../utils/logger'
import { FiddlerCircuitOpenError, FiddlerError, toFiddlerError } from './errors'
import {
    GuardrailsConfig,
    GuardrailAction,
    GuardrailStageStatus,
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

const HEALTHY_STATUS: GuardrailStageStatus = { ok: true, degraded: false, reason: 'ok' }
const DISABLED_STATUS: GuardrailStageStatus = { ok: true, degraded: false, reason: 'disabled_stage' }

/**
 * Build a degraded status from a FiddlerError. Keeps a stable, machine-readable
 * reason so alerting rules and UI banners can branch on it.
 */
const toStatus = (err: FiddlerError, startedAt: number): GuardrailStageStatus => ({
    ok: false,
    degraded: true,
    reason: err.reason,
    httpStatus: err.httpStatus,
    message: err.message,
    latencyMs: Date.now() - startedAt
})

/**
 * Provenance of resolved credentials. Surfaced by the selftest endpoint so
 * operators can tell where the key is actually coming from.
 */
export type FiddlerCredentialSource = 'config_credential_id' | 'workspace' | 'organization' | 'env' | 'none'

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
     * @param workspaceId - Workspace ID for credential lookup (required, credentials are workspace-scoped)
     * @param organizationId - Organization ID for org-level config (optional)
     * @returns Initialized service or null if disabled/no credentials
     *
     * @example
     * const service = await FiddlerGuardrailsService.createFromContext(chatflowId, workspaceId, orgId)
     * if (service) {
     *   const result = await service.validateInput(text)
     * }
     */
    public static async createFromContext(
        chatflowId: string,
        workspaceId: string,
        organizationId?: string
    ): Promise<FiddlerGuardrailsService | null> {
        const resolution = await this.resolveFromContext(chatflowId, workspaceId, organizationId)
        return resolution.service
    }

    /**
     * Resolve context into a diagnostic report describing whether a service
     * could be built and, if not, why. Callers that need to react to degraded
     * states (render a banner, fail-closed, etc.) use this richer return.
     *
     * `service` is non-null ONLY when config is enabled and credentials were
     * resolved. All other outcomes set `service` to null and populate `reason`.
     */
    public static async resolveFromContext(
        chatflowId: string,
        workspaceId: string,
        organizationId?: string
    ): Promise<{
        service: FiddlerGuardrailsService | null
        config: GuardrailsConfig
        credentialSource: FiddlerCredentialSource
        reason: 'ok' | 'disabled' | 'no_credentials' | 'unexpected'
        error?: Error
    }> {
        let config: GuardrailsConfig
        try {
            config = await getGuardrailsConfig(chatflowId, organizationId)
        } catch (error) {
            logger.error('[Guardrails] Failed to load config (fail-safe)', {
                error: (error as Error).message,
                chatflowId,
                workspaceId,
                organizationId
            })
            // Return a minimal-disabled config so the caller's health/fail-mode logic still works
            return {
                service: null,
                config: { enabled: false } as GuardrailsConfig,
                credentialSource: 'none',
                reason: 'unexpected',
                error: error as Error
            }
        }

        if (!config.enabled) {
            return { service: null, config, credentialSource: 'none', reason: 'disabled' }
        }

        try {
            const { credentials, source } = await this.loadCredentials(workspaceId, organizationId, config)
            if (!credentials) {
                logger.warn('[Guardrails] Enabled but no credentials could be resolved', {
                    chatflowId,
                    workspaceId,
                    organizationId,
                    credentialId: config.credentialId
                })
                return { service: null, config, credentialSource: 'none', reason: 'no_credentials' }
            }
            return {
                service: new FiddlerGuardrailsService(credentials, config),
                config,
                credentialSource: source,
                reason: 'ok'
            }
        } catch (error) {
            logger.error('[Guardrails] Unexpected error resolving service', {
                error: (error as Error).message,
                chatflowId,
                workspaceId,
                organizationId
            })
            return { service: null, config, credentialSource: 'none', reason: 'unexpected', error: error as Error }
        }
    }

    /**
     * Load Fiddler credentials with visibility-aware multi-tier lookup.
     *
     * Priority:
     *   1. Config `credentialId` (chatflow/org override) — owned by workspace OR visible to org
     *   2. Any `fiddlerApi` credential owned by workspace OR visible to org (Organization/Platform visibility)
     *   3. Environment variables (`FIDDLER_API_KEY` + `FIDDLER_API_URL`)
     *
     * Previously this filtered by `workspaceId` only. Because the admin UI saves
     * guardrail credentials with `visibility: ['Organization']`, a credential
     * created under workspace A was invisible to a chatflow executing under
     * workspace B of the same org, silently disabling guardrails.
     */
    public static async loadCredentials(
        workspaceId: string,
        organizationId: string | undefined,
        config: GuardrailsConfig
    ): Promise<{ credentials: FiddlerCredentials | null; source: FiddlerCredentialSource }> {
        try {
            const appServer = getRunningExpressApp()
            const credentialRepository = appServer.AppDataSource.getRepository(Credential)

            // Build visibility-aware where-clause: match by workspace OR (org AND visible to org).
            const orgVisibilityClause = organizationId
                ? [
                      {
                          organizationId,
                          visibility: In([CredentialVisibility.ORGANIZATION, CredentialVisibility.PLATFORM])
                      }
                  ]
                : []

            // Priority 1: Explicit credentialId from config
            if (config.credentialId) {
                const credential = await credentialRepository.findOne({
                    where: [
                        { id: config.credentialId, workspaceId },
                        ...orgVisibilityClause.map((c) => ({ id: config.credentialId, ...c }))
                    ]
                })

                if (credential) {
                    const data = await decryptCredentialData(credential.encryptedData)
                    return {
                        credentials: { apiKey: data.fiddlerApiKey, apiUrl: data.fiddlerApiUrl },
                        source: 'config_credential_id'
                    }
                }
            }

            // Priority 2: fiddlerApi credential owned by workspace
            const workspaceCred = await credentialRepository.findOne({
                where: { credentialName: 'fiddlerApi', workspaceId },
                order: { updatedDate: 'DESC' }
            })
            if (workspaceCred) {
                const data = await decryptCredentialData(workspaceCred.encryptedData)
                return {
                    credentials: { apiKey: data.fiddlerApiKey, apiUrl: data.fiddlerApiUrl },
                    source: 'workspace'
                }
            }

            // Priority 2b: fiddlerApi credential visible across the organization
            if (organizationId) {
                const orgCred = await credentialRepository.findOne({
                    where: orgVisibilityClause.map((c) => ({ credentialName: 'fiddlerApi', ...c })),
                    order: { updatedDate: 'DESC' }
                })
                if (orgCred) {
                    const data = await decryptCredentialData(orgCred.encryptedData)
                    return {
                        credentials: { apiKey: data.fiddlerApiKey, apiUrl: data.fiddlerApiUrl },
                        source: 'organization'
                    }
                }
            }

            // Priority 3: Environment variables
            const envApiKey = process.env.FIDDLER_API_KEY
            const envApiUrl = process.env.FIDDLER_API_URL
            if (envApiKey && envApiUrl) {
                logger.info('[Guardrails] Using credentials from environment variables', { workspaceId, organizationId })
                return { credentials: { apiKey: envApiKey, apiUrl: envApiUrl }, source: 'env' }
            }

            return { credentials: null, source: 'none' }
        } catch (error) {
            logger.error('[Guardrails] Error loading Fiddler credentials', {
                error: (error as Error).message,
                workspaceId,
                organizationId
            })
            return { credentials: null, source: 'none' }
        }
    }

    /**
     * Execute a Fiddler API call with circuit breaker protection.
     *
     * Throws typed `FiddlerError` subclasses on any failure (including open
     * circuit) so callers can classify and record a degraded status. No silent
     * fallbacks — "API down" must be distinguishable from "API said safe".
     */
    private async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
        if (!this.circuitBreaker.canExecute()) {
            throw new FiddlerCircuitOpenError()
        }

        try {
            const result = await operation()
            this.circuitBreaker.recordSuccess()
            return result
        } catch (error) {
            this.circuitBreaker.recordFailure()
            throw toFiddlerError(error)
        }
    }

    /**
     * Make POST request to Fiddler API. Throws typed `FiddlerError`.
     */
    private async post<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await this.client.post<T>(endpoint, data)
            return response.data
        } catch (error) {
            throw toFiddlerError(error)
        }
    }

    /**
     * Evaluate safety (11 dimensions). Returns both the evaluation result and a
     * stage health status. Throws nothing — errors are reflected in status.
     */
    public async evaluateSafety(text: string): Promise<{
        result: Partial<SafetyEvaluationResult>
        status: GuardrailStageStatus
    }> {
        if (!this.config.safety.enabled) {
            return {
                result: { dimensions: [], violations: [], isUnsafe: false },
                status: DISABLED_STATUS
            }
        }

        const startedAt = Date.now()
        try {
            const apiResponse = await this.executeWithCircuitBreaker(async () => {
                return await this.post<SafetyAPIResponse>('/v3/guardrails/ftl-safety', {
                    data: { input: text }
                })
            })

            const violations: SafetyViolation[] = []
            const dimensions = Object.keys(apiResponse) as SafetyDimension[]

            for (const dimension of dimensions) {
                const score = apiResponse[dimension]
                const threshold = this.config.safety.dimensionThresholds?.[dimension] ?? this.config.safety.threshold

                if (score > threshold) {
                    const action = this.config.safety.dimensionActions?.[dimension] ?? this.config.safety.action
                    violations.push({ dimension, score, threshold, action })
                }
            }

            return {
                result: { ...apiResponse, violations, isUnsafe: violations.length > 0 } as SafetyEvaluationResult,
                status: { ...HEALTHY_STATUS, latencyMs: Date.now() - startedAt }
            }
        } catch (error) {
            const fiddlerErr = error instanceof FiddlerError ? error : toFiddlerError(error)
            return {
                // Honest fallback: no violations detected because we could not evaluate,
                // NOT because content was safe. Caller must consult `status.degraded`.
                result: { dimensions: [], violations: [], isUnsafe: false },
                status: toStatus(fiddlerErr, startedAt)
            }
        }
    }

    /**
     * Detect PII (15+ types) with per-type filtering and redaction. Returns
     * both the evaluation result and a stage health status. Throws nothing.
     */
    public async detectPII(text: string): Promise<{ result: PIIDetectionResult; status: GuardrailStageStatus }> {
        if (!this.config.pii.enabled) {
            return { result: { detections: [], hasPII: false }, status: DISABLED_STATUS }
        }

        const startedAt = Date.now()
        try {
            const apiResponse = await this.executeWithCircuitBreaker(async () => {
                return await this.post<PIIAPIResponse>('/v3/guardrails/sensitive-information', {
                    data: { input: text }
                })
            })

            const rawDetections = apiResponse.fdl_sensitive_information_scores || []
            const filteredDetections: PIIDetection[] = []

            for (const entity of rawDetections) {
                const entityLabel = entity.label as PIIType
                if (this.config.pii.enabledTypes && !this.config.pii.enabledTypes.includes(entityLabel)) continue

                const threshold = this.config.pii.typeConfidenceThresholds?.[entityLabel] ?? this.config.pii.confidenceThreshold
                if (entity.score >= threshold) {
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

            let redactedText: string | undefined
            const hasRedactActions = filteredDetections.some((d) => d.action === 'redact' || d.action === 'replace')
            if (hasRedactActions) {
                redactedText = this.redactPII(
                    text,
                    filteredDetections.filter((d) => d.action === 'redact' || d.action === 'replace')
                )
            }

            return {
                result: {
                    ...apiResponse,
                    detections: filteredDetections,
                    hasPII: filteredDetections.length > 0,
                    redactedText
                },
                status: { ...HEALTHY_STATUS, latencyMs: Date.now() - startedAt }
            }
        } catch (error) {
            const fiddlerErr = error instanceof FiddlerError ? error : toFiddlerError(error)
            return {
                result: { detections: [], hasPII: false },
                status: toStatus(fiddlerErr, startedAt)
            }
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
     * Validate input text (safety + PII checks in parallel). Always resolves;
     * per-stage failures are reflected in `result.status.degraded`/`reason`.
     *
     * Observability-only mode: if `config.observabilityOnly === true`, even
     * real 'block' actions are downgraded to warnings so the request continues
     * to the LLM while violations are still recorded for analytics.
     */
    public async validateInput(text: string): Promise<InputValidationResult> {
        const [safety, pii] = await Promise.all([this.evaluateSafety(text), this.detectPII(text)])

        const safetyResult = safety.result
        const piiResult = pii.result

        const obsOnly = this.config.observabilityOnly === true
        const shouldBlock =
            !obsOnly &&
            ((safetyResult.violations || []).some((v) => v.action === 'block') ||
                (piiResult.detections || []).some((d) => d.action === 'block'))
        const shouldRedact = piiResult.redactedText !== undefined

        const result: InputValidationResult = {
            safetyResult,
            piiResult,
            blocked: shouldBlock,
            redacted: shouldRedact,
            redactedText: piiResult.redactedText,
            violations: {
                safety: safetyResult.violations,
                pii: piiResult.detections
            },
            status: mergeStageStatus([safety.status, pii.status])
        }

        if (shouldBlock) {
            const safetyBlocks = safetyResult.violations?.filter((v) => v.action === 'block')
            const piiBlocks = (piiResult.detections || []).filter((d) => d.action === 'block')

            const messages: string[] = []
            if (safetyBlocks && safetyBlocks.length > 0) {
                messages.push(`Safety: ${safetyBlocks.map((v) => v.dimension).join(', ')}`)
            }
            if (piiBlocks.length > 0) {
                messages.push(`PII: ${piiBlocks.map((d) => d.label).join(', ')}`)
            }
            result.message = `Content blocked - ${messages.join('; ')}`
        }

        return result
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
        result: {
            score: number
            threshold: number
            action: GuardrailAction
        }
        status: GuardrailStageStatus
    }> {
        if (!this.config.faithfulness.enabled) {
            return {
                result: {
                    score: 1.0,
                    threshold: this.config.faithfulness.threshold,
                    action: 'warn'
                },
                status: DISABLED_STATUS
            }
        }

        const startedAt = Date.now()
        try {
            const api = await this.executeWithCircuitBreaker(async () => {
                return await this.post<{ fdl_faithful_score: number }>('/v3/guardrails/ftl-response-faithfulness', {
                    data: { input: context, output: text }
                })
            })

            return {
                result: {
                    score: api.fdl_faithful_score,
                    threshold: this.config.faithfulness.threshold,
                    action: this.config.faithfulness.action
                },
                status: { ...HEALTHY_STATUS, latencyMs: Date.now() - startedAt }
            }
        } catch (error) {
            const fiddlerErr = error instanceof FiddlerError ? error : toFiddlerError(error)
            return {
                // Honest fallback: no score — caller must consult status.degraded
                // before interpreting. We still supply 1.0 so legacy consumers don't NaN.
                result: {
                    score: 1.0,
                    threshold: this.config.faithfulness.threshold,
                    action: 'warn'
                },
                status: toStatus(fiddlerErr, startedAt)
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
        const promises: Promise<any>[] = [this.evaluateSafety(text), this.detectPII(text)]
        if (context && this.config.faithfulness.enabled) {
            promises.push(this.evaluateFaithfulness(text, context))
        }

        const results = await Promise.all(promises)
        const [safety, pii, faith] = results as [
            { result: Partial<SafetyEvaluationResult>; status: GuardrailStageStatus },
            { result: PIIDetectionResult; status: GuardrailStageStatus },
            (
                | {
                      result: { score: number; threshold: number; action: GuardrailAction }
                      status: GuardrailStageStatus
                  }
                | undefined
            )
        ]

        const safetyResult = safety.result
        const piiResult = pii.result

        const shouldRedact = piiResult.redactedText !== undefined

        const result: OutputValidationResult = {
            replaced: false, // Output validation never replaces (warn-only posture)
            redacted: shouldRedact,
            redactedText: piiResult.redactedText,
            violations: {
                safety: safetyResult.violations,
                pii: piiResult.detections
            },
            status: mergeStageStatus([safety.status, pii.status, faith?.status].filter(Boolean) as GuardrailStageStatus[])
        }

        if (faith) {
            result.violations.faithfulness = {
                score: faith.result.score,
                threshold: faith.result.threshold
            }
        }

        return result
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
     * Structured health check. Returns a normalized status suitable for display
     * in the admin selftest endpoint.
     */
    public async healthCheck(): Promise<GuardrailStageStatus> {
        const startedAt = Date.now()
        try {
            await this.post<SafetyAPIResponse>('/v3/guardrails/ftl-safety', { data: { input: 'ping' } })
            return { ...HEALTHY_STATUS, latencyMs: Date.now() - startedAt }
        } catch (error) {
            const err = error instanceof FiddlerError ? error : toFiddlerError(error)
            return toStatus(err, startedAt)
        }
    }

    /**
     * Expose resolved config for diagnostic endpoints.
     */
    public getConfig(): GuardrailsConfig {
        return this.config
    }
}

/**
 * Merge multiple stage statuses into a single summary status.
 * Any degraded sub-stage marks the whole stage as degraded, and the first
 * non-ok reason wins (preserves specificity over generic 'ok').
 */
function mergeStageStatus(statuses: GuardrailStageStatus[]): GuardrailStageStatus {
    if (statuses.length === 0) return HEALTHY_STATUS

    const degraded = statuses.find((s) => s.degraded)
    if (degraded) return degraded

    // Prefer the first non-disabled_stage status so UI shows a concrete reason
    const concrete = statuses.find((s) => s.reason === 'ok') || statuses[0]
    const totalLatency = statuses.reduce((sum, s) => sum + (s.latencyMs || 0), 0)
    return { ...concrete, latencyMs: totalLatency || concrete.latencyMs }
}
