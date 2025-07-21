import { RedisStore } from 'connect-redis'
import Redis from 'ioredis'
import logger from './utils/logger'

export const appConfig = {
    apiKeys: {
        storageType: process.env.APIKEY_STORAGE_TYPE ? process.env.APIKEY_STORAGE_TYPE.toLowerCase() : 'json'
    },
    showCommunityNodes: process.env.SHOW_COMMUNITY_NODES ? process.env.SHOW_COMMUNITY_NODES.toLowerCase() === 'true' : false
    // todo: add more config options here like database, log, storage, credential and allow modification from UI
}

// Create a centralized Redis configuration function
export function createRedisClient() {
    if (process.env.REDIS_URL) {
        return new Redis(process.env.REDIS_URL)
    }

    return new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        tls:
            process.env.REDIS_TLS === 'true'
                ? {
                      cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                      key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                      ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
                  }
                : undefined
    })
}

export const createRedisStore = () => {
    logger.info('🔍 [server]: Creating Redis Store')
    logger.info('🔍 [server]: REDIS_URL:', process.env.REDIS_URL ? 'Set' : 'Not set')
    
    if (!process.env.REDIS_URL) {
        logger.error('❌ [server]: REDIS_URL is not set')
        throw new Error('REDIS_URL is not set')
    }
    
    logger.info('🔍 [server]: Attempting to create Redis client with URL:', process.env.REDIS_URL)
    
    const redisClient = createRedisClient()
    
    // Enhanced error handling
    redisClient.on('error', (err) => {
        logger.error('❌ [server]: Redis Client Error:', err)
    })
    
    redisClient.on('connect', () => logger.info('✅ [server]: Redis Client Connected'))
    redisClient.on('ready', () => logger.info('✅ [server]: Redis Client Ready'))
    redisClient.on('close', () => logger.warn('⚠️ [server]: Redis Client Connection Closed'))
    redisClient.on('reconnecting', () => logger.info('🔄 [server]: Redis Client Reconnecting'))

    logger.info('🔍 [server]: Creating RedisStore with prefix:', process.env.REDIS_SESSION_PREFIX || 'theanswer:')

    return new RedisStore({
        client: redisClient,
        prefix: process.env.REDIS_SESSION_PREFIX || 'theanswer:'
    })
}
