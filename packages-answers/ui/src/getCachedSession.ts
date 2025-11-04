import { cache } from 'react'
import { prisma } from '@db/client'
import auth0 from '@utils/auth/auth0'
import { authenticateApiKey } from '@utils/auth/authenticateApiKey'
import * as jose from 'jose'
import { User } from 'types'
import { getStripeClient } from '@utils/stripe/getStripeClient'

const getCachedSession = cache(async (req?: any, res: any = new Response()): Promise<{ user: User; accessToken: string }> => {
    let session = null
    try {
        session = await (req && res ? auth0.getSession(req) : auth0.getSession())
    } catch (err) {
        console.debug(`Auth0Error: ${err}`)
    }
    if (!session) {
        try {
            let token = req && req.headers ? req.headers.get('authorization')?.split(' ')[1] : ''
            if (!req) {
                const { headers } = require('next/headers')
                if (headers?.get) token = headers?.get('authorization')?.split(' ')[1] ?? token
            }

            if (token) {
                const jwks = jose.createRemoteJWKSet(new URL(process.env.AUTH0_JWKS_URI!))

                const result = await jose.jwtVerify(token.replace('Bearer ', ''), jwks)
                session = { user: result.payload }
            }
        } catch (err: any) {
            console.debug('next/headers->Error', err.message)
        }
    }

    if (session?.user) {
        let dbOrg = await prisma.organization.findFirst({
            where: {
                name: session.user.org_name
            }
        })
        if (!dbOrg) {
            dbOrg = { id: session.user.org_id, name: session.user.org_name } as any
        }
        const orgData = {
            organizations: {
                connectOrCreate: {
                    where: { id: dbOrg?.id },
                    create: { id: dbOrg?.id, name: session.user.org_name }
                }
            },
            currentOrganization: {
                connectOrCreate: {
                    where: { id: dbOrg?.id },
                    create: { id: dbOrg?.id, name: session.user.org_name }
                }
            }
        }
        const user = await prisma.user.upsert({
            where: {
                email: session.user.email
            },
            create: {
                email: session.user.email,
                name: session.user.name,
                ...orgData
            },
            update: {
                ...orgData
            }
        })
        session.user.id = user.id
        session.user.organizationId = user.organizationId
    }
    if (!session?.user) {
        // no auth0 user, but maybe using an AnswerAI API Key
        const apiKeyData = await authenticateApiKey(req)
        if (apiKeyData?.type === 'user') {
            session = { user: apiKeyData.user } as any
        }
    }
    // Check for CHATFLOW_DOMAIN_OVERRIDE to override the chatflowDomain
    if (process.env.CHATFLOW_DOMAIN_OVERRIDE) {
        // Override chatflowDomain with the environment variable
        if (session?.user) {
            session.user.chatflowDomain = process.env.CHATFLOW_DOMAIN_OVERRIDE
        }
    } else if (session?.user?.chatflowDomain) {
        // Apply existing transformation if no override
        session.user.chatflowDomain = session.user.chatflowDomain?.replace('8080', '4000')
    }
    //Check if user has a subscription make sure no error is thrown
    if (session?.user) {
        let subscription = null
        try {
            const stripe = getStripeClient()
            subscription = await stripe.subscriptions.list({
                customer: session.user.stripeCustomerId,
                status: 'active'
            })
        } catch (error: any) {
            console.error('Error checking Stripe subscription:', error.message)
        }
        if (subscription?.data?.length && subscription?.data?.length > 0) {
            const subscriptionData = subscription.data[0]
            session.user.subscription = subscriptionData
        }
    }

    return session as { user: User; accessToken: string; subscription: any }
})

export default getCachedSession
