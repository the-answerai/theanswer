'use server'
import React from 'react'
import ChatLayout from '@ui/ChatLayout'
import getCachedSession from '@ui/getCachedSession'
import AppLayout from 'flowise-ui/src/AppLayout'

export default async function ChatUILayout({ children }: { children: React.ReactNode }) {
    const session = await getCachedSession()
    const apiHost = session?.user?.chatflowDomain

    // AppLayout already wraps with AppProvider, no need to double-wrap
    return (
        <AppLayout apiHost={apiHost} accessToken={session?.accessToken}>
            {(<ChatLayout>{children as any}</ChatLayout>) as any}
        </AppLayout>
    )
}
