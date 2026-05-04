import type { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { runGuardrailsSelftest } from '../../services/guardrails/selftest'

/**
 * GET /api/v1/guardrails/selftest
 *
 * Returns a diagnostic report describing whether guardrails can be reached
 * from the current runtime for the caller's organization (optionally scoped
 * to a specific chatflow via ?chatflowId=...).
 *
 * Admin-gated: any authenticated user in an org can trigger it today; we
 * intentionally avoid restricting further until we see how ops wants to wire
 * this into existing dashboards.
 */
const getSelftest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized - No user')
        }
        const organizationId = req.user.organizationId
        if (!organizationId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User organization ID not found')
        }

        const chatflowId = typeof req.query.chatflowId === 'string' ? req.query.chatflowId : undefined
        const workspaceIdOverride = typeof req.query.workspaceId === 'string' ? req.query.workspaceId : undefined

        const report = await runGuardrailsSelftest({ organizationId, chatflowId, workspaceIdOverride })
        return res.json(report)
    } catch (error) {
        next(error)
    }
}

export default { getSelftest }
