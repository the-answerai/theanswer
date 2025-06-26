'use client'
import { useState, useCallback } from 'react'
import { Sidekick } from '../SidekickSelect.types'

interface UseSidekickDetailsResult {
    loading: boolean
    error: Error | null
    fetchSidekickDetails: (sidekickId: string) => Promise<Sidekick | null>
}

const useSidekickDetails = (): UseSidekickDetailsResult => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchSidekickDetails = useCallback(async (sidekickId: string): Promise<Sidekick | null> => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/sidekicks/${sidekickId}`)

            if (!response.ok) {
                throw new Error(`Failed to fetch sidekick details: ${response.statusText}`)
            }

            const data = await response.json()
            return data
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'))
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        loading,
        error,
        fetchSidekickDetails
    }
}

export default useSidekickDetails
