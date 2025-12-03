import { Request, Response, NextFunction } from 'express'
import { resetDatabase, seedScenario, createOrphanedTestData, seedTestData } from '../../test-utils'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

// Security middleware - ONLY test mode or development with E2E testing
// Also validates E2E_SECRET header when configured for defense-in-depth
const testGuard = (req: Request, res: Response, next: NextFunction) => {
    const isTestMode = process.env.NODE_ENV === 'test'
    const isDevelopmentWithE2E = process.env.NODE_ENV === 'development' && process.env.ENABLE_E2E_ENDPOINTS === 'true'

    if (!isTestMode && !isDevelopmentWithE2E) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Not found' })
    }

    // Defense-in-depth: validate E2E_SECRET header if configured
    const expectedSecret = process.env.E2E_SECRET
    if (expectedSecret) {
        const providedSecret = req.header('x-e2e-secret')
        if (providedSecret !== expectedSecret) {
            console.warn('⚠️ E2E endpoint access denied: invalid or missing X-E2E-SECRET header')
            return res.status(StatusCodes.FORBIDDEN).json({ error: 'Forbidden' })
        }
    }

    next()
}

// Reset database endpoint
const resetTestDatabase = [
    testGuard,
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            console.log('Resetting database...')
            const appServer = getRunningExpressApp()
            await resetDatabase(appServer.AppDataSource)
            console.log('Creating orphaned chatflows and credentials...')
            await createOrphanedTestData(appServer.AppDataSource)
            res.status(StatusCodes.NO_CONTENT).send()
            console.log('Database reset with orphaned test data...')
        } catch (error) {
            console.error('Test reset error:', error)
            next(error)
        }
    }
]

// Seed scenario endpoint
const seedTestDatabase = [
    testGuard,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const appServer = getRunningExpressApp()
            const hasBodyPayload = req.body && Object.keys(req.body).length > 0

            if (hasBodyPayload) {
                await seedTestData(req.body, appServer.AppDataSource)
            } else {
                const scenario = (req.query.scenario as string) || 'baseline'
                const userEmail = (req.query.userEmail as string) || undefined

                await seedScenario(scenario, appServer.AppDataSource, {
                    userEmail
                })
            }
            res.status(StatusCodes.NO_CONTENT).send()
        } catch (error) {
            console.error('Test seed error:', error)
            next(error)
        }
    }
]

export default {
    resetTestDatabase,
    seedTestDatabase
}
