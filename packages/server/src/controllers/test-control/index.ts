import { Request, Response, NextFunction } from 'express'
import { resetDatabase, seedScenario, createOrphanedTestData, seedTestData } from '../../test-utils'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

// Security middleware - ONLY test mode or development with E2E testing
const testGuard = (req: Request, res: Response, next: NextFunction) => {
    const isTestMode = process.env.NODE_ENV === 'test'
    const isDevelopmentWithE2E = process.env.NODE_ENV === 'development' && process.env.ENABLE_E2E_ENDPOINTS === 'true'

    if (!isTestMode && !isDevelopmentWithE2E) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Not found' })
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
                await seedScenario(scenario, appServer.AppDataSource)
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
