import { prisma } from '@db/client'
import auth0 from '@utils/auth/auth0'

interface User {
    email: string
    organizationId: string
    organizationName: string
    chatflowDomain: string
}

interface PaginationOptions {
    limit?: number
    cursor?: string
}

export async function getChats(user: User, options: PaginationOptions = {}) {
    const { limit = 20, cursor } = options
    // Get auth token for chatflow API
    let token
    try {
        const { accessToken } = await auth0.getAccessToken({
            authorizationParams: { organization: user.organizationName }
        })
        if (!accessToken) throw new Error('No access token found')
        token = accessToken
    } catch (err) {
        console.error('Auth error:', err)
    }

    // Fetch local chats with pagination
    const localChatsPromise = prisma.chat
        .findMany({
            where: {
                users: { some: { email: user.email } },
                organization: { id: user.organizationId },
                chatflowChatId: { not: null },
                journeyId: null,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            include: {
                prompt: true,
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        })
        .then((data: any) => JSON.parse(JSON.stringify(data)))

    // Fetch chatflow chats with pagination
    const chatflowChatsPromise = token
        ? fetch(`${user.chatflowDomain}/api/v1/chats?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              }
          })
              .then((res) => (res.ok ? res.json() : []))
              .catch((err: any) => {
                  console.error('Error fetching chatflow chats:', err.message)
                  return []
              })
        : Promise.resolve([])

    // Wait for both promises to resolve
    const [localChats, chatflowChats] = await Promise.all([localChatsPromise, chatflowChatsPromise])

    // Merge and deduplicate chats
    const mergedChats = [...localChats]
    if (chatflowChats.length > 0) {
        chatflowChats.forEach((chatflowChat: any) => {
            // Only add if not already in local chats
            if (!localChats.some((local) => local.chatflowChatId === chatflowChat.id)) {
                mergedChats.push({
                    ...chatflowChat,
                    chatflowChatId: chatflowChat.id
                })
            }
        })
    }

    // Sort merged chats by date and limit results
    mergedChats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return mergedChats.slice(0, limit)
}
