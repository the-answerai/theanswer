import { CreditsData, TraceMetadata, SyncUsageResponse, UsageEvent, UsageEventsResponse, GetUsageEventsParams } from '../core/types'
import { log, DEFAULT_CUSTOMER_ID, OVERRIDE_CUSTOMER_ID, BILLING_CONFIG } from '../config'
import axios from 'axios'
import { StripeProvider } from '../stripe/StripeProvider'
import { extractCredentialsAndModels } from 'flowise-components'
import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import { TraceWithDetails as Trace, TraceWithFullDetails } from '@langfuse/core'

export class LangfuseProvider {
    // Cache for flow platform status (resets each sync)
    private platformNodeCache = new Map<string, boolean>()

    // Langfuse API configuration
    private readonly langfuseBaseUrl: string
    private readonly langfuseAuth: string

    constructor() {
        // Set up Langfuse API configuration
        this.langfuseBaseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'
        const publicKey = process.env.LANGFUSE_PUBLIC_KEY || ''
        const secretKey = process.env.LANGFUSE_SECRET_KEY || ''
        // Basic auth: publicKey as username, secretKey as password
        this.langfuseAuth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64')
    }

    // Future timestamp buffer (5 minutes) for timestamp validation
    private static readonly FUTURE_TIMESTAMP_BUFFER_SECONDS = 300

    // Adaptive rate limiter state - starts with NO delay, only throttles on 429
    private adaptiveDelay = {
        current: 0, // Start with NO delay - maximum throughput
        min: 0, // Allow zero delay when no rate limits hit
        max: 5000, // Maximum delay (5 seconds)
        backoffMultiplier: 2, // Double on 429
        recoveryRate: 0.8, // Reduce by 20% after success
        lastRateLimitTime: 0, // Track when we last hit a rate limit
        consecutiveSuccesses: 0 // Track successful calls for faster recovery
    }

    /**
     * Record a successful API call - gradually reduce delay
     */
    private recordSuccess(): void {
        this.adaptiveDelay.consecutiveSuccesses++
        // After 5 consecutive successes, start reducing delay
        if (this.adaptiveDelay.consecutiveSuccesses >= 5) {
            this.adaptiveDelay.current = Math.max(
                this.adaptiveDelay.min,
                Math.floor(this.adaptiveDelay.current * this.adaptiveDelay.recoveryRate)
            )
            this.adaptiveDelay.consecutiveSuccesses = 0
        }
    }

    /**
     * Record a rate limit hit - increase delay exponentially
     */
    private recordRateLimit(): void {
        this.adaptiveDelay.consecutiveSuccesses = 0
        // If current is 0, start with 200ms base delay; otherwise double it
        const BASE_DELAY_ON_429 = 200
        const newDelay =
            this.adaptiveDelay.current === 0 ? BASE_DELAY_ON_429 : this.adaptiveDelay.current * this.adaptiveDelay.backoffMultiplier
        this.adaptiveDelay.current = Math.min(this.adaptiveDelay.max, newDelay)
        this.adaptiveDelay.lastRateLimitTime = Date.now()
        log.info('Rate limit detected, increasing delay', {
            newDelayMs: this.adaptiveDelay.current,
            maxDelayMs: this.adaptiveDelay.max
        })
    }

    /**
     * Get current adaptive delay (in ms)
     */
    private getAdaptiveDelay(): number {
        return this.adaptiveDelay.current
    }

    /**
     * Wait with heartbeat logging for long delays
     */
    private async waitWithHeartbeat(delayMs: number, context: string): Promise<void> {
        const HEARTBEAT_INTERVAL = 3000 // Log every 3 seconds
        let elapsed = 0

        while (elapsed < delayMs) {
            const waitTime = Math.min(HEARTBEAT_INTERVAL, delayMs - elapsed)
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            elapsed += waitTime

            // Log heartbeat for long waits
            if (elapsed < delayMs && delayMs > HEARTBEAT_INTERVAL) {
                log.debug('Rate limit cooldown...', {
                    context,
                    elapsed: `${elapsed}ms`,
                    remaining: `${delayMs - elapsed}ms`
                })
            }
        }
    }

    // Concurrency configuration
    private static readonly MAX_CONCURRENCY = 10

