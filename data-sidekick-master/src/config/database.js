/**
 * Database table configuration
 * This file contains all the table names used in the application
 */

const DATABASE_TABLES = {
    // Main table for storing call logs
    CALLS: 'call_log',

    // Table for storing call tags and their metadata
    TAGS: 'tags',

    // Table for storing reports
    REPORTS: 'reports'
}

const DATABASE_COLUMNS = {
    CALLS: {
        ID: 'id',
        RECORDING_URL: 'RECORDING_URL',
        CALL_DURATION: 'CALL_DURATION',
        ANSWERED_BY: 'ANSWERED_BY',
        EMPLOYEE_ID: 'EMPLOYEE_ID',
        EMPLOYEE_NAME: 'EMPLOYEE_NAME',
        CALL_NUMBER: 'CALL_NUMBER',
        CALLER_NAME: 'CALLER_NAME',
        FILENAME: 'FILENAME',
        TRANSCRIPTION: 'TRANSCRIPTION',
        WORD_TIMESTAMPS: 'WORD_TIMESTAMPS',
        TAGS: 'TAGS',
        CALL_TYPE: 'CALL_TYPE',
        TAGS_ARRAY: 'TAGS_ARRAY',
        SENTIMENT_SCORE: 'sentiment_score',
        RESOLUTION_STATUS: 'resolution_status',
        ESCALATED: 'escalated',
        SUMMARY: 'summary',
        COACHING: 'coaching'
    },
    REPORTS: {
        ID: 'id',
        NAME: 'name',
        CONTENT: 'content',
        RECORDING_IDS: 'recording_ids',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at'
    }
}

export { DATABASE_TABLES, DATABASE_COLUMNS }
export default DATABASE_TABLES
