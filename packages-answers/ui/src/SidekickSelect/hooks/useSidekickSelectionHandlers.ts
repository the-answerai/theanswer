'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidekick } from '../SidekickSelect.types'
import { useAnswers } from '../../AnswersContext'
import { Chat, SidekickListItem } from 'types'

export type NavigateFn = (url: string | number, options?: { state?: any; replace?: boolean }) => void

interface UseSidekickSelectionHandlersProps {
    chat?: Chat
    navigate: NavigateFn
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
    const router = useRouter()
    const [isMarketplaceDialogOpen, setIsMarketplaceDialogOpen] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
    const [showCopyMessage, setShowCopyMessage] = useState(false)

    const handleSidekickSelect = useCallback(
        (sidekick: Sidekick) => {
            // Use isExecutable (TheAnswer pattern) to determine if sidekick can be used directly
            // isExecutable = isOwner || visibility.includes('AnswerAI')
            if (sidekick.isExecutable) {
                // Update local storage
                const sidekickHistory = JSON.parse(localStorage.getItem('sidekickHistory') || '{}')
                sidekickHistory.lastUsed = sidekick
                localStorage.setItem('sidekickHistory', JSON.stringify(sidekickHistory))

                // Update context
                setSelectedSidekick(sidekick as unknown as SidekickListItem)
                setSidekick(sidekick as unknown as SidekickListItem)

                if (!chat?.id) {
                    // No active chat - navigate to chat with this sidekick
                    router.push(`/chat/${sidekick.id}`)
                } else {
                    // Already in chat - just switch sidekicks (no navigation)
                    setIsMarketplaceDialogOpen(false)
                }
            } else {
                // Non-executable sidekicks (templates) - navigate to marketplace to view/clone
                router.push(`/sidekick-studio/marketplace/${sidekick.id}`)
            }
        },
        [chat, setSidekick, setSelectedSidekick, router]
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
