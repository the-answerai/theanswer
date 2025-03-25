import client from './client'

const sendMessageAndGetPrediction = (id, input) => client.post(`/internal-prediction/${id}`, input)
const sendMessageAndStreamPrediction = (id, input) => client.post(`/internal-prediction/stream/${id}`, input)

const checkIfChatflowIsValidForStreaming = async (chatflowId) => {
    try {
        const response = await client.get(`/chatflows-streaming/${chatflowId}`)
        return response.data
    } catch (error) {
        console.error('Error checking if chatflow is valid for streaming:', error)
        return { isStreaming: false }
    }
}
const abortMessage = (chatflowId, chatId) => client.post(`/internal-prediction/${chatflowId}/abort`, { chatId })

export default {
    sendMessageAndGetPrediction,
    sendMessageAndStreamPrediction,
    checkIfChatflowIsValidForStreaming,
    abortMessage
}