    /**
     * Run tasks with limited concurrency (pool pattern)
     * Processes items in parallel while respecting rate limits
     */
    private async runWithConcurrency<T, R>(
        items: T[],
        processor: (item: T, index: number) => Promise<R>,
        onProgress?: (completed: number, total: number, result: R | null) => void
    ): Promise<(R | null)[]> {
        const results: (R | null)[] = new Array(items.length).fill(null)
        let nextIndex = 0
        let completed = 0

        const processNext = async (): Promise<void> => {
            while (nextIndex < items.length) {
                const currentIndex = nextIndex++
                const item = items[currentIndex]

                try {
                    // Apply adaptive delay before processing
                    const delay = this.getAdaptiveDelay()
                    if (delay > 0 && currentIndex > 0) {
                        await new Promise((resolve) => setTimeout(resolve, delay))
                    }

                    const result = await processor(item, currentIndex)
                    results[currentIndex] = result
                    completed++

                    if (onProgress) {
                        onProgress(completed, items.length, result)
                    }
                } catch (error: any) {
                    completed++
                    results[currentIndex] = null
                    log.error('Error in concurrent task', {
                        index: currentIndex,
                        error: error.message
                    })
                }
            }
        }

        // Start concurrent workers
        const workers = Array(Math.min(LangfuseProvider.MAX_CONCURRENCY, items.length))
            .fill(null)
            .map(() => processNext())

        await Promise.all(workers)
        return results
    }

    /**
     * Metadata filter to exclude already-processed traces
     * Backward compatible: Traces without billing_status field are included (treated as != 'processed')
     *
     * NOTE: v4 Migration - Metadata filtering syntax may be different in v4 API
     * TODO: Check v4 API documentation for correct metadata filtering approach
     * Currently disabled in api.trace.list() calls below
     */
    private static readonly UNPROCESSED_FILTER = [
        {
            column: 'metadata',
            operator: 'does not contain',
            key: 'billing_status',
            value: 'processed',
            type: 'stringObject'
        }
    ]

    /**
     * Make authenticated request to Langfuse API with retry for rate limits
     * Uses adaptive rate limiting - adjusts delays based on 429 responses
     */
    private async fetchFromLangfuseAPI(endpoint: string, params: Record<string, any> = {}, retryCount = 0): Promise<any> {
        const MAX_RETRIES = BILLING_CONFIG.SYNC.MAX_RETRIES

        try {
            const url = `${this.langfuseBaseUrl}/api/public${endpoint}`
            const response = await axios.get(url, {
                params,
                headers: {
                    Authorization: `Basic ${this.langfuseAuth}`,
                    'Content-Type': 'application/json'
                }
            })
            // Track successful call for adaptive rate limiting
            this.recordSuccess()
            return response.data
        } catch (error: any) {
            const status = error.response?.status

            // Retry on 429 (rate limit) with adaptive backoff
            if (status === 429 && retryCount < MAX_RETRIES) {
                // Record rate limit for adaptive throttling
                this.recordRateLimit()
                const delay = this.getAdaptiveDelay() * Math.pow(2, retryCount)
                log.warn('Rate limited by Langfuse, retrying...', {
                    endpoint,
                    retryCount: retryCount + 1,
                    maxRetries: MAX_RETRIES,
                    delayMs: delay,
                    adaptiveDelay: this.adaptiveDelay.current
                })
                await this.waitWithHeartbeat(delay, `retry ${retryCount + 1}`)
                return this.fetchFromLangfuseAPI(endpoint, params, retryCount + 1)
            }

            log.error('Error fetching from Langfuse API', {
                endpoint,
                error: error.message,
                status,
                retriesExhausted: status === 429
            })
            throw error
        }
    }

    /**
     * Fetch traces from Langfuse API with proper filter encoding
     */
    private async fetchTraces(params: {
        fromTimestamp?: string
        toTimestamp?: string
        limit?: number
        page?: number
        userId?: string
        filter?: any[]
        fields?: string
        orderBy?: string
    }): Promise<any> {
        const queryParams: any = { ...params }

        // Properly encode the filter parameter if present
        if (params.filter) {
            queryParams.filter = JSON.stringify(params.filter)
        }

        return this.fetchFromLangfuseAPI('/traces', queryParams)
    }

    /**
     * Fetch a single trace by ID
     */
    private async fetchTrace(traceId: string): Promise<any> {
        return this.fetchFromLangfuseAPI(`/traces/${traceId}`)
    }

    /**
     * Check if trace has billable usage
     */
    private hasBillableUsage(trace: Trace): boolean {
        return trace.totalCost > 0 || trace.latency > 0
    }

