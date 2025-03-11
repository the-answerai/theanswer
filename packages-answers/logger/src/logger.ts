import { ILogger, LoggerOptions, LogLevel } from './types'
import { colorize, formatTimestamp, isLevelEnabled, LOG_LEVEL_SETTINGS } from './utils'

/**
 * Default logger options
 */
const DEFAULT_OPTIONS: LoggerOptions = {
    level: LogLevel.INFO,
    timestamps: true,
    timestampFormat: 'HH:mm:ss',
    colorize: true,
    icons: true,
    labels: {}
}

/**
 * A clean, easy-to-understand logging system
 */
export class Logger implements ILogger {
    private options: Required<LoggerOptions>
    private context: Record<string, string> = {}

    /**
     * Create a new logger instance
     * @param options Configuration options for the logger
     */
    constructor(options: LoggerOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options } as Required<LoggerOptions>
    }

    /**
     * Log an error message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    error(message: string, ...args: unknown[]): void {
        this.log(LogLevel.ERROR, message, ...args)
    }

    /**
     * Log a warning message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    warn(message: string, ...args: unknown[]): void {
        this.log(LogLevel.WARN, message, ...args)
    }

    /**
     * Log an info message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    info(message: string, ...args: unknown[]): void {
        this.log(LogLevel.INFO, message, ...args)
    }

    /**
     * Log an HTTP message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    http(message: string, ...args: unknown[]): void {
        this.log(LogLevel.HTTP, message, ...args)
    }

    /**
     * Log a debug message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    debug(message: string, ...args: unknown[]): void {
        this.log(LogLevel.DEBUG, message, ...args)
    }

    /**
     * Log a trace message
     * @param message The message to log
     * @param args Additional arguments to log
     */
    trace(message: string, ...args: unknown[]): void {
        this.log(LogLevel.TRACE, message, ...args)
    }

    /**
     * Create a child logger with additional context
     * @param context Additional context to include in logs
     * @returns A new logger instance with the merged context
     */
    child(context: Record<string, string>): ILogger {
        const childLogger = new Logger(this.options)
        childLogger.context = { ...this.context, ...context }
        return childLogger
    }

    /**
     * Internal method to log a message
     * @param level The log level
     * @param message The message to log
     * @param args Additional arguments to log
     */
    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        // Check if this level should be logged
        if (!isLevelEnabled(this.options.level, level)) {
            return
        }

        const levelSettings = LOG_LEVEL_SETTINGS[level]
        const parts: string[] = []

        // Add timestamp if enabled
        if (this.options.timestamps) {
            const timestamp = formatTimestamp(this.options.timestampFormat)
            parts.push(`[${timestamp}]`)
        }

        // Add the log level
        let levelStr = levelSettings.level.toUpperCase()

        // Add icon if enabled
        if (this.options.icons) {
            levelStr = `${levelSettings.icon} ${levelStr}`
        }

        // Add color if enabled
        if (this.options.colorize) {
            levelStr = colorize(levelStr, levelSettings.color)
        }

        parts.push(`[${levelStr}]`)

        // Add labels if any
        const labels = { ...this.options.labels, ...this.context }
        if (Object.keys(labels).length > 0) {
            const labelsStr = Object.entries(labels)
                .map(([key, value]) => `${key}=${value}`)
                .join(' ')
            parts.push(`[${labelsStr}]`)
        }

        // Add the message
        parts.push(message)

        // Format and print the log message
        console.log(parts.join(' '), ...args)
    }
}

/**
 * Create a default logger instance
 */
export const defaultLogger = new Logger()
