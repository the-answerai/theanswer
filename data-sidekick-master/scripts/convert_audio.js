import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import fs from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

// Configuration
const projectRoot = path.join(__dirname, '..')
const inputDir = path.join(projectRoot, 'downloaded_recordings', 'retaildatasystems')
const outputDir = path.join(projectRoot, 'converted_recordings', 'retaildatasystems')
const skippedDir = path.join(projectRoot, 'skipped_recordings', 'retaildatasystems') // New directory for short recordings
console.log(inputDir)
console.log(outputDir)
console.log(skippedDir)
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

async function convertWavToMp3() {
    try {
        // Ensure directories exist
        await fs.ensureDir(outputDir)
        await fs.ensureDir(skippedDir)

        // Get all WAV files
        const files = await fs.readdir(inputDir)
        const wavFiles = files.filter((file) => file.toLowerCase().endsWith('.wav'))

        console.log(`Found ${wavFiles.length} WAV files to process`)

        for (const wavFile of wavFiles) {
            const inputPath = path.join(inputDir, wavFile)
            const outputPath = path.join(outputDir, wavFile.replace('.wav', '.mp3'))
            const skippedPath = path.join(skippedDir, wavFile)

            try {
                // Get audio duration
                const duration = await getAudioDuration(inputPath)
                console.log(`${wavFile} duration: ${duration} seconds`)

                if (duration > 30) {
                    console.log(`Converting ${wavFile} (${duration}s)...`)
                    await new Promise((resolve, reject) => {
                        ffmpeg(inputPath)
                            .toFormat('mp3')
                            .audioFrequency(16000) // Set sample rate to 16000Hz
                            .audioChannels(1) // Convert to mono
                            .audioBitrate('64k') // Set bitrate appropriate for voice
                            .on('end', () => {
                                console.log(`Successfully converted ${wavFile}`)
                                resolve()
                            })
                            .on('error', (err) => {
                                console.error(`Error converting ${wavFile}:`, err)
                                reject(err)
                            })
                            .save(outputPath)
                    })
                } else {
                    console.log(`Skipping ${wavFile} (${duration}s) - too short`)
                    // Move the file to skipped directory
                    await fs.move(inputPath, skippedPath, { overwrite: true })
                }
            } catch (error) {
                console.error(`Error processing ${wavFile}:`, error)
            }
        }

        console.log('All files processed!')

        // Print summary
        const convertedFiles = await fs.readdir(outputDir)
        const skippedFiles = await fs.readdir(skippedDir)
        console.log('\nProcessing Summary:')
        console.log(`- Converted: ${convertedFiles.length} files`)
        console.log(`- Skipped: ${skippedFiles.length} files`)
    } catch (error) {
        console.error('Error during processing:', error)
    }
}

// Run the conversion
convertWavToMp3()
