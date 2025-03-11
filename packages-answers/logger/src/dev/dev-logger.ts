/**
 * Development logger implementation
 * @module dev/dev-logger
 */

import { Logger } from '../core/base-logger'
import { LogLevel } from '../types'
import { DEV_EVENTS } from './constants'
import type { DevLoggerOptions } from './types'

/**
 * A development-focused logger with enhanced visuals and filtering
 * Extends the base Logger with additional development-friendly features
 */
export class DevLogger extends Logger {
    private excludePatterns: RegExp[]
    private showProgress: boolean

    /**
     * Create a new development logger
     * @param options Configuration options for the development logger
     */
    constructor(options: DevLoggerOptions = {}) {
        super({
            ...options,
            icons: true,
            colorize: true,
            timestamps: true
        })

        this.excludePatterns = options.excludePatterns || [
            /webpack\.cache/i,
            /HMR/i,
            /\[webpack\.runtime\]/i,
            /\[HMR\]/i,
            /\[webpack\.hot\]/i
        ]

        this.showProgress = options.showProgress !== undefined ? options.showProgress : true
    }

    /**
     * Log a startup message
     * @param message The startup message to log
     */
    appStart(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.APP_START} STARTING: ${message}`)
    }

    /**
     * Log an app ready message
     * @param message The ready message to log
     */
    appReady(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.APP_READY} READY: ${message}`)
    }

    /**
     * Log a database connection message
     * @param message The database connection message to log
     */
    dbConnected(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.DB_CONNECTED} DATABASE: ${message}`)
    }

    /**
     * Log an API ready message
     * @param message The API ready message to log
     */
    apiReady(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.API_READY} API: ${message}`)
    }

    /**
     * Log an environment check message
     * @param variable The environment variable name
     * @param status The status of the environment variable check
     */
    envCheck(variable: string, status: 'ok' | 'missing' | 'invalid'): void {
        const statusEmoji = status === 'ok' ? '✅' : status === 'missing' ? '❌' : '⚠️'
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.ENV_CHECK} ENV: ${variable} ${statusEmoji}`)
    }

    /**
     * Check if a message should be filtered out
     * @param message The message to check
     * @returns True if the message should be filtered out
     */
    private shouldFilter(message: string): boolean {
        return this.excludePatterns.some((pattern) => pattern.test(message))
    }

    /**
     * Override the info, error, etc. methods to call our custom logging
     * @param message The message to log
     * @param args Additional arguments to log
     */
    override info(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.INFO, message, ...args)
    }

    /**
     * Log an error message with development enhancements
     * @param message The message to log
     * @param args Additional arguments to log
     */
    override error(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.ERROR, message, ...args)
    }

    /**
     * Log a warning message with development enhancements
     * @param message The message to log
     * @param args Additional arguments to log
     */
    override warn(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.WARN, message, ...args)
    }

    /**
     * Log a debug message with development enhancements
     * @param message The message to log
     * @param args Additional arguments to log
     */
    override debug(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.DEBUG, message, ...args)
    }

    /**
     * Log a trace message with development enhancements
     * @param message The message to log
     * @param args Additional arguments to log
     */
    override trace(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.TRACE, message, ...args)
    }

    /**
     * Log an HTTP message with development enhancements
     * @param message The message to log
     * @param args Additional arguments to log
     */
    override http(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.HTTP, message, ...args)
    }

    /**
     * Custom log method that adds filtering and enhanced formatting
     * @param level The log level
     * @param message The message to log
     * @param args Additional arguments to log
     */
    private doDevLog(level: LogLevel, message: string, ...args: unknown[]): void {
        // Skip filtered messages
        if (this.shouldFilter(message)) {
            return
        }

        // Call the parent class log methods
        if (level === LogLevel.ERROR) super.error(message, ...args)
        else if (level === LogLevel.WARN) super.warn(message, ...args)
        else if (level === LogLevel.INFO) super.info(message, ...args)
        else if (level === LogLevel.HTTP) super.http(message, ...args)
        else if (level === LogLevel.DEBUG) super.debug(message, ...args)
        else if (level === LogLevel.TRACE) super.trace(message, ...args)
    }

    /**
     * Log a checklist item
     * @param name The name of the checklist item
     * @param status The status of the checklist item
     * @param details Optional details about the checklist item
     */
    checklistItem(name: string, status: boolean, details?: string): void {
        const emoji = status ? '✅' : '❌'
        const message = `${emoji} ${name}${details ? `: ${details}` : ''}`
        this.doDevLog(LogLevel.INFO, message)
    }

    /**
     * Log a section header to visually separate logical sections
     * @param title The title of the section
     */
    section(title: string): void {
        this.doDevLog(LogLevel.INFO, `\n${'='.repeat(20)}\n🔷 ${title}\n${'='.repeat(20)}`)
    }
}
