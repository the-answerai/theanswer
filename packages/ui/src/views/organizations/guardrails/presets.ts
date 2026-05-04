import { GuardrailsConfig } from '../../../../../../packages/server/src/types/guardrails'

export interface GuardrailsPreset {
    id: string
    name: string
    description: string
    config: Partial<GuardrailsConfig>
}

export const GUARDRAILS_PRESETS: GuardrailsPreset[] = [
    {
        id: 'strict',
        name: 'Strict (Recommended for External Bots)',
        description:
            'Blocks unsafe content (threshold: 0.05), redacts all PII (confidence: 0.8), detects hallucinations (threshold: 0.005). Sets failure mode to fail closed when Fiddler is unavailable.',
        config: {
            enabled: true,
            failureMode: 'closed',
            observabilityOnly: false,
            safety: {
                enabled: true,
                threshold: 0.05,
                action: 'block'
            },
            pii: {
                enabled: true,
                confidenceThreshold: 0.8,
                action: 'redact'
            },
            faithfulness: {
                enabled: true,
                threshold: 0.005,
                action: 'warn'
            },
            circuitBreaker: {
                failureThreshold: 5,
                resetTimeout: 30000,
                successThreshold: 3
            }
        }
    },
    {
        id: 'balanced',
        name: 'Balanced (General Purpose)',
        description:
            'Blocks unsafe content (threshold: 0.1), redacts PII (confidence: 0.8), detects hallucinations (threshold: 0.005). Sets failure mode to fail open when Fiddler is unavailable.',
        config: {
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
                enabled: true,
                threshold: 0.005,
                action: 'warn'
            },
            circuitBreaker: {
                failureThreshold: 5,
                resetTimeout: 30000,
                successThreshold: 3
            }
        }
    },
    {
        id: 'lenient',
        name: 'Lenient (Internal Tools)',
        description:
            'Warns on unsafe content (threshold: 0.15), warns on PII (confidence: 0.85), no hallucination detection. Sets failure mode to fail open when Fiddler is unavailable.',
        config: {
            enabled: true,
            failureMode: 'open',
            observabilityOnly: false,
            safety: {
                enabled: true,
                threshold: 0.15,
                action: 'warn'
            },
            pii: {
                enabled: true,
                confidenceThreshold: 0.85,
                action: 'warn'
            },
            faithfulness: {
                enabled: false,
                threshold: 0.005,
                action: 'warn'
            },
            circuitBreaker: {
                failureThreshold: 5,
                resetTimeout: 30000,
                successThreshold: 3
            }
        }
    }
]

export const getPresetById = (id: string): GuardrailsPreset | undefined => {
    return GUARDRAILS_PRESETS.find((preset) => preset.id === id)
}

export const getPresetConfig = (id: string): Partial<GuardrailsConfig> | undefined => {
    const preset = getPresetById(id)
    return preset?.config
}
