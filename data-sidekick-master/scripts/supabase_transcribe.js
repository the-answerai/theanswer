import fs from 'node:fs'
import path from 'node:path'
import csv from 'csv-parser'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
const argMap = {}

// Process arguments in format --key=value or --flag
for (const arg of args) {
    if (arg.startsWith('--')) {
        const parts = arg.substring(2).split('=')
        if (parts.length === 2) {
            // Handle --key=value format
            argMap[parts[0]] = parts[1]
        } else {
            // Handle --flag format (boolean true)
            argMap[parts[0]] = true
        }
    }
}

// =====================================================================
// CLIENT-SPECIFIC CONFIGURATION
// =====================================================================

/**
 * Client configuration object - modify these values for each client
 */
const CLIENT_CONFIG = {
    // Client name (used for logging)
    clientName: 'RetailDataSystems',

    // Environment to use (.env file suffix)
    // Options: 'local', 'prime', 'wow'
    environment: 'rds',

    // Path to the input directory containing audio recordings
    inputDir: 'downloaded_recordings/retaildatasystems',

    // Path to the original CSV file with call data
    originalCsvPath: 'csv/retail-data-systems-with-filenames.csv',

    // CSV column that contains the recording filename
    // Set to null if filename needs to be extracted from another field
    filenameColumn: 'Recording Filename',

    // If filenameColumn is null, specify the column to extract filename from
    filenameSourceColumn: null,

    // Function to extract filename from source column (if filenameColumn is null)
    // This is client-specific and should be modified based on the CSV structure
    extractFilename: (row) => {
        // Example: Extract filename from a URL or other field
        // For RetailDataSystems, we directly use the Recording Filename column
        return row['Recording Filename']
    },

    // CSV to Supabase field mapping
    // Maps CSV column names to Supabase call_log table column names
    fieldMapping: {
        Type: 'CALL_TYPE',
        'Local Name': 'EMPLOYEE_NAME',
        'Local Number': 'EMPLOYEE_ID',
        'Remote Name': 'CALLER_NAME',
        'Remote Number': 'CALL_NUMBER',
        'Resolution Code': 'resolution_status',
        Duration: 'CALL_DURATION',
        'Recording Filename': 'FILENAME'
    },

    // Default values for fields that might not be in the CSV
    defaultValues: {
        TAGS_ARRAY: [],
        escalated: false,
        sentiment_score: null,
        summary: null,
        coaching: null,
        persona: {}
    },

    // Transcription model to use
    transcriptionModel: 'distil-whisper-large-v3-en',

    // Language for transcription
    transcriptionLanguage: 'en',

    // Rate limiting configuration
    requestsPerMinute: 100,
    batchSize: 25,
    requestTimeout: 60_000, // 60 seconds

    // Testing configuration - set to null for processing all files
    // Set to a number (e.g., 10) to process only that many files
    // testingLimit: 1,

    // Document creation configuration
    createDocuments: true, // Whether to create document records
    researchViewId: 'fbda342a-46e7-43a2-b264-baeab963c45e', // Default research view ID (replace with actual ID)
    dataSourceId: null // Will be set dynamically if null
}

// Override configuration with command line arguments
if (argMap.limit && !Number.isNaN(Number.parseInt(argMap.limit, 10))) {
    CLIENT_CONFIG.testingLimit = Number.parseInt(argMap.limit, 10)
}

if (argMap.documents === 'false' || argMap.documents === '0') {
    CLIENT_CONFIG.createDocuments = false
}

if (argMap.documents === 'true' || argMap.documents === '1') {
    CLIENT_CONFIG.createDocuments = true
}

if (argMap.researchViewId) {
    CLIENT_CONFIG.researchViewId = argMap.researchViewId
}

if (argMap.help) {
    console.log(`
Usage: node supabase_transcribe.js [options]

Options:
  --limit=NUMBER       Limit processing to NUMBER files (for testing)
  --documents=BOOLEAN  Enable/disable document creation (true/false)
  --researchViewId=ID  Set the research view ID for document creation
  --help               Show this help message
    `)
    process.exit(0)
}

// =====================================================================
// SYSTEM CONFIGURATION (generally shouldn't need to be modified)
// =====================================================================

