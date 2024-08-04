import { Request, Response, NextFunction } from 'express'
import journeysService from '../../services/journeys'
import { Journey } from '../../database/entities/Journey'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

const createJourney = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Error: journeysController.createJourney - Unauthorized!`)
        }
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: journeysController.createJourney - body not provided!`)
        }
        const body = req.body
        const newJourney = new Journey()

        Object.assign(newJourney, { ...body, userId: req.user?.id, organizationId: req.user?.organizationId })
        const apiResponse = await journeysService.createJourney(newJourney)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllJourneys = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id
        const organizationId = req.user?.organizationId
        if (!userId) {
            return res.status(401).send('Unauthorized')
        }
        const journeys = await journeysService.getAllJourneys(userId, organizationId)
        return res.json(journeys)
    } catch (error) {
        next(error)
    }
}

const getJourneyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Error: journeysController.getJourneyById - Unauthorized!`)
        const journey = await journeysService.getJourneyById(req.params.id)
        return res.json(journey)
    } catch (error) {
        next(error)
    }
}

const updateJourney = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Error: journeysController.updateJourney - Unauthorized!`)
        const updatedJourney = await journeysService.updateJourney(req.params.id, req.body)
        return res.json(updatedJourney)
    } catch (error) {
        next(error)
    }
}

const deleteJourney = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Error: journeysController.deleteJourney - Unauthorized!`)
        await journeysService.deleteJourney(req.params.id)
        return res.status(204).send()
    } catch (error) {
        next(error)
    }
}

export default {
    createJourney,
    getAllJourneys,
    getJourneyById,
    updateJourney,
    deleteJourney
}
