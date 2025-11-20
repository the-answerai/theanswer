/**
 * Theme Pattern Detector
 * Runtime detection of deprecated theme patterns
 * Helps developers migrate to glassmorphism + CSS Variables approach
 */

export interface PatternViolation {
    type: 'palette-access' | 'common-access' | 'deprecated-hook' | 'hardcoded-color'
    severity: 'error' | 'warn' | 'info'
    message: string
    suggestion: string
    stackTrace?: string
}

class ThemePatternDetector {
    private violations: PatternViolation[] = []
    private enabled = true
    private readonly maxViolations = 50 // Prevent spam

    constructor() {
        this.enabled = typeof window !== 'undefined' && process.env.NODE_ENV !== 'production'
    }

    /**
     * Enable/disable pattern detection
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled
    }

    /**
     * Detect direct theme.palette access
     * Example: theme.palette.primary.main (should use theme.vars.palette.primary.main)
     */
    detectPaletteAccess(accessed: string): void {
        if (!this.enabled || this.violations.length >= this.maxViolations) return

        // Check if accessing palette directly
        if (accessed.includes('theme') && accessed.includes('palette') && !accessed.includes('theme.vars.palette')) {
            this.violations.push({
                type: 'palette-access',
                severity: 'warn',
                message: `Direct theme.palette access detected: ${accessed}`,
                suggestion: `Replace '${accessed}' with 'theme.vars.palette' for CSS Variables support`,
                stackTrace: this.captureStackTrace()
            })

            this.logViolation(this.violations[this.violations.length - 1])
        }
    }

    /**
     * Detect theme.palette.common usage
     * Example: theme.palette.common.white (should use rgba values)
     */
    detectCommonColorAccess(accessPath: string): void {
        if (!this.enabled || this.violations.length >= this.maxViolations) return

        if (accessPath.includes('palette.common')) {
            this.violations.push({
                type: 'common-access',
                severity: 'warn',
                message: `Deprecated palette.common access: ${accessPath}`,
                suggestion: `Use explicit color values (e.g., '#ffffff' or 'rgba(255,255,255,0.8)') instead of palette.common`,
                stackTrace: this.captureStackTrace()
            })

            this.logViolation(this.violations[this.violations.length - 1])
        }
    }

    /**
     * Detect direct useTheme() usage without CSS Variables awareness
     */
    detectDeprecatedThemeHook(context: string): void {
        if (!this.enabled || this.violations.length >= this.maxViolations) return

        if (context.includes('useTheme()')) {
            this.violations.push({
                type: 'deprecated-hook',
                severity: 'info',
                message: `useTheme() hook used directly: ${context}`,
                suggestion: `For CSS Variables support, use the sx prop with a theme function: sx={{ color: (t) => t.vars.palette.text.primary }} or use theme.vars directly`,
                stackTrace: this.captureStackTrace()
            })

            this.logViolation(this.violations[this.violations.length - 1])
        }
    }

    /**
     * Detect hardcoded color values in style objects
     */
    detectHardcodedColors(value: string): void {
        if (!this.enabled || this.violations.length >= this.maxViolations) return

        // Match hex or rgb colors
        const colorPattern = /#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)/
        if (colorPattern.test(value) && !value.includes('var(--')) {
            this.violations.push({
                type: 'hardcoded-color',
                severity: 'info',
                message: `Hardcoded color detected: ${value}`,
                suggestion: `Use CSS Variables (var(--theanswer-palette-...)) or theme tokens for consistent theming`,
                stackTrace: this.captureStackTrace()
            })

            // Only log every 5th occurrence to prevent spam
            if (this.violations.filter((v) => v.type === 'hardcoded-color').length % 5 === 0) {
                this.logViolation(this.violations[this.violations.length - 1])
            }
        }
    }

    /**
     * Get captured stack trace
     */
    private captureStackTrace(): string | undefined {
        if (typeof Error.captureStackTrace === 'undefined') return undefined

        const obj = { stack: '' }
        Error.captureStackTrace(obj, this.captureStackTrace)
        return obj.stack?.split('\n').slice(1, 4).join('\n')
    }

