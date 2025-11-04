'use client'
import { Session } from '@auth0/nextjs-auth0'
import React from 'react'

import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material'

import { darkModeTheme } from '../theme'
import GlobalStyles from '../GlobalStyles'

import { AppSettings } from 'types'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { Auth0Setup } from '@/hooks/useAuth0Setup'
import dynamic from 'next/dynamic'
import { PermissionProvider } from '../PermissionProvider'
const HelpChatDrawer = dynamic(() => import('../HelpChatDrawer'), { ssr: false })
const HelpChatProvider = dynamic(() => import('../HelpChatContext').then((mod) => mod.HelpChatProvider), {
    ssr: false
})
const AppDrawer = dynamic(() => import('../AppDrawer'))
const SubscriptionDialogProvider = dynamic(() => import('../SubscriptionDialogContext').then((mod) => mod.SubscriptionDialogProvider), {
    ssr: false
})
export default function AppLayout({
    session,

    params,
    children,
    noDrawer
}: {
    session?: Session
    appSettings?: AppSettings
    children: React.ReactNode

    params?: {
        slug: string
    }
    noDrawer?: boolean
}) {
    return (
        <Auth0Provider>
            <Auth0Setup apiHost={session?.user?.chatflowDomain} accessToken={session?.tokenSet?.accessToken}>
                <PermissionProvider initialUser={session?.user as any}>
                    <ThemeProvider theme={darkModeTheme}>
                        <CssBaseline enableColorScheme />
                        <GlobalStyles />
                        <SubscriptionDialogProvider>
                            <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', overflowY: 'auto' }}>
                                {!noDrawer && <AppDrawer session={session} />}
                                <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
                                    <div style={{ width: '100%', position: 'relative' }}>{children}</div>
                                </div>
                                <React.Suspense fallback={<div>Loading...</div>}>
                                    <HelpChatProvider>
                                        <HelpChatDrawer
                                            apiHost='https://lr-production.studio.theanswer.ai'
                                            chatflowid='e24d5572-a27a-40b9-83fe-19a376535b9d'
                                        />
                                    </HelpChatProvider>
                                </React.Suspense>
                            </div>
                        </SubscriptionDialogProvider>
                    </ThemeProvider>
                </PermissionProvider>
            </Auth0Setup>
        </Auth0Provider>
    )
}