    /**
     * Check if trace has required billing metadata
     */
    private hasBillingMetadata(trace: Trace): boolean {
        const metadata = trace.metadata as any
        // Must have customer identifier (customerId or userId) and be a chatflow trace
        return !!(metadata?.customerId || metadata?.userId) && !!metadata?.chatflowid
    }

    /**
     * Filter traces for billable usage and return count of skipped
     * Also filters out already processed traces (billing_status = 'processed')
     */
    private filterBillableTraces(traces: Trace[]): { billable: Trace[]; skippedCount: number } {
        let skippedCount = 0
        let alreadyProcessedCount = 0
        let unsupportedCount = 0

        const billable = traces.filter((trace) => {
            // Check if already processed (client-side filtering as backup to API filtering)
            const metadata = trace.metadata as any
            if (metadata?.billing_status === 'processed') {
                alreadyProcessedCount++
                return false
            }

            // Skip traces without required billing metadata (e.g., evaluator traces)
            if (!this.hasBillingMetadata(trace)) {
                unsupportedCount++
                return false
            }

            // Check if has billable usage
            if (!this.hasBillableUsage(trace)) {
                skippedCount++
                return false
            }
            return true
        })

        if (unsupportedCount > 0) {
            log.info('Filtered unsupported traces (missing billing metadata)', { unsupportedCount })
        }

        if (alreadyProcessedCount > 0) {
            log.info('Filtered out already processed traces', {
                alreadyProcessedCount,
                totalTraces: traces.length,
                remainingTraces: billable.length
            })
        }

        return { billable, skippedCount }
    }

    /**
     * Find the newest unprocessed trace to start processing from current time backwards
     * Returns null if no unprocessed traces exist
     */
    private async findNewestUnprocessedTrace(): Promise<Date | null> {
        try {
            const response = await this.fetchTraces({
                fromTimestamp: new Date('2020-01-01').toISOString(),
                limit: 1,
                page: 1,
                filter: LangfuseProvider.UNPROCESSED_FILTER,
                fields: 'core', // Minimal fields for discovery
                orderBy: 'timestamp.desc' // Process from newest to oldest (current time backwards)
            })

            if (response.data.length === 0) {
                return null // No unprocessed traces
            }

            log.info('Found newest unprocessed trace', {
                traceId: response.data[0].id,
                timestamp: response.data[0].timestamp
            })

            return new Date(response.data[0].timestamp)
        } catch (error) {
            log.warn('Failed to find newest trace, defaulting to now', { error })
            return new Date() // Safe fallback to current time
        }
    }

    /**
     * Find the oldest unprocessed trace to set the boundary for time-windowed sync
     * Returns null if no unprocessed traces exist
     */
    private async findOldestUnprocessedTrace(): Promise<Date | null> {
        try {
            const response = await this.fetchTraces({
                fromTimestamp: new Date('2020-01-01').toISOString(),
                limit: 1,
                page: 1,
                filter: LangfuseProvider.UNPROCESSED_FILTER,
                fields: 'core',
                orderBy: 'timestamp.asc'
            })

            if (response.data.length === 0) {
                return null
            }

            log.info('Found oldest unprocessed trace', {
                traceId: response.data[0].id,
                timestamp: response.data[0].timestamp
            })

            return new Date(response.data[0].timestamp)
        } catch (error) {
            log.warn('Failed to find oldest trace, using fallback', { error })
            return null
        }
    }

    /**
     * Convert traces to credits and sync to Stripe
     */
    private async processAndSyncTraces(traces: Trace[]) {
        if (traces.length === 0) {
            return { processedTraces: [], failedEvents: [], meterEvents: [] }
        }

        const creditsDataWithTraces = await this.convertUsageToCredits(traces)
        const stripeProvider = new StripeProvider()

        return await stripeProvider.syncUsageToStripe(
            creditsDataWithTraces.map((item) => ({
                ...item.creditsData,
                traceContext: item.traceContext
            }))
        )
    }