// Load environment variables
dotenv.config({ path: `.env.${CLIENT_CONFIG.environment}` })

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Path configuration
const projectRoot = path.join(__dirname, '..')
const INPUT_DIR = path.join(projectRoot, CLIENT_CONFIG.inputDir)
const ORIGINAL_CSV = path.join(projectRoot, CLIENT_CONFIG.originalCsvPath)
const PROCESSED_DIR = path.join(INPUT_DIR, 'processed')
const ERROR_DIR = path.join(INPUT_DIR, 'error')
const ERROR_LOG = path.join(projectRoot, 'error.log')

// Rate limiting configuration
const REQUESTS_PER_MINUTE = CLIENT_CONFIG.requestsPerMinute
const BATCH_SIZE = CLIENT_CONFIG.batchSize
const MINUTE_IN_MS = 60 * 1000
const DELAY_BETWEEN_BATCHES = Math.ceil(MINUTE_IN_MS / 4) // Split minute into 4 parts

// Timeout for each transcription request
const REQUEST_TIMEOUT = CLIENT_CONFIG.requestTimeout

// Ensure processed and error directories exist
for (const dir of [PROCESSED_DIR, ERROR_DIR]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Log an error message to both console and a file.
 * @param {string} message - The error message to log.
 */
function logError(message) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`)
    fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} - ${message}\n`, 'utf8')
}

/**
 * Log a message with timestamp
 * @param {string} message - The message to log
 */
function logWithTimestamp(message) {
    console.log(`[${new Date().toISOString()}] ${message}`)
}

/**
 * Clean a phone number by removing non-numeric characters
 * @param {string} phoneNumber - The phone number to clean
 * @returns {string|null} - The cleaned phone number or null if invalid
 */
function cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null

    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '')

    // Return null if the result is not a valid number
    if (!cleaned || Number.isNaN(Number(cleaned))) return null

    return cleaned
}

/**
 * Read original CSV data into memory
 * @returns {Promise<Object>} Object with filenames as keys and row data as values
 */
async function loadOriginalCSV() {
    const rows = {}
    return new Promise((resolve, reject) => {
        fs.createReadStream(ORIGINAL_CSV)
            .pipe(
                csv({
                    mapValues: ({ header, value }) => value.replace(/^"|"$/g, ''),
                    mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '') // Remove BOM character
                })
            )
            .on('data', (row) => {
                let fileName

                if (CLIENT_CONFIG.filenameColumn && row[CLIENT_CONFIG.filenameColumn]) {
                    fileName = row[CLIENT_CONFIG.filenameColumn]
                } else if (CLIENT_CONFIG.filenameSourceColumn && row[CLIENT_CONFIG.filenameSourceColumn]) {
                    fileName = CLIENT_CONFIG.extractFilename(row)
                }

                if (fileName) {
                    rows[fileName] = row
                }
            })
            .on('end', () => resolve(rows))
            .on('error', reject)
    })
}

/**
 * Get audio duration using ffmpeg
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<number>} Duration in seconds
 */
async function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err)
                return
            }
            resolve(metadata.format.duration)
        })
    })
}

/**
 * Check if a file has already been processed by querying Supabase
 * @param {string} fileName - The filename to check
 * @returns {Promise<boolean>} True if already processed, false otherwise
 */
async function isAlreadyProcessed(fileName) {
    try {
        const { data, error } = await supabase.from('call_log').select('id').eq('FILENAME', fileName).maybeSingle()

        if (error) throw error
        return !!data
    } catch (error) {
        console.error(`Error checking if ${fileName} is already processed:`, error)
        return false
    }
}

/**
 * Move a file to the error directory, logging that it failed.
 * @param {string} filePath - Full path to the original file.
 * @param {string} fileName - The file name, e.g., something.mp3
 * @param {Error} [err] - Optional Error object for context.
 */
function moveFileToError(filePath, fileName, err) {
    const newPath = path.join(ERROR_DIR, fileName)
    try {
        fs.renameSync(filePath, newPath)
        logError(`Moved ${fileName} to error folder. Reason: ${err?.message || 'Unknown Error'}`)
    } catch (moveErr) {
        // If move fails, log it but allow the script to continue
        logError(`Failed to move ${fileName} to error folder. ${moveErr.message}`)
    }
}

