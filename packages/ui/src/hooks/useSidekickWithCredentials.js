import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import chatflowsApi from '@/api/chatflows'
import { extractMissingCredentials, extractAllCredentials } from '@/utils/flowCredentialsHelper'

export const useSidekickWithCredentials = (sidekickId, forceQuickSetup = false) => {
    const {
        data: sidekick,
        error,
        mutate
    } = useSWR(sidekickId ? `/api/v1/chatflows/${sidekickId}` : null, () => chatflowsApi.getSpecificChatflow(sidekickId), {
        revalidateOnFocus: false,
        dedupingInterval: 10000
    })

    const credentialInfo = useMemo(() => {
        if (!sidekick) return { credentialsToShow: [], needsSetup: false }

        const extractFn = forceQuickSetup ? extractAllCredentials : extractMissingCredentials
        const credentials = extractFn(sidekick)

        return {
            credentialsToShow: credentials,
            needsSetup: credentials.length > 0
        }
    }, [sidekick, forceQuickSetup])

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

    return {
        sidekick,
        isLoading: !error && !sidekick && sidekickId !== null,
        error,
        updateSidekick,
        needsSetup: credentialInfo.needsSetup,
        credentialsToShow: credentialInfo.credentialsToShow
    }
}
