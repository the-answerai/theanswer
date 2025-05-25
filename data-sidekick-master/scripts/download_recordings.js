import fs from 'node:fs'
import csv from 'csv-parser'
import axios from 'axios'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.prime' })

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials in .env.prime file')
    process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Get the project root directory (one level up from scripts)
const projectRoot = path.join(__dirname, '..')

// Use the provided CSV file path or default to the one in csv directory
const defaultCsvPath = path.join(projectRoot, 'csv', '2025-01-06 10_27.csv')
const csvFilePath = process.argv[2] ? path.resolve(process.argv[2]) : defaultCsvPath
const outputFolder = path.join(projectRoot, 'downloaded_recordings')
const whitelistedUrls = process.argv[3] ? JSON.parse(process.argv[3]) : null

// Create the output folder if it doesn't exist
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder)
}

// Verify that the CSV file exists
if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`)
    console.error('Please make sure the file exists or provide the correct path.')
    process.exit(1)
}

const downloadFile = async (url, filePath) => {
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        })

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath)
            response.data.pipe(writer)

            writer.on('finish', () => {
                console.log(`Successfully downloaded: ${filePath}`)
                resolve()
            })

            writer.on('error', (err) => {
                console.error(`Error writing file: ${err.message}`)
                reject(err)
            })
        })
    } catch (error) {
        console.error(`Error downloading ${url}: ${error.message}`)
        throw error
    }
}

const checkExistingRecordings = async (recordingUrls) => {
    try {
        const BATCH_SIZE = 100 // Process 100 URLs at a time
        const existingUrls = new Set()

        // Process URLs in batches
        for (let i = 0; i < recordingUrls.length; i += BATCH_SIZE) {
            const batch = recordingUrls.slice(i, i + BATCH_SIZE)
            console.log(
                `Checking database for recordings ${i + 1} to ${Math.min(i + BATCH_SIZE, recordingUrls.length)} of ${recordingUrls.length}`
            )

            const { data, error } = await supabase.from('call_log').select('RECORDING_URL').in('RECORDING_URL', batch)

            if (error) throw error

            // Add found URLs to our set
            data.forEach((record) => existingUrls.add(record.RECORDING_URL))
        }

        return existingUrls
    } catch (error) {
        console.error('Error checking database:', error)
        process.exit(1)
    }
}

const processCSV = async () => {
    const rows = []

    await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(
                csv({
                    mapValues: ({ header, value }) => value.replace(/^"|"$/g, ''),
                    mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '') // Remove BOM character
                })
            )
            .on('data', (row) => {
                if (
                    row.RECORDING_URL &&
                    row.RECORDING_URL.trim() !== '' &&
                    row.RECORDING_URL.toLowerCase() !== 'null' &&
                    (!whitelistedUrls || whitelistedUrls.includes(row.RECORDING_URL))
                ) {
                    rows.push(row)
                }
            })
            .on('end', resolve)
            .on('error', reject)
    })

    console.log(`Found ${rows.length} valid recording URLs${whitelistedUrls ? ' in whitelist' : ''}`)

    // Get all unique recording URLs
    const recordingUrls = [...new Set(rows.map((row) => row.RECORDING_URL))]
    console.log(`Found ${recordingUrls.length} unique recording URLs`)

    // Check which recordings already exist in the database
    const existingRecordings = await checkExistingRecordings(recordingUrls)
    console.log(`Found ${existingRecordings.size} existing recordings in database`)

    // Filter out existing recordings
    const newRecordings = rows.filter((row) => !existingRecordings.has(row.RECORDING_URL))
    console.log(`Found ${newRecordings.length} new recordings to download`)

    for (const row of newRecordings) {
        const recordingUrl = row.RECORDING_URL
        console.log('Attempting to download:', recordingUrl)

        const fileName = path.basename(recordingUrl)
        const filePath = path.join(outputFolder, fileName)

        try {
            await downloadFile(recordingUrl, filePath)
        } catch (error) {
            console.error(`Failed to download ${recordingUrl}`)
        }
    }
}

processCSV()
    .then(() => console.log('All downloads completed'))
    .catch((error) => console.error('Process failed:', error))
