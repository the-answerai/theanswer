'use client'
import { useState, useCallback } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Sidekick } from '../SidekickSelect.types'

// New SWR-based interface
interface UseSidekickDetailsResult {
    data: Sidekick | null | undefined
    loading: boolean
    error: Error | null
    mutate: () => void
}

// Legacy interface for backward compatibility
interface UseSidekickDetailsLegacyResult {
    loading: boolean
    error: Error | null
    fetchSidekickDetails: (sidekickId: string) => Promise<Sidekick | null>
}

const fetcher = async (url: string): Promise<Sidekick> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
            throw new Error(`Failed to fetch sidekick details: ${response.statusText}`)
        }
        return response.json()
    } finally {
        clearTimeout(timeout)
    }
}

// New SWR-based hook
export const useSidekickDetails = (sidekickId: string | null): UseSidekickDetailsResult => {
    const { data, error, mutate, isLoading } = useSWR<Sidekick>(sidekickId ? `/api/sidekicks/${sidekickId}` : null, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        retry: 2,
        retryDelay: 1000,
        dedupingInterval: 2000
    })

    return {
        data,
        loading: isLoading,
        error,
        mutate
    }
}

// Legacy hook for backward compatibility
const useSidekickDetailsLegacy = (): UseSidekickDetailsLegacyResult => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchSidekickDetails = useCallback(async (sidekickId: string): Promise<Sidekick | null> => {
        setLoading(true)
        setError(null)

        const cacheKey = `/api/sidekicks/${sidekickId}`

        try {
            // First, try to get from SWR cache
            const { data: cachedData } = useSWR.unstable_serialize({ key: cacheKey })
            if (cachedData) {
                setLoading(false)
                return cachedData as Sidekick
            }

            // If not in cache, fetch with retry logic
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const data = await fetcher(cacheKey)
                    // Update SWR cache
                    await globalMutate(cacheKey, data, false)
                    setLoading(false)
                    return data
                } catch (err) {
                    if (attempt === 1) {
                        throw err
                    }
                    // Wait before retry
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'))
            setLoading(false)
            return null
        }

        setLoading(false)
        return null
    }, [])

    return {
        loading,
        error,
        fetchSidekickDetails
    }
}

// Default export maintains backward compatibility
export default useSidekickDetailsLegacy
