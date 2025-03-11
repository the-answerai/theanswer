/**
 * Default logger configuration constants
 * @module constants
 */

import { type LoggerOptions, LogLevel } from '../types'

/**
 * Default logger options used when no options are provided
 */
export const DEFAULT_OPTIONS: LoggerOptions = {
    level: LogLevel.INFO,
    timestamps: true,
    timestampFormat: 'HH:mm:ss',
    colorize: true,
    icons: true,
    labels: {}
}
