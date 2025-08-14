import client from './client'

const getAllCredentials = () => client.get('/credentials')

const getCredentialsByName = (componentCredentialName) => client.get(`/credentials?credentialName=${componentCredentialName}`)

const getAllComponentsCredentials = () => client.get('/components-credentials')

const getSpecificCredential = (id) => client.get(`/credentials/${id}`)

const getSpecificComponentCredential = (name) => client.get(`/components-credentials/${name}`)

const createCredential = (body) => client.post(`/credentials`, body)

const updateCredential = (id, body) => client.put(`/credentials/${id}`, body)

const deleteCredential = (id) => client.delete(`/credentials/${id}`)

const refreshAccessToken = (body) => client.post(`/credentials/refresh-token`, body)

// Organization credentials management - use Next.js API routes instead of direct Flowise calls
const getOrgCredentials = () => {
    // Call Next.js API route which proxies to Flowise server
    return fetch('/api/admin/org-credentials', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to fetch org credentials')
        }
        const data = await response.json()
        return { data }
    })
}

const updateOrgCredentials = (integrations) => {
    // Call Next.js API route which proxies to Flowise server
    return fetch('/api/admin/org-credentials', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integrations })
    }).then(async (response) => {
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update org credentials')
        }
        const data = await response.json()
        return { data }
    })
}

export default {
    getAllCredentials,
    getCredentialsByName,
    getAllComponentsCredentials,
    getSpecificCredential,
    getSpecificComponentCredential,
    createCredential,
    updateCredential,
    deleteCredential,
    refreshAccessToken,
    getOrgCredentials,
    updateOrgCredentials
}
