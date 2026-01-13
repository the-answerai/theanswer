import React from 'react'
import { prisma } from '@db/client'
import UserProfile from '@ui/UserProfile/UserProfile'
import getCachedSession from '@ui/getCachedSession'

export const metadata = {
    title: 'User Settings | Answer Agent',
    description: 'User Settings'
}

const UserFormPage = async ({ params }: any) => {
    const session = await getCachedSession()

    if (!session?.user?.email) return null

    // Get context fields from Prisma (for editing user variables)
    const prismaUser = await prisma.user
        .findFirst({
            where: {
                id: session.user.id
            },
            select: { id: true, contextFields: true }
        })
        .then((data: any) => JSON.parse(JSON.stringify(data)))

    // Merge Prisma data with enriched session data (from Flowise /auth/me)
    const user = {
        ...session.user,
        contextFields: prismaUser?.contextFields || []
    }
    return <UserProfile {...params} user={user} />
}

export default UserFormPage
