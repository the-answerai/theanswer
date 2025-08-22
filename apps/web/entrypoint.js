#!/usr/bin/env node

const { spawn } = require('child_process')

// Utility function to run commands with proper error handling
function runCommand(command, args = [], cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command} ${args.join(' ')} ${cwd !== process.cwd() ? `(in ${cwd})` : ''}`)

        const child = spawn(command, args, {
            cwd,
            stdio: 'inherit',
            env: process.env
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`))
            }
        })

        child.on('error', (error) => {
            reject(new Error(`Failed to start command: ${error.message}`))
        })
    })
}

async function main() {
    console.log('Starting web application entrypoint...')

    // Parse DATABASE_SECRET if it exists
    if (process.env.DATABASE_SECRET) {
        console.log('Parsing DATABASE_SECRET...')

        try {
            const secret = JSON.parse(process.env.DATABASE_SECRET)

            // Set individual database environment variables
            process.env.DATABASE_HOST = secret.host
            process.env.DATABASE_PORT = secret.port.toString()
            process.env.DATABASE_NAME = secret.dbname
            process.env.DATABASE_USER = secret.username
            process.env.DATABASE_PASSWORD = secret.password
            process.env.DATABASE_TYPE = secret.engine

            // Construct DATABASE_URL for Prisma
            process.env.DATABASE_URL = `postgresql://${secret.username}:${secret.password}@${secret.host}:${secret.port}/${secret.dbname}?schema=public&connection_limit=1`

            console.log('Database environment variables set successfully')
            console.log('DATABASE_URL successfully created and configured')
        } catch (error) {
            console.error('Error parsing DATABASE_SECRET:', error.message)
            process.exit(1)
        }
    } else {
        console.log('No DATABASE_SECRET found, skipping database configuration')
    }

    // Verify DATABASE_URL is set before proceeding
    if (process.env.DATABASE_URL) {
        console.log('DATABASE_URL is properly set for Next.js')
        // Verify it's a PostgreSQL URL without exposing credentials
        if (process.env.DATABASE_URL.startsWith('postgresql://')) {
            console.log('DATABASE_URL format: PostgreSQL connection string (credentials secured)')
        } else {
            console.log('WARNING: DATABASE_URL format may be incorrect')
        }
    } else {
        console.error('ERROR: DATABASE_URL is not set!')
        process.exit(1)
    }

    // Run database migration (deploy existing migrations for production)
    console.log('Running database migration...')
    console.log('ROBUST MIGRATION STRATEGY: Try proper migrations first, fallback to schema sync')
    console.log('This handles all deployment scenarios:')
    console.log('- Fresh DB: migrate deploy works (creates tables + tracking)')
    console.log('- Flowise-only DB: migrate deploy fails P3005 → db push creates Prisma tables')
    console.log('- Existing deployment: migrate deploy applies new migrations')
    console.log('- Corrupted state: migrate deploy fails → db push fixes schema')

    console.log('Attempting Prisma migration deployment...')

    try {
        // Try migrate deploy first (pin to specific Prisma version for compatibility)
        await runCommand('npx', ['--yes', 'prisma@^5.22.0', 'migrate', 'deploy'], 'packages-answers/db')
    } catch (error) {
        console.log('Migration deploy failed, falling back to schema push...')
        try {
            // Fallback to schema push (pin to specific Prisma version for compatibility)
            await runCommand('npx', ['--yes', 'prisma@^5.22.0', 'db', 'push', '--accept-data-loss'], 'packages-answers/db')
        } catch (pushError) {
            console.error('Both migration deploy and schema push failed:', pushError.message)
            process.exit(1)
        }
    }

    // Start the Next.js application
    console.log('Starting Next.js application...')

    // Original "exec node apps/web/server.js" to start the server!
    try {
        require('./apps/web/server.js')
    } catch (error) {
        console.error('Failed to start Next.js server:', error.message)
        console.error('Server path: ./apps/web/server.js')
        process.exit(1)
    }
}

// Handle process signals gracefully
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...')
    process.exit(0)
})

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    process.exit(1)
})

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    process.exit(1)
})

// Start the application
main().catch((error) => {
    console.error('Failed to start application:', error)
    process.exit(1)
})
