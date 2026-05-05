/**
 * Single source of truth for ENABLE_CSV_RUN_CRON (Flowise server process env).
 * Used by cron registration and the csv-parser worker-status API.
 */
export function isCsvRunCronEnabled(): boolean {
    return process.env.ENABLE_CSV_RUN_CRON === 'true'
}
