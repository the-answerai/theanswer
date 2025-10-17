import { test, expect } from '@playwright/test'
import axios from 'axios'

import { resetDatabase, seedScenario } from '../../helpers/test-db'

const TEST_SERVER_URL = process.env.API_URL || 'http://localhost:4000'
const RESET_PATH = '/api/v1/__test__/reset'
const SEED_PATH = '/api/v1/__test__/seed'

test.describe('Test DB utilities', () => {
    test('resetDatabase truncates to default test data', async () => {
        await resetDatabase()

        const resetResponse = await axios.post(`${TEST_SERVER_URL}${RESET_PATH}`)
        expect(resetResponse.status).toBe(204)

        const seedResponse = await axios.post(`${TEST_SERVER_URL}${SEED_PATH}?scenario=baseline`)
        expect(seedResponse.status).toBe(204)
    })

    test('Scenario 1: admin user with OpenAI assigned (improved)', async () => {
        const resetResponse = await axios.post(`${TEST_SERVER_URL}${RESET_PATH}`)
        expect(resetResponse.status).toBe(204)

        await seedScenario('user-with-openai')

        const secondSeedResponse = await axios.post(`${TEST_SERVER_URL}${SEED_PATH}?scenario=user-with-openai`)
        expect(secondSeedResponse.status).toBe(204)
    })

    test('Scenario 2: admin user with Exa assigned (improved)', async () => {
        const resetResponse = await axios.post(`${TEST_SERVER_URL}${RESET_PATH}`)
        expect(resetResponse.status).toBe(204)

        await seedScenario('user-with-exa')

        const secondSeedResponse = await axios.post(`${TEST_SERVER_URL}${SEED_PATH}?scenario=user-with-exa`)
        expect(secondSeedResponse.status).toBe(204)
    })

    test('Scenario 3: admin user with both credentials assigned (improved)', async () => {
        const resetResponse = await axios.post(`${TEST_SERVER_URL}${RESET_PATH}`)
        expect(resetResponse.status).toBe(204)

        await seedScenario('user-with-both-credentials')

        const secondSeedResponse = await axios.post(`${TEST_SERVER_URL}${SEED_PATH}?scenario=user-with-both-credentials`)
        expect(secondSeedResponse.status).toBe(204)
    })

    test('New Scenario 4: admin user with all available credentials', async () => {
        const resetResponse = await axios.post(`${TEST_SERVER_URL}${RESET_PATH}`)
        expect(resetResponse.status).toBe(204)

        await seedScenario('user-with-all-credentials')

        const secondSeedResponse = await axios.post(`${TEST_SERVER_URL}${SEED_PATH}?scenario=user-with-all-credentials`)
        expect(secondSeedResponse.status).toBe(204)
    })
})
