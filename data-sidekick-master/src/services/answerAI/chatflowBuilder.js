/**
 * Chatflow Builder Service
 *
 * Provides functionality to create and manage chatflows for research views
 * using the AnswerAI API.
 */
import fs from 'node:fs'
import path from 'node:path'
import axios from 'axios'
import { supabase } from '../../config/db.js'
import { makeApiRequest } from './client.js'

// Path to the conversation QA Chain template
const CONVERSATION_QA_TEMPLATE_PATH = path.join(process.cwd(), 'chatflows', 'conversationQaChain.json')

// Get credential IDs from environment variables
const ANSWERAI_ANTHROPIC_CREDENTIAL_ID = process.env.ANSWERAI_ANTHROPIC_CREDENTIAL_ID
const ANSWERAI_WHISPER_CREDENTIAL_ID = process.env.ANSWERAI_WHISPER_CREDENTIAL_ID
const ANSWERAI_GROQ_CREDENTIAL_ID = process.env.ANSWERAI_GROQ_CREDENTIAL_ID
const ANSWERAI_REDIS_CREDENTIAL_ID = process.env.ANSWERAI_REDIS_CREDENTIAL_ID

/**
 * Create a chatflow for a research view based on the conversation QA template
 *
 * @param {Object} researchView - The research view object
 * @returns {Object} - Object containing the chatflow ID and status
 */
