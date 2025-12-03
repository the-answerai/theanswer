import { defaultChain, INodeData } from '../../../src'
import { DataSource } from 'typeorm'

export function getHost(nodeData?: INodeData) {
    return defaultChain(nodeData?.inputs?.host, process.env.AAI_DEFAULT_POSTGRES_RECORDMANAGER_HOST)
}

export function getDatabase(nodeData?: INodeData) {
    return defaultChain(nodeData?.inputs?.database, process.env.AAI_DEFAULT_POSTGRES_RECORDMANAGER_DATABASE)
}

export function getPort(nodeData?: INodeData) {
    return defaultChain(nodeData?.inputs?.port, process.env.AAI_DEFAULT_POSTGRES_RECORDMANAGER_PORT, '5432')
}

export function getTableName(nodeData?: INodeData) {
    return defaultChain(nodeData?.inputs?.tableName, process.env.AAI_DEFAULT_POSTGRES_RECORDMANAGER_TABLE_NAME, 'upsertion_records')
}

/**
 * Singleton connection manager to share DataSource instances across RecordManager instances
 * with the same configuration. This prevents creating multiple connection pools for the same database.
 */
export class PostgresConnectionManager {
    private static instances = new Map<string, DataSource>()
    private static initializationPromises = new Map<string, Promise<DataSource>>()

    /**
     * Generate a unique key for a database configuration
     */
    private static generateKey(config: any): string {
        const host = config.host || 'localhost'
        const port = config.port || 5432
        const database = config.database || 'postgres'
        const username = config.username || 'postgres'
        return `${host}:${port}:${database}:${username}`
    }

    /**
     * Get or create a DataSource for the given configuration.
     * Handles concurrent calls by ensuring only one initialization per config.
     */
    static async getDataSource(config: any): Promise<DataSource> {
        const key = this.generateKey(config)

        // If already initialized, check health
        const existing = this.instances.get(key)
        if (existing?.isInitialized) {
            try {
                // Health check with timeout
                const queryRunner = existing.createQueryRunner()
                const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
                await Promise.race([queryRunner.query('SELECT 1'), timeoutPromise])
                await queryRunner.release()
                return existing
            } catch (error) {
                // Connection unhealthy, remove and reconnect
                console.warn(`PostgresConnectionManager - Health check failed for ${key}:`, error)
                this.instances.delete(key)
                try {
                    await existing.destroy()
                } catch (destroyError) {
                    // Ignore destroy errors
                }
            }
        }

        // If initialization is in progress, wait for it
        const pendingInit = this.initializationPromises.get(key)
        if (pendingInit) {
            return pendingInit
        }

        // Create new initialization promise
        const initPromise = (async () => {
            try {
                // Enhanced connection config with pool settings
                const enhancedConfig = {
                    ...config,
                    extra: {
                        ...config.extra,
                        max: config.extra?.max || 20, // Increase pool size from default 10
                        min: config.extra?.min || 2, // Maintain minimum connections
                        idleTimeoutMillis: config.extra?.idleTimeoutMillis || 30000, // Close idle connections after 30s
                        connectionTimeoutMillis: config.extra?.connectionTimeoutMillis || 10000, // Timeout for acquiring connections
                        statement_timeout: config.extra?.statement_timeout || 30000 // Query timeout
                    }
                }

                const dataSource = new DataSource(enhancedConfig)
                await dataSource.initialize()
                this.instances.set(key, dataSource)
                return dataSource
            } finally {
                this.initializationPromises.delete(key)
            }
        })()

        this.initializationPromises.set(key, initPromise)
        return initPromise
    }

    /**
     * Destroy a specific DataSource by configuration
     */
    static async destroy(config: any): Promise<void> {
        const key = this.generateKey(config)

        // Wait for any pending initialization
        const pendingInit = this.initializationPromises.get(key)
        if (pendingInit) {
            await pendingInit
        }

        const dataSource = this.instances.get(key)
        if (dataSource?.isInitialized) {
            await dataSource.destroy()
            this.instances.delete(key)
        }
    }

    /**
     * Destroy all cached DataSource instances
     */
    static async destroyAll(): Promise<void> {
        // Wait for all pending initializations
        await Promise.all(Array.from(this.initializationPromises.values()))

        // Destroy all instances
        const destroyPromises = Array.from(this.instances.values()).map(async (ds) => {
            if (ds.isInitialized) {
                await ds.destroy()
            }
        })

        await Promise.all(destroyPromises)
        this.instances.clear()
    }
}
