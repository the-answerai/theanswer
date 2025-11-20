import { CssVarsThemeProvider } from './theme/cssVarsTheme'
import { mount as ogMount } from 'cypress/react18'
import MockNextRouter from './MockNextRouter'
import { PermissionProvider } from './PermissionProvider'

export const mount = (children: any) =>
    ogMount(
        <MockNextRouter>
            <PermissionProvider>
                <CssVarsThemeProvider>{children}</CssVarsThemeProvider>
            </PermissionProvider>
        </MockNextRouter>
    )
