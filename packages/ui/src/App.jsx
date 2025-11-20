'use client'
import React from 'react'

import { CssBaseline, StyledEngineProvider } from '@mui/material'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'

// routing
import Routes from '@/routes'

// CSS Variables theme - FIXED: Import from packages-answers/ui with colorSchemeSelector
import { cssVarsTheme } from '@ui/theme/cssVarsTheme'

// Import migration utility for localStorage theme migration
import { initializeThemeStorage } from '@ui/theme/migrateThemeStorage'

// project imports
import NavigationScroll from '@/layout/NavigationScroll'
import { useAuth0 } from '@auth0/auth0-react'
import useNotifyParentOfNavigation from './utils/useNotifyParentOfNavigation'

// ==============================|| APP ||============================== //

const App = () => {
    const { user, isLoading, getAccessTokenSilently, error, signinWithRedirect } = useAuth0()
    useNotifyParentOfNavigation()

    // Run theme migration ONCE on mount (before theme provider initializes)
    React.useEffect(() => {
        initializeThemeStorage()
    }, [])

    React.useEffect(() => {
        if (user?.chatflowDomain) {
            sessionStorage.setItem('baseURL', user.chatflowDomain.replace('8080', '4000'))
        }
    }, [user?.chatflowDomain])
    React.useEffect(() => {
        ;(async () => {
            try {
                // console.log('user', { user, isLoading })
                if (!user && !isLoading) {
                    await signinWithRedirect()
                } else if (user) {
                    const newToken = await getAccessTokenSilently({
                        authorizationParams: {
                            // scope: 'write:admin'
                        }
                    })
                    sessionStorage.setItem('access_token', newToken)
                }
            } catch (err) {
                console.log(err)
            }
        })()
    }, [user, isLoading, getAccessTokenSilently, signinWithRedirect])

    return (
        <StyledEngineProvider injectFirst>
            <CssVarsProvider
                theme={cssVarsTheme}
                // CRITICAL: Match configuration from CssVarsThemeProvider
                defaultMode='dark'
                modeStorageKey='mui-mode'
                colorSchemeStorageKey='mui-color-scheme'
                disableNestedContext // Prevent context conflicts when nested inside another provider
            >
                <CssBaseline enableColorScheme />
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
            </CssVarsProvider>
        </StyledEngineProvider>
    )
}

export default App
