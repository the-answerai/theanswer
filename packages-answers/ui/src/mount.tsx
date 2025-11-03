import { ThemeProvider } from '@emotion/react'
import { darkModeTheme } from './theme'
import { mount as ogMount } from 'cypress/react18'
import MockNextRouter from './MockNextRouter'
import { PermissionProvider } from './PermissionProvider'

export const mount = (children: any) =>
    ogMount(
        <MockNextRouter>
            <PermissionProvider>
                <ThemeProvider theme={darkModeTheme}>{children}</ThemeProvider>
            </PermissionProvider>
        </MockNextRouter>
    )
