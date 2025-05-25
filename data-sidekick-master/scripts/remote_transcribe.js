import fs from 'node:fs'
import path from 'node:path'
import csv from 'csv-parser'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import stream from 'node:stream'
import { promisify } from 'node:util'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Promisify pipeline for async/await usage with streams
const pipeline = promisify(stream.pipeline)

// =====================================================================
// CLIENT-SPECIFIC CONFIGURATION
// =====================================================================

/**
 * Client configuration object - modify these values for each client
 */
const CLIENT_CONFIG = {
    // Client name (used for logging)
    clientName: 'ExampleClient',

    // Environment to use (.env file suffix)
    // Options: 'local', 'prime', 'wow'
    environment: 'local',

    // Path to the original CSV file with call data
    originalCsvPath: 'csv/example-calls.csv',

    // Directory to download audio files to
    downloadDir: 'downloaded_recordings/example_client',

    // CSV column that contains the recording URL
    // This should be the column that has the URL to download the audio file
    recordingUrlColumn: 'RECORDING_URL',

    // Function to extract the filename from the URL
    // This is client-specific and should be modified based on the URL structure
    extractFilenameFromUrl: (url) => {
        if (!url) return null
        // Extract filename from URL (e.g., https://example.com/recordings/call123.mp3 -> call123.mp3)
        const urlObj = new URL(url)
        return path.basename(urlObj.pathname)
    },

    // CSV to Supabase field mapping
    // Maps CSV column names to Supabase call_log table column names
    fieldMapping: {
        CALL_TYPE: 'CALL_TYPE',
        EMPLOYEE_NAME: 'EMPLOYEE_NAME',
        EMPLOYEE_ID: 'EMPLOYEE_ID',
        CALLER_NAME: 'CALLER_NAME',
        CALL_NUMBER: 'CALL_NUMBER',
        CALL_DURATION: 'CALL_DURATION',
        RECORDING_URL: 'RECORDING_URL'
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
    batchSize: 10, // Smaller batch size for downloads
    requestTimeout: 60_000, // 60 seconds

    // Testing configuration - set to null for processing all files
    // Set to a number (e.g., 5) to process only that many files
    testingLimit: 5,

    // Authentication for downloading files (if needed)
    // Set to null if no authentication is required
    downloadAuth: {
        type: 'basic', // 'basic', 'bearer', 'custom'
        username: 'username', // For basic auth
        password: 'password', // For basic auth
        token: null, // For bearer auth
        headerName: null, // For custom auth
        headerValue: null // For custom auth
    }
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
const DOWNLOAD_DIR = path.join(projectRoot, CLIENT_CONFIG.downloadDir)
const ORIGINAL_CSV = path.join(projectRoot, CLIENT_CONFIG.originalCsvPath)
const PROCESSED_DIR = path.join(DOWNLOAD_DIR, 'processed')
const ERROR_DIR = path.join(DOWNLOAD_DIR, 'error')
const ERROR_LOG = path.join(projectRoot, 'error.log')

// Rate limiting configuration
const REQUESTS_PER_MINUTE = CLIENT_CONFIG.requestsPerMinute
const BATCH_SIZE = CLIENT_CONFIG.batchSize
const MINUTE_IN_MS = 60 * 1000
const DELAY_BETWEEN_BATCHES = Math.ceil(MINUTE_IN_MS / 4) // Split minute into 4 parts

// Timeout for each transcription request
const REQUEST_TIMEOUT = CLIENT_CONFIG.requestTimeout

// Ensure directories exist
for (const dir of [DOWNLOAD_DIR, PROCESSED_DIR, ERROR_DIR]) {
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
    console.error(message)
    fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} - ${message}\n`, 'utf8')
}

/**
 * Read original CSV data into memory
 * @returns {Promise<Array>} Array of row objects from the CSV
 */
async function loadOriginalCSV() {
    const rows = []
    return new Promise((resolve, reject) => {
        fs.createReadStream(ORIGINAL_CSV)
            .pipe(
                csv({
                    mapValues: ({ header, value }) => value.replace(/^"|"$/g, ''),
                    mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '') // Remove BOM character
                })
            )
            .on('data', (row) => {
                rows.push(row)
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
 * Check if a recording URL has already been processed by querying Supabase
 * @param {string} recordingUrl - The recording URL to check
 * @returns {Promise<boolean>} True if already processed, false otherwise
 */
async function isAlreadyProcessed(recordingUrl) {
    try {
        const { data, error } = await supabase.from('call_log').select('id').eq('RECORDING_URL', recordingUrl).maybeSingle()

        if (error) throw error
        return !!data
    } catch (error) {
        console.error(`Error checking if ${recordingUrl} is already processed:`, error)
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

/**
 * Download a file from a URL
 * @param {string} url - URL to download from
 * @param {string} outputPath - Path to save the file to
 * @returns {Promise<void>}
 */
async function downloadFile(url, outputPath) {
    try {
        console.log(`Downloading ${url} to ${outputPath}...`)

        // Prepare headers for authentication if needed
        const headers = {}

        if (CLIENT_CONFIG.downloadAuth) {
            const auth = CLIENT_CONFIG.downloadAuth

            if (auth.type === 'basic' && auth.username && auth.password) {
                const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
                headers['Authorization'] = `Basic ${credentials}`
            } else if (auth.type === 'bearer' && auth.token) {
                headers['Authorization'] = `Bearer ${auth.token}`
            } else if (auth.type === 'custom' && auth.headerName && auth.headerValue) {
                headers[auth.headerName] = auth.headerValue
            }
        }

        // Download the file
        const response = await fetch(url, { headers })

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
        }

        // Save the file
        const fileStream = fs.createWriteStream(outputPath)
        await pipeline(response.body, fileStream)

        console.log(`Successfully downloaded ${url}`)
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`)
    }
}

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
        console.log('Sending transcription request to Groq...')
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
 * Process a single row from the CSV
 * @param {Object} row - CSV row data
 * @returns {Promise<Object|null>} Processed data with transcription or null if skipped
 */
