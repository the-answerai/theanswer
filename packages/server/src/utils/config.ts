// BEWARE: This file is an intereem solution until we have a proper config strategy

import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs'

// Load main .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), override: true })

// Load .env.test file if it exists (for E2E testing)
const testEnvPath = path.join(__dirname, '..', '..', '..', '..', 'apps', 'web', '.env.test')
if (fs.existsSync(testEnvPath)) {
    console.log('[config] Loading test environment from apps/web/.env.test')
    dotenv.config({ path: testEnvPath, override: true })
}

// default config
const loggingConfig = {
    dir: process.env.LOG_PATH ?? path.join(__dirname, '..', '..', 'logs'),
    server: {
        level: process.env.LOG_LEVEL ?? 'info',
        filename: 'server.log',
        errorFilename: 'server-error.log'
    },
    express: {
        level: process.env.LOG_LEVEL ?? 'info',
        format: 'jsonl', // can't be changed currently
        filename: 'server-requests.log.jsonl' // should end with .jsonl
    }
}

export default {
    logging: loggingConfig
}