/**
 * Move a file to the processed directory.
 * @param {string} filePath - Full path to the original file.
 * @param {string} fileName - The file name, e.g., something.mp3
 */
function moveFileToProcessed(filePath, fileName) {
    const processedPath = path.join(PROCESSED_DIR, fileName)
    fs.renameSync(filePath, processedPath)
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// =====================================================================
// TRANSCRIPTION FUNCTIONS
// =====================================================================

/**
 * Call Groq API with a timeout.
 * If the request exceeds the specified REQUEST_TIMEOUT, it throws an error.
 *
 * @param {string} filePath - Full path to the audio file
 * @returns {Promise<any>} - Groq API response
 */
async function transcribeWithTimeout(filePath) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
        logWithTimestamp('Sending transcription request to Groq...')
        const transcription = await groq.audio.transcriptions.create(
            {
                file: fs.createReadStream(filePath),
                model: CLIENT_CONFIG.transcriptionModel,
                response_format: 'verbose_json',
                language: CLIENT_CONFIG.transcriptionLanguage
            },
            {
                signal: controller.signal
            }
        )

        clearTimeout(id)

        // Transform the response to match the expected format
        const wordTimestamps =
            transcription.segments?.map((segment) => ({
                word: segment.text,
                start: segment.start,
                end: segment.end
            })) || []

        return {
            text: transcription.text,
            words: wordTimestamps
        }
    } catch (error) {
        clearTimeout(id)
        console.error('Transcription error:', error)
        if (error.name === 'AbortError') {
            throw new Error(`Transcription timed out for file: ${path.basename(filePath)}`)
        }
        throw error
    }
}

/**
 * Process a single audio file and insert into Supabase
 * @param {string} filePath - Path to the audio file
 * @param {Object} originalData - Original CSV data
 * @returns {Promise<Object>} Processed data with transcription
 */
async function processAudioFile(filePath, originalData) {
    const fileName = path.basename(filePath)
    logWithTimestamp(`Processing ${fileName}...`)

    // Check if already processed in Supabase
    const alreadyProcessed = await isAlreadyProcessed(fileName)
    if (alreadyProcessed) {
        logWithTimestamp(`File ${fileName} already exists in Supabase. Skipping.`)
        moveFileToProcessed(filePath, fileName)
        return null
    }

    // Get audio duration
    const durationInSeconds = await getAudioDuration(filePath)

    // Get transcription (with timeout)
    const transcription = await transcribeWithTimeout(filePath)

    // Move file to processed folder
    moveFileToProcessed(filePath, fileName)

    // Get original data for this file
    const originalRow = originalData[fileName] || {}

    // Create a record for Supabase with mapped fields
    const supabaseRecord = {
        // Set RECORDING_URL to a unique identifier based on the filename
        RECORDING_URL: `${CLIENT_CONFIG.clientName.toLowerCase()}_${fileName}`,
        FILENAME: fileName,
        TRANSCRIPTION: transcription.text,
        WORD_TIMESTAMPS: transcription.words,
        // Add default values
        ...CLIENT_CONFIG.defaultValues
    }

    // Map CSV fields to Supabase fields
    for (const [csvField, supabaseField] of Object.entries(CLIENT_CONFIG.fieldMapping)) {
        if (originalRow[csvField] !== undefined) {
            // Clean phone numbers for specific fields
            if (csvField === 'Local Number' || csvField === 'Remote Number') {
                supabaseRecord[supabaseField] = cleanPhoneNumber(originalRow[csvField])
            } else {
                supabaseRecord[supabaseField] = originalRow[csvField]
            }
        }
    }

    // Handle special case for call duration (convert to seconds if needed)
    if (supabaseRecord.CALL_DURATION && typeof supabaseRecord.CALL_DURATION === 'string') {
        // Check if it's in format like "00:02:15" (hh:mm:ss)
        if (supabaseRecord.CALL_DURATION.includes(':')) {
            const parts = supabaseRecord.CALL_DURATION.split(':').map(Number)
            if (parts.length === 3) {
                // Convert hh:mm:ss to seconds
                supabaseRecord.CALL_DURATION = parts[0] * 3600 + parts[1] * 60 + parts[2]
            } else if (parts.length === 2) {
                // Convert mm:ss to seconds
                supabaseRecord.CALL_DURATION = parts[0] * 60 + parts[1]
            }
        }
    } else if (!supabaseRecord.CALL_DURATION) {
        // Use the calculated duration if not provided in CSV
        supabaseRecord.CALL_DURATION = durationInSeconds
    }

    return supabaseRecord
}

