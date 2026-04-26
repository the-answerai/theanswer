/**
 * Fiddler Guardrails Configuration Types
 *
 * Defines the configuration structure for Fiddler AI Guardrails integration.
 * Supports three-tier hierarchy: Environment → Organization → Chatflow
 */

// ============================================================================
// Safety Dimensions (11 total)
// ============================================================================

export type SafetyDimension =
    | 'fdl_harmful'
    | 'fdl_violent'
    | 'fdl_unethical'
    | 'fdl_illegal'
    | 'fdl_sexual'
    | 'fdl_racist'
    | 'fdl_jailbreaking'
    | 'fdl_harassing'
    | 'fdl_hateful'
    | 'fdl_sexist'
    | 'fdl_roleplaying'

// ============================================================================
// PII Types (15+ supported by Fiddler)
// ============================================================================

export type PIIType =
    | 'PERSON'
    | 'EMAIL'
    | 'PHONE_NUMBER'
    | 'ADDRESS'
    | 'US_SOCIAL_SECURITY_NUMBER'
    | 'CREDIT_CARD'
    | 'US_PASSPORT'
    | 'US_DRIVER_LICENSE'
    | 'US_BANK_NUMBER'
    | 'CREDIT_CARD_EXPIRATION'
    | 'PIN'
    | 'IBAN_CODE'
    | 'SWIFT_CODE'
    | 'USERNAME'
    | 'AGE'

// ============================================================================
// Action Types
// ============================================================================

export type GuardrailAction = 'block' | 'redact' | 'replace' | 'warn' | 'continue'

// ============================================================================
// Failure Semantics
// ============================================================================

/**
 * How the runtime should react when a guardrail stage cannot be evaluated
 * (missing credential, upstream outage, auth error, timeout, circuit open).
 *
 * - 'open'   = continue to the LLM, annotate response metadata with degraded=true.
 *              Admins/users see an amber banner; ops sees structured logs + Langfuse spans.
 * - 'closed' = stop the request cold (503) so the chat cannot proceed unprotected.
 */
export type GuardrailFailureMode = 'open' | 'closed'

/**
 * Machine-readable reason why a guardrail stage was (or wasn't) evaluated.
 * Stable enum so alerting rules and UI banners can switch on it.
 */
export type GuardrailHealthReason =
    | 'ok' // evaluated successfully
    | 'disabled' // config.enabled === false
    | 'disabled_stage' // stage-level disabled (safety/pii/faithfulness)
    | 'no_credentials' // no API key resolvable
    | 'auth_error' // upstream 401/403
    | 'api_error' // upstream non-auth error (4xx/5xx)
    | 'timeout' // request exceeded timeout
    | 'circuit_open' // circuit breaker rejected call
    | 'network_error' // connection failure
    | 'unsupported' // Fiddler plan tier does not include this guardrail (404 NotFound)
    | 'unexpected' // unhandled throw; bug-class

export interface GuardrailStageStatus {
    ok: boolean
    degraded: boolean
    reason: GuardrailHealthReason
    httpStatus?: number
    message?: string
    latencyMs?: number
}

// ============================================================================
// Safety Configuration
// ============================================================================

export interface SafetyConfig {
    /**
     * Enable safety checks
     * @default true
     */
    enabled: boolean

    /**
     * Global safety threshold (0-1)
     *
     * INTERPRETATION: Higher scores indicate MORE unsafe content
     * - Score > threshold = Unsafe (violation detected)
     * - Fiddler recommends threshold > 0.1 for production
     * - Lower threshold = MORE strict (catches more violations)
     * - Higher threshold = LESS strict (catches fewer violations)
     *
     * @default 0.1
     */
    threshold: number

    /**
     * Per-dimension threshold overrides
     * Allows fine-tuned control per safety dimension
     *
     * Example:
     * {
     *   fdl_illegal: 0.02,  // More strict for illegal content
     *   fdl_roleplaying: 0.5  // More lenient for roleplaying
     * }
     */
    dimensionThresholds?: Partial<Record<SafetyDimension, number>>

    /**
     * Action to take when safety violation detected
     * @default 'block'
     */
    action: GuardrailAction

    /**
     * Per-dimension action overrides
     *
     * Example:
     * {
     *   fdl_illegal: 'block',
     *   fdl_roleplaying: 'warn'
     * }
     */
    dimensionActions?: Partial<Record<SafetyDimension, GuardrailAction>>
}

// ============================================================================
// PII Configuration
// ============================================================================

export interface PIIConfig {
    /**
     * Enable PII detection
     * @default true
     */
    enabled: boolean

    /**
     * Global confidence threshold (0-1)
     *
     * INTERPRETATION: Higher scores indicate HIGHER confidence in PII detection
     * - Score > threshold = PII detected with sufficient confidence
     * - Only detections above this threshold are processed
     * - Lower threshold = MORE sensitive (detects more PII, more false positives)
     * - Higher threshold = LESS sensitive (detects less PII, fewer false positives)
     *
     * @default 0.8
     */
    confidenceThreshold: number

    /**
     * Per-type confidence threshold overrides
     *
     * Example:
     * {
     *   US_SOCIAL_SECURITY_NUMBER: 0.7,  // Lower threshold (more sensitive)
     *   USERNAME: 0.9  // Higher threshold (less sensitive)
     * }
     */
    typeConfidenceThresholds?: Partial<Record<PIIType, number>>

    /**
     * Which PII types to check for
     * If undefined, checks for all types
     */
    enabledTypes?: PIIType[]

    /**
     * Global action when PII detected
     * @default 'redact'
     */
    action: GuardrailAction

