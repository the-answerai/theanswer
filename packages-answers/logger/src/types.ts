/**
 * Available log levels
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    DEBUG = 'debug',
    TRACE = 'trace'
}

/**
 * Log level settings
 */
export interface LogLevelSetting {
    level: LogLevel
    color: string
    icon: string
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
    /**
     * Minimum log level to display
     * @default LogLevel.INFO
     */
    level?: LogLevel

    /**
     * Whether to show timestamps in logs
     * @default true
     */
    timestamps?: boolean

    /**
     * Format for timestamps
     * @default 'HH:mm:ss'
     */
    timestampFormat?: string

    /**
     * Additional labels to include in logs
     */
    labels?: Record<string, string>

    /**
     * Whether to colorize the output
     * @default true
     */
    colorize?: boolean

    /**
     * Whether to include icons in output
     * @default true
     */
    icons?: boolean
}

/**
 * The logger interface
 */
export interface ILogger {
    /**
     * Log an error message
     */
    error(message: string, ...args: any[]): void

    /**
     * Log a warning message
     */
    warn(message: string, ...args: any[]): void

    /**
     * Log an info message
     */
    info(message: string, ...args: any[]): void

    /**
     * Log an HTTP message
     */
    http(message: string, ...args: any[]): void

    /**
     * Log a debug message
     */
    debug(message: string, ...args: any[]): void

    /**
     * Log a trace message
     */
    trace(message: string, ...args: any[]): void

    /**
     * Create a child logger with additional context
     */
    child(context: Record<string, string>): ILogger
}
