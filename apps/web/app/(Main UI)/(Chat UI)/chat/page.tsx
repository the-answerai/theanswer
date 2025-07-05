import React from 'react'

import Chat from '@ui/Chat'

export const metadata = {
    title: 'Chats | Answer Agent',
    description: 'Your current Answer Agent chat'
}

const ChatDetailPage = async ({ params }: any) => {
    // Simply render the Chat component - sidekick selection now happens on client-side
    // This enables faster page loads and better caching since no server-side API calls are needed
    return <Chat {...params} />
}

export default ChatDetailPage