    /**
     * Per-type action overrides
     *
     * Example:
     * {
     *   US_SOCIAL_SECURITY_NUMBER: 'block',
     *   CREDIT_CARD: 'block',
     *   EMAIL: 'redact',
     *   USERNAME: 'warn'
     * }
     */
    typeActions?: Partial<Record<PIIType, GuardrailAction>>
}

// ============================================================================
// Faithfulness Configuration (RAG Hallucination Detection)
// ============================================================================

export interface FaithfulnessConfig {
    /**
     * Enable faithfulness checks
     * @default false (disabled by default, opt-in per org/chatflow)
     */
    enabled: boolean

    /**
     * Faithfulness threshold (0-1)
     *
     * INTERPRETATION: INVERTED SCALE - Lower scores indicate LESS faithful responses
     * - Fiddler's Fast Faithfulness uses inverted scale
     * - Score < 0.005 = Unfaithful (hallucination/inaccuracy detected)
     * - Score ≥ 0.005 = Faithful (response aligns with source context)
     * - Fiddler recommends threshold < 0.005 for detection
     * - Typical faithful scores: 0.01-1.0
     * - Typical unfaithful scores: 0.0-0.004
     *
     * @default 0.005
     */
    threshold: number

    /**
     * Action when hallucination detected
     * Note: Output validation always fails open (never blocks)
     * @default 'warn'
     */
    action: GuardrailAction
}

// ============================================================================
// Complete Guardrails Configuration
// ============================================================================

export interface GuardrailsConfig {
    /**
     * Master enable/disable for all guardrails
     * @default true
     */
    enabled: boolean

    /**
     * Fiddler API credential ID
     * References a credential in the credential table
     * Falls back to FIDDLER_API_KEY environment variable if not set
     */
    credentialId?: string

    /**
     * Failure policy when guardrails cannot be evaluated.
     * @default 'open'
     */
    failureMode: GuardrailFailureMode

    /**
     * Observability-only mode: when true, violations are recorded in metadata
     * but never block the request (even 200-OK violations from Fiddler).
     * Intended for shadow/canary rollouts before flipping enforcement on.
     * @default false
     */
    observabilityOnly?: boolean

    /**
     * Safety checks configuration
     */
    safety: SafetyConfig

    /**
     * PII detection configuration
     */
    pii: PIIConfig

    /**
     * Faithfulness checks configuration
     */
    faithfulness: FaithfulnessConfig

    /**
     * Circuit breaker configuration
     */
    circuitBreaker?: {
        /**
         * Number of consecutive failures before opening circuit
         * @default 5
         */
        failureThreshold: number

        /**
         * Time in ms to wait before attempting to close circuit
         * @default 30000 (30 seconds)
         */
        resetTimeout: number

        /**
         * Number of successful requests to close circuit
         * @default 3
         */
        successThreshold: number
    }

    /**
     * Caching configuration
     */
    cache?: {
        /**
         * Enable Redis caching
         * @default true
         */
        enabled: boolean

        /**
         * Cache TTL in seconds
         * @default 3600 (1 hour)
         */
        ttl: number
    }
}

// ============================================================================
// Configuration Hierarchy
// ============================================================================

/**
 * Organization-level configuration stored in Organization.organizationConfig
 */
export interface OrganizationConfig {
    guardrails?: Partial<GuardrailsConfig>
    // Other organization config can be added here
}

/**
 * Chatflow-level configuration stored in ChatFlow.chatflowConfig
 */
export interface ChatflowConfig {
    guardrails?: Partial<GuardrailsConfig>
    // Other chatflow config can be added here
}

// ============================================================================
// Validation Results
// ============================================================================

export interface PIIDetection {
    label: PIIType
    score: number
    start: number
    end: number
    text: string
    action: GuardrailAction
}

export interface PIIDetectionResult {
    detections: PIIDetection[]
    hasPII: boolean
    redactedText?: string
}

export interface PIIAPIResponse {
    fdl_sensitive_information_scores: Array<{
        score: number
        label: string
        start: number
        end: number
        text: string
    }>
}

export interface SafetyViolation {
    dimension: SafetyDimension
    score: number
    threshold: number
    action: GuardrailAction
}

export interface SafetyEvaluationResult extends SafetyAPIResponse {
    dimensions: SafetyDimension[]
    violations: SafetyViolation[]
    isUnsafe: boolean
}

export type SafetyAPIResponse = Record<SafetyDimension, number>

export interface InputValidationResult {
    safetyResult: Partial<SafetyEvaluationResult>
    piiResult: Partial<PIIDetectionResult>
    blocked: boolean
    redacted: boolean
    redactedText?: string
    message?: string
    violations: {
        safety?: SafetyViolation[]
        pii?: PIIDetection[]
    }
    /**
     * Per-stage health for this evaluation.
     * If any sub-stage (safety/pii) degraded, status.degraded=true.
     */
    status: GuardrailStageStatus
}

export interface OutputValidationResult {
    replaced: boolean
    redacted: boolean
    replacedText?: string
    redactedText?: string
    message?: string
    violations: {
        safety?: SafetyViolation[]
        pii?: PIIDetection[]
        faithfulness?: {
            score: number
            threshold: number
        }
    }
    status: GuardrailStageStatus
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
    enabled: true,
    failureMode: 'open',
    observabilityOnly: false,
    safety: {
        enabled: true,
        threshold: 0.1,
        action: 'block'
    },
    pii: {
        enabled: true,
        confidenceThreshold: 0.8,
        action: 'redact'
    },
    faithfulness: {
        enabled: false, // Disabled by default (opt-in per organization/chatflow)
        threshold: 0.005, // Fiddler's recommendation (inverted scale: < 0.005 = unfaithful)
        action: 'warn' // Never blocks/replaces output, only logs metadata
    },
    circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 3
    },
    cache: {
        enabled: true,
        ttl: 3600
    }
}
