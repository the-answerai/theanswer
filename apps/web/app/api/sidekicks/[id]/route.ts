import { NextResponse } from 'next/server'
import getCachedSession from '@ui/getCachedSession'
import { findSidekicksForChat } from '@utils/findSidekicksForChat'
import { respond401 } from '@utils/auth/respond401'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getCachedSession()
    const user = session?.user

    if (!session?.user?.email) return respond401()

    try {
        // Fetch full data for all sidekicks (non-lightweight mode)
        const data = await findSidekicksForChat(user, { lightweight: false })

        // Find the specific sidekick by ID
        const sidekick = data.sidekicks.find((s: any) => s.id === params.id)

        if (!sidekick) {
            return NextResponse.json({ error: 'Sidekick not found' }, { status: 404 })
        }

        // Add isExecutable flag
        const chatbotConfig = sidekick.chatflow?.chatbotConfig ? JSON.parse(sidekick.chatflow.chatbotConfig) : {}
        const sidekickWithCloneInfo = {
            ...sidekick,
            isExecutable: true
        }

        return NextResponse.json(sidekickWithCloneInfo)
    } catch (error) {
        console.error('Error fetching sidekick details:', error)
        return respond401()
    }
}
