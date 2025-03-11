import { Logger } from './logger'
import { LogLevel, type LoggerOptions } from './types'
import { LOG_LEVEL_SETTINGS } from './utils'

/**
 * Enhanced log level settings with more visual emojis for development
 */
export const DEV_LOG_LEVEL_SETTINGS = {
    [LogLevel.ERROR]: {
        ...LOG_LEVEL_SETTINGS[LogLevel.ERROR],
        icon: '🔴',
        label: 'ERROR'
    },
    [LogLevel.WARN]: {
        ...LOG_LEVEL_SETTINGS[LogLevel.WARN],
        icon: '🟠',
        label: 'WARN'
    },
    [LogLevel.INFO]: {
        ...LOG_LEVEL_SETTINGS[LogLevel.INFO],
        icon: '🔵',
        label: 'INFO'
    },
    [LogLevel.HTTP]: {
        ...LOG_LEVEL_SETTINGS[LogLevel.HTTP],
        icon: '🌐',
        label: 'HTTP'
    },
    [LogLevel.DEBUG]: {
        ...LOG_LEVEL_SETTINGS[LogLevel.DEBUG],
        icon: '🪲',
        label: 'DEBUG'
    },
    [LogLevel.TRACE]: {
        ...LOG_LEVEL_SETTINGS[LogLevel.TRACE],
        icon: '🔍',
        label: 'TRACE'
    }
}

/**
 * Special event emojis for development logging
 */
export const DEV_EVENTS = {
    APP_START: '🚀',
    APP_READY: '✅',
    DB_CONNECTED: '🗃️',
    API_READY: '🌐',
    ENV_CHECK: '🔐',
    BUILD: '🏗️',
    WEBPACK: '📦',
    PRISMA: '💾',
    WARNING: '⚠️',
    ERROR: '❌',
    SUCCESS: '✅',
    CONFIG: '⚙️',
    USER: '👤',
    SECURITY: '🔒'
}

/**
 * Development logger options
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

/**
 * A development-focused logger with enhanced visuals and filtering
 */
export class DevLogger extends Logger {
    private excludePatterns: RegExp[]
    private showProgress: boolean

    /**
     * Create a new development logger
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
     */
    appStart(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.APP_START} STARTING: ${message}`)
    }

    /**
     * Log an app ready message
     */
    appReady(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.APP_READY} READY: ${message}`)
    }

    /**
     * Log a database connection message
     */
    dbConnected(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.DB_CONNECTED} DATABASE: ${message}`)
    }

    /**
     * Log an API ready message
     */
    apiReady(message: string): void {
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.API_READY} API: ${message}`)
    }

    /**
     * Log an environment check message
     */
    envCheck(variable: string, status: 'ok' | 'missing' | 'invalid'): void {
        const statusEmoji = status === 'ok' ? '✅' : status === 'missing' ? '❌' : '⚠️'
        this.doDevLog(LogLevel.INFO, `${DEV_EVENTS.ENV_CHECK} ENV: ${variable} ${statusEmoji}`)
    }

    /**
     * Check if a message should be filtered out
     */
    private shouldFilter(message: string): boolean {
        return this.excludePatterns.some((pattern) => pattern.test(message))
    }

    /**
     * Override the info, error, etc. methods to call our custom logging
     */
    override info(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.INFO, message, ...args)
    }

    override error(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.ERROR, message, ...args)
    }

    override warn(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.WARN, message, ...args)
    }

    override debug(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.DEBUG, message, ...args)
    }

    override trace(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.TRACE, message, ...args)
    }

    override http(message: string, ...args: unknown[]): void {
        this.doDevLog(LogLevel.HTTP, message, ...args)
    }

    /**
     * Custom log method that adds filtering and enhanced formatting
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
     */
    checklistItem(name: string, status: boolean, details?: string): void {
        const emoji = status ? '✅' : '❌'
        const message = `${emoji} ${name}${details ? `: ${details}` : ''}`
        this.doDevLog(LogLevel.INFO, message)
    }

    /**
     * Log a section header
     */
    section(title: string): void {
        this.doDevLog(LogLevel.INFO, `\n${'='.repeat(20)}\n🔷 ${title}\n${'='.repeat(20)}`)
    }
}

/**
 * Create a default development logger instance
 */
export const devLogger = new DevLogger()

/**
 * Check and report on required environment variables
 */
export function checkEnvironmentVariables(requiredVars: string[]): boolean {
    let allValid = true

    devLogger.section('Environment Variables Check')

    for (const envVar of requiredVars) {
        const value = process.env[envVar]
        if (!value) {
            devLogger.envCheck(envVar, 'missing')
            allValid = false
        } else {
            devLogger.envCheck(envVar, 'ok')
        }
    }

    return allValid
}

/**
 * Log application startup with service status checklist
 */
export function logAppStartup(services: Record<string, boolean>): void {
    devLogger.section('Application Startup')

    for (const [service, status] of Object.entries(services)) {
        devLogger.checklistItem(service, status)
    }

    if (Object.values(services).every(Boolean)) {
        devLogger.appReady('All services are ready!')
    } else {
        devLogger.warn(`${DEV_EVENTS.WARNING} Some services failed to start`)
    }
}
