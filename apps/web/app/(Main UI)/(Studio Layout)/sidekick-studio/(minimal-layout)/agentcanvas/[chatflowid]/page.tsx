import React from 'react'
import View from '@/views/canvas/index'
import SidekickSetupModal from '@/components/SidekickSetupModal'

const Page = ({ params }: { params: { chatflowid: string } }) => {
    return (
        <>
            <View chatflowid={params.chatflowid} />
            <SidekickSetupModal sidekickId={params.chatflowid} />
        </>
    )
}

export default Page
