/**
 * Guardrails Configuration Utilities
 *
 * Handles three-tier configuration hierarchy:
 * 1. Environment Variables (defaults)
 * 2. Organization Config (TypeORM)
 * 3. Chatflow Config (TypeORM)
 *
 * Precedence: Chatflow > Organization > Environment
 * Supports deep merging for per-dimension and per-type overrides
 */

import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Organization } from '../../database/entities/Organization'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { GuardrailsConfig, DEFAULT_GUARDRAILS_CONFIG, OrganizationConfig, ChatflowConfig, GuardrailAction } from '../../types/guardrails'

/**
 * Load configuration from environment variables
 */
export function getEnvironmentConfig(): Partial<GuardrailsConfig> {
    const enabled = process.env.FIDDLER_GUARDRAILS_ENABLED !== 'false'
    const safetyThreshold = parseFloat(process.env.FIDDLER_SAFETY_THRESHOLD || '0.1')
    const piiThreshold = parseFloat(process.env.FIDDLER_PII_THRESHOLD || '0.8')
    // Fiddler faithfulness uses inverted scale: < 0.005 = unfaithful
    const faithfulnessThreshold = parseFloat(process.env.FIDDLER_FAITHFULNESS_THRESHOLD || '0.005')

    return {
        enabled,
        safety: {
            enabled: process.env.FIDDLER_SAFETY_ENABLED !== 'false',
            threshold: safetyThreshold,
            action: (process.env.FIDDLER_SAFETY_ACTION as GuardrailAction) || 'block'
        },
        pii: {
            enabled: process.env.FIDDLER_PII_ENABLED !== 'false',
            confidenceThreshold: piiThreshold,
            action: (process.env.FIDDLER_PII_ACTION as GuardrailAction) || 'redact'
        },
        faithfulness: {
            enabled: process.env.FIDDLER_FAITHFULNESS_ENABLED !== 'false',
            threshold: faithfulnessThreshold,
            action: (process.env.FIDDLER_FAITHFULNESS_ACTION as GuardrailAction) || 'warn'
        },
        circuitBreaker: {
            failureThreshold: parseInt(process.env.FIDDLER_CIRCUIT_FAILURE_THRESHOLD || '5'),
            resetTimeout: parseInt(process.env.FIDDLER_CIRCUIT_RESET_TIMEOUT || '30000'),
            successThreshold: parseInt(process.env.FIDDLER_CIRCUIT_SUCCESS_THRESHOLD || '3')
        },
        cache: {
            enabled: process.env.FIDDLER_CACHE_ENABLED !== 'false',
            ttl: parseInt(process.env.FIDDLER_CACHE_TTL || '3600')
        }
    }
}

/**
 * Load organization configuration from database
 */
export async function getOrganizationConfig(organizationId: string): Promise<Partial<GuardrailsConfig>> {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(Organization)

        const organization = await repository.findOne({
            where: { id: organizationId }
        })

        if (!organization?.organizationConfig) {
            return {}
        }

        // Parse JSON config
        const orgConfig: OrganizationConfig = JSON.parse(organization.organizationConfig)
        return orgConfig.guardrails || {}
    } catch (error) {
        // Fail gracefully - return empty config
        console.error('Error loading organization guardrails config:', error)
        return {}
    }
}

/**
 * Load chatflow configuration from database
 */
export async function getChatflowConfig(chatflowId: string): Promise<Partial<GuardrailsConfig>> {
    try {
        const appServer = getRunningExpressApp()
        const repository = appServer.AppDataSource.getRepository(ChatFlow)

        const chatflow = await repository.findOne({
            where: { id: chatflowId }
        })

        if (!chatflow?.chatbotConfig) {
            return {}
        }

        // Parse JSON config
        const chatbotConfig: ChatflowConfig = JSON.parse(chatflow.chatbotConfig)
        return chatbotConfig.guardrails || {}
    } catch (error) {
        // Fail gracefully - return empty config
        console.error('Error loading chatflow guardrails config:', error)
        return {}
    }
}

/**
 * Deep merge two partial configs
 * Later config takes precedence, including per-dimension and per-type overrides
 */
