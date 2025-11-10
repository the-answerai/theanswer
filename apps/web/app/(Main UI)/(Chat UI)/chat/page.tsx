import React from 'react'
import Chat from '@ui/Chat'
import getCachedSession from '@ui/getCachedSession'
import { findSidekicksForChat } from '@utils/findSidekicksForChat'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Chats | Answer Agent',
    description: 'Your current Answer Agent chat'
}

const ChatDetailPage = ({ params }: any) => {
    return <Chat {...params} />
}

export default ChatDetailPage
