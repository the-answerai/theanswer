/**
 * Redis Cache for Guardrails Results
 *
 * Caches Fiddler API responses to improve performance and reduce API costs
 * Uses SHA256 hash of input as cache key
 */

import Redis from 'ioredis'
import { createHash } from 'crypto'

export class GuardrailsCache {
    private client: Redis | null = null
    private ttl: number

    constructor(ttl: number = 3600) {
        this.ttl = ttl

        // Initialize Redis client if REDIS_URL is available
        if (process.env.REDIS_URL) {
            try {
                this.client = new Redis(process.env.REDIS_URL, {
                    keepAlive:
                        process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                            ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                            : undefined,
                    // Fail gracefully if Redis is unavailable
                    lazyConnect: true,
                    maxRetriesPerRequest: 3,
                    enableOfflineQueue: false
                })

                // Handle connection errors gracefully
                this.client.on('error', (error) => {
                    console.error('Guardrails Redis cache error:', error)
                    // Don't crash - just disable caching
                    this.client = null
                })

                // Attempt to connect
                this.client.connect().catch((error) => {
                    console.error('Failed to connect to Redis for guardrails cache:', error)
                    this.client = null
                })
            } catch (error) {
                console.error('Failed to initialize Redis client for guardrails cache:', error)
                this.client = null
            }
        } else if (process.env.REDIS_HOST) {
            try {
                this.client = new Redis({
                    host: process.env.REDIS_HOST,
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    username: process.env.REDIS_USERNAME || undefined,
                    password: process.env.REDIS_PASSWORD || undefined,
                    lazyConnect: true,
                    maxRetriesPerRequest: 3,
                    enableOfflineQueue: false
                })

                this.client.on('error', (error) => {
                    console.error('Guardrails Redis cache error:', error)
                    this.client = null
                })

                this.client.connect().catch((error) => {
                    console.error('Failed to connect to Redis for guardrails cache:', error)
                    this.client = null
                })
            } catch (error) {
                console.error('Failed to initialize Redis client for guardrails cache:', error)
                this.client = null
            }
        }
    }

    /**
     * Generate cache key from input
     */
    private generateKey(prefix: string, input: string): string {
        const hash = createHash('sha256').update(input).digest('hex')
        return `guardrails:${prefix}:${hash}`
    }

    /**
     * Get cached result
     */
    public async get<T>(prefix: string, input: string): Promise<T | null> {
        if (!this.client) {
            return null
        }

        try {
            const key = this.generateKey(prefix, input)
            const cached = await this.client.get(key)

            if (cached) {
                return JSON.parse(cached) as T
            }

            return null
        } catch (error) {
            console.error('Error getting from guardrails cache:', error)
            return null
        }
    }

    /**
     * Set cached result
     */
    public async set<T>(prefix: string, input: string, result: T): Promise<void> {
        if (!this.client) {
            return
        }

        try {
            const key = this.generateKey(prefix, input)
            const serialized = JSON.stringify(result)

            await this.client.setex(key, this.ttl, serialized)
        } catch (error) {
            console.error('Error setting guardrails cache:', error)
            // Fail silently - caching is optional
        }
    }

    /**
     * Clear all guardrails cache
     */
    public async clear(): Promise<void> {
        if (!this.client) {
            return
        }

        try {
            const keys = await this.client.keys('guardrails:*')
            if (keys.length > 0) {
                await this.client.del(...keys)
            }
        } catch (error) {
            console.error('Error clearing guardrails cache:', error)
        }
    }

    /**
     * Clear specific prefix cache
     */
    public async clearPrefix(prefix: string): Promise<void> {
        if (!this.client) {
            return
        }

        try {
            const pattern = `guardrails:${prefix}:*`
            const keys = await this.client.keys(pattern)
            if (keys.length > 0) {
                await this.client.del(...keys)
            }
        } catch (error) {
            console.error(`Error clearing guardrails cache prefix ${prefix}:`, error)
        }
    }

    /**
     * Check if cache is available
     */
    public isAvailable(): boolean {
        return this.client !== null && this.client.status === 'ready'
    }

    /**
     * Close Redis connection
     */
    public async close(): Promise<void> {
        if (this.client) {
            await this.client.quit()
            this.client = null
        }
    }
}

/**
 * Singleton instance for global use
 */
let cacheInstance: GuardrailsCache | null = null

/**
 * Get or create cache instance
 */
export function getGuardrailsCache(ttl?: number): GuardrailsCache {
    if (!cacheInstance) {
        cacheInstance = new GuardrailsCache(ttl)
    }
    return cacheInstance
}
