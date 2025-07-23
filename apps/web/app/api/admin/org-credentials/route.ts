import { NextResponse } from 'next/server'
import getCachedSession from '@ui/getCachedSession'
import { respond401 } from '@utils/auth/respond401'
import { EnabledIntegrationsData, EnabledIntegration } from 'types'
import auth0 from '@utils/auth/auth0'

export async function GET(req: Request) {
    try {
        console.log('=== DEBUG: org-credentials GET request started ===')

        const session = await getCachedSession()
        console.log('=== DEBUG: Session check ===', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            userId: session?.user?.id,
            organizationId: session?.user?.organizationId,
            roles: session?.user?.roles
        })

        if (!session?.user?.email) {
            console.log('=== DEBUG: No session/user, returning 401 ===')
            return respond401()
        }

        const { user } = session

        // Check if user is admin
        const isAdmin = Array.isArray(user?.roles) && user.roles.includes('Admin')
        console.log('=== DEBUG: Admin check ===', {
            userRoles: user?.roles,
            isAdmin,
            rolesIsArray: Array.isArray(user?.roles)
        })

        if (!isAdmin) {
            console.log('=== DEBUG: User is not admin, returning 403 ===')
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
        }

        console.log('=== DEBUG: Getting Auth0 access token ===', {
            organizationId: user.organizationId
        })

        // Get user's access token for Flowise authentication
        let accessToken: string | undefined
        try {
            const tokenResponse = await auth0.getAccessToken({
                authorizationParams: { organization: user.organizationId }
            })
            accessToken = tokenResponse.accessToken
            console.log('=== DEBUG: Auth0 token result ===', {
                hasAccessToken: !!accessToken,
                tokenLength: accessToken?.length
            })
        } catch (tokenError) {
            console.error('=== DEBUG: Auth0 token error ===', tokenError)
            return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
        }

        if (!accessToken) {
            console.log('=== DEBUG: No access token received ===')
            return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
        }

        // Use the same domain resolution as other API routes
        const flowiseDomain = user.chatflowDomain || process.env.CHATFLOW_DOMAIN_OVERRIDE || process.env.DOMAIN || 'http://localhost:4000'

        console.log('=== DEBUG: Making request to Flowise ===', {
            domain: flowiseDomain,
            url: `${flowiseDomain}/api/v1/admin/organizations/${user.organizationId}`,
            hasAuthHeader: !!accessToken
        })

        try {
            const response = await fetch(`${flowiseDomain}/api/v1/admin/organizations/${user.organizationId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            console.log('=== DEBUG: Flowise response ===', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            })

            if (!response.ok) {
                console.error('=== DEBUG: Flowise error response ===', {
                    status: response.status,
                    statusText: response.statusText
                })

                // Try to get more details from the error response
                try {
                    const errorText = await response.text()
                    console.error('=== DEBUG: Flowise error body ===', errorText)
                } catch (e) {
                    console.error('=== DEBUG: Could not read error body ===', e)
                }

                return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: response.status })
            }

            const organization = await response.json()
            console.log('=== DEBUG: Organization data ===', {
                hasData: !!organization,
                hasEnabledIntegrations: !!organization.enabledIntegrations,
                enabledIntegrationsLength: organization.enabledIntegrations?.length
            })

            let enabledIntegrationsData: EnabledIntegrationsData = { integrations: [] }

            if (organization.enabledIntegrations) {
                try {
                    enabledIntegrationsData = JSON.parse(organization.enabledIntegrations)
                } catch (error) {
                    console.error('Failed to parse enabledIntegrations:', error)
                }
            }

            console.log('=== DEBUG: Returning success ===', {
                integrationsCount: enabledIntegrationsData.integrations?.length
            })

            return NextResponse.json({
                integrations: enabledIntegrationsData.integrations || []
            })
        } catch (error) {
            console.error('=== DEBUG: Network/fetch error ===', error)
            return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 })
        }
    } catch (error) {
        console.error('=== DEBUG: Outer catch error ===', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getCachedSession()
        if (!session?.user?.email) return respond401()

        const { integrations } = await req.json()
        const { user } = session

        // Check if user is admin
        const isAdmin = Array.isArray(user?.roles) && user.roles.includes('Admin')
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
        }

        // Get user's access token for Flowise authentication
        const { accessToken } = await auth0.getAccessToken({
            authorizationParams: { organization: user.organizationId }
        })
        if (!accessToken) {
            return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
        }

        // Use the same domain resolution as other API routes
        const flowiseDomain = user.chatflowDomain || process.env.CHATFLOW_DOMAIN_OVERRIDE || process.env.DOMAIN || 'http://localhost:4000'

        // Prepare the data structure for the Flowise server
        const enabledIntegrationsData: EnabledIntegrationsData = {
            integrations: integrations as EnabledIntegration[]
        }

        try {
            const response = await fetch(`${flowiseDomain}/api/v1/admin/organizations/${user.organizationId}/enabled-integrations`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({ enabledIntegrations: enabledIntegrationsData })
            })

            if (!response.ok) {
                console.error('Failed to update organization in Flowise:', response.status, response.statusText)
                return NextResponse.json({ error: 'Failed to update organization settings' }, { status: response.status })
            }

            const updatedOrganization = await response.json()

            // Parse the updated enabled integrations
            let updatedIntegrationsData: EnabledIntegrationsData = { integrations: [] }
            if (updatedOrganization.enabledIntegrations) {
                try {
                    updatedIntegrationsData = JSON.parse(updatedOrganization.enabledIntegrations)
                } catch (error) {
                    console.error('Failed to parse updated enabledIntegrations:', error)
                }
            }

            return NextResponse.json({
                success: true,
                integrations: updatedIntegrationsData.integrations || []
            })
        } catch (error) {
            console.error('Error updating organization in Flowise:', error)
            return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 })
        }
    } catch (error) {
        console.error('Failed to update org credentials:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
