import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

// Load facilities from JSON file
const FACILITIES_FILE = 'data/prime-storage-facilities.json'
const OUTPUT_FILE = 'data/prime-storage-facilities-details.json'

async function extractFacilityDetails(page) {
    return await page.evaluate(() => {
        const details = {}

        // Extract facility name
        const nameElement = document.querySelector('h1')
        details.name = nameElement ? nameElement.textContent.trim() : ''

        // Extract address
        const addressElement = document.querySelector('address')
        if (addressElement) {
            const addressText = addressElement.textContent.trim()
            // Clean up any extra whitespace and newlines
            const cleanAddress = addressText.replace(/\s+/g, ' ')
            const addressParts = cleanAddress.split(',').map((part) => part.trim())

            if (addressParts.length >= 3) {
                const stateZip = addressParts[2].trim().split(' ')
                details.address = {
                    street: addressParts[0],
                    city: addressParts[1],
                    state: stateZip[0],
                    zip: stateZip[1] || ''
                }
            } else {
                details.address = {
                    full: cleanAddress
                }
            }
        } else {
            details.address = {}
        }

        // Extract phone number
        const phoneElement = document.querySelector('a[href^="tel:"]')
        details.phone = phoneElement ? phoneElement.textContent.trim() : ''

        // Extract facility features
        const facilityFeaturesList = document.querySelector('.facility-features')
        details.features = facilityFeaturesList
            ? Array.from(facilityFeaturesList.querySelectorAll('li')).map((li) => li.textContent.trim())
            : []

        // Extract units
        const units = []
        const unitCards = document.querySelectorAll('.storage-unit-card, .unit-card, [data-testid="unit-type-card"]')
        for (const card of unitCards) {
            // Extract and clean size
            const sizeElement = card.querySelector('.unit-size, .size, [data-testid="unit-size"]')
            let size = ''
            if (sizeElement) {
                const sizeText = sizeElement.textContent.trim()
                const sizeMatch = sizeText.match(/(\d+x\d+)/)
                size = sizeMatch ? sizeMatch[1] : sizeText.replace(/\s+/g, ' ')
            }

            // Extract and clean price
            const priceElement = card.querySelector('.unit-price, .price, [data-testid="unit-price"]')
            let price = ''
            let webPrice = ''
            if (priceElement) {
                const priceText = priceElement.textContent.trim()
                const prices = priceText.split('/')[0].match(/\$\d+(?:,\d+)?/g)
                if (prices && prices.length > 0) {
                    price = prices[0]
                    if (prices.length > 1) {
                        webPrice = prices[1]
                    }
                }
            }

            // Extract and clean type
            const typeElement = card.querySelector('.unit-type, .type, [data-testid="unit-type"]')
            let type = ''
            let description = ''
            if (typeElement) {
                const typeText = typeElement.textContent.trim().replace(/\s+/g, ' ')
                const parts = typeText
                    .split(/\n|\./)
                    .map((part) => part.trim())
                    .filter(Boolean)
                type = parts[0] || ''
                description = parts[1] || ''
            }

            // Extract features
            const featuresList = card.querySelectorAll('.unit-features li, .features li, [data-testid="unit-features"] li')
            const features = Array.from(featuresList).map((li) => li.textContent.trim())

            // Check availability
            const reserveBtn = card.querySelector('button:not([disabled]), [data-testid="reserve-button"]')

            // Only add units that have at least size or price information
            if (size || price) {
                const unitInfo = {
                    size,
                    price,
                    ...(webPrice && { webPrice }),
                    type,
                    ...(description && { description }),
                    features,
                    available: !!reserveBtn
                }
                units.push(unitInfo)
            }
        }
        details.units = units

        return details
    })
}

