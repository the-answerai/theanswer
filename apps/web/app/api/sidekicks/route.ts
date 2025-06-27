import { NextResponse } from 'next/server'
import getCachedSession from '@ui/getCachedSession'
import { findSidekicksForChat } from '@utils/findSidekicksForChat'
import { respond401 } from '@utils/auth/respond401'

export async function GET(req: Request) {
    const session = await getCachedSession()
    const { searchParams } = new URL(req.url)
    const lightweight = searchParams.get('lightweight') !== 'false' // Default to true

    const user = session?.user
    if (!session?.user?.email) return respond401()
    try {
        const data = await findSidekicksForChat(user, { lightweight })
        // Use the requiresClone field from the chatbotConfig
        const sidekicksWithCloneInfo = data.sidekicks.map((sidekick: any) => {
            // In lightweight mode, chatbotConfig might not be available
            const chatbotConfig = sidekick.chatflow?.chatbotConfig ? JSON.parse(sidekick.chatflow.chatbotConfig) : {}
            return {
                ...sidekick,
                isExecutable: true
                // sidekick.chatflow.userId === user.id ||
                // (sidekick.chatflow.visibility?.includes('AnswerAI') && sidekick.chatflow.organizationId === user.organizationId),
                // requiresClone: chatbotConfig.requiresClone || !sidekick.chatflow.isPublic
            }
        })
        // console.log({ sidekicks: sidekicksWithCloneInfo })
        return NextResponse.json({ ...data, sidekicks: sidekicksWithCloneInfo })
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return respond401()
        }
        console.error('Error fetching sidekicks:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
