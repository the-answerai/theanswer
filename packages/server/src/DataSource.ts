import 'reflect-metadata'
import path from 'path'
import * as fs from 'fs'
import { DataSource } from 'typeorm'
import { getUserHome } from './utils'
import { entities } from './database/entities'
import { sqliteMigrations } from './database/migrations/sqlite'
import { mysqlMigrations } from './database/migrations/mysql'
import { mariadbMigrations } from './database/migrations/mariadb'
import { postgresMigrations } from './database/migrations/postgres'
import logger from './utils/logger'

let appDataSource: DataSource

/**
 * 🔒 SECURITY CRITICAL: Test Database Prefix Enforcement
 * Prevents production DB access during testing by auto-prefixing when NODE_ENV=test.
 * DO NOT MODIFY without updating docs/TEST_DATABASE_SECURITY.md and unit tests.
 */
const ensureTestPrefix = (value: string | undefined, defaultName: string): string => {
    // Guard against empty/undefined - use default instead
    const effectiveValue = value?.trim() || defaultName

    // Check if already has test prefix (prefix or suffix)
    if (effectiveValue.startsWith('test_') || effectiveValue.endsWith('_test')) {
        return effectiveValue
    }

    // Auto-correct: add test_ prefix
    return `test_${effectiveValue}`
}

/**
 * Masks sensitive values in logs (passwords, tokens)
 * Shows first/last 2 chars with asterisks in between
 */
const maskSensitive = (value: string | undefined): string => {
    if (!value || value.length < 4) return '****'
    return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`
}

export const init = async (): Promise<void> => {
    // 🔒 SECURITY: Auto-prefix test database credentials (see ensureTestPrefix)
    if (process.env.NODE_ENV === 'test') {
        const originalDbName = process.env.DATABASE_NAME
        const originalDbUser = process.env.DATABASE_USER
        const originalDbPassword = process.env.DATABASE_PASSWORD

        // Apply test prefix with guards against empty values
        process.env.DATABASE_NAME = ensureTestPrefix(originalDbName, 'theanswer')
        process.env.DATABASE_USER = ensureTestPrefix(originalDbUser, 'user')

        // Log test mode activation with transformations
        logger.info('🔒 TEST MODE: Auto-prefixed database credentials')
        logger.info(`  DATABASE_NAME: ${originalDbName || '(empty)'} → ${process.env.DATABASE_NAME}`)
        logger.info(`  DATABASE_USER: ${originalDbUser || '(empty)'} → ${process.env.DATABASE_USER}`)
        logger.info(`  DATABASE_PASSWORD: ${maskSensitive(originalDbPassword)} (masked)`)
    }

    // Always log storage configuration at DataSource init (before logger tries to use S3)
    logger.info('DataSource initialization - Storage Configuration:')
    logger.info(`  STORAGE_TYPE: ${process.env.STORAGE_TYPE || 'not set (defaults to local)'}`)
    if (process.env.STORAGE_TYPE === 's3') {
        logger.info(`  S3_STORAGE_BUCKET_NAME: ${process.env.S3_STORAGE_BUCKET_NAME || 'NOT SET - CRITICAL!'}`)
        logger.info(`  S3_STORAGE_REGION: ${process.env.S3_STORAGE_REGION || 'not set (defaults to us-east-1)'}`)
    }
    let homePath
    let flowisePath = path.join(getUserHome(), '.flowise')
    if (!fs.existsSync(flowisePath)) {
        fs.mkdirSync(flowisePath)
    }
    switch (process.env.DATABASE_TYPE) {
        case 'sqlite':
            homePath = process.env.DATABASE_PATH ?? flowisePath
            appDataSource = new DataSource({
                type: 'sqlite',
                database: path.resolve(homePath, 'database.sqlite'),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: sqliteMigrations
            })
            break
        case 'mysql':
            appDataSource = new DataSource({
                type: 'mysql',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                charset: 'utf8mb4',
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: mysqlMigrations,
                ssl: getDatabaseSSLFromEnv()
            })
            break
        case 'mariadb':
            appDataSource = new DataSource({
                type: 'mariadb',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                charset: 'utf8mb4',
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: mariadbMigrations,
                ssl: getDatabaseSSLFromEnv()
            })
            break
        case 'postgres':
            appDataSource = new DataSource({
                type: 'postgres',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '5432'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                ssl: getDatabaseSSLFromEnv(),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: postgresMigrations
            })
            break
        default:
            homePath = process.env.DATABASE_PATH ?? flowisePath
            appDataSource = new DataSource({
                type: 'sqlite',
                database: path.resolve(homePath, 'database.sqlite'),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities),
                migrations: sqliteMigrations
            })
            break
    }
}

export function getDataSource(): DataSource {
    if (appDataSource === undefined) {
        init()
    }
    return appDataSource
}

const getDatabaseSSLFromEnv = () => {
    if (process.env.DATABASE_SSL_KEY_BASE64) {
        return {
            rejectUnauthorized: false,
            ca: Buffer.from(process.env.DATABASE_SSL_KEY_BASE64, 'base64')
        }
    } else if (process.env.DATABASE_SSL === 'true') {
        return true
    }
    return undefined
}
