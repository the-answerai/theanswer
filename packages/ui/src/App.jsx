'use client'
import React from 'react'
import { useSelector } from 'react-redux'

import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'

// routing
import Routes from '@/routes'

// defaultTheme
import themes from '@/themes'

// project imports
import NavigationScroll from '@/layout/NavigationScroll'
import useNotifyParentOfNavigation from './utils/useNotifyParentOfNavigation'

// ==============================|| APP ||============================== //

const App = () => {
    const customization = useSelector((state) => state.customization)
    const user = useSelector((state) => state.auth.user)
    useNotifyParentOfNavigation()
    React.useEffect(() => {
        if (user?.chatflowDomain) {
            sessionStorage.setItem('baseURL', user.chatflowDomain.replace('8080', '4000'))
        }
    }, [user?.chatflowDomain])

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
            </ThemeProvider>
        </StyledEngineProvider>
    )
}

export default App
