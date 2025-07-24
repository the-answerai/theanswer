import { useCallback } from 'react'
import useSWR from 'swr'
import chatflowsApi from '@/api/chatflows'

const fetcher = async (url) => {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
    }
    return response.json()
}

export const useSidekickWithCredentials = (sidekickId, forceQuickSetup = false) => {
    const {
        data: sidekick,
        error,
        mutate,
        isLoading
    } = useSWR(sidekickId ? `/api/sidekicks/${sidekickId}` : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 10000
    })

    const updateSidekick = useCallback(
        async (updateData) => {
            if (!sidekickId) return

            try {
                const updatedSidekick = await chatflowsApi.updateChatflow(sidekickId, updateData)
                await mutate(updatedSidekick, false)
                return updatedSidekick
            } catch (error) {
                console.error('Failed to update sidekick:', error)
                throw error
            }
        },
        [sidekickId, mutate]
    )

    console.log('[useSidekickWithCredentials] sidekick', { sidekickId, sidekick, forceQuickSetup, error })
    return {
        sidekick,
        isLoading,
        error,
        updateSidekick,
        needsSetup: sidekick?.needsSetup,
        credentialsToShow: sidekick?.credentialsToShow
    }
}
