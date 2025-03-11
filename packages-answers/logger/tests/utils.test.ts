import { colorize, formatTimestamp, isLevelEnabled } from '../src/utils'
import { LogLevel } from '../src/types'

describe('Logger Utilities', () => {
    describe('isLevelEnabled', () => {
        it('should return true when target level has higher or equal priority', () => {
            expect(isLevelEnabled(LogLevel.INFO, LogLevel.ERROR)).toBe(true)
            expect(isLevelEnabled(LogLevel.INFO, LogLevel.WARN)).toBe(true)
            expect(isLevelEnabled(LogLevel.INFO, LogLevel.INFO)).toBe(true)
        })

        it('should return false when target level has lower priority', () => {
            expect(isLevelEnabled(LogLevel.INFO, LogLevel.DEBUG)).toBe(false)
            expect(isLevelEnabled(LogLevel.INFO, LogLevel.TRACE)).toBe(false)
            expect(isLevelEnabled(LogLevel.ERROR, LogLevel.WARN)).toBe(false)
        })

        it('should handle all log levels correctly', () => {
            expect(isLevelEnabled(LogLevel.TRACE, LogLevel.ERROR)).toBe(true)
            expect(isLevelEnabled(LogLevel.TRACE, LogLevel.WARN)).toBe(true)
            expect(isLevelEnabled(LogLevel.TRACE, LogLevel.INFO)).toBe(true)
            expect(isLevelEnabled(LogLevel.TRACE, LogLevel.HTTP)).toBe(true)
            expect(isLevelEnabled(LogLevel.TRACE, LogLevel.DEBUG)).toBe(true)
            expect(isLevelEnabled(LogLevel.TRACE, LogLevel.TRACE)).toBe(true)
        })
    })

    describe('formatTimestamp', () => {
        beforeEach(() => {
            // Mock Date to return a fixed date for testing
            jest.useFakeTimers()
            jest.setSystemTime(new Date(2023, 0, 15, 14, 30, 45, 123))
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it('should format timestamp with default format', () => {
            const timestamp = formatTimestamp()
            expect(timestamp).toBe('14:30:45')
        })

        it('should format timestamp with custom format', () => {
            const timestamp = formatTimestamp('YYYY-MM-DD HH:mm:ss.SSS')
            expect(timestamp).toBe('2023-01-15 14:30:45.123')
        })

        it('should handle different format tokens', () => {
            expect(formatTimestamp('YYYY')).toBe('2023')
            expect(formatTimestamp('MM')).toBe('01')
            expect(formatTimestamp('DD')).toBe('15')
            expect(formatTimestamp('HH')).toBe('14')
            expect(formatTimestamp('mm')).toBe('30')
            expect(formatTimestamp('ss')).toBe('45')
            expect(formatTimestamp('SSS')).toBe('123')
        })
    })

    describe('colorize', () => {
        it('should colorize text using chalk', () => {
            const colorized = colorize('test', 'red')
            // Since we can't easily test the actual color, we'll check that it's not the same as the input
            expect(colorized).not.toBe('test')
            expect(colorized).toContain('test')
        })

        it('should return original text for unknown colors', () => {
            const colorized = colorize('test', 'nonexistentcolor')
            expect(colorized).toBe('test')
        })
    })
})
