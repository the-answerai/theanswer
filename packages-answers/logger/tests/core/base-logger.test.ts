import { Logger } from '../../src/core'
import { LogLevel } from '../../src/types'

describe('Logger', () => {
    let originalConsoleLog: typeof console.log
    let mockConsoleLog: jest.Mock

    beforeEach(() => {
        // Mock console.log to capture output
        originalConsoleLog = console.log
        mockConsoleLog = jest.fn()
        console.log = mockConsoleLog
    })

    afterEach(() => {
        // Restore original console.log
        console.log = originalConsoleLog
    })

    describe('constructor', () => {
        it('should create a logger with default options', () => {
            const logger = new Logger()
            expect(logger).toBeInstanceOf(Logger)
        })

        it('should create a logger with custom options', () => {
            const logger = new Logger({
                level: LogLevel.DEBUG,
                timestamps: false,
                colorize: false,
                icons: false
            })
            expect(logger).toBeInstanceOf(Logger)
        })
    })

    describe('logging methods', () => {
        it('should log error messages', () => {
            const logger = new Logger()
            logger.error('Test error message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('ERROR')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test error message')
        })

        it('should log warn messages', () => {
            const logger = new Logger()
            logger.warn('Test warning message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('WARN')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test warning message')
        })

        it('should log info messages', () => {
            const logger = new Logger()
            logger.info('Test info message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('INFO')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test info message')
        })

        it('should log http messages when level is set to HTTP', () => {
            const logger = new Logger({ level: LogLevel.HTTP })
            logger.http('Test http message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('HTTP')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test http message')
        })

        it('should log debug messages when level is set to DEBUG', () => {
            const logger = new Logger({ level: LogLevel.DEBUG })
            logger.debug('Test debug message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('DEBUG')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test debug message')
        })

        it('should not log debug messages when level is set to INFO', () => {
            const logger = new Logger({ level: LogLevel.INFO })
            logger.debug('Test debug message')
            expect(mockConsoleLog).not.toHaveBeenCalled()
        })

        it('should log trace messages when level is set to TRACE', () => {
            const logger = new Logger({ level: LogLevel.TRACE })
            logger.trace('Test trace message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('TRACE')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test trace message')
        })

        it('should not log trace messages when level is set to DEBUG', () => {
            const logger = new Logger({ level: LogLevel.DEBUG })
            logger.trace('Test trace message')
            expect(mockConsoleLog).not.toHaveBeenCalled()
        })
    })

    describe('child loggers', () => {
        it('should create a child logger with additional context', () => {
            const logger = new Logger()
            const childLogger = logger.child({ service: 'test-service' })

            childLogger.info('Test child logger message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('service=test-service')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test child logger message')
        })

        it('should merge context from parent and child loggers', () => {
            const logger = new Logger({ labels: { app: 'test-app' } })
            const childLogger = logger.child({ service: 'test-service' })

            childLogger.info('Test child logger message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('app=test-app')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('service=test-service')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test child logger message')
        })
    })

    describe('formatting options', () => {
        it('should include timestamps when enabled', () => {
            const logger = new Logger({ timestamps: true })
            logger.info('Test message')
            expect(mockConsoleLog).toHaveBeenCalled()
            // Check for timestamp format [HH:mm:ss]
            expect(mockConsoleLog.mock.calls[0][0]).toMatch(/\[\d{2}:\d{2}:\d{2}\]/)
        })

        it('should not include timestamps when disabled', () => {
            const logger = new Logger({ timestamps: false })
            logger.info('Test message')
            expect(mockConsoleLog).toHaveBeenCalled()
            // Should not match timestamp format
            expect(mockConsoleLog.mock.calls[0][0]).not.toMatch(/\[\d{2}:\d{2}:\d{2}\]/)
        })

        it('should include icons when enabled', () => {
            const logger = new Logger({ icons: true })
            logger.info('Test message')
            expect(mockConsoleLog).toHaveBeenCalled()
            // INFO icon is ℹ
            expect(mockConsoleLog.mock.calls[0][0]).toContain('ℹ')
        })

        it('should not include icons when disabled', () => {
            const logger = new Logger({ icons: false })
            logger.info('Test message')
            expect(mockConsoleLog).toHaveBeenCalled()
            // INFO icon is ℹ
            expect(mockConsoleLog.mock.calls[0][0]).not.toContain('ℹ')
        })

        it('should include additional arguments in the log', () => {
            const logger = new Logger()
            const additionalData = { userId: 123, action: 'login' }
            logger.info('User action', additionalData)
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][1]).toEqual(additionalData)
        })
    })
})
