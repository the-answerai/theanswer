import { NextResponse } from 'next/server'
import getCachedSession from '@ui/getCachedSession'
import { respond401 } from '@utils/auth/respond401'
import { EnabledIntegrationsData, EnabledIntegration } from 'types'
import auth0 from '@utils/auth/auth0'

export async function GET(req: Request) {
    try {
        const session = await getCachedSession()

        if (!session?.user?.email) {
            return respond401()
        }

        const { user } = session

        // Allow any authenticated organization member (Admin/Builder/Member) to read integrations
        const allowedViewerRoles = ['Admin', 'Builder', 'Member']
        const hasViewAccess = Array.isArray(user?.roles) && user.roles.some((r: string) => allowedViewerRoles.includes(r))
        if (!hasViewAccess) {
            return NextResponse.json({ error: 'Unauthorized - Organization membership required' }, { status: 403 })
        }

        // Get user's access token for Flowise authentication
        let accessToken: string | undefined
        try {
            const tokenResponse = await auth0.getAccessToken({
                authorizationParams: { organization: user.organizationId }
            })
            accessToken = tokenResponse.accessToken
        } catch (tokenError) {
            console.error('=== DEBUG: Auth0 token error ===', tokenError)
            return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
        }

        if (!accessToken) {
            return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
        }

        // Use the same domain resolution as other API routes
        const flowiseDomain = process.env.CHATFLOW_DOMAIN_OVERRIDE || user.chatflowDomain || process.env.DOMAIN

        try {
            const response = await fetch(`${flowiseDomain}/api/v1/admin/organizations/${user.organizationId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
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

            let enabledIntegrationsData: EnabledIntegrationsData = { integrations: [] }

            if (
                organization?.enabledIntegrations &&
                typeof organization.enabledIntegrations === 'string' &&
                organization.enabledIntegrations.length > 0
            ) {
                try {
                    enabledIntegrationsData = JSON.parse(organization.enabledIntegrations)
                } catch (error) {
                    console.error('Failed to parse enabledIntegrations:', error)
                }
            }

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

        // Validate and prepare the data structure for the Flowise server
        if (!Array.isArray(integrations)) {
            return NextResponse.json({ error: 'Integrations must be an array' }, { status: 400 })
        }

        // Validate each integration object
        for (const integration of integrations) {
            if (!integration || typeof integration !== 'object') {
                return NextResponse.json({ error: 'Each integration must be an object' }, { status: 400 })
            }

            if (typeof integration.credentialName !== 'string' || !integration.credentialName.trim()) {
                return NextResponse.json(
                    { error: 'Integration credentialName is required and must be a non-empty string' },
                    { status: 400 }
                )
            }

            if (typeof integration.label !== 'string' || !integration.label.trim()) {
                return NextResponse.json({ error: 'Integration label is required and must be a non-empty string' }, { status: 400 })
            }

            if (typeof integration.enabled !== 'boolean') {
                return NextResponse.json({ error: 'Integration enabled must be a boolean' }, { status: 400 })
            }

            // Validate optional fields if present
            if (integration.description !== undefined && typeof integration.description !== 'string') {
                return NextResponse.json({ error: 'Integration description must be a string if provided' }, { status: 400 })
            }

            if (integration.environmentVariables !== undefined) {
                if (!Array.isArray(integration.environmentVariables)) {
                    return NextResponse.json({ error: 'Integration environmentVariables must be an array if provided' }, { status: 400 })
                }

                for (const envVar of integration.environmentVariables) {
                    if (!envVar || typeof envVar !== 'object') {
                        return NextResponse.json({ error: 'Environment variables must be objects' }, { status: 400 })
                    }
                    if (typeof envVar.key !== 'string' || typeof envVar.value !== 'string') {
                        return NextResponse.json({ error: 'Environment variable key and value must be strings' }, { status: 400 })
                    }
                    if (envVar.description !== undefined && typeof envVar.description !== 'string') {
                        return NextResponse.json(
                            { error: 'Environment variable description must be a string if provided' },
                            { status: 400 }
                        )
                    }
                }
            }

            if (integration.organizationCredentialIds !== undefined) {
                if (!Array.isArray(integration.organizationCredentialIds)) {
                    return NextResponse.json(
                        { error: 'Integration organizationCredentialIds must be an array if provided' },
                        { status: 400 }
                    )
                }

                for (const id of integration.organizationCredentialIds) {
                    if (typeof id !== 'string') {
                        return NextResponse.json({ error: 'Organization credential IDs must be strings' }, { status: 400 })
                    }
                }
            }
        }

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

            // Return the updated integrations data so the frontend can update its state
            return NextResponse.json({
                success: true,
                message: 'Organization integrations updated successfully',
                integrations: enabledIntegrationsData.integrations
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
