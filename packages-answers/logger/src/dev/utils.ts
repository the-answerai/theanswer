/**
 * Development logger utilities
 * @module dev/utils
 */

import { DevLogger } from './dev-logger'

/**
 * Create a default development logger instance
 */
export const devLogger = new DevLogger()

/**
 * Check and report on required environment variables
 * @param requiredVars Array of environment variable names to check
 * @returns True if all required variables are present
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
 * @param services Object with service names as keys and their status as boolean values
 */
export function logAppStartup(services: Record<string, boolean>): void {
    devLogger.section('Application Startup')

    for (const [service, status] of Object.entries(services)) {
        devLogger.checklistItem(service, status)
    }

    if (Object.values(services).every(Boolean)) {
        devLogger.appReady('All services are ready!')
    } else {
        devLogger.warn('⚠️ Some services failed to start')
    }
}
