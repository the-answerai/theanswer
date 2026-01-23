'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import useSWR from 'swr'
import { Sidekick } from '../SidekickSelect.types'

interface UseSidekickDataProps {
    defaultSidekicks?: Sidekick[]
    enablePerformanceLogs?: boolean
}

interface UseSidekickDataResult {
    data: {
        sidekicks: Sidekick[]
        categories: { top: string[]; more: string[] }
    }
    combinedSidekicks: Sidekick[]
    isLoading: boolean
    sidekicksByCategoryCache: React.MutableRefObject<Record<string, { data: Sidekick[]; timestamp: number }>>
    perfLog: (message: string, ...args: any[]) => void
    allCategories: { top: string[]; more: string[] }
}

const useSidekickData = ({ defaultSidekicks = [], enablePerformanceLogs = false }: UseSidekickDataProps = {}): UseSidekickDataResult => {
    // Improved cache structure with better typing and timestamp tracking
    const sidekicksByCategoryCache = useRef<Record<string, { data: Sidekick[]; timestamp: number }>>({})

    // Logger utility (no-op in production)
    const perfLog = useCallback((_message: string, ..._args: any[]) => {}, [])

    // Fetcher with better caching and error handling
    const fetcher = useCallback(async (url: string) => {
        try {
            const res = await fetch(url)
            if (res.status === 401) {
                window.location.href = '/api/auth/login?redirect_uri=' + encodeURIComponent(window.location.href)
            } else {
                const data = await res.json()

                // Clear the cache when new data is fetched
                sidekicksByCategoryCache.current = {}

                return data
            }
        } catch (error) {
            console.error('SidekickSelect fetch error:', error)
            if (error instanceof Response && error.status === 401) {
                window.location.href = '/api/auth/login?redirect_uri=' + encodeURIComponent(window.location.href)
            }
            return { sidekicks: [], categories: { top: [], more: [] } }
        }
    }, [])

    // Use the optimized fetcher
    const { data, isLoading } = useSWR('/api/sidekicks', fetcher)

    const { sidekicks: allSidekicks = [], categories: chatflowCategories = { top: [], more: [] } } = data || {
        sidekicks: defaultSidekicks,
        categories: { top: [], more: [] }
    }

    // Optimize combinedSidekicks calculation with better dependency tracking
    const combinedSidekicks = useMemo(() => {
        if (!allSidekicks) {
            return []
        }

        const sidekickMap = new Map<string, Sidekick>()

        // Process all sidekicks and efficiently merge them
        allSidekicks.forEach((sidekick: any) => {
            sidekickMap.set(sidekick.id, sidekick)
        })

        // When recalculating combined sidekicks, clear stale category cache
        // But preserve favorites cache which is based on the favorites Set
        Object.keys(sidekicksByCategoryCache.current)
            .filter((category) => category !== 'favorites')
            .forEach((category) => {
                delete sidekicksByCategoryCache.current[category]
            })

        return Array.from(sidekickMap.values())
    }, [allSidekicks, perfLog])

    const allCategories = useMemo(() => {
        const allCats = [
            ...chatflowCategories.top,
            ...chatflowCategories.more,
            ...new Set(allSidekicks.flatMap((s: Sidekick) => s.categories))
        ].filter(Boolean)

        // Count executable sidekicks per category
        const executableCountByCategory: Record<string, number> = {}

        // Initialize counters for all categories
        const uniqueCatsSet = new Set(allCats)
        uniqueCatsSet.forEach((category) => {
            executableCountByCategory[category] = 0
        })

        // Count executable sidekicks per category
        combinedSidekicks.forEach((sidekick) => {
            if (sidekick.isExecutable) {
                const categories = [
                    sidekick.chatflow.category,
                    ...(sidekick.chatflow.categories || []),
                    ...(sidekick.categories || [])
                ].filter(Boolean)

                categories.forEach((category) => {
                    if (category && uniqueCatsSet.has(category)) {
                        executableCountByCategory[category] = (executableCountByCategory[category] || 0) + 1
                    }
                })
            }
        })

        // Get unique categories and sort them by:
        // 1. Number of executable sidekicks (descending)
        // 2. Alphabetically (ascending)
        const uniqueCats = [...uniqueCatsSet].sort((a, b) => {
            const countDiff = executableCountByCategory[b] - executableCountByCategory[a]
            return countDiff !== 0 ? countDiff : a.localeCompare(b)
        })

        return {
            top: uniqueCats.slice(0, 4),
            more: uniqueCats.slice(4)
        }
    }, [chatflowCategories, combinedSidekicks])

    // Selectively invalidate relevant cache entries when sidekicks change
    useEffect(() => {
        // Get categories that need invalidation
        const categoriesToInvalidate = Object.keys(sidekicksByCategoryCache.current).filter((category) => category !== 'favorites') // Keep favorites cache if only sidekicks changed

        // Selectively remove affected categories from cache
        categoriesToInvalidate.forEach((category) => {
            delete sidekicksByCategoryCache.current[category]
        })
    }, [combinedSidekicks])

    return {
        data,
        combinedSidekicks,
        isLoading,
        sidekicksByCategoryCache,
        perfLog,
        allCategories
    }
}

export default useSidekickData
