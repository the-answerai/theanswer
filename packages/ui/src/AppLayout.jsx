'use client'
import { useEffect } from 'react'
import PropTypes from 'prop-types'

// style + assets
import '@/assets/scss/style.scss'

// third party

import { StyledEngineProvider } from '@mui/material'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import { cssVarsTheme } from '@ui/theme/cssVarsTheme'
import { initializeThemeStorage } from '@ui/theme/migrateThemeStorage'
import AppProvider from './AppProvider'

// Create a new context

// New component to wrap Auth0 setup

const AppLayout = ({ children, apiHost, accessToken }) => {
    // Run theme migration on mount
    useEffect(() => {
        initializeThemeStorage()
    }, [])

    return (
        <StyledEngineProvider injectFirst>
            <CssVarsProvider
                theme={cssVarsTheme}
                defaultMode='dark'
                modeStorageKey='mui-mode'
                colorSchemeStorageKey='mui-color-scheme'
                disableNestedContext
            >
                <AppProvider apiHost={apiHost} accessToken={accessToken}>
                    {children}
                </AppProvider>
            </CssVarsProvider>
        </StyledEngineProvider>
    )
}

AppLayout.propTypes = {
    children: PropTypes.node,
    apiHost: PropTypes.string,
    accessToken: PropTypes.string
}

export default AppLayout
