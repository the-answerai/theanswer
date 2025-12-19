import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import PropTypes from 'prop-types'

import { setBaseURL } from '../store/constant'
import { Auth0Context } from '../AppProvider'
import { store } from '@/store'
import { loginSuccess } from '@/store/reducers/authSlice'
import authApi from '@/api/auth'
export const Auth0Setup = ({ children, apiHost, accessToken }) => {
    const { isAuth0Ready, user } = useAuth0Setup(apiHost, accessToken)

    useEffect(() => {
        const run = async () => {
            if (user) {
                store.dispatch(loginSuccess(user))
            }
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])
    return <Auth0Context.Provider value={{ isAuth0Ready, user }}>{children}</Auth0Context.Provider>
}
Auth0Setup.propTypes = {
    children: PropTypes.node.isRequired,
    apiHost: PropTypes.string.isRequired,
    accessToken: PropTypes.string.isRequired
}

export const useAuth0Setup = (apiHost, accessToken) => {
    const { user: auth0User, isLoading, isAuthenticated } = useUser()
    const [isAuth0Ready, setIsAuth0Ready] = useState(false)
    const [backendUser, setBackendUser] = useState(null)

    useEffect(() => {
        const setBaseUrlEffect = () => {
            if (process.env.CHATFLOW_DOMAIN_OVERRIDE) {
                setBaseURL(process.env.CHATFLOW_DOMAIN_OVERRIDE)
            } else if (backendUser && backendUser.chatflowDomain) {
                setBaseURL(backendUser.chatflowDomain)
            } else if (apiHost) {
                setBaseURL(apiHost)
            }
        }

        setBaseUrlEffect()
    }, [apiHost, isLoading, backendUser, isAuthenticated])

    useEffect(() => {
        const setAccessTokenAndFetchUser = async () => {
            try {
                const newToken = accessToken
                if (newToken) {
                    sessionStorage.setItem('access_token', newToken)

                    // Fetch enriched user from backend after Auth0 authentication
                    if (isAuthenticated && !isLoading) {
                        try {
                            const response = await authApi.getMe()
                            if (response.data) {
                                setBackendUser(response.data)
                                setIsAuth0Ready(true)
                            } else {
                                console.error('[useAuth0Setup] Failed to fetch user from backend: No data in response')
                                setIsAuth0Ready(false)
                            }
                        } catch (err) {
                            console.error('[useAuth0Setup] Failed to fetch user from backend:', err)
                            setIsAuth0Ready(false)
                        }
                    } else if (!isAuthenticated && !isLoading) {
                        // User is not authenticated
                        setIsAuth0Ready(true)
                    }
                } else {
                    console.error('[useAuth0Setup] Failed to set access token: Token is undefined or null')
                    setIsAuth0Ready(false)
                }
            } catch (err) {
                console.error('[useAuth0Setup] Error in setAccessTokenAndFetchUser:', err)
                setIsAuth0Ready(false)
            }
        }

        setAccessTokenAndFetchUser()
    }, [isAuthenticated, accessToken, isLoading])

    return { isAuth0Ready, user: backendUser }
}
