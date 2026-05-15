import client from './client'

const getAllChatflows = (params) => client.get('/chatflows?type=CHATFLOW', { params })

const getAllAgentflows = (type, params) => client.get(`/chatflows?type=${type}`, { params })

const getSpecificChatflow = (id) => client.get(`/chatflows/${id}`)

const getSpecificChatflowFromPublicEndpoint = (id) => client.get(`/public-chatflows/${id}`)

const createNewChatflow = (body) => client.post(`/chatflows`, body)

const updateChatflow = (id, body) => client.put(`/chatflows/${id}`, body)

const deleteChatflow = (id) => client.delete(`/chatflows/${id}`)

const getIsChatflowStreaming = (id) => client.get(`/chatflows-streaming/${id}`)

const getAllowChatflowUploads = (id) => client.get(`/chatflows-uploads/${id}`)

// AAI
const getHasChatflowChanged = (id, lastUpdatedDateTime) => client.get(`/chatflows/has-changed/${id}/${lastUpdatedDateTime}`)

const generateAgentflow = (body) => client.post(`/agentflowv2-generator/generate`, body)

const getAdminChatflows = (filter, type = 'CHATFLOW') => {
    const params = new URLSearchParams()
    params.append('type', type)
    if (filter) {
        params.append('filter', JSON.stringify(filter))
    }
    return client.get(`/admin/chatflows?${params.toString()}`)
}

const getDefaultChatflowTemplate = () => client.get('/admin/chatflows/default-template')

const bulkUpdateChatflows = (chatflowIds, options) => client.put('/admin/chatflows/bulk-update', { chatflowIds, options })

// Versioning API methods
const getChatflowVersions = (id) => client.get(`/admin/chatflows/${id}/versions`)

const getChatflowVersion = (id, version) => client.get(`/chatflows/${id}/versions/${version}`)

const rollbackChatflowToVersion = (id, version) => client.post(`/admin/chatflows/${id}/rollback/${version}`)

export default {
    getAllChatflows,
    getAllAgentflows,
    getSpecificChatflow,
    getSpecificChatflowFromPublicEndpoint,
    createNewChatflow,
    updateChatflow,
    deleteChatflow,
    getIsChatflowStreaming,
    getAllowChatflowUploads,
    generateAgentflow,
    // AAI
    getAdminChatflows,
    getDefaultChatflowTemplate,
    bulkUpdateChatflows,
    getChatflowVersions,
    getChatflowVersion,
    rollbackChatflowToVersion,
    getHasChatflowChanged
}
