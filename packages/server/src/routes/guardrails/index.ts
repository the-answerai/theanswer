import express from 'express'
import guardrailsController from '../../controllers/guardrails'

const router = express.Router()

/**
 * Diagnostic selftest: reports resolved config, credential source, live
 * healthCheck() latency/status, and circuit-breaker state. Operators hit this
 * to verify guardrail wiring in any environment.
 */
router.get('/selftest', guardrailsController.getSelftest)

export default router
