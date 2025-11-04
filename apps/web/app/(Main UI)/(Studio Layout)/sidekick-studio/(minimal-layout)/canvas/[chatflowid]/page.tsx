'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import SidekickSetupModal from '@/components/SidekickSetupModal'

const View = dynamic(() => import('@/views/canvas/index'), { ssr: false })

const Page = ({ params }: { params: { chatflowid: string } }) => {
    const { chatflowid } = React.use(params)
    return (
        <>
            <View chatflowid={chatflowid} />
            <SidekickSetupModal sidekickId={chatflowid} />
        </>
    )
}

export default Page
