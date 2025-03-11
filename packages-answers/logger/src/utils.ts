import chalk from 'chalk'
import { LogLevel, LogLevelSetting } from './types'

/**
 * Log level settings with colors and icons
 */
export const LOG_LEVEL_SETTINGS: Record<LogLevel, LogLevelSetting> = {
    [LogLevel.ERROR]: {
        level: LogLevel.ERROR,
        color: 'red',
        icon: '✖'
    },
    [LogLevel.WARN]: {
        level: LogLevel.WARN,
        color: 'yellow',
        icon: '⚠'
    },
    [LogLevel.INFO]: {
        level: LogLevel.INFO,
        color: 'blue',
        icon: 'ℹ'
    },
    [LogLevel.HTTP]: {
        level: LogLevel.HTTP,
        color: 'magenta',
        icon: '↔'
    },
    [LogLevel.DEBUG]: {
        level: LogLevel.DEBUG,
        color: 'cyan',
        icon: '●'
    },
    [LogLevel.TRACE]: {
        level: LogLevel.TRACE,
        color: 'gray',
        icon: '◎'
    }
}

/**
 * Log level priorities (lower number = higher priority)
 */
export const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.HTTP]: 3,
    [LogLevel.DEBUG]: 4,
    [LogLevel.TRACE]: 5
}

/**
 * Check if a log level is enabled
 * @param currentLevel The current log level
 * @param targetLevel The target log level to check
 * @returns Whether the target level should be logged
 */
export function isLevelEnabled(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
    return LOG_LEVEL_PRIORITIES[targetLevel] <= LOG_LEVEL_PRIORITIES[currentLevel]
}

/**
 * Format a timestamp according to the given format
 * @param format The format string
 * @returns The formatted timestamp
 */
export function formatTimestamp(format = 'HH:mm:ss'): string {
    const now = new Date()

    // Replace format tokens with actual values
    return format
        .replace('YYYY', now.getFullYear().toString())
        .replace('MM', (now.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', now.getDate().toString().padStart(2, '0'))
        .replace('HH', now.getHours().toString().padStart(2, '0'))
        .replace('mm', now.getMinutes().toString().padStart(2, '0'))
        .replace('ss', now.getSeconds().toString().padStart(2, '0'))
        .replace('SSS', now.getMilliseconds().toString().padStart(3, '0'))
}

/**
 * Color text using chalk
 * @param text The text to color
 * @param color The color name
 * @returns The colored text
 */
export function colorize(text: string, color: string): string {
    if (color in chalk) {
        return (chalk as any)[color](text)
    }
    return text
}
