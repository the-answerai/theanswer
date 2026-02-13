import { NextRequest, NextResponse } from 'next/server'
import getCachedSession from '@ui/getCachedSession'

export async function POST(request: NextRequest) {
    try {
        const session = await getCachedSession()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { workspaceId } = await request.json()

        if (!workspaceId) {
            return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
        }

        // Verify user has access to this workspace
        const assignedWorkspaces = (session.user as any).assignedWorkspaces || []
        const hasAccess = assignedWorkspaces.some((ws: { id: string }) => ws.id === workspaceId)

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 })
        }

        // Call Flowise server to update active workspace
        // The Flowise endpoint expects the workspace ID as a query parameter
        const apiHost = session.user.chatflowDomain || process.env.FLOWISE_DOMAIN || process.env.API_HOST
        const response = await fetch(`${apiHost}/api/v1/workspace/switch?id=${workspaceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.accessToken}`,
                'x-request-from': 'aai'
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[API workspaces/switch] Failed to switch workspace:', errorData)
            return NextResponse.json({ error: errorData.message || 'Failed to switch workspace' }, { status: response.status })
        }

        const data = await response.json()

        return NextResponse.json({
            success: true,
            activeWorkspaceId: workspaceId,
            ...data
        })
    } catch (error: any) {
        console.error('[API workspaces/switch] Error:', error.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