export const createChatflowForResearchView = async (researchView) => {
    try {
        if (!researchView) {
            console.error('No research view provided to createChatflowForResearchView')
            return { success: false, error: 'No research view provided' }
        }

        if (!researchView.answerai_store_id) {
            console.error('Research view has no document store ID')
            return { success: false, error: 'Research view has no document store ID' }
        }

        // Verify credential IDs are available
        if (!ANSWERAI_ANTHROPIC_CREDENTIAL_ID) {
            console.error('AnswerAI Anthropic credential ID is not set in environment variables')
            return { success: false, error: 'Anthropic credential ID not set' }
        }

        if (!ANSWERAI_WHISPER_CREDENTIAL_ID) {
            console.warn('AnswerAI Whisper credential ID is not set in environment variables, speech-to-text may not work')
            // Continue anyway as this is optional
        }

        if (!ANSWERAI_REDIS_CREDENTIAL_ID) {
            console.warn('AnswerAI Redis credential ID is not set in environment variables, chat memory may not work')
            // Continue anyway as this is optional
        }

        console.log(`Creating chatflow for research view: ${researchView.id} (${researchView.name})`)

        // Load the conversation QA chain template
        let templateData
        try {
            const templateContent = fs.readFileSync(CONVERSATION_QA_TEMPLATE_PATH, 'utf8')
            templateData = JSON.parse(templateContent)

            // Validate all required fields are present
            console.log('Template structure:', Object.keys(templateData))
            if (!templateData.flowData) {
                console.error('Template is missing flowData property')
                return { success: false, error: 'Template missing flowData' }
            }

            // Ensure all required properties exist, initialize with defaults if missing
            // Fix typo in category if present
            if (templateData?.category?.includes('knoweldgebase')) {
                console.log('Fixing typo in category: knoweldgebase -> knowledgebase')
                templateData.category = templateData.category.replace('knoweldgebase', 'knowledgebase')
            }
            templateData.category = templateData.category || 'conversational;knowledgebase'
            templateData.chatbotConfig = templateData.chatbotConfig || {}
            templateData.speechToText = templateData.speechToText || {}
        } catch (error) {
            console.error('Error loading conversation QA template:', error)
            return { success: false, error: 'Error loading template' }
        }

        // Update the document store ID and credential IDs in the template
        const storeId = researchView.answerai_store_id
        try {
            const nodes = templateData?.flowData?.nodes
            if (nodes) {
                // Update each node as needed
                for (const node of nodes) {
                    // Update document store node
                    if (node?.data?.type === 'DocumentStoreVS' && node?.data?.inputs) {
                        node.data.inputs.selectedStore = storeId
                    }

                    // Update ChatAnthropic model node
                    if (node?.data?.type === 'ChatAnthropic') {
                        console.log(`Updating Anthropic credential ID in node: ${node.id}`)

                        // ChatAnthropic node typically has credential at node.data level
                        node.data.credential = ANSWERAI_ANTHROPIC_CREDENTIAL_ID

                        // Log the update for debugging
                        console.log(
                            'ChatAnthropic node updated with credential:',
                            ANSWERAI_ANTHROPIC_CREDENTIAL_ID ? `${ANSWERAI_ANTHROPIC_CREDENTIAL_ID.substring(0, 8)}...` : 'not set'
                        )
                    }

                    // Update GroqChat model node
                    if (node?.data?.type === 'GroqChat' && ANSWERAI_GROQ_CREDENTIAL_ID) {
                        console.log('Updating GroqChat credential')
                        // Check if the credential should be in inputs or at the node level
                        if (node?.data?.inputs) {
                            console.log('Setting GroqChat credential in inputs object')
                            node.data.inputs.credential = ANSWERAI_GROQ_CREDENTIAL_ID
                        } else {
                            console.log('Setting GroqChat credential at node.data level')
                            node.data.credential = ANSWERAI_GROQ_CREDENTIAL_ID
                        }

                        // Log the node structure after update
                        console.log(
                            'GroqChat node structure:',
                            JSON.stringify({
                                nodeId: node.id,
                                hasInputs: !!node?.data?.inputs,
                                credentialPath: node?.data?.inputs ? 'inputs.credential' : 'data.credential'
                            })
                        )
                    }

                    // Update memory nodes - handle both Redis and Buffer memory
                    if (node?.data?.type === 'RedisBackedChatMemory' && ANSWERAI_REDIS_CREDENTIAL_ID) {
                        console.log(`Updating Redis credential ID to ${ANSWERAI_REDIS_CREDENTIAL_ID}`)
                        node.data.inputs.credential = ANSWERAI_REDIS_CREDENTIAL_ID
                    }
                }
            }

            // Update the Whisper credential ID in the speechToText section if available
            if (templateData.speechToText?.openAIWhisper && ANSWERAI_WHISPER_CREDENTIAL_ID) {
                console.log(
                    `Updating Whisper credential ID from ${templateData.speechToText.openAIWhisper.credentialId} to ${ANSWERAI_WHISPER_CREDENTIAL_ID}`
                )
                templateData.speechToText.openAIWhisper.credentialId = ANSWERAI_WHISPER_CREDENTIAL_ID
            }
        } catch (error) {
            console.error('Error updating template data:', error)
            // Continue anyway, as the template structure might be different
        }

        // Prepare the chatflow data
        const chatflowData = {
            name: `${researchView.name} - QA Chatbot`,
            deployed: true,
            isPublic: true,
            category: templateData.category || 'conversational;knowledgebase',
            type: 'CHATFLOW'
        }

        // Add flowData with validation
        if (templateData.flowData) {
            try {
                // Ensure flowData is properly stringified
                chatflowData.flowData =
                    typeof templateData.flowData === 'string' ? templateData.flowData : JSON.stringify(templateData.flowData)
            } catch (flowDataError) {
                console.error('Error stringifying flowData:', flowDataError)
                return { success: false, error: 'Invalid flowData format' }
            }
        } else {
            console.error('Template is missing flowData')
            return { success: false, error: 'Template missing flowData' }
        }

        // Add chatbotConfig with validation
        if (templateData.chatbotConfig) {
            try {
                // Ensure chatbotConfig is properly stringified
                chatflowData.chatbotConfig =
                    typeof templateData.chatbotConfig === 'string' ? templateData.chatbotConfig : JSON.stringify(templateData.chatbotConfig)
            } catch (configError) {
                console.error('Error stringifying chatbotConfig:', configError)
                return { success: false, error: 'Invalid chatbotConfig format' }
            }
        } else {
            // Set default empty object if chatbotConfig is missing
            chatflowData.chatbotConfig = JSON.stringify({})
        }

        // Add speechToText with validation
        if (templateData.speechToText) {
            try {
                // Ensure speechToText is properly stringified
                chatflowData.speechToText =
                    typeof templateData.speechToText === 'string' ? templateData.speechToText : JSON.stringify(templateData.speechToText)
            } catch (speechError) {
                console.error('Error stringifying speechToText:', speechError)
                return { success: false, error: 'Invalid speechToText format' }
            }
        } else {
            // Set default empty object if speechToText is missing
            chatflowData.speechToText = JSON.stringify({})
        }

        // Log the payload for debugging
        console.log('Preparing chatflow payload with data:', {
            name: chatflowData.name,
            flowDataLength: chatflowData.flowData ? chatflowData.flowData.length : 0,
            chatbotConfigLength: chatflowData.chatbotConfig ? chatflowData.chatbotConfig.length : 0,
            speechToTextLength: chatflowData.speechToText ? chatflowData.speechToText.length : 0
        })

        // Make the API request to create the chatflow
        const apiUrl = process.env.ANSWERAI_ENDPOINT || 'http://localhost:4000/api/v1'
        const apiToken = process.env.ANSWERAI_TOKEN

        if (!apiToken) {
            console.error('No AnswerAI API token found')
            return { success: false, error: 'No API token' }
        }

        try {
            console.log(`Making chatflow creation request to ${apiUrl}/chatflows`)
            const response = await axios.post(`${apiUrl}/chatflows`, chatflowData, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${apiToken}`
                },
                timeout: 30000 // 30 second timeout
            })

            if (!response.data || !response.data.id) {
                console.error('AnswerAI API returned invalid response:', response.data)
                return { success: false, error: 'Invalid API response' }
            }

            const chatflowId = response.data.id
            console.log(`Successfully created chatflow with ID: ${chatflowId}`)

            // Update the research view with the chatflow ID
            const { error: updateError } = await supabase
                .from('research_views')
                .update({
                    answerai_chatflow_id: chatflowId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', researchView.id)

            if (updateError) {
                console.error(`Error updating research view with chatflow ID: ${updateError.message}`)
                return { success: true, chatflowId, warning: 'Failed to update research view' }
            }

            return { success: true, chatflowId }
        } catch (error) {
            console.error('Error during chatflow API request:')

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Status:', error.response.status)
                console.error('Headers:', error.response.headers)
                console.error('Data:', error.response.data)
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request)
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Request error:', error.message)
            }

            return {
                success: false,
                error: error.message,
                details: error.response?.data || error.stack,
                status: error.response?.status
            }
        }
    } catch (error) {
        console.error(`Error creating chatflow for research view ${researchView?.id}:`, error)
        return {
            success: false,
            error: error.message,
            details: error.response?.data || error.stack
        }
    }
}

/**
 * Get a chatflow by ID
 *
 * @param {string} chatflowId - The chatflow ID
 * @returns {Object} - The chatflow data
 */
export const getChatflow = async (chatflowId) => {
    try {
        if (!chatflowId) {
            throw new Error('No chatflow ID provided')
        }

        const apiUrl = process.env.ANSWERAI_ENDPOINT || 'http://localhost:4000/api/v1'
        const apiToken = process.env.ANSWERAI_TOKEN

        if (!apiToken) {
            throw new Error('No AnswerAI API token found')
        }

        const response = await axios.get(`${apiUrl}/chatflows/${chatflowId}`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${apiToken}`
            }
        })

        return response.data
    } catch (error) {
        console.error(`Error getting chatflow with ID ${chatflowId}:`, error)
        throw error
    }
}

/**
 * Update an existing chatflow
 *
 * @param {string} chatflowId - The ID of the chatflow to update
 * @param {Object} updateData - The data to update
 * @returns {Object} - The updated chatflow data
 */
export const updateChatflow = async (chatflowId, updateData) => {
    try {
        if (!chatflowId) {
            throw new Error('No chatflow ID provided')
        }

        const apiUrl = process.env.ANSWERAI_ENDPOINT || 'http://localhost:4000/api/v1'
        const apiToken = process.env.ANSWERAI_TOKEN

        if (!apiToken) {
            throw new Error('No AnswerAI API token found')
        }

        const response = await axios.put(`${apiUrl}/chatflows/${chatflowId}`, updateData, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${apiToken}`
            }
        })

        return response.data
    } catch (error) {
        console.error(`Error updating chatflow with ID ${chatflowId}:`, error)
        throw error
    }
}
