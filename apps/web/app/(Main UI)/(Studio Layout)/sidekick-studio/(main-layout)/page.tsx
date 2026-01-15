import React from 'react'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { generateOGMetadata } from '../../../../../lib/og'

const View = dynamic(() => import('@/views/chatflows/index'), { ssr: false })

export const metadata: Metadata = {
    title: 'Chatflows',
    description: 'Build and manage AI chatflows with Sidekick Studio',
    openGraph: generateOGMetadata({
        title: 'Sidekick Studio',
        description: 'Build and manage AI chatflows for your organization',
        type: 'chatflow'
    })
}
const Page = () => {
    return (
        <>
            <View />
        </>
    )
}

export default Page
