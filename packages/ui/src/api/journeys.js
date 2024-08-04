import client from './client'

const getAllJourneys = () => client.get('/journeys')

const getSpecificJourney = (id) => client.get(`/journeys/${id}`)

const createNewJourney = (body) => client.post('/journeys', body)

const updateJourney = (id, body) => client.put(`/journeys/${id}`, body)

const deleteJourney = (id) => client.delete(`/journeys/${id}`)

export default {
    getAllJourneys,
    getSpecificJourney,
    createNewJourney,
    updateJourney,
    deleteJourney
}
