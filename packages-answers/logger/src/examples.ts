/**
 * Examples of how to use the logger
 *
 * Note: This file is for demonstration purposes only and is not part of the library exports.
 */

import { Logger, LogLevel, defaultLogger } from './index'

// Example 1: Using the default logger
console.log('\n--- Example 1: Using the default logger ---')
defaultLogger.error('This is an error message')
defaultLogger.warn('This is a warning message')
defaultLogger.info('This is an info message')
defaultLogger.http('This is an HTTP message')
defaultLogger.debug('This is a debug message (not shown with default level)')
defaultLogger.trace('This is a trace message (not shown with default level)')

// Example 2: Creating a custom logger with debug level
console.log('\n--- Example 2: Creating a custom debug logger ---')
const debugLogger = new Logger({ level: LogLevel.DEBUG })
debugLogger.error('This is an error message')
debugLogger.warn('This is a warning message')
debugLogger.info('This is an info message')
debugLogger.http('This is an HTTP message')
debugLogger.debug('This is a debug message (now visible)')
debugLogger.trace('This is a trace message (still not visible)')

// Example 3: Creating a logger with custom formatting
console.log('\n--- Example 3: Creating a logger with custom formatting ---')
const customLogger = new Logger({
    level: LogLevel.INFO,
    timestampFormat: 'HH:mm:ss.SSS',
    labels: {
        service: 'auth-service',
        version: '1.0.0'
    }
})
customLogger.info('User authenticated')
customLogger.warn('Rate limit approaching', { userId: '123', rate: '90%' })

// Example 4: Using child loggers
console.log('\n--- Example 4: Using child loggers ---')
const apiLogger = defaultLogger.child({ component: 'api' })
apiLogger.info('API server started')

const userApiLogger = apiLogger.child({ endpoint: '/users' })
userApiLogger.info('GET /users request received')
userApiLogger.error('Failed to fetch users', { error: 'Database connection failed' })

// Example 5: Disabling features
console.log('\n--- Example 5: Disabling features ---')
const minimalLogger = new Logger({
    timestamps: false,
    colorize: false,
    icons: false
})
minimalLogger.info('This is a minimal log message')
minimalLogger.error('This is a minimal error message')

// Example 6: With complex data
console.log('\n--- Example 6: With complex data ---')
defaultLogger.info('Process completed', {
    duration: 123.45,
    steps: ['init', 'process', 'cleanup'],
    result: {
        success: true,
        itemsProcessed: 42
    }
})
