import React from 'react'
import getCachedSession from '@ui/getCachedSession'
import GuardrailsSettings from '@ui/GuardrailsSettings'

export const metadata = {
    title: 'Guardrails Settings | Answer Agent',
    description: 'Configure AI Guardrails for your organization'
}

const GuardrailsSettingsPage = async () => {
    const session = await getCachedSession()

    if (!session?.user?.organizationId) {
        return <div>Unauthorized</div>
    }

    return <GuardrailsSettings organizationId={session.user.organizationId} />
}

export default GuardrailsSettingsPage
