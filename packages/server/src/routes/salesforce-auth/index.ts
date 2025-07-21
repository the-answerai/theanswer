import express from 'express'
import salesforceAuthController from '../../controllers/salesforce-auth'
import passport from 'passport'

const router = express.Router()

router.get('/', salesforceAuthController.authenticate)
router.get('/error', (req, res) => {
    const messages = (req.session as any)?.messages || []
    const errorMessage = messages.length > 0 ? messages[messages.length - 1] : req.query.error
    res.json({ error: errorMessage })
})
router.get(
    '/callback',
    passport.authenticate('salesforce-dynamic', { failureRedirect: '/api/v1/salesforce-auth/error', failureMessage: true }),
    salesforceAuthController.salesforceAuthCallback
)

export default router
