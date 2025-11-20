/**
 * Feature Flag Service
 * Manages feature flags for gradual rollout and A/B testing
 */

export interface FeatureFlags {
    useCssVarsTheme: boolean
    enableThemeAnimations: boolean
    debugTheme: boolean
}

export class FeatureFlagService {
    private flags: Map<string, boolean> = new Map()

    constructor() {
        this.loadFromEnv()
        this.loadFromLocalStorage()
    }

    /**
     * Load flags from environment variables
     */
    private loadFromEnv() {
        if (typeof process !== 'undefined' && process.env) {
            // CSS Variables theme flag
            const useCssVars = process.env.NEXT_PUBLIC_USE_CSS_VARS_THEME === 'true'
            this.flags.set('useCssVarsTheme', useCssVars)

            // Theme animations flag (default true)
            const enableAnimations = process.env.NEXT_PUBLIC_ENABLE_THEME_ANIMATIONS !== 'false'
            this.flags.set('enableThemeAnimations', enableAnimations)

            // Debug mode (default false)
            const debugTheme = process.env.NEXT_PUBLIC_DEBUG_THEME === 'true'
            this.flags.set('debugTheme', debugTheme)
        }
    }

    /**
     * Load flags from localStorage (overrides env vars)
     */
    private loadFromLocalStorage() {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('featureFlags')
                if (stored) {
                    const parsed = JSON.parse(stored) as Partial<FeatureFlags>
                    Object.entries(parsed).forEach(([key, value]) => {
                        if (typeof value === 'boolean') {
                            this.flags.set(key, value)
                        }
                    })
                }
            } catch (error) {
                console.warn('Failed to load feature flags from localStorage:', error)
            }
        }
    }

    /**
     * Check if a feature flag is enabled
     */
    isEnabled(flag: keyof FeatureFlags): boolean {
        return this.flags.get(flag) ?? false
    }

    /**
     * Set a feature flag value
     * Persists to localStorage
     */
    setFlag(flag: keyof FeatureFlags, enabled: boolean) {
        this.flags.set(flag, enabled)
        this.persist()

        // Log for debugging
        if (this.isEnabled('debugTheme')) {
            console.log(`[FeatureFlags] ${flag} = ${enabled}`)
        }
    }

    /**
     * Get all flags as an object
     */
    getAll(): FeatureFlags {
        return {
            useCssVarsTheme: this.isEnabled('useCssVarsTheme'),
            enableThemeAnimations: this.isEnabled('enableThemeAnimations'),
            debugTheme: this.isEnabled('debugTheme')
        }
    }

    /**
     * Reset all flags to defaults
     */
    reset() {
        this.flags.clear()
        if (typeof window !== 'undefined') {
            localStorage.removeItem('featureFlags')
        }
        this.loadFromEnv()
    }

    /**
     * Persist flags to localStorage
     */
    private persist() {
        if (typeof window !== 'undefined') {
            try {
                const obj = Object.fromEntries(this.flags)
                localStorage.setItem('featureFlags', JSON.stringify(obj))
            } catch (error) {
                console.warn('Failed to persist feature flags to localStorage:', error)
            }
        }
    }
}

// Singleton instance
export const featureFlags = new FeatureFlagService()

// Export for debugging
if (typeof window !== 'undefined') {
    ;(window as any).featureFlags = featureFlags
}
