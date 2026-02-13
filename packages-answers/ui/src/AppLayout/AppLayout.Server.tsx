import { Session } from '@auth0/nextjs-auth0'
import AppLayoutClient from './AppLayout.Client'
import { AppSettings } from 'types'
import { Suspense } from 'react'
import ChatDrawer from '@ui/ChatDrawer'

const AppLayoutServer = (props: {
    session?: Session
    appSettings?: AppSettings
    // providers: Record<string, ClientSafeProvider> | null;
    children: any
    params?: {
        slug: string
    }
    noDrawer?: boolean
}) => {
    return (
        <AppLayoutClient
            {...(props as any)}
            chatList={
                <Suspense fallback=''>
                    <ChatDrawer />
                </Suspense>
            }
        />
    )
}

export default AppLayoutServer
