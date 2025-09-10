import { useState, useEffect, createContext, useContext } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { setBaseURL } from '@/store/constant'
import PropTypes from 'prop-types'

// Create a context for Auth0 setup
const Auth0Context = createContext<{ isAuth0Ready: boolean; user: any }>({
    isAuth0Ready: false,
    user: null
})

export const useAuth0 = () => {
    const context = useContext(Auth0Context)
    if (!context) {
        throw new Error('useAuth0 must be used within an Auth0Setup provider')
    }
    return context
}

export const Auth0Setup = ({ children, apiHost, accessToken }: { children: React.ReactNode; apiHost?: string; accessToken?: string }) => {
    const { user, isLoading } = useUser()
    const [isAuth0Ready, setIsAuth0Ready] = useState(false)

    useEffect(() => {
        const setBaseUrlEffect = () => {
            if (process.env.CHATFLOW_DOMAIN_OVERRIDE) {
                setBaseURL(process.env.CHATFLOW_DOMAIN_OVERRIDE)
            } else if (user && user.chatflowDomain) {
                setBaseURL(user.chatflowDomain)
            } else if (apiHost) {
                setBaseURL(apiHost)
            }
        }

        setBaseUrlEffect()
    }, [apiHost, isLoading, user])

    useEffect(() => {
        const setAccessTokenEffect = () => {
            try {
                if (accessToken) {
                    sessionStorage.setItem('access_token', accessToken)
                    setIsAuth0Ready(true)
                } else {
                    console.warn('[Auth0Setup] No access token provided')
                    setIsAuth0Ready(true) // Still set ready even without token
                }
            } catch (err) {
                console.error('[Auth0Setup] Error setting access token:', err)
                setIsAuth0Ready(false)
            }
        }

        setAccessTokenEffect()
    }, [accessToken])

    return <Auth0Context.Provider value={{ isAuth0Ready, user }}>{children}</Auth0Context.Provider>
}

Auth0Setup.propTypes = {
    children: PropTypes.node.isRequired,
    apiHost: PropTypes.string,
    accessToken: PropTypes.string
}
