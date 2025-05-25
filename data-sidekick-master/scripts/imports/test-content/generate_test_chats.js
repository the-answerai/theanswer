import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TEST_USER_IDS } from './generate_test_users.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to 'local' if no environment is specified

console.log(`Using environment: ${env}`)

// Load environment variables
dotenv.config({ path: `.env.${env}` })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Required environment variables are missing!')
    console.error(`Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.${env}`)
    process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const chatbots = ['CustomerService Bot', 'SalesAssistant Bot', 'TechnicalSupport Bot']
const aiModels = ['GPT-4o', 'GPT-4o-mini', 'Claude-3.5-sonnet']
const resolutionStatuses = ['resolved', 'escalated', 'followup']
const toolsUsedOptions = ['database_lookup', 'product_catalog', 'knowledge_base', 'ticket_system', 'payment_processor', 'email_sender']

function generateRandomChat() {
    const messageCount = Math.floor(Math.random() * 10) + 5 // 5-15 messages
    const messages = []
    let isUserTurn = true

    for (let i = 0; i < messageCount; i++) {
        const timestamp = new Date(Date.now() - (messageCount - i) * 60000).toISOString()
        if (isUserTurn) {
            messages.push({
                role: 'user',
                content: generateUserMessage(),
                timestamp
            })
        } else {
            messages.push({
                role: 'assistant',
                content: generateAssistantMessage(),
                timestamp
            })
        }
        isUserTurn = !isUserTurn
    }

    return messages
}

function generateUserMessage() {
    const userMessages = [
        'I need help with my recent order',
        'How do I reset my password?',
        'Can you check the status of my return?',
        "I'm having trouble with your website",
        'What are your business hours?',
        'Is this item in stock?',
        'How long does shipping take?',
        'Can I change my delivery address?'
    ]
    return userMessages[Math.floor(Math.random() * userMessages.length)]
}

function generateAssistantMessage() {
    const assistantMessages = [
        "I'd be happy to help you with that. Could you please provide your order number?",
        'I understand your concern. Let me look into that for you.',
        'Thanks for reaching out. I can definitely assist you with this.',
        "I'll check our system right away.",
        'Let me guide you through the process.',
        "I've found some information that might help.",
        'According to our records...',
        "Is there anything else you'd like to know?"
    ]
    return assistantMessages[Math.floor(Math.random() * assistantMessages.length)]
}

function getRandomItems(array, min = 1, max = 3) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}

function getRandomAssignedTo() {
    // 30% chance of being unassigned
    if (Math.random() < 0.3) {
        return null
    }
    return TEST_USER_IDS[Math.floor(Math.random() * TEST_USER_IDS.length)]
}

async function generateTestData() {
    // First get all available documents
    const { data: documents, error: docError } = await supabase.from('documents').select('id, title, content_summary, file_type')

    if (docError) {
        console.error('Error fetching documents:', docError)
        return
    }

    function getRandomDocuments() {
        if (!documents?.length) return []
        const count = Math.floor(Math.random() * 3) + 1 // 1-3 documents
        const shuffled = [...documents].sort(() => 0.5 - Math.random())
        return shuffled.slice(0, count).map((doc) => ({
            id: doc.id,
            title: doc.title,
            excerpt: doc.content_summary,
            type: doc.file_type
        }))
    }

    // Generate AI chats
    const aiTestData = Array.from({ length: 10 }, () => ({
        chatbot_name: chatbots[Math.floor(Math.random() * chatbots.length)],
        ai_model: aiModels[Math.floor(Math.random() * aiModels.length)],
        resolution_status: resolutionStatuses[Math.floor(Math.random() * resolutionStatuses.length)],
        summary: 'Customer inquiry about product features and availability. Provided detailed information and resolved concerns.',
        coaching: 'Good handling of product inquiries. Consider proactive suggestions for related products next time.',
        persona: {
            customer_type: ['regular', 'new', 'premium'][Math.floor(Math.random() * 3)],
            interaction_style: ['formal', 'casual', 'technical'][Math.floor(Math.random() * 3)],
            primary_concern: ['product', 'service', 'technical', 'billing'][Math.floor(Math.random() * 4)]
        },
        sentiment_score: Math.random() * 10,
        tags_array: getRandomItems(['product-inquiry', 'technical-issue', 'billing-question', 'feedback', 'complaint', 'praise']),
        tools_used: getRandomItems(toolsUsedOptions),
        chat_messages: generateRandomChat(),
        chat_type: 'ai',
        assigned_to: getRandomAssignedTo(),
        documents_cited: getRandomDocuments()
    }))

    // Generate Live chats
    const liveTestData = Array.from({ length: 5 }, () => ({
        chatbot_name: chatbots[Math.floor(Math.random() * chatbots.length)],
        ai_model: null, // Live chats don't use AI models
        resolution_status: 'in_progress', // Live chats are typically in progress
        summary: 'Ongoing live chat session with customer.',
        coaching: null, // Live chats don't have coaching yet
        persona: {
            customer_type: ['regular', 'new', 'premium'][Math.floor(Math.random() * 3)],
            interaction_style: ['formal', 'casual', 'technical'][Math.floor(Math.random() * 3)],
            primary_concern: ['product', 'service', 'technical', 'billing'][Math.floor(Math.random() * 4)]
        },
        sentiment_score: Math.random() * 10,
        tags_array: getRandomItems(['live-chat', 'urgent', 'support-needed']),
        tools_used: [],
        chat_messages: generateRandomChat(),
        chat_type: 'live',
        assigned_to: getRandomAssignedTo(),
        documents_cited: getRandomDocuments()
    }))

    const allTestData = [...aiTestData, ...liveTestData]

    for (const chat of allTestData) {
        const { error } = await supabase.from('chat_logs').insert(chat)

        if (error) {
            console.error('Error inserting chat:', error)
        } else {
            console.log(`Successfully inserted ${chat.chat_type} chat`)
        }
    }
}

generateTestData()
    .then(() => console.log('Test data generation complete'))
    .catch(console.error)
