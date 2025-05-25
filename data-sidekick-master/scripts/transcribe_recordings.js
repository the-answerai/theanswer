import fs from 'node:fs'
import path from 'node:path'
import csv from 'csv-parser'
import { createObjectCsvWriter } from 'csv-writer'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { fileURLToPath } from 'node:url'
// Optional: If you want a promise-based timeout solution, install p-timeout.
// import pTimeout from 'p-timeout';

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.prime' })

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

// Configuration
const projectRoot = path.join(__dirname, '..')
const INPUT_DIR = path.join(projectRoot, 'converted_recordings', 'rds')
const PROCESSED_DIR = path.join(INPUT_DIR, 'processed')
const ERROR_DIR = path.join(INPUT_DIR, 'error')
const ORIGINAL_CSV = path.join(projectRoot, 'csv', '2025-01-06 10_27.csv')
const OUTPUT_CSV = path.join(projectRoot, 'csv', 'transcribed_recordings.csv')
const TEMP_CSV = path.join(projectRoot, 'csv', 'temp_transcribed_recordings.csv')
const ERROR_LOG = path.join(projectRoot, 'error.log')

// Rate limiting configuration
const REQUESTS_PER_MINUTE = 100
const BATCH_SIZE = 25 // Process 25 files at a time (1/4 of our per-minute limit)
const MINUTE_IN_MS = 60 * 1000
const DELAY_BETWEEN_BATCHES = Math.ceil(MINUTE_IN_MS / 4) // Split minute into 4 parts

// Timeout for each transcription request
const REQUEST_TIMEOUT = 60_000 // 60 seconds

// CSV Headers from original file
const ORIGINAL_HEADERS = ['RECORDING_URL', 'CALL_DURATION', 'ANSWERED_BY', 'EMPLOYEE_ID', 'EMPLOYEE_NAME', 'CALL_NUMBER', 'CALLER_NAME']

// Define headers order (original headers first, then new fields)
const ALL_HEADERS = [...ORIGINAL_HEADERS, 'FILENAME', 'TRANSCRIPTION', 'WORD_TIMESTAMPS']

// Ensure processed and error directories exist
;[PROCESSED_DIR, ERROR_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
})

/**
 * Log an error message to both console and a file.
 * @param {string} message - The error message to log.
 */
function logError(message) {
    console.error(message)
    fs.appendFileSync(ERROR_LOG, `${new Date().toISOString()} - ${message}\n`, 'utf8')
}

// Extract filename from URL
function getFilenameFromUrl(url) {
    if (!url) return ''
    const matches = url.match(/RE[a-f0-9]+\.wav/)
    return matches ? matches[0].replace('.wav', '.mp3') : ''
}

// Read original CSV data into memory
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
                const fileName = getFilenameFromUrl(row.RECORDING_URL)
                if (fileName) {
                    rows[fileName] = row
                }
            })
            .on('end', () => resolve(rows))
            .on('error', reject)
    })
}

// Get audio duration using ffmpeg
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

// Load existing transcribed data
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
                model: 'distil-whisper-large-v3-en',
                response_format: 'verbose_json',
                language: 'en'
            },
            {
                signal: controller.signal
            }
        )

        clearTimeout(id)

        // console.log('\nRaw Groq response:', JSON.stringify(transcription, null, 2));

        // Transform the response to match the expected format
        const wordTimestamps =
            transcription.segments?.map((segment) => ({
                word: segment.text,
                start: segment.start,
                end: segment.end
            })) || []

        // console.log('\nExtracted word timestamps:', JSON.stringify(wordTimestamps, null, 2));

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

// Process a single audio file
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
        CALL_DURATION: durationInSeconds.toFixed(2),
        TRANSCRIPTION: transcription.text,
        WORD_TIMESTAMPS: JSON.stringify(transcription.words)
    }
}

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Process a batch of files with rate limiting
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

async function main() {
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
        const filesToProcess = mp3Files.filter((mp3File) => !allRecords.has(mp3File))
        console.log(`${filesToProcess.length} files need processing`)

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
