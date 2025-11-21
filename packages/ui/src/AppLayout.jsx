'use client'
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { store } from '@/store'

// style + assets
import '@/assets/scss/style.scss'

// third party

import { StyledEngineProvider } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import themes from '@/themes'
import AppProvider from './AppProvider'

// Create a new context

// New component to wrap Auth0 setup

const AppLayout = ({ children, apiHost, accessToken }) => {
    const [customization, setCustomization] = useState(store.getState().customization)

    // Subscribe to Redux changes
    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            setCustomization(store.getState().customization)
        })
        return () => unsubscribe()
    }, [])

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <AppProvider apiHost={apiHost} accessToken={accessToken}>
                    {children}
                </AppProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    )
}

AppLayout.propTypes = {
    children: PropTypes.node,
    apiHost: PropTypes.string,
    accessToken: PropTypes.string
}

export default AppLayout
