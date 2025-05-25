import { memo } from 'react'
import { Box } from '@mui/material'
import ChatManager from '../components/chats/ChatManager'

const ChatListPage = memo(function ChatListPage() {
    return (
        <Box>
            <ChatManager />
        </Box>
    )
})

export default ChatListPage
