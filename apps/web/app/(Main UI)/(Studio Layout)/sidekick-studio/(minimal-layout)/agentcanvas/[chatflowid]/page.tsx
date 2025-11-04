import React from 'react'
import View from '@/views/canvas/index'

interface ViewProps {
    chatflowid: string
}

const Page = async ({ params }: { params: { chatflowid: string } }) => {
    const { chatflowid } = await params
    return (
        <>
            <View chatflowid={chatflowid} />
        </>
    )
}

export default Page
