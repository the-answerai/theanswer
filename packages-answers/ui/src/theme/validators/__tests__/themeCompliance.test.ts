/**
 * Theme Compliance Validator Tests
 * Ensures theme configuration is valid and complete
 */

import {
    validateGlassmorphismTokens,
    validateColorTokens,
    validateStatusColors,
    validateCssVariableNaming,
    validateNoDuplicateColors,
    runComplianceAudit
} from '../themeCompliance'

describe('Theme Compliance Validator', () => {
    describe('validateGlassmorphismTokens', () => {
        it('should validate all required glass properties exist', () => {
            const result = validateGlassmorphismTokens()

            expect(result.category).toBe('Glassmorphism Tokens')
            expect(result.checks.length).toBeGreaterThan(0)

            // Should have checks for both light and dark modes
            const lightChecks = result.checks.filter((c) => c.name.includes('Light mode'))
            const darkChecks = result.checks.filter((c) => c.name.includes('Dark mode'))

            expect(lightChecks.length).toBeGreaterThan(0)
            expect(darkChecks.length).toBeGreaterThan(0)
        })

        it('should report comprehensive glass token coverage', () => {
            const result = validateGlassmorphismTokens()

            const requiredTokens = [
                'glassPrimary',
                'glassSecondary',
                'glassSubtle',
                'glassHover',
                'glassSuccess',
                'glassWarning',
                'glassError'
            ]

            for (const token of requiredTokens) {
                const check = result.checks.find((c) => c.name.includes(token))
                expect(check).toBeDefined()
                expect(check?.passed).toBe(true)
            }
        })

        it('should validate glass style properties', () => {
            const result = validateGlassmorphismTokens()

            const stylePropertyChecks = result.checks.filter((c) => c.name.includes('has'))
            expect(stylePropertyChecks.length).toBeGreaterThan(0)

            // All checked properties should have positive results
            const allPassed = stylePropertyChecks.every((c) => c.passed)
            expect(allPassed).toBe(true)
        })
    })

    describe('validateColorTokens', () => {
        it('should validate all required color modes exist', () => {
            const result = validateColorTokens()

            expect(result.category).toBe('Color Tokens')

            const lightModeChecks = result.checks.filter((c) => c.name.includes('Light mode'))
            const darkModeChecks = result.checks.filter((c) => c.name.includes('Dark mode'))

            expect(lightModeChecks.length).toBeGreaterThan(0)
            expect(darkModeChecks.length).toBeGreaterThan(0)

            // All should pass
            expect(lightModeChecks.every((c) => c.passed)).toBe(true)
            expect(darkModeChecks.every((c) => c.passed)).toBe(true)
        })

        it('should validate color palette structure', () => {
            const result = validateColorTokens()

            const paletteChecks = result.checks.filter(
                (c) => c.name.includes('main') || c.name.includes('light') || c.name.includes('dark')
            )
            expect(paletteChecks.length).toBeGreaterThan(0)

            // All palette checks should pass
            const allPassed = paletteChecks.every((c) => c.passed)
            expect(allPassed).toBe(true)
        })
    })

    describe('validateStatusColors', () => {
        it('should validate all required status colors exist', () => {
            const result = validateStatusColors()

            expect(result.category).toBe('Status Colors')

            const requiredStatuses = ['success', 'warning', 'error', 'info']
            for (const status of requiredStatuses) {
                const check = result.checks.find((c) => c.name.includes(status))
                expect(check).toBeDefined()
            }
        })

        it('should validate status color variants', () => {
            const result = validateStatusColors()

            const variantChecks = result.checks.filter((c) => c.name.includes('variants'))
            expect(variantChecks.length).toBeGreaterThan(0)

            // All variant checks should pass
            const allPassed = variantChecks.every((c) => c.passed)
            expect(allPassed).toBe(true)
        })
    })

    describe('validateCssVariableNaming', () => {
        it('should validate CSS variable naming convention', () => {
            const result = validateCssVariableNaming()

            expect(result.category).toBe('CSS Variable Naming')
            expect(result.checks.length).toBeGreaterThan(0)

            // All checks should pass
            const allPassed = result.checks.every((c) => c.passed)
            expect(allPassed).toBe(true)
        })

        it('should validate naming pattern consistency', () => {
            const result = validateCssVariableNaming()

            const patternCheck = result.checks.find((c) => c.name.includes('naming convention'))
            expect(patternCheck).toBeDefined()
            expect(patternCheck?.passed).toBe(true)
        })
    })

    describe('validateNoDuplicateColors', () => {
        it('should detect and report duplicate colors', () => {
            const result = validateNoDuplicateColors()

            expect(result.category).toBe('Color Uniqueness')
            expect(result.checks.length).toBeGreaterThan(0)
        })

        it('should provide unique color information', () => {
            const result = validateNoDuplicateColors()

            // Should have entries for various colors
            expect(result.checks.length).toBeGreaterThan(0)

            // Each check should have meaningful information
            for (const check of result.checks) {
                expect(check.message).toBeTruthy()
                expect(check.name).toBeTruthy()
            }
        })
    })

    describe('runComplianceAudit', () => {
        it('should run all validation checks', () => {
            const report = runComplianceAudit()

            expect(report.timestamp).toBeTruthy()
            expect(report.summary).toBeDefined()
            expect(report.results.length).toBe(5) // All 5 validators
        })

        it('should provide accurate summary statistics', () => {
            const report = runComplianceAudit()

            const { totalChecks, passedChecks, failedChecks } = report.summary
            expect(totalChecks).toBeGreaterThan(0)
            expect(passedChecks + failedChecks).toBe(totalChecks)
        })

        it('should report overall compliance status', () => {
            const report = runComplianceAudit()

            // In a properly configured theme, should be compliant
            expect(typeof report.isFullyCompliant).toBe('boolean')
        })

        it('should include all validation categories', () => {
            const report = runComplianceAudit()

            const categories = report.results.map((r) => r.category)
            expect(categories).toContain('Glassmorphism Tokens')
            expect(categories).toContain('Color Tokens')
            expect(categories).toContain('Status Colors')
            expect(categories).toContain('CSS Variable Naming')
            expect(categories).toContain('Color Uniqueness')
        })

        it('should provide detailed check information', () => {
            const report = runComplianceAudit()

            for (const result of report.results) {
                for (const check of result.checks) {
                    expect(check.name).toBeTruthy()
                    expect(typeof check.passed).toBe('boolean')
                    expect(check.message).toBeTruthy()
                }
            }
        })
    })

    describe('Compliance Status', () => {
        it('should show overall system compliance', () => {
            const report = runComplianceAudit()

            // Log results for inspection
            console.log('Theme Compliance Report:')
            console.log(`  Status: ${report.isFullyCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`)
            console.log(`  Total Checks: ${report.summary.totalChecks}`)
            console.log(`  Passed: ${report.summary.passedChecks}`)
            console.log(`  Failed: ${report.summary.failedChecks}`)

            // All validators should be present
            expect(report.results).toHaveLength(5)
        })
    })
})
