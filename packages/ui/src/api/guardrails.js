import client from './client'

// Generic organization config endpoints
const getOrgConfig = (orgId) => client.get(`/organizations/${orgId}/config`)

const updateOrgConfig = (orgId, config) => client.put(`/organizations/${orgId}/config`, { config })

// Guardrails convenience endpoints
const getGuardrailsConfig = (orgId) => client.get(`/organizations/${orgId}/config/guardrails`)

const updateGuardrailsConfig = (orgId, guardrails) => client.put(`/organizations/${orgId}/config/guardrails`, { guardrails })

export default {
    getOrgConfig,
    updateOrgConfig,
    getGuardrailsConfig,
    updateGuardrailsConfig
}
