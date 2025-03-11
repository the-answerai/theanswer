// Create a mock DevLogger
const mockDevLogger = {
    section: jest.fn(),
    envCheck: jest.fn(),
    checklistItem: jest.fn(),
    appReady: jest.fn(),
    warn: jest.fn()
}

// Mock the dev-logger module
jest.mock('../../src/dev/dev-logger', () => {
    return {
        DevLogger: jest.fn().mockImplementation(() => mockDevLogger)
    }
})

// Import after mocking
import { checkEnvironmentVariables, logAppStartup } from '../../src/dev/utils'

describe('Dev Logger Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('checkEnvironmentVariables', () => {
        it('should check all required environment variables', () => {
            // Mock process.env
            const originalEnv = process.env
            process.env = {
                ...originalEnv,
                TEST_VAR1: 'value1',
                TEST_VAR2: 'value2'
            }

            const result = checkEnvironmentVariables(['TEST_VAR1', 'TEST_VAR2', 'MISSING_VAR'])

            expect(mockDevLogger.section).toHaveBeenCalledWith('Environment Variables Check')
            expect(mockDevLogger.envCheck).toHaveBeenCalledTimes(3)
            expect(mockDevLogger.envCheck).toHaveBeenCalledWith('TEST_VAR1', 'ok')
            expect(mockDevLogger.envCheck).toHaveBeenCalledWith('TEST_VAR2', 'ok')
            expect(mockDevLogger.envCheck).toHaveBeenCalledWith('MISSING_VAR', 'missing')
            expect(result).toBe(false)

            // Restore process.env
            process.env = originalEnv
        })

        it('should return true when all variables are present', () => {
            // Mock process.env
            const originalEnv = process.env
            process.env = {
                ...originalEnv,
                TEST_VAR1: 'value1',
                TEST_VAR2: 'value2'
            }

            const result = checkEnvironmentVariables(['TEST_VAR1', 'TEST_VAR2'])

            expect(mockDevLogger.envCheck).toHaveBeenCalledTimes(2)
            expect(result).toBe(true)

            // Restore process.env
            process.env = originalEnv
        })
    })

    describe('logAppStartup', () => {
        it('should log startup status for all services', () => {
            const services = {
                database: true,
                api: true,
                cache: false
            }

            logAppStartup(services)

            expect(mockDevLogger.section).toHaveBeenCalledWith('Application Startup')
            expect(mockDevLogger.checklistItem).toHaveBeenCalledTimes(3)
            expect(mockDevLogger.checklistItem).toHaveBeenCalledWith('database', true)
            expect(mockDevLogger.checklistItem).toHaveBeenCalledWith('api', true)
            expect(mockDevLogger.checklistItem).toHaveBeenCalledWith('cache', false)
            expect(mockDevLogger.warn).toHaveBeenCalled()
        })

        it('should show success message when all services are ready', () => {
            const services = {
                database: true,
                api: true
            }

            logAppStartup(services)

            expect(mockDevLogger.appReady).toHaveBeenCalledWith('All services are ready!')
            expect(mockDevLogger.warn).not.toHaveBeenCalled()
        })
    })
})
