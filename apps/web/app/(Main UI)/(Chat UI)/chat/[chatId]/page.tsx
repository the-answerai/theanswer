import React from 'react'
import { prisma } from '@db/client'
import Chat from '@ui/Chat'
import ChatNotFound from '@ui/ChatNotFound'
import getCachedSession from '@ui/getCachedSession'

import auth0 from '@utils/auth/auth0'
import type { Chatflow, Chat as ChatType, User } from 'types'

async function getChat(chatId: string, user: User) {
    // Get auth token for chatflow API
    let token
    try {
        const { accessToken } = await auth0.getAccessToken({
            authorizationParams: { organization: user.org_name }
        })
        if (!accessToken) throw new Error('No access token found')
        token = accessToken
    } catch (err) {
        console.error('[getChat] Auth error:', err)
    }

    // Check if id corresponds to a valid chat
    const chatUrl = `${user.chatflowDomain}/api/v1/chats/${chatId}`

    const chatflowChatPromise = token
        ? fetch(chatUrl, {
              headers: {
                  'Content-Type': 'application/json',
                  'x-request-from': 'aai',
                  Authorization: `Bearer ${token}`
              }
          })
              .then(async (res) => {
                  if (res.ok) {
                      const data = await res.json()

                      return data
                  }
                  return null
              })
              .catch((err) => {
                  console.error('[getChat] Error fetching chatflow chat:', err)
                  return null
              })
        : Promise.resolve(null)

    const [chatflowChat] = await Promise.all([chatflowChatPromise])

    // Return chatflow chat if local chat doesn't exist
    if (chatflowChat) {
        // IMPORTANT: Ensure chatflowId is included for getMessages to work
        const result = {
            ...chatflowChat,
            chatflowChatId: chatflowChat.id,
            // chatflowId might be 'chatflowid' (lowercase) in the response
            chatflowId: chatflowChat.chatflowId || chatflowChat.chatflowid,
            sidekickId: chatflowChat.sidekickId || chatflowChat.chatflowId || chatflowChat.chatflowid
        }

        return result
    }

    // If no Chat, check if it's a chatflow ID
    const chatflowUrl = `${user.chatflowDomain}/api/v1/chatflows/${chatId}`

    const chatflow: Chatflow = await (token
        ? fetch(chatflowUrl, {
              headers: {
                  'Content-Type': 'application/json',
                  'x-request-from': 'aai',
                  Authorization: `Bearer ${token}`
              }
          })
              .then(async (res) => {
                  return res.ok ? res.json() : null
              })
              .catch((err) => {
                  console.error('[getChat] Error fetching chatflow:', err)
                  return null
              })
        : Promise.resolve(null))

    if (chatflow) {
        return {
            chatflowId: chatflow.id,
            sidekickId: chatflow.id
        }
    }
}

async function getMessages(chat: Partial<ChatType>, user: User) {
    if (!chat?.chatflowChatId) {
        return []
    }

    // The chatflowId is required in the URL path - get it from the chat object
    const chatflowId = (chat as any)?.chatflowId || (chat as any)?.sidekickId
    if (!chatflowId) {
        console.error('[getMessages] No chatflowId found in chat object:', chat)
        return []
    }

    try {
        const { accessToken } = await auth0.getAccessToken({
            authorizationParams: { organization: user.org_name }
        })
        if (!accessToken) throw new Error('No access token found')

        // IMPORTANT: Route is /api/v1/chatmessage/:chatflowId?chatId=xxx
        // The :id param in the route is the chatflowId, chatId goes in query string
        const url = `${user.chatflowDomain}/api/v1/chatmessage/${chatflowId}?chatId=${chat.chatflowChatId}`

        const result = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-request-from': 'aai',
                Authorization: `Bearer ${accessToken}`
            }
        })

        if (!result.ok) {
            const errorText = await result.text()
            console.error('[getMessages] Error response:', errorText)
            throw new Error(`Failed to fetch messages: ${result.status} ${errorText}`)
        }

        let messages: any[] = []
        try {
            messages = await result.json()
        } catch (err) {
            console.error('[getMessages] Error parsing messages:', err)
        }

        return messages?.map((m: any) => ({
            ...m,
            // agentReasoning: JSON.parse(m.agentReasoning ?? '[]'),
            // usedTools: JSON.parse(m.usedTools ?? '[]'),
            // contextDocuments: JSON.parse(m.sourceDocuments ?? '[]'),
            fileUploads: (m.fileUploads as any[])?.map((f: any) => ({
                ...f,
                data: `${user.chatflowDomain}/api/v1/get-upload-file?chatflowId=${m.chatflowid}&chatId=${chat.chatflowChatId}&fileName=${f.name}`
            }))
        }))
    } catch (err) {
        console.error('Error fetching messages:', err)
        return []
    }
}

export const metadata = {
    title: 'Chats | Answer Agent',
    description: 'Your current Answer Agent chat'
}

const ChatDetailPage = async ({ params }: { params: { chatId: string } }) => {
    const session = await getCachedSession()

    if (!session?.user?.email) {
        return <ChatNotFound />
    }

    const user = session.user

    try {
        const [chat] = await Promise.all([getChat(params.chatId, user)])

        if (!chat) {
            return <ChatNotFound />
        }

        // Fetch messages after we have the chat
        const messages = await getMessages(chat, user)
        const chatWithMessages = {
            ...chat,
            messages
        }

        // Chat without credential issues - use regular Chat component
        // The Chat component will handle credential checking using useCredentialChecker hook
        return <Chat {...params} chat={chatWithMessages} journey={chatWithMessages?.journey} />
    } catch (error) {
        console.error('Error loading chat:', error)
        // Even if there's an error, still pass the sidekicks if we have them
        return <Chat />
    }
}

export default ChatDetailPage
