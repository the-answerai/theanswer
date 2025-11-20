/**
 * @deprecated This file is kept for reference only.
 *
 * The primary theme migration now happens via inline scripts in:
 * - apps/web/app/ThemeScript.tsx (for Next.js SSR)
 * - packages/ui/src/App.jsx (for Flowise standalone)
 * - packages/ui/src/AppLayout.jsx (for Flowise embedded)
 *
 * This file's initializeThemeStorage() is still called by the Flowise
 * entry points as a backup migration path, but the SSR migration in
 * ThemeScript.tsx should handle most cases.
 *
 * Migration logic:
 * - Checks localStorage for legacy 'isDarkMode' key ('true'/'false')
 * - Converts to new MUI format: 'mui-mode' and 'mui-color-scheme' ('dark'/'light')
 * - Removes legacy key after successful migration
 *
 * Note: 'isDarkMode' is only referenced here for backward compatibility during migration.
 * New code should use 'mode' variable naming as documented in MIGRATION.md
 *
 * @see apps/web/app/ThemeScript.tsx for primary SSR migration
 * @see packages/ui/src/themes/MIGRATION.md for complete migration guide
 */

export const NEW_STORAGE_KEY = 'mui-mode' // New standardized key
const OLD_STORAGE_KEY = 'isDarkMode' // Legacy key

type ValidMode = 'light' | 'dark' | 'system'

// Development-only logger to prevent console pollution in production
const isDev = process.env.NODE_ENV === 'development'

const logger = {
    log: (...args: any[]) => {
        if (isDev) console.log(...args)
    },
    warn: (...args: any[]) => {
        if (isDev) console.warn(...args)
    },
    error: (...args: any[]) => {
        // Always log errors, even in production
        console.error(...args)
    }
}

/**
 * Validates if a value is a valid MUI color scheme mode
 */
function isValidMode(value: string | null): value is ValidMode {
    return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Migrates old theme storage format to new format
 * Call this before initializing the theme provider
 */
export function migrateThemeStorage(): void {
    if (typeof window === 'undefined') return

    try {
        const oldValue = localStorage.getItem(OLD_STORAGE_KEY)
        const newValue = localStorage.getItem(NEW_STORAGE_KEY)

        // If new storage already has a valid value, clean up old and return
        if (newValue && isValidMode(newValue)) {
            if (oldValue !== null) {
                localStorage.removeItem(OLD_STORAGE_KEY)
                logger.log('[Theme Migration] Cleaned up old storage key')
            }
            return
        }

        // Migrate old value if it exists
        if (oldValue !== null) {
            let migratedMode: ValidMode

            // Handle boolean format (old system: true = dark, false = light)
            if (oldValue === 'true') {
                migratedMode = 'dark'
            } else if (oldValue === 'false') {
                migratedMode = 'light'
            }
            // Handle string format but wrong value
            else if (isValidMode(oldValue)) {
                migratedMode = oldValue
            }
            // Invalid value, default to dark
            else {
                logger.warn('[Theme Migration] Invalid old value, defaulting to dark mode')
                migratedMode = 'dark'
            }

            // Set new value and remove old
            localStorage.setItem(NEW_STORAGE_KEY, migratedMode)
            localStorage.removeItem(OLD_STORAGE_KEY)

            logger.log(`[Theme Migration] Migrated "${oldValue}" → "${migratedMode}"`)
        }
    } catch (error) {
        logger.error('[Theme Migration] Failed to migrate storage:', error)
    }
}

/**
 * Validates and cleans theme storage on every load
 * Ensures only valid mode values are stored
 */
export function validateThemeStorage(): void {
    if (typeof window === 'undefined') return

    try {
        const storedMode = localStorage.getItem(NEW_STORAGE_KEY)

        // If no value, nothing to validate
        if (storedMode === null) return

        // If invalid value, remove it (will fall back to default)
        if (!isValidMode(storedMode)) {
            logger.warn(`[Theme Validation] Invalid mode "${storedMode}", removing`)
            localStorage.removeItem(NEW_STORAGE_KEY)
        }
    } catch (error) {
        logger.error('[Theme Validation] Failed to validate storage:', error)
    }
}

/**
 * Complete migration and validation flow
 * Call this once on app initialization
 */
export function initializeThemeStorage(): void {
    migrateThemeStorage()
    validateThemeStorage()
}

/**
 * Clear all theme storage (useful for debugging)
 */
export function clearThemeStorage(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(OLD_STORAGE_KEY)
        localStorage.removeItem(NEW_STORAGE_KEY)
        logger.log('[Theme Storage] Cleared all theme keys')
    } catch (error) {
        logger.error('[Theme Storage] Failed to clear storage:', error)
    }
}
