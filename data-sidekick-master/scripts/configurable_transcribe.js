import fs from 'node:fs'
import path from 'node:path'
import csv from 'csv-parser'
import { createObjectCsvWriter } from 'csv-writer'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { fileURLToPath } from 'node:url'

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

    // Path to save the output CSV with transcriptions
    outputCsvPath: 'csv/rds_transcribed_recordings.csv',

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

    // CSV columns to include in the output (in addition to transcription data)
    // These should match the column names in the original CSV
    columnsToInclude: [
        'Type',
        'Local Name',
        'Local Number',
        'Remote Name',
        'Remote Number',
        'Resolution Code',
        'Resolution Extension',
        'Start Time',
        'Duration',
        'Recording Filename'
    ],

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
    testingLimit: 1
}

// =====================================================================
// SYSTEM CONFIGURATION (generally shouldn't need to be modified)
// =====================================================================

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: `.env.${CLIENT_CONFIG.environment}` })

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

// Path configuration
const projectRoot = path.join(__dirname, '..')
const INPUT_DIR = path.join(projectRoot, CLIENT_CONFIG.inputDir)
const PROCESSED_DIR = path.join(INPUT_DIR, 'processed')
const ERROR_DIR = path.join(INPUT_DIR, 'error')
const ORIGINAL_CSV = path.join(projectRoot, CLIENT_CONFIG.originalCsvPath)
const OUTPUT_CSV = path.join(projectRoot, CLIENT_CONFIG.outputCsvPath)
const TEMP_CSV = `${OUTPUT_CSV}.temp`
const ERROR_LOG = path.join(projectRoot, `${CLIENT_CONFIG.clientName.toLowerCase()}_error.log`)

// Rate limiting configuration
const REQUESTS_PER_MINUTE = CLIENT_CONFIG.requestsPerMinute
const BATCH_SIZE = CLIENT_CONFIG.batchSize
const MINUTE_IN_MS = 60 * 1000
const DELAY_BETWEEN_BATCHES = Math.ceil(MINUTE_IN_MS / (REQUESTS_PER_MINUTE / BATCH_SIZE))
const REQUEST_TIMEOUT = CLIENT_CONFIG.requestTimeout

// Define output headers (original headers + transcription data)
const TRANSCRIPTION_HEADERS = ['FILENAME', 'TRANSCRIPTION', 'WORD_TIMESTAMPS', 'AUDIO_DURATION']

