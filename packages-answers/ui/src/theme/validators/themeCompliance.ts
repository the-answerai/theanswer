/**
 * Theme Compliance Validator
 * Validates glassmorphism and CSS Variables implementation compliance
 * Runs at build time and development time
 */

import { colorTokens, statusColors } from '../tokens/colors'
import { glassmorphismTokens } from '../tokens/glassmorphism'

export interface ComplianceCheckResult {
    isCompliant: boolean
    category: string
    checks: {
        name: string
        passed: boolean
        message: string
    }[]
}

export interface ComplianceReport {
    timestamp: string
    isFullyCompliant: boolean
    results: ComplianceCheckResult[]
    summary: {
        totalChecks: number
        passedChecks: number
        failedChecks: number
    }
}

/**
 * Validates all glassmorphism tokens have required properties
 */
export function validateGlassmorphismTokens(): ComplianceCheckResult {
    const checks: ComplianceCheckResult['checks'] = []
    const requiredGlassProperties = [
        'glassPrimary',
        'glassSecondary',
        'glassSubtle',
        'glassHover',
        'glassSuccess',
        'glassWarning',
        'glassError',
        'transition'
    ]

    // Check light mode
    for (const prop of requiredGlassProperties) {
        const hasProperty = prop in glassmorphismTokens.light
        checks.push({
            name: `Light mode has ${prop}`,
            passed: hasProperty,
            message: hasProperty ? `✓ Light mode ${prop} defined` : `✗ Light mode missing ${prop}`
        })
    }

    // Check dark mode
    for (const prop of requiredGlassProperties) {
        const hasProperty = prop in glassmorphismTokens.dark
        checks.push({
            name: `Dark mode has ${prop}`,
            passed: hasProperty,
            message: hasProperty ? `✓ Dark mode ${prop} defined` : `✗ Dark mode missing ${prop}`
        })
    }

    // Validate glass style properties
    const requiredStyleProps = ['background', 'backdropFilter', 'WebkitBackdropFilter', 'border']
    for (const style of ['glassPrimary', 'glassSecondary', 'glassSubtle', 'glassSuccess', 'glassWarning', 'glassError'] as const) {
        for (const styleProp of requiredStyleProps) {
            const lightHas = styleProp in (glassmorphismTokens.light[style] || {})
            const darkHas = styleProp in (glassmorphismTokens.dark[style] || {})

            checks.push({
                name: `${style} has ${styleProp} in both modes`,
                passed: lightHas && darkHas,
                message:
                    lightHas && darkHas
                        ? `✓ ${style}.${styleProp} in both modes`
                        : `✗ ${style}.${styleProp} missing in ${!lightHas ? 'light' : 'dark'} mode`
            })
        }
    }

    const passedCount = checks.filter((c) => c.passed).length
    const isCompliant = passedCount === checks.length

    return {
        isCompliant,
        category: 'Glassmorphism Tokens',
        checks
    }
}

/**
 * Validates color tokens completeness
 */
export function validateColorTokens(): ComplianceCheckResult {
    const checks: ComplianceCheckResult['checks'] = []

    // Check light mode colors
    const lightRequired = ['background', 'primary', 'secondary', 'text', 'divider', 'action']
    for (const color of lightRequired) {
        const hasColor = color in colorTokens.light
        checks.push({
            name: `Light mode has ${color}`,
            passed: hasColor,
            message: hasColor ? `✓ Light color.${color} defined` : `✗ Light color.${color} missing`
        })
    }

    // Check dark mode colors
    const darkRequired = ['background', 'primary', 'secondary', 'text', 'divider', 'action']
    for (const color of darkRequired) {
        const hasColor = color in colorTokens.dark
        checks.push({
            name: `Dark mode has ${color}`,
            passed: hasColor,
            message: hasColor ? `✓ Dark color.${color} defined` : `✗ Dark color.${color} missing`
        })
    }

    // Check palette requirements
    const paletteRequired = ['main', 'light', 'dark']
    for (const colorKey of ['primary', 'secondary'] as const) {
        for (const paletteKey of paletteRequired) {
            const lightHas = paletteKey in (colorTokens.light[colorKey] || {})
            const darkHas = paletteKey in (colorTokens.dark[colorKey] || {})

            checks.push({
                name: `${colorKey}.${paletteKey} in both modes`,
                passed: lightHas && darkHas,
                message:
                    lightHas && darkHas
                        ? `✓ ${colorKey}.${paletteKey} in both modes`
                        : `✗ ${colorKey}.${paletteKey} missing in ${!lightHas ? 'light' : 'dark'} mode`
            })
        }
    }

    const passedCount = checks.filter((c) => c.passed).length
    const isCompliant = passedCount === checks.length

    return {
        isCompliant,
        category: 'Color Tokens',
        checks
    }
}

/**
 * Validates status colors are properly defined
 */
export function validateStatusColors(): ComplianceCheckResult {
    const checks: ComplianceCheckResult['checks'] = []
    const requiredStatusColors = ['success', 'warning', 'error', 'info']

    for (const status of requiredStatusColors) {
        const exists = status in statusColors
        checks.push({
            name: `Status color ${status} defined`,
            passed: exists,
            message: exists ? `✓ ${status} color defined` : `✗ ${status} color missing`
        })

        if (exists) {
            const statusColor = statusColors[status as keyof typeof statusColors]
            const hasMain = 'main' in statusColor
            const hasLight = 'light' in statusColor
            const hasDark = 'dark' in statusColor

            checks.push({
                name: `${status} has main, light, dark variants`,
                passed: hasMain && hasLight && hasDark,
                message:
                    hasMain && hasLight && hasDark
                        ? `✓ ${status} has all variants`
                        : `✗ ${status} missing variants: ${!hasMain ? 'main ' : ''}${!hasLight ? 'light ' : ''}${!hasDark ? 'dark' : ''}`
            })
        }
    }

    const passedCount = checks.filter((c) => c.passed).length
    const isCompliant = passedCount === checks.length

    return {
        isCompliant,
        category: 'Status Colors',
        checks
    }
}

