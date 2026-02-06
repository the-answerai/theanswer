/**
 * AAI Context - Configuration and request-scoped AsyncLocalStorage for workspace filtering.
 */
import { AsyncLocalStorage } from 'async_hooks'

// Config - Feature DISABLED by default for safety
const config = {
    enabled: process.env.AAI_MULTI_WORKSPACE_SHARING === 'true',
    sharedWorkspaceName: process.env.AAI_SHARED_WORKSPACE_NAME || 'Default Workspace',
    debug: process.env.AAI_WORKSPACE_DEBUG === 'true'
}

export const isMultiWorkspaceSharingEnabled = () => config.enabled
export const getSharedWorkspaceName = () => config.sharedWorkspaceName
export const isDebugEnabled = () => config.debug
// eslint-disable-next-line no-console
export const debugLog = (msg: string, data?: any) => config.debug && console.log(`[AAI] ${msg}`, data ?? '')

// Request context
export const requestContext = new AsyncLocalStorage<{ workspaceIds?: string[] }>()
export const getWorkspaceIdsFromContext = () => requestContext.getStore()?.workspaceIds
