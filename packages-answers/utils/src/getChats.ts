import auth0 from './auth/auth0'

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
        const { token: accessToken } = await auth0.getAccessToken({
            audience: 'https://theanswer.ai',
            refresh: true,
            scope: 'openid profile email'
            // authorizationParams: { organization: user.organizationName }
        })
        if (!accessToken) throw new Error('No access token found')
        token = accessToken
    } catch (err) {
        console.error('Auth error:', err)
        return []
    }

    // Fetch chatflow chats with pagination
    try {
        const response = await fetch(`${user.chatflowDomain}/api/v1/chats?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })

        if (!response.ok) {
            console.error('Error fetching chatflow chats:', response.statusText)
            return []
        }

        return await response.json()
    } catch (err: any) {
        console.error(err)
        return []
    }
}
