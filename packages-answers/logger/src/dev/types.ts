/**
 * Development logger type definitions
 * @module dev/types
 */

import type { LoggerOptions } from '../types'

/**
 * Development logger options extending the base logger options
 */
export interface DevLoggerOptions extends LoggerOptions {
    /**
     * Filter patterns to exclude from logs
     */
    excludePatterns?: RegExp[]

    /**
     * Whether to show progress for long operations
     */
    showProgress?: boolean
}
