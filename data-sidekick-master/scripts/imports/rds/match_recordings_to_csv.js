import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'
import moment from 'moment-timezone'
import { fileURLToPath } from 'node:url'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths
const CSV_PATH = path.join(__dirname, '../csv/retail-data-systems-original.csv')
const RECORDINGS_DIR = path.join(__dirname, '../downloaded_recordings/retaildatasystems')
const OUTPUT_CSV_PATH = path.join(__dirname, '../csv/retail-data-systems-with-filenames.csv')
const DEBUG_LOG_PATH = path.join(__dirname, '../csv/matching-debug.log')

// Function to extract timestamp and phone number from filename
function parseFilename(filename) {
    // Format: rec-XXXX_YYYYYYYYYY-YYYYMMDDTHHMMSSZ.mp3
    // or: rec-YYYYYYYYYY_XXXXXXXXXX-YYYYMMDDTHHMMSSZ.mp3 (reversed format)
    const standardMatch = filename.match(/rec-(\d+)_(\d+)-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z\.mp3/)

    if (standardMatch) {
        const [, extension, phoneNumber, year, month, day, hour, minute, second] = standardMatch

        // Manually construct the UTC date
        const utcTime = moment.utc(`${year}-${month}-${day} ${hour}:${minute}:${second}`, 'YYYY-MM-DD HH:mm:ss')

        return {
            extension,
            phoneNumber,
            utcTime,
            filename
        }
    }

    // Try alternative format (phone numbers reversed)
    const reversedMatch = filename.match(/rec-(\d+)_(\d+)-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z\.mp3/)

    if (reversedMatch) {
        const [, phoneNumber, extension, year, month, day, hour, minute, second] = reversedMatch

        // Manually construct the UTC date
        const utcTime = moment.utc(`${year}-${month}-${day} ${hour}:${minute}:${second}`, 'YYYY-MM-DD HH:mm:ss')

        return {
            extension,
            phoneNumber,
            utcTime,
            filename
        }
    }

    return null
}

