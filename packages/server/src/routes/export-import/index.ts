import express from 'express'
import exportImportController from '../../controllers/export-import'
import enforceAbility from '../../middlewares/authentication/enforceAbility'
const router = express.Router()

// SECURITY: Export/import operations require proper authorization
router.post('/export', enforceAbility('ChatFlow'), exportImportController.exportData)

router.post('/import', enforceAbility('ChatFlow'), exportImportController.importData)

export default router
