import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Journey } from '../../database/entities/Journey'
import { getErrorMessage } from '../../errors/utils'

const createJourney = async (journey: Journey): Promise<Journey> => {
    try {
        const appServer = getRunningExpressApp()
        console.log('Attempting to save journey:', journey)
        const savedJourney = await appServer.AppDataSource.getRepository(Journey).save(journey)
        console.log('Saved journey:', savedJourney)
        return savedJourney
    } catch (error) {
        console.error('Error saving journey:', error)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: journeysService.createJourney - ${getErrorMessage(error)}`
        )
    }
}

const getAllJourneys = async (userId?: string, organizationId?: string): Promise<Journey[]> => {
    try {
        const appServer = getRunningExpressApp()
        return await appServer.AppDataSource.getRepository(Journey).find({
            where: { userId, organizationId },
            order: { createdAt: 'DESC' }
        })
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: journeysService.getAllJourneys - ${getErrorMessage(error)}`
        )
    }
}

const getJourneyById = async (journeyId: string): Promise<Journey> => {
    try {
        const appServer = getRunningExpressApp()
        const journey = await appServer.AppDataSource.getRepository(Journey).findOneBy({ id: journeyId })
        if (!journey) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Journey ${journeyId} not found`)
        }
        return journey
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: journeysService.getJourneyById - ${getErrorMessage(error)}`
        )
    }
}

const updateJourney = async (journeyId: string, journeyData: Partial<Journey>): Promise<Journey> => {
    try {
        const appServer = getRunningExpressApp()
        await appServer.AppDataSource.getRepository(Journey).update(journeyId, journeyData)
        return await getJourneyById(journeyId)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: journeysService.updateJourney - ${getErrorMessage(error)}`
        )
    }
}

const deleteJourney = async (journeyId: string): Promise<void> => {
    try {
        const appServer = getRunningExpressApp()
        await appServer.AppDataSource.getRepository(Journey).delete(journeyId)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: journeysService.deleteJourney - ${getErrorMessage(error)}`
        )
    }
}

export default {
    createJourney,
    getAllJourneys,
    getJourneyById,
    updateJourney,
    deleteJourney
}