// Main function
async function matchRecordingsToCSV() {
    try {
        console.log('Reading CSV file...')
        const csvData = fs.readFileSync(CSV_PATH, 'utf8')
        const records = parse(csvData, { columns: true, skip_empty_lines: true })

        console.log('Reading recording files...')
        const files = fs
            .readdirSync(RECORDINGS_DIR)
            .filter((file) => file.endsWith('.mp3'))
            .map((filename) => parseFilename(filename))
            .filter((file) => file !== null)

        console.log(`Found ${files.length} recording files`)

        // Create maps for different lookup strategies
        const recordingsMap = new Map() // Map by timestamp and phone number
        const timeMap = new Map() // Map by time only
        const phoneMap = new Map() // Map by phone number only
        const extensionMap = new Map() // Map by extension

        // Debug information
        let debugLog = 'File Name, UTC Time, Phone Number, Extension\n'

        for (const file of files) {
            // Add to debug log
            debugLog += `${file.filename}, ${file.utcTime.format('YYYY-MM-DD HH:mm:ss')}, ${file.phoneNumber}, ${file.extension}\n`

            // Create keys with different formats to increase match chances
            // Store by exact timestamp and phone number
            const key = `${file.utcTime.format('YYYY-MM-DDTHH:mm:ss')}|${file.phoneNumber}`
            recordingsMap.set(key, file)

            // Store by minute-rounded timestamp and phone number (to handle slight time differences)
            const roundedTime = file.utcTime.clone().startOf('minute')
            const roundedKey = `${roundedTime.format('YYYY-MM-DDTHH:mm')}|${file.phoneNumber}`
            recordingsMap.set(roundedKey, file)

            // Store by hour-rounded timestamp and phone number (for even more flexibility)
            const hourRoundedTime = file.utcTime.clone().startOf('hour')
            const hourKey = `${hourRoundedTime.format('YYYY-MM-DDTHH')}|${file.phoneNumber}`
            if (!recordingsMap.has(hourKey)) {
                recordingsMap.set(hourKey, file)
            }

            // Store by time only (for cases where we can't match by phone number)
            const timeKey = file.utcTime.format('YYYY-MM-DDTHH:mm:ss')
            if (!timeMap.has(timeKey)) {
                timeMap.set(timeKey, file)
            }

            // Store by minute-rounded time only
            const roundedTimeKey = roundedTime.format('YYYY-MM-DDTHH:mm')
            if (!timeMap.has(roundedTimeKey)) {
                timeMap.set(roundedTimeKey, file)
            }

            // Store by phone number only (for cases where time doesn't match exactly)
            if (!phoneMap.has(file.phoneNumber)) {
                phoneMap.set(file.phoneNumber, file)
            }

            // Store by extension (for internal calls)
            if (!extensionMap.has(file.extension)) {
                extensionMap.set(file.extension, file)
            }
        }

        // Write debug log
        fs.writeFileSync(DEBUG_LOG_PATH, debugLog)
        console.log(`Debug log written to ${DEBUG_LOG_PATH}`)

        // Match CSV records with recordings
        const matchedRecords = []
        let matchCount = 0
        let noMatchCount = 0

        // Debug information for CSV records
        let csvDebugLog = 'CSV Start Time, UTC Time, Remote Number, Local Number, Resolution Extension\n'

        for (const record of records) {
            // Parse the PST timestamp from CSV and convert to UTC
            const pstTime = moment.tz(record['Start Time'], 'YYYY-MMM-DD HH:mm', 'America/Los_Angeles')
            const utcTime = pstTime.clone().tz('UTC')

            // Clean the phone numbers (remove non-digits)
            const remoteNumber = record['Remote Number']?.replace(/\D/g, '')
            const localNumber = record['Local Number']?.replace(/\D/g, '')
            const extension = record['Resolution Extension']

            // Add to CSV debug log
            csvDebugLog += `${record['Start Time']}, ${utcTime.format(
                'YYYY-MM-DD HH:mm:ss'
            )}, ${remoteNumber}, ${localNumber}, ${extension}\n`

            // Try to match by timestamp and phone number
            let matchedFile = null

            // Try different combinations for matching
            const possibleKeys = [
                // Exact time with phone numbers
                `${utcTime.format('YYYY-MM-DDTHH:mm:ss')}|${remoteNumber}`,
                `${utcTime.format('YYYY-MM-DDTHH:mm:ss')}|${localNumber}`,

                // Minute-rounded time with phone numbers
                `${utcTime.clone().startOf('minute').format('YYYY-MM-DDTHH:mm')}|${remoteNumber}`,
                `${utcTime.clone().startOf('minute').format('YYYY-MM-DDTHH:mm')}|${localNumber}`,

                // Hour-rounded time with phone numbers (last resort)
                `${utcTime.clone().startOf('hour').format('YYYY-MM-DDTHH')}|${remoteNumber}`,
                `${utcTime.clone().startOf('hour').format('YYYY-MM-DDTHH')}|${localNumber}`
            ]

            // Try to find a match with any of the possible keys
            for (const key of possibleKeys) {
                if (recordingsMap.has(key)) {
                    matchedFile = recordingsMap.get(key)
                    break
                }
            }

            // If no match found by phone number and time, try by time only
            if (!matchedFile) {
                const timeKeys = [utcTime.format('YYYY-MM-DDTHH:mm:ss'), utcTime.clone().startOf('minute').format('YYYY-MM-DDTHH:mm')]

                for (const key of timeKeys) {
                    if (timeMap.has(key)) {
                        matchedFile = timeMap.get(key)
                        break
                    }
                }
            }

            // If still no match, try by extension for internal calls
            if (!matchedFile && extension) {
                if (extensionMap.has(extension)) {
                    matchedFile = extensionMap.get(extension)
                }
            }

            // If still no match, try by phone number only as a last resort
            if (!matchedFile) {
                if (phoneMap.has(remoteNumber)) {
                    matchedFile = phoneMap.get(remoteNumber)
                } else if (phoneMap.has(localNumber)) {
                    matchedFile = phoneMap.get(localNumber)
                }
            }

            // Add the filename to the record if found
            const matchedRecord = {
                ...record,
                'Recording Filename': matchedFile ? matchedFile.filename : ''
            }

            matchedRecords.push(matchedRecord)

            if (matchedFile) {
                matchCount++
            } else {
                noMatchCount++
            }
        }

        // Write CSV debug log
        fs.writeFileSync(path.join(__dirname, '../csv/csv-debug.log'), csvDebugLog)

        console.log(`Matched ${matchCount} out of ${records.length} records (${noMatchCount} not matched)`)

        // Write the output CSV
        const output = stringify(matchedRecords, { header: true })
        fs.writeFileSync(OUTPUT_CSV_PATH, output)

        console.log(`Output written to ${OUTPUT_CSV_PATH}`)
    } catch (error) {
        console.error('Error:', error)
    }
}

// Run the script
matchRecordingsToCSV()
