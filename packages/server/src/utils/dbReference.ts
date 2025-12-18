/**
 * Simple module to hold a reference to the initialized DataSource
 * This avoids circular dependencies that occur when importing from getRunningExpressApp
 */
import { DataSource } from 'typeorm'

let dataSource: DataSource | null = null

/**
 * Set the DataSource reference (called during server initialization)
 */
export const setDataSource = (ds: DataSource): void => {
    dataSource = ds
}

/**
 * Get the DataSource reference
 * @returns DataSource or null if not yet initialized
 */
export const getDataSource = (): DataSource | null => {
    return dataSource
}

/**
 * Check if the DataSource is initialized and ready for use
 */
export const isDataSourceReady = (): boolean => {
    return dataSource !== null && dataSource.isInitialized
}
