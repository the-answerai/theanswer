import React from 'react'
import { useSelector } from 'react-redux'

import { ThemeProvider } from '@mui/material/styles'
import { Button, CssBaseline, StyledEngineProvider } from '@mui/material'

// routing
import Routes from '@/routes'

// defaultTheme
import themes from '@/themes'

// project imports
import NavigationScroll from '@/layout/NavigationScroll'
import { useAuth0 } from '@auth0/auth0-react'
import useNotifyParentOfNavigation from './utils/useNotifyParentOfNavigation'
import { useFlagsmith } from 'flagsmith/react'

// ==============================|| APP ||============================== //

const App = () => {
    const customization = useSelector((state) => state.customization)
    const { user, getAccessTokenSilently, error } = useAuth0()
    const flagsmith = useFlagsmith()
    useNotifyParentOfNavigation()
    React.useEffect(() => {
        if (user) {
            flagsmith.identify(
                `user_${user.org_id}_${
                    user.email
                        ? user.email.split('').reduce((a, b) => {
                              a = (a << 5) - a + b.charCodeAt(0)
                              return a & a
                          }, 0)
                        : ''
                }`,
                {
                    roles: user['https://theanswer.ai/roles']?.join(',')
                }
            )
        }
    }, [user, flagsmith])
    React.useEffect(() => {
        ;(async () => {
            try {
                const newToken = await getAccessTokenSilently({
                    authorizationParams: {
                        // scope: 'write:admin'
                    }
                })
                sessionStorage.setItem('access_token', newToken)
            } catch (err) {
                console.log(err)
            }
        })()
    }, [getAccessTokenSilently])

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
                {error && (
                    <>
                        <h1>{error.message}</h1>
                        <Button onClick={() => loginWithRedirect()}>Try Again</Button>
                    </>
                )}
            </ThemeProvider>
        </StyledEngineProvider>
    )
}

export default App
