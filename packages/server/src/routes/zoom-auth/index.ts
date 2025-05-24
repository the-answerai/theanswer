import express from 'express'
import zoomAuthController from '../../controllers/zoom-auth/index'
import passport from 'passport'

const router = express.Router()

// GET /api/v1/zoom-auth
router.get('/zoom-auth', zoomAuthController.authenticate)

// GET /api/v1/zoom-auth/callback
router.get(
    '/zoom-auth/callback',
    passport.authenticate('zoom', { session: false, failureRedirect: `${process.env.BASE_URL}/404` }),
    zoomAuthController.zoomAuthCallback
)

export default router
