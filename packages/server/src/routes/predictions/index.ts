import express, { NextFunction, Request, Response } from 'express'
import predictionsController from '../../controllers/predictions'
import { getMulterStorage } from '../../utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { verifyAAIToken } from '../../middlewares/authentication/verifyAAIToken'

const router = express.Router()

// /prediction is whitelisted, so the global auth never reads the token. Identify Auth0 callers
// (browser extension) here; anonymous callers pass through. The data source exists only at request time.
const optionalAAIAuth = (req: Request, res: Response, next: NextFunction) =>
    verifyAAIToken(getRunningExpressApp().AppDataSource, { optional: true })(req, res, next)

// NOTE: extractChatflowId function in XSS.ts extracts the chatflow ID from the prediction URL.
// It assumes the URL format is /prediction/{chatflowId}. Make sure to update the function if the URL format changes.
// CREATE
router.post(
    ['/', '/:id'],
    getMulterStorage().array('files'),
    predictionsController.getRateLimiterMiddleware,
    optionalAAIAuth,
    predictionsController.createPrediction
)

export default router
