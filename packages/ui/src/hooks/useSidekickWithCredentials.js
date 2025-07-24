import { useCallback } from 'react'
import useSWR from 'swr'
import useSidekickDetails from '@ui/SidekickSelect/hooks/useSidekickDetails'
import chatflowsApi from '@/api/chatflows'

export const useSidekickWithCredentials = (sidekickId, forceQuickSetup = false) => {
    const { fetchSidekickDetails } = useSidekickDetails()
    const {
        data: sidekick,
        error,
        mutate
    } = useSWR(sidekickId ? `/api/v1/sidekicks/${sidekickId}` : null, () => fetchSidekickDetails(sidekickId), {
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
        isLoading: !error && !sidekick && sidekickId !== null,
        error,
        updateSidekick,
        needsSetup: sidekick?.needsSetup,
        credentialsToShow: sidekick?.credentialsToShow
    }
}
