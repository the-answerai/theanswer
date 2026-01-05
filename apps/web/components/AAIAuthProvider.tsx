'use client'
/**
 * AAI Auth Provider
 *
 * Client component that dispatches loginSuccess to Redux store
 * with enriched user data from getCachedSession().
 *
 * This keeps AAI auth code isolated from Flowise UI internals.
 */
import { useEffect } from 'react'
import { store } from 'flowise-ui/src/store'
import { loginSuccess } from 'flowise-ui/src/store/reducers/authSlice'

interface AAIAuthProviderProps {
    user: any
    children: React.ReactNode
}

export function AAIAuthProvider({ user, children }: AAIAuthProviderProps) {
    useEffect(() => {
        if (user) {
            // Dispatch enriched user directly to Redux
            // This user is already enriched by getCachedSession() server-side
            store.dispatch(
                loginSuccess({
                    ...user,
                    features: user.features || {}
                })
            )
        }
    }, [user])

    return <>{children}</>
}

export default AAIAuthProvider
