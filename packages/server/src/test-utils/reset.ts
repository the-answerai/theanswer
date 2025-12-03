// Database reset helper used by e2e seeds. Supports multiple SQL backends and centralizes the
// logic for truncating tables across Postgres/MySQL/SQLite.
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import logger from '../utils/logger'
import { ensureDataSource } from './dataSource'
import { SupportedDataSource } from './types'

const IGNORED_TABLES = new Set(['migrations', 'typeorm_metadata'])

const fetchTableNames = async (ds: SupportedDataSource): Promise<string[]> => {
    const dbType = String(ds.options.type)

    if (dbType === 'postgres') {
        const rows = await ds.query(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (${[...IGNORED_TABLES]
                .map((table) => `'${table}'`)
                .join(', ')})`
        )
        return rows.map((row: { tablename: string }) => row.tablename)
    }

    if (dbType === 'mysql' || dbType === 'mariadb') {
        const rows = await ds.query(`SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = DATABASE()`)
        return rows.map((row: { tableName: string }) => row.tableName).filter((tableName: string) => !IGNORED_TABLES.has(tableName))
    }

    if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
        const rows = await ds.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
        return rows.map((row: { name: string }) => row.name).filter((tableName: string) => !IGNORED_TABLES.has(tableName))
    }

    throw new InternalFlowiseError(StatusCodes.NOT_IMPLEMENTED, `Error: test-utils.fetchTableNames - Unsupported database type: ${dbType}`)
}

export const resetDatabase = async (providedDataSource?: SupportedDataSource): Promise<void> => {
    logger.info('[test-utils] 🔄 Starting database reset...')
    const ds = ensureDataSource(providedDataSource)
    const dbType = String(ds.options.type)

    const tables = await fetchTableNames(ds)
    if (!tables.length) {
        logger.info('[test-utils] ✅ Database reset complete (no tables found)')
        return
    }

    logger.info(`[test-utils] 📋 Resetting ${tables.length} tables (${dbType})`)

    if (dbType === 'postgres') {
        const identifiers = tables.map((table) => `"public"."${table}"`).join(', ')
        await ds.query(`TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`)
        logger.info('[test-utils] ✅ Database reset complete (PostgreSQL)')
        return
    }

    if (dbType === 'mysql' || dbType === 'mariadb') {
        await ds.query('SET FOREIGN_KEY_CHECKS = 0')
        for (const table of tables) {
            await ds.query(`TRUNCATE TABLE \`${table}\``)
        }
        await ds.query('SET FOREIGN_KEY_CHECKS = 1')
        logger.info('[test-utils] ✅ Database reset complete (MySQL/MariaDB)')
        return
    }

    if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
        for (const table of tables) {
            await ds.query(`DELETE FROM ${table}`)
        }
        const quotedTables = tables.map((table) => `'${table}'`).join(', ')
        if (quotedTables.length) {
            await ds.query(`DELETE FROM sqlite_sequence WHERE name IN (${quotedTables})`)
        }
        logger.info('[test-utils] ✅ Database reset complete (SQLite)')
        return
    }

    throw new InternalFlowiseError(StatusCodes.NOT_IMPLEMENTED, `Error: test-utils.resetDatabase - Unsupported database type: ${dbType}`)
}
