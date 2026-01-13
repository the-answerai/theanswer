import { useCallback, useContext, useEffect } from 'react'
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom'

// https://stackoverflow.com/questions/71572678/react-router-v-6-useprompt-typescript

export function useBlocker(blocker, when = true) {
    const context = useContext(NavigationContext)
    const navigator = context?.navigator

    useEffect(() => {
        // Skip if no navigator (Next.js environment with navigation shim)
        if (!when || !navigator?.block) return

        const unblock = navigator.block((tx) => {
            const autoUnblockingTx = {
                ...tx,
                retry() {
                    unblock()
                    tx.retry()
                }
            }

            blocker(autoUnblockingTx)
        })

        return unblock
    }, [navigator, blocker, when])
}

export function usePrompt(message, when = true) {
    const blocker = useCallback(
        (tx) => {
            if (window.confirm(message)) tx.retry()
        },
        [message]
    )

    useBlocker(blocker, when)

    // Fallback: browser beforeunload for tab close/refresh
    // Works in both React Router and Next.js environments
    useEffect(() => {
        if (!when) return

        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = message
            return message
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [when, message])
}
