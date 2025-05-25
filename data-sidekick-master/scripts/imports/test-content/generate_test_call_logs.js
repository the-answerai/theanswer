import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { faker } from '@faker-js/faker'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to 'local' if no environment is specified
const tagFilePath = args.find((arg) => arg.startsWith('--tag-file='))?.split('=')[1]
const useRealTags = tagFilePath || process.env.USE_REAL_TAGS === 'true'

console.log(`Using environment: ${env}`)
console.log(`Using real tags: ${useRealTags ? 'Yes' : 'No'}`)

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

// Load tag data if using real tags
let tagData = null
if (useRealTags) {
    try {
        const tagDataPath = tagFilePath || process.env.TAG_DATA_PATH
        if (!tagDataPath) {
            console.error('No tag data file path provided. Use --tag-file=path or set TAG_DATA_PATH environment variable.')
            process.exit(1)
        }

        const fileContent = fs.readFileSync(tagDataPath, 'utf8')
        tagData = JSON.parse(fileContent)
        console.log(`Loaded tag data with ${Object.keys(tagData.tagCombinations).length} tag combinations`)
    } catch (error) {
        console.error('Error loading tag data:', error)
        process.exit(1)
    }
}

// Define tag combinations for different scenarios when not using real tags
const defaultTagCombinations = {
    technical_hardware: ['technical_support', 'hardware', 'urgent'],
    technical_software: ['technical_support', 'software', 'normal'],
    technical_network: ['technical_support', 'network', 'high'],
    billing_payment: ['billing', 'payment', 'normal'],
    billing_refund: ['billing', 'refund', 'high'],
    billing_invoice: ['billing', 'invoice', 'low'],
    sales_new: ['sales', 'new_account', 'normal'],
    sales_upgrade: ['sales', 'upgrade', 'high'],
    customer_complaint: ['customer_service', 'complaint', 'high'],
    customer_inquiry: ['customer_service', 'general_inquiry', 'normal']
}

function generateTestCallLogs(count = 50) {
    const callTypes = ['inbound', 'outbound', 'missed', 'voicemail']
    const resolutionStatuses = ['resolved', 'followup', 'unresolved']

    return Array.from({ length: count }, (_, index) => {
        const callDuration = faker.number.float({ min: 30, max: 3600, precision: 0.1 }) // 30 seconds to 1 hour
        const employeeId = faker.number.int({ min: 1000, max: 9999 })
        const employeeName = faker.person.fullName()

        // Select tags based on whether we're using real tags or default ones
        let selectedTags
        if (useRealTags && tagData) {
            // Get a random combination from the real tag data
            const combinationKeys = Object.keys(tagData.tagCombinations)
            const randomKey = faker.helpers.arrayElement(combinationKeys)
            selectedTags = tagData.tagCombinations[randomKey]
        } else {
            // Use the default tag combinations
            const combinationKey = faker.helpers.arrayElement(Object.keys(defaultTagCombinations))
            selectedTags = defaultTagCombinations[combinationKey]
        }

        // Generate word timestamps for transcription
        const wordTimestamps = Array.from({ length: faker.number.int({ min: 50, max: 200 }) }, (_, i) => ({
            word: faker.lorem.word(),
            start: i * faker.number.float({ min: 0.2, max: 0.5, precision: 0.01 }),
            end: (i + 1) * faker.number.float({ min: 0.2, max: 0.5, precision: 0.01 }),
            confidence: faker.number.float({ min: 0.7, max: 1, precision: 0.01 })
        }))

        // Generate sentiment score between 1-10 instead of -1 to 1
        const sentimentScore = faker.number.float({ min: 1, max: 10, precision: 0.1 })

        return {
            resolution_status: faker.helpers.arrayElement(resolutionStatuses),
            summary: faker.lorem.paragraph(),
            EMPLOYEE_NAME: employeeName,
            EMPLOYEE_ID: employeeId,
            TAGS_ARRAY: selectedTags,
            persona: {
                tone: faker.helpers.arrayElement(['professional', 'friendly', 'concerned', 'frustrated']),
                emotion: faker.helpers.arrayElement(['neutral', 'positive', 'negative']),
                characteristics: faker.helpers.arrayElements(['polite', 'clear', 'patient', 'knowledgeable', 'empathetic'], {
                    min: 1,
                    max: 3
                })
            },
            sentiment_score: sentimentScore,
            ANSWERED_BY: employeeName,
            escalated: faker.datatype.boolean(),
            CALLER_NAME: faker.person.fullName(),
            TRANSCRIPTION: faker.lorem.paragraphs({ min: 3, max: 7 }),
            coaching: faker.lorem.paragraph(),
            FILENAME: `call_${index + 1}_${faker.string.alphanumeric(8)}.mp3`,
            CALL_TYPE: faker.helpers.arrayElement(callTypes),
            RECORDING_URL: `https://storage.example.com/calls/${faker.string.uuid()}.mp3`,
            CALL_DURATION: callDuration,
            CALL_NUMBER: faker.phone.number(),
            WORD_TIMESTAMPS: wordTimestamps,
            TAGS: selectedTags.join(',')
        }
    })
}

async function generateTestCallLogsData() {
    try {
        console.log('Starting to generate test call logs...')

        // Clear existing data
        await supabase.from('call_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        console.log('Cleared existing call logs')

        // Generate and insert call logs in batches of 10
        const allCallLogs = generateTestCallLogs(50)

        for (let i = 0; i < allCallLogs.length; i += 10) {
            const batch = allCallLogs.slice(i, i + 10)
            const { error } = await supabase.from('call_log').insert(batch)

            if (error) {
                console.error(`Error inserting call logs batch ${i / 10 + 1}:`, error)
                return
            }
        }

        console.log(`Successfully generated ${allCallLogs.length} call logs!`)
    } catch (error) {
        console.error('Error in generateTestCallLogsData:', error)
    }
}

generateTestCallLogsData()