    /**
     * Log a single violation
     */
    private logViolation(violation: PatternViolation): void {
        const icon = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️'
        }[violation.severity]

        const logger = {
            error: console.error,
            warn: console.warn,
            info: console.info
        }[violation.severity]

        logger(`${icon} [Theme Pattern] ${violation.message}`)
        logger(`   → Suggestion: ${violation.suggestion}`)

        if (violation.stackTrace && process.env.DEBUG_THEME_PATTERNS) {
            logger(`   → Stack: ${violation.stackTrace}`)
        }
    }

    /**
     * Get all violations
     */
    getViolations(): PatternViolation[] {
        return [...this.violations]
    }

    /**
     * Clear violations
     */
    clearViolations(): void {
        this.violations = []
    }

    /**
     * Get violations summary
     */
    getSummary(): {
        total: number
        errors: number
        warnings: number
        info: number
    } {
        return {
            total: this.violations.length,
            errors: this.violations.filter((v) => v.severity === 'error').length,
            warnings: this.violations.filter((v) => v.severity === 'warn').length,
            info: this.violations.filter((v) => v.severity === 'info').length
        }
    }
}

// Singleton instance
export const themePatternDetector = new ThemePatternDetector()

/**
 * Middleware hook for detecting MUI useTheme usage
 * Can be called in development to warn about deprecated patterns
 */
export function createThemeProxy(theme: any): any {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
        return theme
    }

    return new Proxy(theme, {
        get(target, prop) {
            // Warn on direct palette access
            if (prop === 'palette' && !Array.isArray(target[prop])) {
                themePatternDetector.detectPaletteAccess(`theme.${String(prop)}`)
            }

            // Warn on common color access
            if (prop === 'palette') {
                return new Proxy(target[prop], {
                    get(paletteTarget, paletteProp) {
                        if (paletteProp === 'common') {
                            themePatternDetector.detectCommonColorAccess(`theme.palette.${String(paletteProp)}`)
                        }
                        return paletteTarget[paletteProp]
                    }
                })
            }

            return target[prop]
        }
    })
}

/**
 * Hook to detect useTheme() pattern in components
 * Usage: useThemePatternDetection(theme)
 */
export function useThemePatternDetection(theme: any): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
        return
    }

    // Check for palette access
    if (theme?.palette) {
        themePatternDetector.detectDeprecatedThemeHook('useTheme() detected - check if using palette directly')
    }

    // Check for common color access
    if (theme?.palette?.common) {
        themePatternDetector.detectCommonColorAccess('theme.palette.common')
    }
}

/**
 * Validate style object for deprecated patterns
 */
export function validateStyleObject(styles: any, componentName = 'Component'): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
        return
    }

    const validateValue = (value: any): void => {
        if (typeof value === 'string') {
            themePatternDetector.detectHardcodedColors(value)
        } else if (typeof value === 'object' && value !== null) {
            Object.values(value).forEach(validateValue)
        }
    }

    if (typeof styles === 'object' && styles !== null) {
        Object.values(styles).forEach(validateValue)
    }
}

/**
 * Report all violations in console
 */
export function reportThemePatternViolations(): void {
    const violations = themePatternDetector.getViolations()
    const summary = themePatternDetector.getSummary()

    if (summary.total === 0) {
        console.log('✅ No theme pattern violations detected')
        return
    }

    console.group('🎨 Theme Pattern Violations')
    console.log(`Total: ${summary.total} | Errors: ${summary.errors} | Warnings: ${summary.warnings} | Info: ${summary.info}`)

    // Group by type
    const byType = violations.reduce((acc, v) => {
        if (!acc[v.type]) acc[v.type] = []
        acc[v.type].push(v)
        return acc
    }, {} as Record<string, PatternViolation[]>)

    for (const [type, typeViolations] of Object.entries(byType)) {
        console.group(`${type} (${typeViolations.length})`)
        for (const violation of typeViolations.slice(0, 5)) {
            console.log(`${violation.message}`)
            console.log(`→ ${violation.suggestion}`)
        }
        if (typeViolations.length > 5) {
            console.log(`... and ${typeViolations.length - 5} more`)
        }
        console.groupEnd()
    }

    console.groupEnd()
}
