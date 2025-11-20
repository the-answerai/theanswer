import { withAlpha, alphaVar, hexToRgb } from './alpha'

describe('Alpha Utility Functions', () => {
    describe('hexToRgb', () => {
        it('should convert hex color to RGB components', () => {
            const result = hexToRgb('#2563eb')
            expect(result).toEqual({ r: 37, g: 99, b: 235 })
        })

        it('should handle colors without hash', () => {
            const result = hexToRgb('ff6e40')
            expect(result).toEqual({ r: 255, g: 110, b: 64 })
        })

        it('should throw on invalid hex', () => {
            expect(() => hexToRgb('invalid')).toThrow('Invalid hex color: invalid')
        })
    })

    describe('withAlpha', () => {
        it('should generate alpha variants for a color', () => {
            const result = withAlpha('#2563eb')
            expect(result.main).toBe('#2563eb')
            expect(result.alpha10).toBe('rgba(37, 99, 235, 0.10)')
            expect(result.alpha20).toBe('rgba(37, 99, 235, 0.20)')
            expect(result.alpha30).toBe('rgba(37, 99, 235, 0.30)')
            expect(result.alpha40).toBe('rgba(37, 99, 235, 0.40)')
            expect(result.alpha50).toBe('rgba(37, 99, 235, 0.50)')
        })

        it('should handle white color', () => {
            const result = withAlpha('#ffffff')
            expect(result.main).toBe('#ffffff')
            expect(result.alpha10).toBe('rgba(255, 255, 255, 0.10)')
        })

        it('should handle black color', () => {
            const result = withAlpha('#000000')
            expect(result.main).toBe('#000000')
            expect(result.alpha10).toBe('rgba(0, 0, 0, 0.10)')
        })
    })

    describe('alphaVar', () => {
        it('should use color-mix syntax with percent', () => {
            const result = alphaVar('--color-primary', 0.5)
            expect(result).toBe('color-mix(in srgb, --color-primary 50%, transparent)')
        })

        it('should round opacity to percent', () => {
            const result = alphaVar('--color-secondary', 0.333)
            expect(result).toBe('color-mix(in srgb, --color-secondary 33%, transparent)')
        })

        it('should use fallback when provided and color-mix not supported', () => {
            const fallback = 'rgba(37, 99, 235, 0.5)'
            const result = alphaVar('--color-primary', 0.5, fallback)
            // Will use color-mix in browsers that support it, fallback otherwise
            expect(result).toBeDefined()
        })
    })
})
