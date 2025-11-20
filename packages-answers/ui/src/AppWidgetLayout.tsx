'use client'
import { Session } from '@auth0/nextjs-auth0'
import { CssBaseline } from '@mui/material'

import { CssVarsThemeProvider } from './theme/cssVarsTheme'
import GlobalStyles from './GlobalStyles'
import { PermissionProvider } from './PermissionProvider'

const AppWidgetLayout = ({
    session,
    children,
    // Layouts must accept a children prop.
    params
}: {
    session?: Session
    children: any
    params: {
        slug: string
    }
}) => {
    return (
        <PermissionProvider initialUser={session?.user as any}>
            <CssVarsThemeProvider>
                <CssBaseline enableColorScheme />
                <GlobalStyles />
                {children}
            </CssVarsThemeProvider>
        </PermissionProvider>
    )
}

export default AppWidgetLayout
