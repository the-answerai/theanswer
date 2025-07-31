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

// Organization credentials management
const getOrgCredentials = () => client.get('/admin/org-credentials')

const updateOrgCredentials = (integrations) => client.post('/admin/org-credentials', { integrations })

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
