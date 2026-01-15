import { redirect } from 'next/navigation'
import React from 'react'
import ChatRedirectHandler from '@ui/ChatRedirectHandler'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Home',
    description: 'Welcome to Answer Agent - AI-powered answers for your organization.',
    openGraph: {
        title: 'Answer Agent | AI-Powered Enterprise Solutions',
        description: 'Welcome to Answer Agent - AI-powered answers for your organization.',
        images: [
            {
                url: '/api/og?title=Answer%20Agent&description=AI-powered%20answers%20for%20your%20organization',
                width: 1200,
                height: 630
            }
        ]
    }
}

const HomepagePage = async () => {
    return <ChatRedirectHandler />
}

export default HomepagePage
