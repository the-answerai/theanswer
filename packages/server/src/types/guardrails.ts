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
     * Higher values = more strict
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
     * Only detections above this threshold are processed
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
     * @default true
     */
    enabled: boolean

    /**
     * Faithfulness threshold (0-1)
     * Measures how faithful output is to RAG context
     * @default 0.7
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
    type: PIIType
    start: number
    end: number
    confidence: number
    text: string
    label: string
}

export interface SafetyViolation {
    dimension: SafetyDimension
    score: number
    threshold: number
}

export interface InputValidationResult {
    blocked: boolean
    redacted: boolean
    redactedText?: string
    message?: string
    violations: {
        safety?: SafetyViolation[]
        pii?: PIIDetection[]
    }
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
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
    enabled: true,
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
        enabled: true,
        threshold: 0.7,
        action: 'warn'
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
