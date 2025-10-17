import express from 'express'
import testControlController from '../../controllers/test-control'

const router = express.Router()

// Test control endpoints (already secured in controller)
router.post('/reset', testControlController.resetTestDatabase)
router.get('/reset', (req, res) => {
    console.log('Resetting database...')
})
router.post('/seed', testControlController.seedTestDatabase)

export default router
