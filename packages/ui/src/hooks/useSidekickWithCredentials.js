import { useCallback } from 'react'
import { useSidekickDetails } from '@ui/SidekickSelect/hooks/useSidekickDetails'
import chatflowsApi from '@/api/chatflows'

export const useSidekickWithCredentials = (sidekickId, forceQuickSetup = false) => {
    const { data: sidekick, error, mutate, loading } = useSidekickDetails(sidekickId)

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
        isLoading: loading,
        error,
        updateSidekick,
        needsSetup: sidekick?.needsSetup,
        credentialsToShow: sidekick?.credentialsToShow
    }
}
