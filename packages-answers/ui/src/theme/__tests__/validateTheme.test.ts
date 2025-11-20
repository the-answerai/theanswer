/**
 * Tests for Theme Validation Utilities
 */

import { validateTheme, validateCssVariables, validateColorScheme } from '../utils/validateTheme'
import { cssVarsTheme } from '../cssVarsTheme'

describe('validateTheme', () => {
    // Spy on console methods
    let consoleErrorSpy: jest.SpyInstance
    let consoleWarnSpy: jest.SpyInstance
    let consoleLogSpy: jest.SpyInstance

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
        consoleErrorSpy.mockRestore()
        consoleWarnSpy.mockRestore()
        consoleLogSpy.mockRestore()
    })

    it('should validate a complete theme successfully', () => {
        const result = validateTheme(cssVarsTheme)
        expect(result).toBe(true)
        expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should detect missing required properties', () => {
        const incompleteTheme = {
            palette: { mode: 'dark' as const }
        } as any

        const result = validateTheme(incompleteTheme)
        expect(result).toBe(false)
        expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should warn about missing CSS variables', () => {
        const themeWithoutVars = {
            palette: {
                mode: 'dark' as const,
                primary: { main: '#000' },
                secondary: { main: '#fff' },
                background: { default: '#000', paper: '#111' },
                text: { primary: '#fff' }
            },
            typography: { fontFamily: 'Arial' },
            spacing: 8,
            breakpoints: {
                values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }
            },
            shape: { borderRadius: 4 },
            transitions: {}
        } as any

        const result = validateTheme(themeWithoutVars)
        expect(result).toBe(true)
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining('CSS Variables')]))
    })
})

describe('validateCssVariables', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation()
        jest.spyOn(console, 'warn').mockImplementation()
        jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should warn in non-browser environment', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn')

        // Mock typeof window to be undefined
        const originalWindow = global.window
        delete (global as any).window

        const result = validateCssVariables()

        // Restore window
        ;(global as any).window = originalWindow

        expect(result).toBe(false)
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot validate in non-browser environment'))
    })
})

describe('validateColorScheme', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation()
        jest.spyOn(console, 'warn').mockImplementation()
        jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should warn in non-browser environment', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn')

        // Mock typeof window to be undefined
        const originalWindow = global.window
        delete (global as any).window

        const result = validateColorScheme()

        // Restore window
        ;(global as any).window = originalWindow

        expect(result).toBe(false)
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot validate in non-browser environment'))
    })
})