async function processRow(row) {
    // Get the recording URL from the row
    const recordingUrl = row[CLIENT_CONFIG.recordingUrlColumn]

    if (!recordingUrl) {
        console.log('No recording URL found in row, skipping')
        return null
    }

    // Check if already processed in Supabase
    const alreadyProcessed = await isAlreadyProcessed(recordingUrl)
    if (alreadyProcessed) {
        console.log(`Recording ${recordingUrl} already exists in Supabase. Skipping.`)
        return null
    }

    // Extract filename from URL
    const fileName = CLIENT_CONFIG.extractFilenameFromUrl(recordingUrl)
    if (!fileName) {
        console.log(`Could not extract filename from URL: ${recordingUrl}`)
        return null
    }

    // Path to save the downloaded file
    const filePath = path.join(DOWNLOAD_DIR, fileName)

    try {
        // Download the file
        await downloadFile(recordingUrl, filePath)

        // Get audio duration
        const durationInSeconds = await getAudioDuration(filePath)

        // Get transcription
        const transcription = await transcribeWithTimeout(filePath)

        // Move file to processed folder
        moveFileToProcessed(filePath, fileName)

        // Create a record for Supabase with mapped fields
        const supabaseRecord = {
            RECORDING_URL: recordingUrl,
            FILENAME: fileName,
            TRANSCRIPTION: transcription.text,
            WORD_TIMESTAMPS: transcription.words,
            // Add default values
            ...CLIENT_CONFIG.defaultValues
        }

        // Map CSV fields to Supabase fields
        for (const [csvField, supabaseField] of Object.entries(CLIENT_CONFIG.fieldMapping)) {
            if (row[csvField] !== undefined) {
                supabaseRecord[supabaseField] = row[csvField]
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
    } catch (error) {
        console.error(`Error processing row with URL ${recordingUrl}:`, error)

        // If the file was downloaded, move it to the error folder
        if (fs.existsSync(filePath)) {
            moveFileToError(filePath, fileName, error)
        }

        return null
    }
}

/**
 * Process a batch of rows with rate limiting
 * @param {Array} batch - Batch of CSV rows to process
 * @returns {Promise<void>}
 */
async function processBatch(batch) {
    console.log(`\nProcessing batch of ${batch.length} rows...`)
    const batchStart = Date.now()

    // Process rows in parallel within the batch
    const promises = batch.map(async (row) => {
        try {
            const result = await processRow(row)
            return { success: true, row, result }
        } catch (error) {
            console.error(`Error processing row:`, error)
            return { success: false, row, error }
        }
    })

    // Wait for all rows in the batch to complete
    const results = await Promise.all(promises)

    // Filter out successful results and null results (already processed)
    const successfulResults = results.filter((r) => r.success && r.result !== null).map((r) => r.result)

    // Insert into Supabase
    if (successfulResults.length > 0) {
        try {
            const { data, error } = await supabase.from('call_log').insert(successfulResults)

            if (error) {
                throw error
            }

            console.log(`Successfully inserted ${successfulResults.length} records into Supabase`)
        } catch (error) {
            console.error('Error inserting records into Supabase:', error)
            logError(`Failed to insert batch into Supabase: ${error.message}`)
        }
    } else {
        console.log('No new records to insert in this batch')
    }

    // Calculate time spent processing this batch
    const batchDuration = Date.now() - batchStart

    // If we processed faster than our rate limit, wait the remaining time
    if (batchDuration < DELAY_BETWEEN_BATCHES) {
        const waitTime = DELAY_BETWEEN_BATCHES - batchDuration
        console.log(`\nWaiting ${Math.round(waitTime / 1000)} seconds to respect rate limit...`)
        await sleep(waitTime)
    }
}

// =====================================================================
// MAIN FUNCTION
// =====================================================================

async function main() {
    console.log(`Starting remote transcription for client: ${CLIENT_CONFIG.clientName}`)
    console.log(`Environment: ${CLIENT_CONFIG.environment}`)
    console.log(`Download directory: ${DOWNLOAD_DIR}`)
    console.log(`Original CSV: ${ORIGINAL_CSV}`)

    try {
        // Test Supabase connection
        const { data: testData, error: testError } = await supabase.from('call_log').select('count')

        if (testError) {
            throw new Error(`Supabase connection failed: ${testError.message}`)
        }

        console.log('Supabase connection successful')

        // Load original CSV data
        const csvRows = await loadOriginalCSV()
        console.log(`CSV data loaded: ${csvRows.length} rows`)

        // Apply testing limit if specified
        let rowsToProcess = csvRows
        if (CLIENT_CONFIG.testingLimit && typeof CLIENT_CONFIG.testingLimit === 'number') {
            const originalCount = rowsToProcess.length
            rowsToProcess = rowsToProcess.slice(0, CLIENT_CONFIG.testingLimit)
            console.log(`TESTING MODE: Limited to ${rowsToProcess.length} rows (from ${originalCount})`)
        }

        // Process rows in batches with rate limiting
        const totalBatches = Math.ceil(rowsToProcess.length / BATCH_SIZE)
        for (let i = 0; i < rowsToProcess.length; i += BATCH_SIZE) {
            const batch = rowsToProcess.slice(i, i + BATCH_SIZE)
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1

            console.log(`\nStarting batch ${batchNumber} of ${totalBatches}`)
            await processBatch(batch)
            console.log(`Completed batch ${batchNumber} of ${totalBatches}`)
        }

        console.log('\nProcessing complete!')
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

// Run the script
main()
