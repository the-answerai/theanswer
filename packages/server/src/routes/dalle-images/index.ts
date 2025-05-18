import express from 'express'
import dalleImagesController from '../../controllers/dalle-images'
const router = express.Router()

router.get('/', dalleImagesController.streamDalleImage)

export default router
