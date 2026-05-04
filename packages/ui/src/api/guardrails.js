import client from './client'

// Generic organization config endpoints
const getOrgConfig = (orgId) => client.get(`/organizations/${orgId}/config`)

const updateOrgConfig = (orgId, config) => client.put(`/organizations/${orgId}/config`, { config })

// Guardrails convenience endpoints
const getGuardrailsConfig = (orgId) => client.get(`/organizations/${orgId}/config/guardrails`)

const updateGuardrailsConfig = (orgId, guardrails) => client.put(`/organizations/${orgId}/config/guardrails`, { guardrails })

/**
 * Diagnostic selftest. Returns:
 *   { config, credentialSource, healthCheck, capabilities, circuitState, notes }
 * Capabilities is a per-endpoint plan-tier matrix so the admin UI can render
 * which guardrails the connected Fiddler key actually supports.
 */
const getSelftest = (params = {}) => {
    const search = new URLSearchParams()
    if (params.chatflowId) search.set('chatflowId', params.chatflowId)
    if (params.workspaceId) search.set('workspaceId', params.workspaceId)
    const qs = search.toString()
    return client.get(`/guardrails/selftest${qs ? `?${qs}` : ''}`)
}

export default {
    getOrgConfig,
    updateOrgConfig,
    getGuardrailsConfig,
    updateGuardrailsConfig,
    getSelftest
}
