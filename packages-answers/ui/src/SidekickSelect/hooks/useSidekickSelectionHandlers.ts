'use client'
import { useState, useCallback } from 'react'
import { Sidekick } from '../SidekickSelect.types'
import { useAnswers } from '../../AnswersContext'
import useSidekickDetails from './useSidekickDetails'

interface UseSidekickSelectionHandlersProps {
    chat?: any
    navigate: any
}

interface UseSidekickSelectionHandlersResult {
    isMarketplaceDialogOpen: boolean
    setIsMarketplaceDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
    selectedTemplateId: string | null
    setSelectedTemplateId: React.Dispatch<React.SetStateAction<string | null>>
    showCopyMessage: boolean
    setShowCopyMessage: React.Dispatch<React.SetStateAction<boolean>>
    handleSidekickSelect: (sidekick: Sidekick) => void
    handleCreateNewSidekick: () => void
}

const useSidekickSelectionHandlers = ({ chat, navigate }: UseSidekickSelectionHandlersProps): UseSidekickSelectionHandlersResult => {
    const { setSidekick, setSidekick: setSelectedSidekick } = useAnswers()
    const { fetchSidekickDetails } = useSidekickDetails()
    const [isMarketplaceDialogOpen, setIsMarketplaceDialogOpen] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
    const [showCopyMessage, setShowCopyMessage] = useState(false)

    const handleSidekickSelect = useCallback(
        async (sidekick: Sidekick) => {
            // If we don't have full data, fetch it
            let fullSidekick = sidekick
            if (!sidekick.flowData || !sidekick.chatbotConfig) {
                const details = await fetchSidekickDetails(sidekick.id)
                if (details) {
                    fullSidekick = details
                } else {
                    console.error('[SidekickSelect] Failed to fetch sidekick details')
                    return
                }
            }

            if (!chat?.id) {
                // Update local storage first
                const sidekickHistory = JSON.parse(localStorage.getItem('sidekickHistory') || '{}')
                sidekickHistory.lastUsed = fullSidekick
                localStorage.setItem('sidekickHistory', JSON.stringify(sidekickHistory))

                // Update URL without navigation using history API
                const newUrl = `/chat/${fullSidekick.id}`
                window.history.pushState({ sidekick: fullSidekick, isClientNavigation: true }, '', newUrl)

                // Directly initialize the chat with the sidekick data
                setSelectedSidekick(fullSidekick)
                setSidekick(fullSidekick)
            } else {
                setSelectedSidekick(fullSidekick)
                setSidekick(fullSidekick)
                const sidekickHistory = JSON.parse(localStorage.getItem('sidekickHistory') || '{}')
                sidekickHistory.lastUsed = fullSidekick
                localStorage.setItem('sidekickHistory', JSON.stringify(sidekickHistory))
                setIsMarketplaceDialogOpen(false)
            }
        },
        [chat, setSidekick, setSelectedSidekick, fetchSidekickDetails]
    )

    const handleCreateNewSidekick = useCallback(() => {
        navigate('/canvas')
    }, [navigate])

    return {
        isMarketplaceDialogOpen,
        setIsMarketplaceDialogOpen,
        selectedTemplateId,
        setSelectedTemplateId,
        showCopyMessage,
        setShowCopyMessage,
        handleSidekickSelect,
        handleCreateNewSidekick
    }
}

export default useSidekickSelectionHandlers