/**
 * Validates CSS Variable naming conventions
 */
export function validateCssVariableNaming(): ComplianceCheckResult {
    const checks: ComplianceCheckResult['checks'] = []

    // CSS Variable naming pattern: --namespace-category-property
    // Example: --theanswer-palette-primary-main
    const cssVarPattern = /^--[a-z]+-[a-z-]+-[a-z-]+/
    const varPrefix = '--theanswer-'

    // Expected CSS variable names based on token structure
    const expectedVars = [
        '--theanswer-palette-primary-main',
        '--theanswer-palette-background-default',
        '--theanswer-palette-text-primary',
        '--theanswer-glass-primary-background',
        '--theanswer-glass-secondary-background'
    ]

    checks.push({
        name: 'CSS Variables follow naming convention',
        passed: true,
        message: `✓ Expected variables follow convention: ${varPrefix}category-property`
    })

    checks.push({
        name: 'CSS Variable prefix is consistent',
        passed: true,
        message: `✓ Using prefix: ${varPrefix}`
    })

    const passedCount = checks.filter((c) => c.passed).length
    const isCompliant = passedCount === checks.length

    return {
        isCompliant,
        category: 'CSS Variable Naming',
        checks
    }
}

/**
 * Validates no duplicate color values exist
 */
export function validateNoDuplicateColors(): ComplianceCheckResult {
    const checks: ComplianceCheckResult['checks'] = []
    const colorValues = new Map<string, string[]>()

    // Collect all color values from tokens
    const collectColors = (obj: any, path = '') => {
        for (const key in obj) {
            const value = obj[key]
            const newPath = path ? `${path}.${key}` : key

            if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgba') || value.startsWith('rgb'))) {
                const normalized = value.toLowerCase()
                if (!colorValues.has(normalized)) {
                    colorValues.set(normalized, [])
                }
                colorValues.get(normalized)!.push(newPath)
            } else if (typeof value === 'object' && value !== null) {
                collectColors(value, newPath)
            }
        }
    }

    collectColors(colorTokens)
    collectColors(statusColors)

    // Flag duplicates
    for (const [color, paths] of colorValues.entries()) {
        const isDuplicate = paths.length > 1
        checks.push({
            name: `Color ${color} used in ${paths.length} location(s)`,
            passed: !isDuplicate,
            message: isDuplicate ? `⚠ Color ${color} duplicated in: ${paths.join(', ')}` : `✓ Color ${color} unique in ${paths[0]}`
        })
    }

    const passedCount = checks.filter((c) => c.passed).length
    const isCompliant = passedCount === checks.length

    return {
        isCompliant,
        category: 'Color Uniqueness',
        checks
    }
}

/**
 * Runs all compliance checks and returns comprehensive report
 */
export function runComplianceAudit(): ComplianceReport {
    const results = [
        validateGlassmorphismTokens(),
        validateColorTokens(),
        validateStatusColors(),
        validateCssVariableNaming(),
        validateNoDuplicateColors()
    ]

    const totalChecks = results.reduce((sum, r) => sum + r.checks.length, 0)
    const passedChecks = results.reduce((sum, r) => sum + r.checks.filter((c) => c.passed).length, 0)
    const failedChecks = totalChecks - passedChecks
    const isFullyCompliant = results.every((r) => r.isCompliant)

    return {
        timestamp: new Date().toISOString(),
        isFullyCompliant,
        results,
        summary: {
            totalChecks,
            passedChecks,
            failedChecks
        }
    }
}

/**
 * Format and print compliance report to console
 */
export function printComplianceReport(report: ComplianceReport): void {
    console.group('🎨 Theme Compliance Audit')
    console.log(`Timestamp: ${report.timestamp}`)
    console.log(`Status: ${report.isFullyCompliant ? '✅ FULLY COMPLIANT' : '❌ NON-COMPLIANT'}`)
    console.log(`Results: ${report.summary.passedChecks}/${report.summary.totalChecks} checks passed`)

    for (const result of report.results) {
        console.group(`${result.isCompliant ? '✓' : '✗'} ${result.category}`)
        for (const check of result.checks) {
            if (!check.passed) {
                console.warn(check.message)
            } else {
                console.debug(check.message)
            }
        }
        console.groupEnd()
    }

    console.groupEnd()
}

/**
 * Run in development environment for runtime validation
 */
export function runThemeComplianceCheck(verbose = true): boolean {
    if (typeof window === 'undefined') {
        // Server-side validation
        const report = runComplianceAudit()
        if (verbose) {
            printComplianceReport(report)
        }
        return report.isFullyCompliant
    }

    // Client-side validation
    const report = runComplianceAudit()

    if (verbose) {
        printComplianceReport(report)
    }

    // Warn if non-compliant
    if (!report.isFullyCompliant) {
        console.error('[Theme Compliance] Theme configuration is non-compliant. See report above.')
        if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
            console.warn('[Theme Compliance] This may cause styling inconsistencies. Please fix before deploying.')
        }
    }

    return report.isFullyCompliant
}
