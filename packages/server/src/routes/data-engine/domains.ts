import express from 'express'
import domainsController from '../../controllers/data-engine/domains'

const router = express.Router()

// All routes protected by global authentication middleware (API key or JWT)
router.post('/', domainsController.createDomain)
router.get('/', domainsController.getAllDomains)
router.get('/:id', domainsController.getDomainById)
router.put('/:id', domainsController.updateDomain)
router.delete('/:id', domainsController.deleteDomain)

export default router
