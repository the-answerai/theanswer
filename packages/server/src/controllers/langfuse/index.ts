import { Request, Response, NextFunction } from 'express'

const getHealthCheck = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const secretKey = process.env.LANGFUSE_SECRET_KEY || ''
        const publicKey = process.env.LANGFUSE_PUBLIC_KEY || ''
        const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'

        if (!secretKey || !publicKey) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing Langfuse API keys'
            })
        }

        // Calculate date 7 days ago
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // Create Basic Auth header
        const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64')

        // Build base query parameters for last 7 days
        const baseParams = {
            fromTimestamp: sevenDaysAgo.toISOString(),
            toTimestamp: new Date().toISOString()
        }

        // Helper function to fetch a specific page
        const fetchPage = async (page: number) => {
            const params = new URLSearchParams({
                ...baseParams,
                page: page.toString()
            })

            const response = await fetch(`${baseUrl}/api/public/traces?${params}`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`Langfuse API error on page ${page}: ${response.status} ${response.statusText}`)
            }

            return await response.json()
        }

        // First, fetch page 1 to get totalPages
        console.log('Fetching page 1 to determine total pages...')
        const firstPageResult = await fetchPage(1)
        const totalPages = firstPageResult.meta?.totalPages || 1

        console.log(`Found ${totalPages} total pages, fetching all pages...`)

        // Collect all data from all pages
        let allTraces = firstPageResult.data || []
        const allPages = [firstPageResult]

        // Fetch remaining pages if there are more than 1
        if (totalPages > 1) {
            const remainingPagePromises = []
            for (let page = 2; page <= totalPages; page++) {
                remainingPagePromises.push(fetchPage(page))
            }

            // Wait for all remaining pages to complete
            const remainingPages = await Promise.all(remainingPagePromises)

            // Combine all traces from all pages
            for (const pageResult of remainingPages) {
                allTraces = allTraces.concat(pageResult.data || [])
                allPages.push(pageResult)
            }
        }

        console.log(`Successfully fetched ${allTraces.length} traces from ${totalPages} pages`)

        return res.json({
            status: 'success',
            data: {
                data: allTraces,
                meta: {
                    ...firstPageResult.meta,
                    totalItemsFetched: allTraces.length,
                    pagesFetched: totalPages,
                    allPages: allPages.map((page, index) => ({
                        page: index + 1,
                        itemCount: page.data?.length || 0,
                        meta: page.meta
                    }))
                }
            },
            metadata: {
                period: '7 days',
                from: sevenDaysAgo.toISOString(),
                to: new Date().toISOString(),
                totalPages: totalPages,
                totalTraces: allTraces.length
            }
        })
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'An error occurred while fetching traces'
        })
    }
}

export default {
    getHealthCheck
}