    /**
     * Sync usage data from Langfuse to Stripe
     *
     * Filtering Strategy (Dual-layer approach for reliability):
     * 1. API-level filter: metadata.billing_status != 'processed' (attempted, but may not work consistently in v4)
     * 2. Client-side filter: Checks metadata.billing_status !== 'processed' in filterBillableTraces()
     * 3. In-memory filter: billable usage (totalCost > 0 OR latency > 0)
     *
     * Processing Flow:
     * - Fetches unprocessed traces from lookback period
     * - Filters out already processed traces (client-side backup)
     * - Converts usage to credits and syncs to Stripe
     * - Marks traces as processed: metadata.billing_status = 'processed' (TODO: v4 implementation needed)
     *
     * Backward Compatible: Old traces without billing_status field are automatically included
     *
     * @param traceId - Optional specific trace ID to sync
     */
    async syncUsageToStripe(traceId?: string): Promise<SyncUsageResponse> {
        // Track counts instead of full arrays to reduce memory usage
        let processedCount = 0
        let failedCount = 0
        let skippedCount = 0
        // Only track failures for debugging (typically small)
        let failedTraces: Array<{ traceId: string; error: string }> = []

        try {
            // Handle single trace lookup
            if (traceId) {
                const trace = await this.fetchTrace(traceId)
                const traces: Trace[] = trace
                    ? [
                          {
                              ...trace,
                              observations: trace.observations?.map((obs: any) => obs?.id),
                              scores: trace.scores?.map((score: any) => score?.id)
                          } as unknown as Trace
                      ]
                    : []

                const response = await this.processAndSyncTraces(traces)
                return {
                    processedTraces: response.processedTraces,
                    failedTraces: response.failedEvents,
                    skippedTraces: []
                }
            }

            // Step 1: Find newest unprocessed trace to process from current time backwards
            const newestTraceDate = await this.findNewestUnprocessedTrace()
            if (!newestTraceDate) {
                log.info('No unprocessed traces found - all caught up!')
                return {
                    processedTraces: [],
                    failedTraces: [],
                    skippedTraces: [],
                    processedCount: 0,
                    failedCount: 0,
                    skippedCount: 0
                }
            }

            const CHUNK_SIZE_DAYS = BILLING_CONFIG.SYNC.CHUNK_SIZE_DAYS
            const NOW = new Date()
            // Find oldest unprocessed trace to set dynamic boundary (fallback to 2020-01-01)
            const oldestTraceDate = await this.findOldestUnprocessedTrace()
            const OLDEST_BOUNDARY = oldestTraceDate ?? new Date('2020-01-01')
            let windowEnd = new Date(NOW)
            let windowNumber = 0
            const totalWindowsEstimate = Math.ceil((NOW.getTime() - OLDEST_BOUNDARY.getTime()) / (CHUNK_SIZE_DAYS * 24 * 60 * 60 * 1000))

            log.info('Starting time-windowed sync from current time backwards', {
                newestTrace: newestTraceDate.toISOString(),
                oldestTrace: OLDEST_BOUNDARY.toISOString(),
                now: NOW.toISOString(),
                chunkSizeDays: CHUNK_SIZE_DAYS,
                estimatedWindows: totalWindowsEstimate
            })

            // Step 2: Process each time window (newest to oldest)
            while (windowEnd > OLDEST_BOUNDARY) {
                windowNumber++
                const windowStart = new Date(
                    Math.max(windowEnd.getTime() - CHUNK_SIZE_DAYS * 24 * 60 * 60 * 1000, OLDEST_BOUNDARY.getTime())
                )

                log.info('Processing time window', {
                    window: `${windowNumber}/${totalWindowsEstimate}`,
                    start: windowStart.toISOString(),
                    end: windowEnd.toISOString(),
                    progress: `${((windowNumber / totalWindowsEstimate) * 100).toFixed(1)}%`
                })

                const fromTimestamp = windowStart
                const toTimestamp = windowEnd

                // Fetch and process first page
                // Use minimal fields for initial filtering - exclude observations & scores for performance
                const initialResponse = await this.fetchTraces({
                    fromTimestamp: fromTimestamp.toISOString(),
                    toTimestamp: toTimestamp.toISOString(),
                    limit: 100,
                    page: 1,
                    filter: LangfuseProvider.UNPROCESSED_FILTER,
                    fields: 'core,metrics,io', // Exclude observations & scores - reduces payload by 80-90%
                    orderBy: 'timestamp.desc' // Process newest first within each window
                })
                const totalPages = initialResponse.meta.totalPages
                log.info('Total pages to process in this window', { totalPages })

                const { billable: firstPageTraces, skippedCount: firstPageSkipped } = this.filterBillableTraces(initialResponse.data)
                const firstPageResponse = await this.processAndSyncTraces(firstPageTraces)

                processedCount += firstPageResponse.processedTraces.length
                failedCount += firstPageResponse.failedEvents.length
                skippedCount += firstPageSkipped
                failedTraces.push(...firstPageResponse.failedEvents)

                // Process remaining pages in batches with adaptive rate limiting
                const PAGE_BATCH_SIZE = BILLING_CONFIG.SYNC.PAGE_BATCH_SIZE

                for (let startPage = 2; startPage <= totalPages; startPage += PAGE_BATCH_SIZE) {
                    const endPage = Math.min(startPage + PAGE_BATCH_SIZE - 1, totalPages)

                    log.info('Processing page group', {
                        startPage,
                        endPage,
                        progress: `${endPage}/${totalPages}`,
                        adaptiveDelay: `${this.getAdaptiveDelay()}ms`
                    })

                    const { billable: traces, skippedCount: pageSkipped } = await this.fetchPageGroup(
                        startPage,
                        endPage,
                        fromTimestamp,
                        toTimestamp
                    )
                    const response = await this.processAndSyncTraces(traces)

                    processedCount += response.processedTraces.length
                    failedCount += response.failedEvents.length
                    skippedCount += pageSkipped
                    failedTraces.push(...response.failedEvents)

                    // Use adaptive delay between batches (no delay when not rate limited)
                    if (endPage < totalPages) {
                        const delay = this.getAdaptiveDelay()
                        if (delay > 0) {
                            await new Promise((resolve) => setTimeout(resolve, delay))
                        }
                    }
                }

                log.info('Completed time window', {
                    window: `${windowNumber}/${totalWindowsEstimate}`,
                    windowPagesProcessed: totalPages,
                    windowProcessedCount: processedCount
                })

                // Move to previous window (no gaps in coverage, processing backwards)
                windowEnd = windowStart
            }

            log.info('Time-windowed sync completed', {
                totalWindows: windowNumber,
                processedCount,
                failedCount,
                skippedCount
            })
        } catch (error: any) {
            log.error('Error syncing usage data:', error)
            failedTraces = [{ traceId: traceId || 'unknown', error: error.message }]
        } finally {
            // Clear cache after sync
            this.platformNodeCache.clear()
        }

        return {
            processedTraces: [], // Deprecated - keeping for API compatibility
            failedTraces,
            skippedTraces: [], // Deprecated - keeping for API compatibility
            processedCount,
            failedCount,
            skippedCount
        }
    }

