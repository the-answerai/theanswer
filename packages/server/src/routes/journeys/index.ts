import express from 'express'
import journeysController from '../../controllers/journeys'
const router = express.Router()

router.post('/', journeysController.createJourney)
router.get('/', journeysController.getAllJourneys)
router.get('/:id', journeysController.getJourneyById)
router.put('/:id', journeysController.updateJourney)
router.delete('/:id', journeysController.deleteJourney)

export default router
