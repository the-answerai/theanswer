import { DevLogger } from '../../src/dev'
import { LogLevel } from '../../src/types'

describe('DevLogger', () => {
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
        it('should create a dev logger with default options', () => {
            const logger = new DevLogger()
            expect(logger).toBeInstanceOf(DevLogger)
        })

        it('should create a dev logger with custom options', () => {
            const logger = new DevLogger({
                level: LogLevel.DEBUG,
                excludePatterns: [/test/i],
                showProgress: false
            })
            expect(logger).toBeInstanceOf(DevLogger)
        })
    })

    describe('logging methods', () => {
        it('should log error messages with enhanced formatting', () => {
            const logger = new DevLogger()
            logger.error('Test error message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('ERROR')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test error message')
        })

        it('should log warn messages with enhanced formatting', () => {
            const logger = new DevLogger()
            logger.warn('Test warning message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('WARN')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test warning message')
        })

        it('should log info messages with enhanced formatting', () => {
            const logger = new DevLogger()
            logger.info('Test info message')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('INFO')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Test info message')
        })

        it('should filter out messages matching exclude patterns', () => {
            const logger = new DevLogger({
                excludePatterns: [/test pattern/i]
            })
            logger.info('This contains test pattern to filter')
            expect(mockConsoleLog).not.toHaveBeenCalled()
        })

        it('should not filter messages not matching exclude patterns', () => {
            const logger = new DevLogger({
                excludePatterns: [/test pattern/i]
            })
            logger.info('This does not match the filter')
            expect(mockConsoleLog).toHaveBeenCalled()
        })
    })

    describe('special logging methods', () => {
        it('should log app start messages', () => {
            const logger = new DevLogger()
            logger.appStart('Server starting')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('STARTING')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Server starting')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('🚀')
        })

        it('should log app ready messages', () => {
            const logger = new DevLogger()
            logger.appReady('Server ready')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('READY')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Server ready')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('✅')
        })

        it('should log database connection messages', () => {
            const logger = new DevLogger()
            logger.dbConnected('Connected to PostgreSQL')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('DATABASE')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Connected to PostgreSQL')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('🗃️')
        })

        it('should log API ready messages', () => {
            const logger = new DevLogger()
            logger.apiReady('API listening on port 3000')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('API')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('API listening on port 3000')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('🌐')
        })

        it('should log environment check messages', () => {
            const logger = new DevLogger()
            logger.envCheck('DATABASE_URL', 'ok')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('ENV')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('DATABASE_URL')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('✅')
        })

        it('should log checklist items', () => {
            const logger = new DevLogger()
            logger.checklistItem('Database connection', true)
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Database connection')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('✅')
        })

        it('should log section headers', () => {
            const logger = new DevLogger()
            logger.section('Configuration')
            expect(mockConsoleLog).toHaveBeenCalled()
            expect(mockConsoleLog.mock.calls[0][0]).toContain('Configuration')
            expect(mockConsoleLog.mock.calls[0][0]).toContain('==========')
        })
    })
})
