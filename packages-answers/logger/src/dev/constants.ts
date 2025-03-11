/**
 * Development logger constants
 * @module dev/constants
 */

import { LogLevel } from '../types'
import { LOG_LEVEL_SETTINGS } from '../utils'

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
