/**
 * Default logger instance
 * @module default-logger
 */

import { Logger } from './base-logger'

/**
 * Create a default logger instance that can be imported and used directly
 * @example
 * import { defaultLogger } from '@answers/logger'
 * defaultLogger.info('Hello world')
 */
export const defaultLogger = new Logger()
