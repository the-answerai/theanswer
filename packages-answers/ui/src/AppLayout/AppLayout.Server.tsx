import type { Session } from '@utils/auth/aaiAuth0Server'
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
            {...props}
            chatList={
                <Suspense fallback=''>
                    {/* @ts-expect-error Server Component */}
                    <ChatDrawer />
                </Suspense>
            }
        />
    )
}

export default AppLayoutServer
