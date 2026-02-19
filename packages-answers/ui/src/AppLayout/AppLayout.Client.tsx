'use client'
import type { Session } from '@utils/auth/aaiAuth0Server'
import React, { useEffect } from 'react'

import CssBaseline from '@mui/material/CssBaseline'

import { UnifiedThemeProvider } from '../theme'
import GlobalStyles from '../GlobalStyles'

import { AppSettings } from 'types'
import { UserProvider } from '@utils/auth/aaiAuth0Client'
import { Auth0Setup } from '@/hooks/useAuth0Setup'
// @ts-ignore
import { ErrorProvider } from '@/store/context/ErrorContext'
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
    // Protect against paste events with null clipboardData
    // (caused by browser extensions like Grammarly, LastPass, 1Password)
    useEffect(() => {
        function handlePasteCapture(e: ClipboardEvent): void {
            if (!e.clipboardData) {
                e.stopImmediatePropagation()
                return
            }
        }
        window.addEventListener('paste', handlePasteCapture, true)
        return () => window.removeEventListener('paste', handlePasteCapture, true)
    }, [])

    // const authorizationParams = {
    //     organization: session?.user.organizationId,
    //     redirect_uri: typeof window !== 'undefined' ? window?.location?.origin : '',
    //     audience: process.env.VITE_AUTH_AUDIENCE,
    //     scope: 'openid profile email'
    // }

    return (
        <UserProvider>
            <Auth0Setup apiHost={session?.user?.chatflowDomain} accessToken={session?.accessToken}>
                <PermissionProvider initialUser={session?.user as any}>
                    <UnifiedThemeProvider>
                        <CssBaseline enableColorScheme />
                        <GlobalStyles />
                        <ErrorProvider>
                            <SubscriptionDialogProvider>
                                <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
                                    {!noDrawer && <AppDrawer params={params} session={session} />}
                                    <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'auto' }}>
                                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>{children}</div>
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
                        </ErrorProvider>
                    </UnifiedThemeProvider>
                </PermissionProvider>
            </Auth0Setup>
        </UserProvider>
    )
}
