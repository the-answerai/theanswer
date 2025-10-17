// Utility for pulling the baseline chatflow template ID from environment variables. Keeps the
// same validation logic reusable across baseline/orphan seeding.
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../errors/internalFlowiseError'

export const resolveInitialChatflowId = (): string => {
    const rawIds = process.env.INITIAL_CHATFLOW_IDS ?? ''
    const ids = rawIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

    if (!ids.length) {
        throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Error: test-utils.config - INITIAL_CHATFLOW_IDS not configured')
    }

    return ids[0]
}
