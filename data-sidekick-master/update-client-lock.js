#!/usr/bin/env node

/**
 * This script updates the client's pnpm-lock.yaml file to match the package.json
 * It should be run before deploying to Render or any CI environment
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const clientDir = join(process.cwd(), 'client')

// Check if client directory exists
if (!existsSync(clientDir)) {
    console.error('Client directory not found!')
    process.exit(1)
}

console.log('Updating client pnpm-lock.yaml file...')

try {
    // Change to client directory
    process.chdir(clientDir)

    // Update the lockfile
    execSync('pnpm install --no-frozen-lockfile', { stdio: 'inherit' })

    console.log('Successfully updated client pnpm-lock.yaml file!')
} catch (error) {
    console.error('Failed to update client pnpm-lock.yaml file:', error.message)
    process.exit(1)
}