// =====================================================================
// DOCUMENT CREATION FUNCTIONS
// =====================================================================

/**
 * Create or get a data source for the client
 * @returns {Promise<string>} Data source ID
 */
async function getOrCreateDataSource() {
    // If data source ID is already set in config, use it
    if (CLIENT_CONFIG.dataSourceId) {
        return CLIENT_CONFIG.dataSourceId
    }

    // Check if a data source for this client already exists
    const { data: existingSource, error: sourceError } = await supabase
        .from('data_sources')
        .select('id')
        .eq('research_view_id', CLIENT_CONFIG.researchViewId)
        .eq('source_type', 'audio')
        .ilike('file_path', `%${CLIENT_CONFIG.clientName.toLowerCase()}%`)
        .maybeSingle()

    if (sourceError && sourceError.code !== 'PGRST116') {
        logError(`Error checking for existing data source: ${sourceError.message}`)
        throw sourceError
    }

    if (existingSource) {
        logWithTimestamp(`Using existing data source: ${existingSource.id}`)
        CLIENT_CONFIG.dataSourceId = existingSource.id
        return existingSource.id
    }

    // Create a new data source for this client
    const { data: newSource, error: createError } = await supabase
        .from('data_sources')
        .insert({
            research_view_id: CLIENT_CONFIG.researchViewId,
            source_type: 'audio',
            file_path: CLIENT_CONFIG.originalCsvPath,
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (createError) {
        logError(`Error creating data source: ${createError.message}`)
        throw createError
    }

    logWithTimestamp(`Created new data source: ${newSource.id}`)
    CLIENT_CONFIG.dataSourceId = newSource.id
    return newSource.id
}

/**
 * Create a document record for a call
 * @param {Object} callRecord - The call record from Supabase
 * @param {string} sourceId - The data source ID
 * @returns {Promise<string>} Document ID
 */
async function createDocumentRecord(callRecord, sourceId) {
    try {
        // Calculate word and token counts
        const transcript = callRecord.TRANSCRIPTION || ''
        const wordCount = transcript.split(/\s+/).length
        const tokenCount = Math.ceil(wordCount * 1.3) // Rough estimate

        // Prepare the title
        const callDate = new Date().toISOString().split('T')[0] // Use current date if not available
        const title = `Call ${callRecord.FILENAME} - ${callRecord.EMPLOYEE_NAME || 'Unknown'} - ${callDate}`

        // Create the document record
        const documentRecord = {
            source_id: sourceId,
            title: title,
            url: null,
            author: callRecord.EMPLOYEE_NAME || callRecord.CALLER_NAME || CLIENT_CONFIG.clientName,
            publication_date: new Date().toISOString(),
            content: transcript,
            content_summary: transcript.substring(0, 200) + (transcript.length > 200 ? '...' : ''),
            token_count: tokenCount,
            word_count: wordCount,
            file_type: 'transcript',
            category_ai: callRecord.CALL_TYPE || 'call',
            category_user: null,
            status: 'processed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Insert the document
        const { data: document, error: documentError } = await supabase.from('documents').insert([documentRecord]).select().single()

        if (documentError) {
            throw new Error(`Failed to insert document: ${documentError.message}`)
        }

        logWithTimestamp(`Created document record with ID: ${document.id}`)
        return document.id
    } catch (error) {
        logError(`Error creating document record: ${error.message}`)
        throw error
    }
}

/**
 * Create metadata entries for a document
 * @param {string} documentId - The document ID
 * @param {Object} callRecord - The call record from Supabase
 * @returns {Promise<void>}
 */
async function createDocumentMetadata(documentId, callRecord) {
    try {
        const metadataEntries = []

        // Add metadata entries for relevant call fields
        const fieldsToInclude = [
            { field: 'CALL_TYPE', name: 'call_type' },
            { field: 'EMPLOYEE_NAME', name: 'employee_name' },
            { field: 'EMPLOYEE_ID', name: 'employee_id' },
            { field: 'CALLER_NAME', name: 'caller_name' },
            { field: 'CALL_NUMBER', name: 'call_number' },
            { field: 'resolution_status', name: 'resolution_status' },
            { field: 'CALL_DURATION', name: 'call_duration' },
            { field: 'FILENAME', name: 'filename' },
            { field: 'RECORDING_URL', name: 'recording_url' }
        ]

        for (const { field, name } of fieldsToInclude) {
            if (callRecord[field] !== undefined && callRecord[field] !== null) {
                metadataEntries.push({
                    document_id: documentId,
                    field_name: name,
                    field_value: String(callRecord[field]),
                    is_predefined: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            }
        }

        // Add special fields
        if (callRecord.TAGS_ARRAY && callRecord.TAGS_ARRAY.length > 0) {
            metadataEntries.push({
                document_id: documentId,
                field_name: 'tags',
                field_value: callRecord.TAGS_ARRAY.join(','),
                is_predefined: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }

        // Add client name
        metadataEntries.push({
            document_id: documentId,
            field_name: 'client',
            field_value: CLIENT_CONFIG.clientName,
            is_predefined: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })

        // Insert metadata entries if there are any
        if (metadataEntries.length > 0) {
            const { error: metadataError } = await supabase.from('document_metadata').insert(metadataEntries)

            if (metadataError) {
                throw new Error(`Failed to insert metadata: ${metadataError.message}`)
            }

            logWithTimestamp(`Created ${metadataEntries.length} metadata entries for document ${documentId}`)
        }
    } catch (error) {
        logError(`Error creating document metadata: ${error.message}`)
        throw error
    }
}

// =====================================================================
// PROCESS BATCH FUNCTION (UPDATED)
// =====================================================================

/**
 * Process a batch of files with rate limiting
 * @param {string[]} batch - Batch of filenames to process
 * @param {Object} originalData - Original CSV data
 * @returns {Promise<void>}
 */
async function processBatch(batch, originalData) {
    logWithTimestamp(`\nProcessing batch of ${batch.length} files...`)
    const batchStart = Date.now()

    // Get or create data source ID if document creation is enabled
    let sourceId = null
    if (CLIENT_CONFIG.createDocuments) {
        try {
            sourceId = await getOrCreateDataSource()
        } catch (error) {
            logError(`Failed to get or create data source: ${error.message}`)
            // Continue without document creation
        }
    }

    // Process files in parallel within the batch
    const promises = batch.map(async (mp3File) => {
        try {
            const filePath = path.join(INPUT_DIR, mp3File)
            logWithTimestamp(`\nProcessing ${mp3File}...`)

            const result = await processAudioFile(filePath, originalData)
            return { success: true, mp3File, result }
        } catch (error) {
            console.error(`Error processing ${mp3File}:`, error)
            const filePath = path.join(INPUT_DIR, mp3File)
            moveFileToError(filePath, mp3File, error)
            return { success: false, mp3File, error }
        }
    })

    // Wait for all files in the batch to complete
    const results = await Promise.all(promises)

    // Filter out successful results and null results (already processed)
    const successfulResults = results.filter((r) => r.success && r.result !== null).map((r) => r.result)

    // Insert into Supabase call_log table
    if (successfulResults.length > 0) {
        try {
            const { data: insertedRecords, error } = await supabase.from('call_log').insert(successfulResults).select()

            if (error) {
                throw error
            }

            logWithTimestamp(`Successfully inserted ${successfulResults.length} records into call_log table`)

            // Create document records if enabled
            if (CLIENT_CONFIG.createDocuments && sourceId) {
                logWithTimestamp(`Creating document records for ${insertedRecords.length} calls...`)

                for (const callRecord of insertedRecords) {
                    try {
                        // Create document record
                        const documentId = await createDocumentRecord(callRecord, sourceId)

                        // Create document metadata
                        await createDocumentMetadata(documentId, callRecord)

                        logWithTimestamp(`Successfully created document and metadata for call ${callRecord.FILENAME}`)
                    } catch (docError) {
                        logError(`Failed to create document for call ${callRecord.FILENAME}: ${docError.message}`)
                        // Continue with next record
                    }
                }
            }
        } catch (error) {
            console.error('Error inserting records into Supabase:', error)
            logError(`Failed to insert batch into Supabase: ${error.message}`)
        }
    } else {
        logWithTimestamp('No new records to insert in this batch')
    }

    // Calculate time spent processing this batch
    const batchDuration = Date.now() - batchStart

    // If we processed faster than our rate limit, wait the remaining time
    if (batchDuration < DELAY_BETWEEN_BATCHES) {
        const waitTime = DELAY_BETWEEN_BATCHES - batchDuration
        logWithTimestamp(`\nWaiting ${Math.round(waitTime / 1000)} seconds to respect rate limit...`)
        await sleep(waitTime)
    }
}

// =====================================================================
// MAIN FUNCTION
// =====================================================================

async function main() {
    logWithTimestamp(`Starting transcription for client: ${CLIENT_CONFIG.clientName}`)
    logWithTimestamp(`Environment: ${CLIENT_CONFIG.environment}`)
    logWithTimestamp(`Input directory: ${INPUT_DIR}`)
    logWithTimestamp(`Original CSV: ${ORIGINAL_CSV}`)

    try {
        // Test Supabase connection
        const { data: testData, error: testError } = await supabase.from('call_log').select('count')

        if (testError) {
            throw new Error(`Supabase connection failed: ${testError.message}`)
        }

        logWithTimestamp('Supabase connection successful')

        // Check if we need to create a research view for document creation
        if (CLIENT_CONFIG.createDocuments) {
            try {
                // Check if the research view exists
                const { data: researchView, error: viewError } = await supabase
                    .from('research_views')
                    .select('id')
                    .eq('id', CLIENT_CONFIG.researchViewId)
                    .maybeSingle()

                if (viewError && viewError.code !== 'PGRST116') {
                    throw new Error(`Error checking research view: ${viewError.message}`)
                }

                if (!researchView) {
                    logWithTimestamp(`Research view with ID ${CLIENT_CONFIG.researchViewId} not found. Creating new research view...`)

                    // Create a new research view
                    const { data: newView, error: createViewError } = await supabase
                        .from('research_views')
                        .insert({
                            id: CLIENT_CONFIG.researchViewId,
                            name: `${CLIENT_CONFIG.clientName} Calls`,
                            description: `Call transcriptions for ${CLIENT_CONFIG.clientName}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single()

                    if (createViewError) {
                        throw new Error(`Failed to create research view: ${createViewError.message}`)
                    }

                    logWithTimestamp(`Created new research view with ID: ${newView.id}`)
                } else {
                    logWithTimestamp(`Using existing research view with ID: ${researchView.id}`)
                }
            } catch (error) {
                logError(`Error setting up research view: ${error.message}`)
                logWithTimestamp('Continuing without document creation')
                CLIENT_CONFIG.createDocuments = false
            }
        }

        // Load original CSV data
        const originalData = await loadOriginalCSV()
        logWithTimestamp('CSV data loaded')

        // Get list of MP3 files
        const files = fs.readdirSync(INPUT_DIR)
        const mp3Files = files.filter((file) => file.toLowerCase().endsWith('.mp3') && fs.statSync(path.join(INPUT_DIR, file)).isFile())
        logWithTimestamp(`Found ${mp3Files.length} MP3 files to process`)

        // Apply testing limit if specified
        let filesToProcess = mp3Files
        if (CLIENT_CONFIG.testingLimit && typeof CLIENT_CONFIG.testingLimit === 'number') {
            const originalCount = filesToProcess.length
            filesToProcess = filesToProcess.slice(0, CLIENT_CONFIG.testingLimit)
            logWithTimestamp(`TESTING MODE: Limited to ${filesToProcess.length} files (from ${originalCount})`)
        }

        // Process files in batches with rate limiting
        const totalBatches = Math.ceil(filesToProcess.length / BATCH_SIZE)
        for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
            const batch = filesToProcess.slice(i, i + BATCH_SIZE)
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1

            logWithTimestamp(`\nStarting batch ${batchNumber} of ${totalBatches}`)
            await processBatch(batch, originalData)
            logWithTimestamp(`Completed batch ${batchNumber} of ${totalBatches}`)
        }

        logWithTimestamp('\nProcessing complete!')
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

// Run the script
main()
