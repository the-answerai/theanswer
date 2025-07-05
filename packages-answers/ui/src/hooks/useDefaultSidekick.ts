'use client'
import { useEffect, useState } from 'react'
import { useAnswers } from '../AnswersContext'
import useSidekickData from '../SidekickSelect/hooks/useSidekickData'
import type { Sidekick } from 'types'

interface UseDefaultSidekickResult {
    isLoading: boolean
    sidekicks: Sidekick[]
    defaultSidekick: Sidekick | null
    hasDefaultSelected: boolean
}

/**
 * Hook that handles client-side sidekick fetching and automatic default selection
 * Optimizes performance by moving away from server-side fetching
 */
const useDefaultSidekick = (): UseDefaultSidekickResult => {
    const { user, sidekick: selectedSidekick, setSidekick } = useAnswers()
    const [hasSetDefault, setHasSetDefault] = useState(false)

    // Use existing useSidekickData hook for optimized fetching
    const { combinedSidekicks, isLoading } = useSidekickData({
        enablePerformanceLogs: false
    })

    // Get default chatflow ID from user's app settings
    const defaultChatflowId = user?.appSettings?.defaultChatflowId || user?.defaultChatflowId

    // Find the default sidekick from available sidekicks
    const defaultSidekick = defaultChatflowId ? combinedSidekicks.find((s) => s.id === defaultChatflowId) || null : null

    // Auto-select default sidekick when data loads and no sidekick is currently selected
    useEffect(() => {
        if (!isLoading && !selectedSidekick && defaultSidekick && !hasSetDefault && setSidekick) {
            setSidekick(defaultSidekick)
            setHasSetDefault(true)
        }
    }, [isLoading, selectedSidekick, defaultSidekick, hasSetDefault, setSidekick])

    // Reset hasSetDefault when defaultSidekick changes (e.g., user switches)
    useEffect(() => {
        setHasSetDefault(false)
    }, [defaultChatflowId])

    return {
        isLoading,
        sidekicks: combinedSidekicks,
        defaultSidekick,
        hasDefaultSelected: !!selectedSidekick && selectedSidekick.id === defaultChatflowId
    }
}

export default useDefaultSidekick
