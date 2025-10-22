import getCachedSession from '@ui/getCachedSession'
import ChatDrawerClient from './ChatDrawer'
import { getChats } from '@utils/getChats'

const ChatDrawerServer = async () => {
    const session = await getCachedSession()

    if (!session?.user?.email) {
        return null
    }

    // Fetch only initial chats for SSR
    const mergedChats = await getChats(session.user, { limit: 20 })
    return <ChatDrawerClient chats={mergedChats} />
}

export default ChatDrawerServer