export function deepMergeConfigs(base: Partial<GuardrailsConfig>, override: Partial<GuardrailsConfig>): Partial<GuardrailsConfig> {
    const merged: Partial<GuardrailsConfig> = { ...base }

    // Merge top-level enabled flag
    if (override.enabled !== undefined) {
        merged.enabled = override.enabled
    }

    // Merge credentialId
    if (override.credentialId !== undefined) {
        merged.credentialId = override.credentialId
    }

    // Merge safety config
    if (override.safety) {
        merged.safety = {
            ...(base.safety || {}),
            ...override.safety,
            // Deep merge dimensionThresholds
            dimensionThresholds: {
                ...(base.safety?.dimensionThresholds || {}),
                ...(override.safety?.dimensionThresholds || {})
            },
            // Deep merge dimensionActions
            dimensionActions: {
                ...(base.safety?.dimensionActions || {}),
                ...(override.safety?.dimensionActions || {})
            }
        }
    }

    // Merge PII config
    if (override.pii) {
        merged.pii = {
            ...(base.pii || {}),
            ...override.pii,
            // Deep merge typeConfidenceThresholds
            typeConfidenceThresholds: {
                ...(base.pii?.typeConfidenceThresholds || {}),
                ...(override.pii?.typeConfidenceThresholds || {})
            },
            // Deep merge typeActions
            typeActions: {
                ...(base.pii?.typeActions || {}),
                ...(override.pii?.typeActions || {})
            },
            // Merge enabledTypes arrays
            enabledTypes: override.pii.enabledTypes || base.pii?.enabledTypes
        }
    }

    // Merge faithfulness config
    if (override.faithfulness) {
        merged.faithfulness = {
            ...(base.faithfulness || {}),
            ...override.faithfulness
        }
    }

    // Merge circuit breaker config
    if (override.circuitBreaker) {
        merged.circuitBreaker = {
            ...(base.circuitBreaker || {}),
            ...override.circuitBreaker
        }
    }

    // Merge cache config
    if (override.cache) {
        merged.cache = {
            ...(base.cache || {}),
            ...override.cache
        }
    }

    return merged
}

/**
 * Get complete guardrails configuration for a chatflow
 * Merges: Environment → Organization → Chatflow
 *
 * @param chatflowId - Chatflow ID for config hierarchy
 * @param organizationId - Organization ID for org-level config (works for both authenticated and embed requests)
 */
export async function getGuardrailsConfig(chatflowId: string, organizationId?: string): Promise<GuardrailsConfig> {
    // Start with defaults
    let config: Partial<GuardrailsConfig> = { ...DEFAULT_GUARDRAILS_CONFIG }

    // Layer 1: Environment variables
    const envConfig = getEnvironmentConfig()
    config = deepMergeConfigs(config, envConfig)

    // Layer 2: Organization config
    if (organizationId) {
        const orgConfig = await getOrganizationConfig(organizationId)
        config = deepMergeConfigs(config, orgConfig)
    }

    // Layer 3: Chatflow config
    if (chatflowId) {
        const chatflowConfig = await getChatflowConfig(chatflowId)
        config = deepMergeConfigs(config, chatflowConfig)
    }

    // Fill in any missing required fields with defaults
    return {
        ...DEFAULT_GUARDRAILS_CONFIG,
        ...config
    } as GuardrailsConfig
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<GuardrailsConfig>): string[] {
    const errors: string[] = []

    // Validate safety thresholds
    if (config.safety) {
        if (config.safety.threshold !== undefined) {
            if (config.safety.threshold < 0 || config.safety.threshold > 1) {
                errors.push('Safety threshold must be between 0 and 1')
            }
        }

        if (config.safety.dimensionThresholds) {
            Object.entries(config.safety.dimensionThresholds).forEach(([dim, threshold]) => {
                if (threshold < 0 || threshold > 1) {
                    errors.push(`Safety dimension threshold for ${dim} must be between 0 and 1`)
                }
            })
        }

        if (config.safety.action) {
            const validActions: GuardrailAction[] = ['block', 'redact', 'replace', 'warn', 'continue']
            if (!validActions.includes(config.safety.action)) {
                errors.push(`Invalid safety action: ${config.safety.action}`)
            }
        }
    }

    // Validate PII thresholds
    if (config.pii) {
        if (config.pii.confidenceThreshold !== undefined) {
            if (config.pii.confidenceThreshold < 0 || config.pii.confidenceThreshold > 1) {
                errors.push('PII confidence threshold must be between 0 and 1')
            }
        }

        if (config.pii.typeConfidenceThresholds) {
            Object.entries(config.pii.typeConfidenceThresholds).forEach(([type, threshold]) => {
                if (threshold < 0 || threshold > 1) {
                    errors.push(`PII type confidence threshold for ${type} must be between 0 and 1`)
                }
            })
        }

        if (config.pii.action) {
            const validActions: GuardrailAction[] = ['block', 'redact', 'replace', 'warn', 'continue']
            if (!validActions.includes(config.pii.action)) {
                errors.push(`Invalid PII action: ${config.pii.action}`)
            }
        }
    }

    // Validate faithfulness threshold
    if (config.faithfulness?.threshold !== undefined) {
        if (config.faithfulness.threshold < 0 || config.faithfulness.threshold > 1) {
            errors.push('Faithfulness threshold must be between 0 and 1')
        }
    }

    // Validate circuit breaker config
    if (config.circuitBreaker) {
        if (config.circuitBreaker.failureThreshold !== undefined && config.circuitBreaker.failureThreshold < 1) {
            errors.push('Circuit breaker failure threshold must be at least 1')
        }
        if (config.circuitBreaker.successThreshold !== undefined && config.circuitBreaker.successThreshold < 1) {
            errors.push('Circuit breaker success threshold must be at least 1')
        }
        if (config.circuitBreaker.resetTimeout !== undefined && config.circuitBreaker.resetTimeout < 0) {
            errors.push('Circuit breaker reset timeout must be positive')
        }
    }

    // Validate cache config
    if (config.cache?.ttl !== undefined && config.cache.ttl < 0) {
        errors.push('Cache TTL must be positive')
    }

    return errors
}
