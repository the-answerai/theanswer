'use client'
import type { Session } from '@utils/auth/aaiAuth0Server'

import CssBaseline from '@mui/material/CssBaseline'
import ThemeProvider from '@mui/material/styles/ThemeProvider'

import { darkModeTheme } from './theme'
import GlobalStyles from './GlobalStyles'
import { PermissionProvider } from './PermissionProvider'

const AppWidgetLayout = ({
    session,
    children,
    // Layouts must accept a children prop.
    params: _params
}: {
    session?: Session
    children: any
    params: {
        slug: string
    }
}) => {
    return (
        <PermissionProvider initialUser={session?.user as any}>
            <ThemeProvider theme={darkModeTheme}>
                <CssBaseline enableColorScheme />
                <GlobalStyles />
                {children}
            </ThemeProvider>
        </PermissionProvider>
    )
}

export default AppWidgetLayout
