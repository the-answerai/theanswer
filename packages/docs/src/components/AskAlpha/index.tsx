import React, { useState, useEffect } from 'react'
import { AskAlphaPanel } from './AskAlphaPanel'

export { AskAlphaButton } from './AskAlphaButton'
export { AskAlphaPanel } from './AskAlphaPanel'

interface AskAlphaProps {
    chatflowId?: string
    apiHost?: string
}

/**
 * Complete AskAlpha component that manages both button and panel
 * Listens for global 'ask-alpha-open' events
 */
export const AskAlpha: React.FC<AskAlphaProps> = ({
    chatflowId = 'd480f12e-0f35-48a3-bac8-a2cacb924f78',
    apiHost = 'https://api.staging.theanswer.ai'
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [context, setContext] = useState({})

    useEffect(() => {
        const handleAskAlphaOpen = (event: CustomEvent) => {
            setContext(event.detail?.context || {})
            setIsOpen(true)
        }

        window.addEventListener('ask-alpha-open', handleAskAlphaOpen as EventListener)

        return () => {
            window.removeEventListener('ask-alpha-open', handleAskAlphaOpen as EventListener)
        }
    }, [])

    return (
        <AskAlphaPanel
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            initialContext={context}
            chatflowId={chatflowId}
            apiHost={apiHost}
        />
    )
}

export default AskAlpha
