import { getAppSettings } from './getAppSettings'
import { AnswersProvider } from './AnswersContext'
import getCachedSession from './getCachedSession'
import dynamic from 'next/dynamic'
import type { Chat as ChatType, Journey } from 'types'

const ChatDetail = dynamic(() => import('./ChatDetail').then((mod) => ({ default: mod.ChatDetail })))
const Modal = dynamic(() => import('./Modal', { ssr: false }))
export interface Params {
    chat?: ChatType
    journey?: Journey
}

const Chat = async ({ chat, journey }: Params) => {
    const appSettingsPromise = getAppSettings()
    const sessionPromise = getCachedSession()

    const [session, appSettings] = await Promise.all([sessionPromise, appSettingsPromise])

    return (
        <AnswersProvider user={session?.user!} appSettings={appSettings} chat={chat} journey={journey}>
            <Modal />
            <ChatDetail appSettings={appSettings} session={JSON.parse(JSON.stringify(session))} />
        </AnswersProvider>
    )
}

export default Chat
