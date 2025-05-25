#!/usr/bin/env node

import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'

const SLIDES_PER_ROW = 4
const HEADER_HEIGHT = 40 // Height for "Slide X" headers
const PADDING = 20 // Padding between slides
const HEADER_FONT_SIZE = 24

async function combineSlides(inputDir, outputFile) {
    try {
        // Read all image files from the input directory
        const files = await fs.readdir(inputDir)
        const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file)).sort()

        if (imageFiles.length === 0) {
            console.error('No image files found in the input directory')
            process.exit(1)
        }

        // Load all images and get their dimensions
        const images = await Promise.all(
            imageFiles.map(async (file) => {
                const image = sharp(path.join(inputDir, file))
                const metadata = await image.metadata()
                return { image, metadata, file }
            })
        )

        // Calculate dimensions for the final image
        const maxWidth = Math.max(...images.map((img) => img.metadata.width))
        const maxHeight = Math.max(...images.map((img) => img.metadata.height))
        const rows = Math.ceil(images.length / SLIDES_PER_ROW)

        // Calculate total width and height
        const totalWidth = (maxWidth + PADDING) * SLIDES_PER_ROW - PADDING
        const totalHeight = rows * (maxHeight + HEADER_HEIGHT + PADDING) - PADDING

        // Create a white background
        const background = await sharp({
            create: {
                width: totalWidth,
                height: totalHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
            .png()
            .toBuffer()

        // Prepare composite array for sharp
        const compositeArray = []

        for (let i = 0; i < images.length; i++) {
            const row = Math.floor(i / SLIDES_PER_ROW)
            const col = i % SLIDES_PER_ROW

            // Calculate position for each slide
            const x = col * (maxWidth + PADDING)
            const y = row * (maxHeight + HEADER_HEIGHT + PADDING)

            // Add header text
            const headerText = await sharp({
                text: {
                    text: `Slide ${i + 1}`,
                    font: 'Arial',
                    fontSize: HEADER_FONT_SIZE,
                    rgba: true
                }
            })
                .png()
                .toBuffer()

            // Add header to composite array
            compositeArray.push({
                input: headerText,
                top: y,
                left: x
            })

            // Add image to composite array
            compositeArray.push({
                input: await images[i].image.toBuffer(),
                top: y + HEADER_HEIGHT,
                left: x
            })
        }

        // Create final image
        await sharp(background).composite(compositeArray).toFile(outputFile)

        console.log(`Successfully combined ${images.length} slides into ${outputFile}`)
    } catch (error) {
        console.error('Error processing images:', error)
        process.exit(1)
    }
}

// Check command line arguments
if (process.argv.length !== 4) {
    console.log('Usage: node combine_slides.js <input_directory> <output_file>')
    console.log('Example: node combine_slides.js ./slides slides_combined.png')
    process.exit(1)
}

const inputDir = process.argv[2]
const outputFile = process.argv[3]

combineSlides(inputDir, outputFile)