// Combine original headers with transcription headers
const ALL_HEADERS = [...CLIENT_CONFIG.columnsToInclude, ...TRANSCRIPTION_HEADERS]

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
    console.error(message)
    fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} - ${message}\n`, 'utf8')
}

/**
 * Read original CSV data into memory
 * @returns {Promise<Object>} Map of filenames to row data
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

                if (CLIENT_CONFIG.filenameColumn) {
                    // Use the specified filename column
                    fileName = row[CLIENT_CONFIG.filenameColumn]
                } else {
                    // Extract filename using the client-specific function
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
 * Load existing transcribed data
 * @returns {Promise<Map>} Map of filenames to transcription data
 */
async function loadExistingTranscriptions() {
    if (!fs.existsSync(OUTPUT_CSV)) {
        return new Map()
    }

    const rows = new Map()
    return new Promise((resolve, reject) => {
        fs.createReadStream(OUTPUT_CSV)
            .pipe(csv())
            .on('data', (row) => {
                if (row.FILENAME) {
                    rows.set(row.FILENAME, row)
                }
            })
            .on('end', () => resolve(rows))
            .on('error', reject)
    })
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
 * Process a single audio file
 * @param {string} filePath - Path to the audio file
 * @param {Object} originalData - Original CSV data
 * @returns {Promise<Object>} Processed data with transcription
 */
async function processAudioFile(filePath, originalData) {
    const fileName = path.basename(filePath)
    console.log(`Processing ${fileName}...`)

    // Get audio duration
    const durationInSeconds = await getAudioDuration(filePath)

    // Get transcription (with timeout)
    const transcription = await transcribeWithTimeout(filePath)

    // Move file to processed folder
    moveFileToProcessed(filePath, fileName)

    // Get original data for this file
    const originalRow = originalData[fileName] || {}

    // Combine original data with transcription
    return {
        ...originalRow,
        FILENAME: fileName,
        AUDIO_DURATION: durationInSeconds.toFixed(2),
        TRANSCRIPTION: transcription.text,
        WORD_TIMESTAMPS: JSON.stringify(transcription.words)
    }
}

/**
 * Process a batch of files with rate limiting
 * @param {string[]} batch - Batch of filenames to process
 * @param {Object} originalData - Original CSV data
 * @param {Map} allRecords - Map of all processed records
 * @returns {Promise<void>}
 */
async function processBatch(batch, originalData, allRecords) {
    console.log(`\nProcessing batch of ${batch.length} files...`)
    const batchStart = Date.now()

    // Process files in parallel within the batch
    const promises = batch.map(async (mp3File) => {
        try {
            const filePath = path.join(INPUT_DIR, mp3File)
            console.log(`\nProcessing ${mp3File}...`)

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

    // Update records and save progress
    const successfulResults = results.filter((r) => r.success)
    for (const { mp3File, result } of successfulResults) {
        allRecords.set(mp3File, result)
    }

    // Write progress after batch completion
    if (successfulResults.length > 0) {
        const csvWriter = createObjectCsvWriter({
            path: TEMP_CSV,
            header: ALL_HEADERS.map((header) => ({ id: header, title: header }))
        })
        await csvWriter.writeRecords(Array.from(allRecords.values()))
        fs.renameSync(TEMP_CSV, OUTPUT_CSV)
        console.log(`Successfully processed and saved ${successfulResults.length} files`)
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
    console.log(`Starting transcription for client: ${CLIENT_CONFIG.clientName}`)
    console.log(`Environment: ${CLIENT_CONFIG.environment}`)
    console.log(`Input directory: ${INPUT_DIR}`)
    console.log(`Original CSV: ${ORIGINAL_CSV}`)
    console.log(`Output CSV: ${OUTPUT_CSV}`)

    try {
        // Load original CSV data and existing transcriptions
        const [originalData, existingTranscriptions] = await Promise.all([loadOriginalCSV(), loadExistingTranscriptions()])
        console.log('CSV data loaded')

        // Get list of MP3 files
        const files = fs.readdirSync(INPUT_DIR)
        const mp3Files = files.filter((file) => file.toLowerCase().endsWith('.mp3') && fs.statSync(path.join(INPUT_DIR, file)).isFile())
        console.log(`Found ${mp3Files.length} MP3 files to process`)

        // Create a new Map to store all records
        const allRecords = new Map(existingTranscriptions)

        // Filter out already processed files
        let filesToProcess = mp3Files.filter((mp3File) => !allRecords.has(mp3File))
        console.log(`${filesToProcess.length} files need processing`)

        // Apply testing limit if specified
        if (CLIENT_CONFIG.testingLimit && typeof CLIENT_CONFIG.testingLimit === 'number') {
            const originalCount = filesToProcess.length
            filesToProcess = filesToProcess.slice(0, CLIENT_CONFIG.testingLimit)
            console.log(`TESTING MODE: Limited to ${filesToProcess.length} files (from ${originalCount})`)
        }

        // Process files in batches with rate limiting
        const totalBatches = Math.ceil(filesToProcess.length / BATCH_SIZE)
        for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
            const batch = filesToProcess.slice(i, i + BATCH_SIZE)
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1

            console.log(`\nStarting batch ${batchNumber} of ${totalBatches}`)
            await processBatch(batch, originalData, allRecords)
            console.log(`Completed batch ${batchNumber} of ${totalBatches}`)
        }

        console.log('\nProcessing complete!')
        console.log(`Successfully processed ${allRecords.size} files`)
    } catch (error) {
        console.error('Fatal error:', error)

        // Clean up temp file if it exists
        if (fs.existsSync(TEMP_CSV)) {
            fs.unlinkSync(TEMP_CSV)
        }

        process.exit(1)
    }
}

// Run the script
main()