    /**
     * Fetch and filter traces from multiple pages sequentially
     * Sequential fetching prevents ClickHouse database overload
     * Uses adaptive rate limiting to optimize throughput
     */
    private async fetchPageGroup(
        startPage: number,
        endPage: number,
        fromTimestamp: Date,
        toTimestamp: Date,
        traceId?: string
    ): Promise<{ billable: Trace[]; skippedCount: number }> {
        // Fetch pages sequentially to avoid ClickHouse overload
        // Uses adaptive delays that adjust based on 429 responses
        const responses = []
        const totalPages = endPage - startPage + 1

        for (let page = startPage; page <= endPage; page++) {
            const pageIndex = page - startPage + 1

            // Log progress for longer fetches
            if (totalPages > 2 && pageIndex % 2 === 0) {
                log.debug('Fetching pages', {
                    progress: `${pageIndex}/${totalPages}`,
                    currentDelay: `${this.getAdaptiveDelay()}ms`
                })
            }

            // Execute fetch call and await immediately (truly sequential)
            const response = await this.fetchTraces({
                fromTimestamp: fromTimestamp.toISOString(),
                toTimestamp: toTimestamp.toISOString(),
                limit: 100,
                page,
                filter: LangfuseProvider.UNPROCESSED_FILTER,
                fields: 'core,metrics,io', // Exclude observations & scores - reduces payload by 80-90%
                orderBy: 'timestamp.desc' // Process newest first within each window
            })
            responses.push(response)

            // Use adaptive delay between pages (no delay when not rate limited)
            if (page < endPage) {
                const delay = this.getAdaptiveDelay()
                if (delay > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delay))
                }
            }
        }

        // Combine and filter traces
        const allTraces = responses.flatMap((response) => response.data)
        const tracesById = traceId ? allTraces.filter((trace) => trace.id === traceId) : allTraces

        return this.filterBillableTraces(tracesById)
    }

    /**
     * Validate that trace has required fields for billing
     * Note: billing_status check not needed here - API filter handles it
     */
    private async validateUsageData(trace: Trace): Promise<boolean> {
        return !!(trace.id && typeof trace.totalCost === 'number' && typeof trace.latency === 'number')
    }
    private async convertUsageToCredits(
        usageData: Trace[]
    ): Promise<Array<{ creditsData: CreditsData; traceContext: { timestamp: string; metadata: any } }>> {
        const validTraces = await Promise.all(usageData.map((trace) => this.validateUsageData(trace)))
        const filteredData = usageData.filter((_, index) => validTraces[index])

        // Use UTC timestamp for consistency
        const nowUtc = new Date()
        const nowUtcSeconds = Math.floor(nowUtc.getTime() / 1000)

        log.info('Starting parallel trace processing', {
            totalTraces: filteredData.length,
            concurrency: LangfuseProvider.MAX_CONCURRENCY,
            referenceTime: nowUtc.toISOString(),
            initialDelay: `${this.getAdaptiveDelay()}ms`
        })

        // Process traces in parallel with controlled concurrency
        const startTime = Date.now()
        let successCount = 0
        let failCount = 0
        let totalCredits = 0
        let lastLogTime = Date.now()

        const results = await this.runWithConcurrency(
            filteredData,
            async (trace) => {
                return this.processTrace(trace, nowUtcSeconds)
            },
            (completed, total, result) => {
                if (result) {
                    successCount++
                    totalCredits += result.creditsData.credits.total || 0
                } else {
                    failCount++
                }

                // Log progress every 2 seconds or every 10 completions
                const now = Date.now()
                if (now - lastLogTime > 2000 || completed % 10 === 0) {
                    lastLogTime = now
                    const elapsed = ((now - startTime) / 1000).toFixed(1)
                    log.info('Parallel processing progress', {
                        completed: `${completed}/${total}`,
                        success: successCount,
                        failed: failCount,
                        runningTotal: totalCredits,
                        elapsed: `${elapsed}s`,
                        rate: `${(completed / parseFloat(elapsed)).toFixed(1)}/s`,
                        currentDelay: `${this.getAdaptiveDelay()}ms`
                    })
                }
            }
        )

        // Collect successful results (filter out null AND undefined)
        const processedData = results.filter(
            (r): r is { creditsData: CreditsData; traceContext: { timestamp: string; metadata: any } } => r != null
        )

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1)
        log.info('Parallel trace processing complete', {
            success: successCount,
            failed: failCount,
            totalCredits,
            elapsedSeconds: elapsedSec,
            avgSecondsPerTrace: filteredData.length > 0 ? (parseFloat(elapsedSec) / filteredData.length).toFixed(2) : '0',
            effectiveRate: `${(filteredData.length / parseFloat(elapsedSec)).toFixed(1)}/s`,
            finalDelay: `${this.getAdaptiveDelay()}ms`
        })

        return processedData
    }

    private async processTrace(
        trace: Trace,
        nowUtcSeconds: number
    ): Promise<{ creditsData: CreditsData; traceContext: { timestamp: string; metadata: any } } | undefined> {
        try {
            const traceDate = new Date(trace.timestamp)
            const traceTimestampSeconds = Math.floor(traceDate.getTime() / 1000)

            // Skip future timestamps (with 5 min buffer)
            if (traceTimestampSeconds > nowUtcSeconds + LangfuseProvider.FUTURE_TIMESTAMP_BUFFER_SECONDS) {
                log.warn('Skipping trace with future timestamp', {
                    traceId: trace.id,
                    timestamp: trace.timestamp,
                    difference: traceTimestampSeconds - nowUtcSeconds
                })
                return undefined
            }

            const fullTrace = await this.fetchTrace(trace.id)

            // Check if already processed (fresh data from full trace fetch)
            // This catches traces where Langfuse cache was stale during initial fetch
            const fullMetadata = fullTrace?.metadata as any
            if (fullMetadata?.billing_status === 'processed') {
                log.debug('Skipping already processed trace (detected on full fetch)', {
                    traceId: trace.id
                })
                return undefined
            }

            const metadata = {
                ...((trace.metadata || {}) as TraceMetadata),
                aiCredentialsOwnership: 'user'
            } as TraceMetadata
            // TODO: Update calculateCosts, getModelUsage, and buildCreditsData to work with v4 API response types
            const costs = await this.calculateCosts(fullTrace as any)
            metadata.aiCredentialsOwnership = costs.aiCredentialsOwnership
            const credits = this.convertCostsToCredits(costs)
            const modelUsage = await this.getModelUsage(fullTrace as any)

            const creditsData = this.buildCreditsData(fullTrace as any, metadata, costs, credits, modelUsage, traceTimestampSeconds)
            // Only store minimal context needed for metadata updates (timestamp + metadata)
            // This reduces memory from ~500KB to ~1KB per trace
            return {
                creditsData,
                traceContext: {
                    timestamp: fullTrace.timestamp,
                    metadata: fullTrace.metadata
                }
            }
        } catch (error: any) {
            log.error('Error processing trace', { traceId: trace.id, error: error.message })
            return undefined
        }
    }

    private async hasAAIPlatformNodes(chatflowId: string): Promise<boolean> {
        if (!chatflowId?.trim()) return false

        const cached = this.platformNodeCache.get(chatflowId)
        if (cached !== undefined) return cached

        try {
            const appServer = getRunningExpressApp()
            const result = await appServer.AppDataSource.query('SELECT "flowData" FROM chat_flow WHERE id = $1', [chatflowId])

            if (result?.[0]?.flowData) {
                const { hasPlatformAINodes } = extractCredentialsAndModels(result[0].flowData)
                this.platformNodeCache.set(chatflowId, hasPlatformAINodes)
                return hasPlatformAINodes
            }
        } catch (error) {
            log.debug('Failed to check AAI nodes', { chatflowId, error })
        }

        this.platformNodeCache.set(chatflowId, false)
        return false
    }

    private async calculateCosts(trace: TraceWithFullDetails): Promise<{
        ai: number
        compute: number
        storage: number
        total: number
        withMargin: number
        aiCredentialsOwnership: string
    }> {
        const computeMinutes = trace.latency / (1000 * 60)
        const metadata = ((trace.metadata || {}) as TraceMetadata) || ({} as TraceMetadata)

        // Validate ownership
        let aiCredentialsOwnership = metadata.aiCredentialsOwnership || 'user'

        if (aiCredentialsOwnership !== 'platform' && metadata.chatflowid) {
            const hasAAI = await this.hasAAIPlatformNodes(metadata.chatflowid)
            if (hasAAI) {
                aiCredentialsOwnership = 'platform'
            }
        }

        const aiCost = aiCredentialsOwnership === 'platform' ? trace.totalCost : 0
        const computeCost = computeMinutes * 0.05
        const storageCost = 0
        const totalBase = aiCost + computeCost + storageCost
        const withMargin = totalBase * BILLING_CONFIG.MARGIN_MULTIPLIER

        return {
            ai: aiCost,
            compute: computeCost,
            storage: storageCost,
            total: totalBase,
            withMargin,
            aiCredentialsOwnership
        }
    }

    private convertCostsToCredits(costs: { ai: number; compute: number; storage: number; withMargin: number }) {
        return {
            ai_tokens: Math.ceil((costs.ai * BILLING_CONFIG.MARGIN_MULTIPLIER) / BILLING_CONFIG.CREDIT_TO_USD),
            compute: Math.ceil((costs.compute * BILLING_CONFIG.MARGIN_MULTIPLIER) / BILLING_CONFIG.CREDIT_TO_USD),
            storage: Math.ceil((costs.storage * BILLING_CONFIG.MARGIN_MULTIPLIER) / BILLING_CONFIG.CREDIT_TO_USD)
        }
    }

    private async getModelUsage(trace: TraceWithFullDetails) {
        return trace.observations
            .filter((obs) => obs.model && (obs.calculatedTotalCost || obs.calculatedTotalCost === 0))
            .map((obs) => ({
                model: obs.model!,
                inputTokens: obs.usage?.input || 0,
                outputTokens: obs.usage?.output || 0,
                totalTokens: obs.usage?.total || 0,
                costUSD: obs.calculatedTotalCost || 0
            }))
    }

    private buildCreditsData(
        trace: TraceWithFullDetails,
        metadata: TraceMetadata,
        costs: { ai: number; compute: number; storage: number; total: number; withMargin: number },
        credits: { ai_tokens: number; compute: number; storage: number },
        modelUsage: Array<any>,
        timestampSeconds: number
    ): CreditsData {
        const totalCredits = credits.ai_tokens + credits.compute + credits.storage
        const computeMinutes = trace.latency / (1000 * 60)

        return {
            traceId: trace.id,
            userId: metadata.userId,
            organizationId: metadata.organizationId,
            aiCredentialsOwnership: metadata.aiCredentialsOwnership,
            // When OVERRIDE_CUSTOMER_ID is true, ALWAYS use DEFAULT_CUSTOMER_ID (ignores trace metadata and DB values)
            stripeCustomerId: OVERRIDE_CUSTOMER_ID ? DEFAULT_CUSTOMER_ID || '' : metadata.customerId || DEFAULT_CUSTOMER_ID || '',
            subscriptionTier: metadata.subscriptionTier || 'free',
            timestamp: trace.timestamp.toString(),
            timestampEpoch: timestampSeconds,
            credits: {
                ...credits,
                total: totalCredits
            },
            metadata: {
                ...metadata,
                timestamp: trace.timestamp
            },
            usage: {
                tokens: modelUsage.reduce((sum, model) => sum + model.totalTokens, 0),
                computeMinutes,
                storageGB: 0,
                totalCost: costs.total,
                models: modelUsage
            },
            costs: {
                base: {
                    ai: costs.ai,
                    compute: costs.compute,
                    storage: costs.storage,
                    total: costs.total
                },
                withMargin: {
                    total: costs.withMargin,
                    marginMultiplier: BILLING_CONFIG.MARGIN_MULTIPLIER
                }
            }
        }
    }

    /**
     * Get usage events from Langfuse traces
     */
    async getUsageEvents(params: GetUsageEventsParams): Promise<UsageEventsResponse> {
        const { userId, customerId, page = 1, limit = 10, sortBy: _sortBy = 'timestamp', sortOrder: _sortOrder = 'desc' } = params
        // TODO: Admins should be able to see all events
        try {
            // Determine time range - default to last 30 days
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 30)

            // Fetch traces from Langfuse API with pagination
            // Use minimal fields for usage events display - exclude observations to reduce load
            const langfuseResponse = await this.fetchTraces({
                fromTimestamp: startDate.toISOString(),
                toTimestamp: endDate.toISOString(),
                limit,
                page,
                userId,
                fields: 'core,metrics,io', // Exclude observations & scores - faster response
                orderBy: 'timestamp.desc' // Show newest events first in UI
                // Note: We can't directly filter by customerId in the API call
                // We'll filter the results after fetching
            })

            // Filter traces by userId and customerId
            // When organizational billing override is enabled, we skip the customerId check
            // because all traces have individual user customer IDs but bill to the org customer ID
            const filteredTraces = (langfuseResponse?.data || []).filter((trace: Trace) => {
                const metadata = trace.metadata as TraceMetadata
                // Always allow: own traces, admin access
                const hasUserAccess = trace.userId === userId || trace.userId === params.user.id || params.user.roles?.includes('Admin')

                // Only check customer ID when override is disabled
                const hasCustomerAccess = !OVERRIDE_CUSTOMER_ID && metadata && metadata.stripeCustomerId === customerId

                return hasUserAccess || hasCustomerAccess
            })

            // Transform traces to UsageEvent format
            const events: UsageEvent[] = filteredTraces.map((trace: Trace) => {
                const metadata = (trace.metadata || {}) as TraceMetadata & {
                    billing_details?: any
                    billing_status?: string
                    stripeError?: string
                    chatflowName?: string
                    chatflowid?: string
                }

                // Extract billing details
                const billingDetails = metadata.billing_details || {}
                const totalCredits = billingDetails.total_credits || 0

                // Extract credit breakdown
                const breakdown = {
                    ai_tokens: billingDetails.breakdown?.ai_tokens?.base_credits || 0,

                    compute: billingDetails.breakdown?.compute?.base_credits || 0,
                    storage: billingDetails.breakdown?.storage?.base_credits || 0
                }

                // Determine sync status
                let syncStatus: 'processed' | 'pending' | 'error' = 'pending'
                let error: string | undefined

                if (metadata.billing_status === 'processed') {
                    syncStatus = 'processed'
                } else if (metadata.stripeError) {
                    syncStatus = 'error'
                    error = metadata.stripeError
                }

                return {
                    id: trace.id,
                    userId: trace.userId || undefined,
                    timestamp: trace.timestamp,
                    chatflowName: metadata.chatflowName,
                    chatflowId: metadata.chatflowid,
                    totalCredits,
                    tokensIn: 0,
                    tokensOut: 0,
                    breakdown,
                    syncStatus,
                    error,
                    metadata
                }
            })

            // Calculate proper pagination values
            const totalItems = langfuseResponse.meta.totalItems
            const totalPages = langfuseResponse.meta.totalPages

            return {
                events,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            }
        } catch (error) {
            log.error('Error fetching usage events:', { error, customerId })
            throw error
        }
    }
}
