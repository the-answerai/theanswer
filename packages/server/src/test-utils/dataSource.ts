// Lightweight helper that gives every test util a consistent way to access the TypeORM
// DataSource—either the provided instance or the one exposed by the running Express app.
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { SupportedDataSource } from './types'

export const ensureDataSource = (provided?: SupportedDataSource): SupportedDataSource => {
    if (provided) {
        return provided
    }

    const appServer = getRunningExpressApp()
    if (!appServer?.AppDataSource) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Error: test-utils.ensureDataSource - AppDataSource not initialized'
        )
    }

    return appServer.AppDataSource
}
