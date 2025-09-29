import { request } from '@playwright/test'

const API_URL = process.env.API_URL || 'http://localhost:4000'

export async function resetDatabase(): Promise<void> {
    const api = await request.newContext({ baseURL: API_URL })
    try {
        await api.post('/api/v1/__test__/reset')
    } finally {
        await api.dispose()
    }
}

export type SeedScenarioOptions = {
    userEmail?: string
}

export async function seedScenario(scenario: string = 'baseline', options: SeedScenarioOptions = {}): Promise<void> {
    const api = await request.newContext({ baseURL: API_URL })
    try {
        const params = new URLSearchParams({ scenario })

        if (options.userEmail) {
            params.set('userEmail', options.userEmail)
        }

        await api.post(`/api/v1/__test__/seed?${params.toString()}`)
    } finally {
        await api.dispose()
    }
}

export async function seedTestData(payload: Record<string, unknown>): Promise<void> {
    const api = await request.newContext({ baseURL: API_URL })
    try {
        await api.post('/api/v1/__test__/seed', {
            data: payload,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    } finally {
        await api.dispose()
    }
}

export async function resetTestDb(): Promise<void> {
    await resetDatabase()
}

export async function resetAndSeed(payload: Record<string, unknown>): Promise<void> {
    await resetTestDb()
    await seedTestData(payload)
}