async function extractHours(page) {
    // Try to find the hours sections using the specific selectors
    const hours = await page.evaluate(() => {
        const hoursData = {}

        // Helper function to find span by text content
        function findSpanByText(text) {
            const spans = document.querySelectorAll('span.text-xs.uppercase')
            return Array.from(spans).find((span) => span.textContent.trim().toLowerCase() === text.toLowerCase())
        }

        // Find office hours
        const officeHoursSpan = findSpanByText('Storage Office Hours')
        if (officeHoursSpan) {
            console.log('Debug: Found office hours span')
            const officeHoursList = officeHoursSpan.closest('div').querySelector('ul')
            if (officeHoursList) {
                console.log('Debug: Found office hours list')
                const hoursObj = {}
                const items = Array.from(officeHoursList.querySelectorAll('li'))
                for (const item of items) {
                    const text = item.textContent.trim()
                    const [day, timeRange] = text.split(':').map((part) => part.trim())
                    if (day && timeRange) {
                        // Clean up the time range by removing any extra spaces and AM/PM variations
                        const cleanTime = timeRange
                            .replace(/\s+/g, ' ')
                            .replace(/([ap])\.?m\.?/gi, '$1m')
                            .trim()
                        hoursObj[day] = cleanTime || 'Closed'
                    }
                }
                hoursData.office = hoursObj
            }
        }

        // Find access hours
        const accessHoursSpan = findSpanByText('Storage Access Hours')
        if (accessHoursSpan) {
            console.log('Debug: Found access hours span')
            const accessHoursList = accessHoursSpan.closest('div').querySelector('ul')
            if (accessHoursList) {
                console.log('Debug: Found access hours list')
                const hoursObj = {}
                const items = Array.from(accessHoursList.querySelectorAll('li'))
                for (const item of items) {
                    const text = item.textContent.trim()
                    const [day, timeRange] = text.split(':').map((part) => part.trim())
                    if (day && timeRange) {
                        // Clean up the time range by removing any extra spaces and AM/PM variations
                        const cleanTime = timeRange
                            .replace(/\s+/g, ' ')
                            .replace(/([ap])\.?m\.?/gi, '$1m')
                            .trim()
                        hoursObj[day] = cleanTime || 'Closed'
                    }
                }
                hoursData.access = hoursObj
            }
        }

        // If we found any hours, return them
        if (Object.keys(hoursData).length > 0) {
            return hoursData
        }

        // Try alternative approach if the specific spans weren't found
        const spans = Array.from(document.querySelectorAll('span.text-xs.uppercase'))
        console.log(
            'Debug: Found spans:',
            spans.map((s) => s.textContent)
        )

        for (const span of spans) {
            const text = span.textContent.toLowerCase().trim()
            if (!text.includes('hours')) continue

            const container = span.closest('div')
            if (!container) continue

            const hoursList = container.querySelector('ul')
            if (!hoursList) continue

            const hoursObj = {}
            const items = Array.from(hoursList.querySelectorAll('li'))
            for (const item of items) {
                const itemText = item.textContent.trim()
                const [day, timeRange] = itemText.split(':').map((part) => part.trim())
                if (day && timeRange) {
                    // Clean up the time range by removing any extra spaces and AM/PM variations
                    const cleanTime = timeRange
                        .replace(/\s+/g, ' ')
                        .replace(/([ap])\.?m\.?/gi, '$1m')
                        .trim()
                    hoursObj[day] = cleanTime || 'Closed'
                }
            }

            if (text.includes('office')) {
                hoursData.office = hoursObj
            } else if (text.includes('access')) {
                hoursData.access = hoursObj
            }
        }

        return hoursData
    })

    if (Object.keys(hours || {}).length > 0) {
        return hours
    }

    // If we still haven't found hours, try the modal approach as a last resort
    console.log('Debug: Trying modal approach as last resort')
    const hoursButton = await page.$('button:has-text("Hours"), .hours-button, [aria-label*="hours" i], [data-testid="hours-button"]')
    if (hoursButton) {
        await hoursButton.click()
        await page.waitForTimeout(2000)

        const modalHours = await page.evaluate(() => {
            const hoursContainer = document.querySelector('.hours-modal, .office-hours, [role="dialog"], [data-testid="hours-modal"]')
            if (!hoursContainer) return {}

            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            const hoursData = { office: {} }

            const rows = Array.from(hoursContainer.querySelectorAll('tr, .hours-row'))
            for (const day of days) {
                const dayRow = rows.find((row) => {
                    const text = row.textContent.toLowerCase()
                    return text.includes(day.toLowerCase())
                })

                if (dayRow) {
                    const timeCell = dayRow.querySelector('td:last-child, .hours-time')
                    hoursData.office[day] = timeCell ? timeCell.textContent.trim() : 'Closed'
                } else {
                    hoursData.office[day] = 'Closed'
                }
            }

            return hoursData
        })

        // Try different methods to close the modal
        try {
            const closeButton = await page.$('button[aria-label="Close"], .close-button')
            if (closeButton) {
                await closeButton.click()
            } else {
                await page.mouse.click(0, 0)
            }
        } catch (error) {
            await page.keyboard.press('Escape')
        }

        await page.waitForTimeout(1000)

        return modalHours
    }

    return {}
}

async function scrapeFacility(page, url) {
    try {
        console.log(`Scraping facility: ${url}`)

        // Navigate to the page and wait for key elements
        await page.goto(url, { waitUntil: 'networkidle' })

        // Wait for key content to be visible
        await Promise.all([
            page.waitForSelector('h1', { state: 'visible', timeout: 10000 }).catch(() => console.log('Warning: h1 not found')),
            page.waitForSelector('address', { state: 'visible', timeout: 10000 }).catch(() => console.log('Warning: address not found')),
            page
                .waitForSelector('a[href^="tel:"]', { state: 'visible', timeout: 10000 })
                .catch(() => console.log('Warning: phone not found'))
        ])

        // Additional wait for dynamic content
        await page.waitForTimeout(2000)

        const details = await extractFacilityDetails(page)
        const hours = await extractHours(page)

        return {
            ...details,
            hours,
            url
        }
    } catch (error) {
        console.error(`Error scraping facility ${url}:`, error)
        return null
    }
}

async function main() {
    // Read facilities list
    const facilitiesData = JSON.parse(await fs.readFile(FACILITIES_FILE, 'utf-8'))
    const results = []

    const browser = await chromium.launch({
        headless: true // Set to true for production
    })
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })

    // Listen to console messages
    context.on('console', (msg) => {
        const text = msg.text()
        if (text.startsWith('Debug:')) {
            console.log(text)
        }
    })

    const page = await context.newPage()

    try {
        console.log(`Starting to scrape ${facilitiesData.length} facilities...`)

        for (let i = 0; i < facilitiesData.length; i++) {
            const facility = facilitiesData[i]
            console.log(`\nProcessing facility ${i + 1}/${facilitiesData.length}: ${facility.name}`)

            const result = await scrapeFacility(page, facility.url)
            if (result) {
                results.push(result)
                // Save progress after each successful scrape
                await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2))
                console.log(`Successfully scraped ${facility.name}`)
            } else {
                console.log(`Failed to scrape ${facility.name}`)
            }

            // Add a small delay between requests
            if (i < facilitiesData.length - 1) {
                await page.waitForTimeout(2000)
            }
        }

        console.log(`\nScraping complete! Successfully processed ${results.length}/${facilitiesData.length} facilities`)
        console.log(`Results saved to ${OUTPUT_FILE}`)
    } catch (error) {
        console.error('Error during scraping:', error)
    } finally {
        await browser.close()
    }
}

main()
