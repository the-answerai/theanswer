import { CreditsData, TraceMetadata, SyncUsageResponse, UsageEvent, UsageEventsResponse, GetUsageEventsParams } from '../core/types'
import { log, DEFAULT_CUSTOMER_ID, BILLING_CONFIG } from '../config'
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
     * Make authenticated request to Langfuse API
     */
    private async fetchFromLangfuseAPI(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        try {
            const url = `${this.langfuseBaseUrl}/api/public${endpoint}`
            const response = await axios.get(url, {
                params,
                headers: {
                    Authorization: `Basic ${this.langfuseAuth}`,
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error: any) {
            log.error('Error fetching from Langfuse API', {
                endpoint,
                error: error.message,
                status: error.response?.status
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
     * Filter traces for billable usage and return count of skipped
     * Also filters out already processed traces (billing_status = 'processed')
     */
    private filterBillableTraces(traces: Trace[]): { billable: Trace[]; skippedCount: number } {
        let skippedCount = 0
        let alreadyProcessedCount = 0

        const billable = traces.filter((trace) => {
            // Check if already processed (client-side filtering as backup to API filtering)
            const metadata = trace.metadata as any
            if (metadata?.billing_status === 'processed') {
                alreadyProcessedCount++
                return false
            }

            // Check if has billable usage
            if (!this.hasBillableUsage(trace)) {
                skippedCount++
                return false
            }
            return true
        })

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
                fullTrace: item.fullTrace
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

            // Use the earliest possible date to fetch ALL unprocessed traces
            // The filter will ensure we only get unprocessed ones, so we don't need time limits
            const fromTimestamp = new Date('2020-01-01T00:00:00.000Z') // Langfuse didn't exist before 2020
            const toTimestamp = new Date() // Current time

            log.info('Starting streaming sync for ALL unprocessed traces', {
                fromTimestamp: fromTimestamp.toISOString(),
                toTimestamp: toTimestamp.toISOString(),
                filter: 'billing_status != processed',
                note: 'Fetching all historical unprocessed traces'
            })

            // Fetch and process first page
            const initialResponse = await this.fetchTraces({
                fromTimestamp: fromTimestamp.toISOString(),
                toTimestamp: toTimestamp.toISOString(),
                limit: 100,
                page: 1,
                filter: LangfuseProvider.UNPROCESSED_FILTER
            })
            // console.log('initialResponse', initialResponse)
            const totalPages = initialResponse.meta.totalPages
            log.info('Total pages to process', { totalPages })

            const { billable: firstPageTraces, skippedCount: firstPageSkipped } = this.filterBillableTraces(initialResponse.data)
            const firstPageResponse = await this.processAndSyncTraces(firstPageTraces)

            processedCount += firstPageResponse.processedTraces.length
            failedCount += firstPageResponse.failedEvents.length
            skippedCount += firstPageSkipped
            failedTraces.push(...firstPageResponse.failedEvents)

            // Process remaining pages in batches
            const PAGE_BATCH_SIZE = BILLING_CONFIG.SYNC.PAGE_BATCH_SIZE
            const RATE_LIMIT_DELAY_MS = BILLING_CONFIG.SYNC.RATE_LIMIT_DELAY_MS

            for (let startPage = 2; startPage <= totalPages; startPage += PAGE_BATCH_SIZE) {
                const endPage = Math.min(startPage + PAGE_BATCH_SIZE - 1, totalPages)

                log.info('Processing page group', {
                    startPage,
                    endPage,
                    progress: `${endPage}/${totalPages}`
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

                // Rate limit between batches
                if (endPage < totalPages) {
                    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS))
                }
            }

            log.info('Streaming sync completed', {
                totalPagesProcessed: totalPages,
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
     * Fetch and filter traces from multiple pages in parallel
     */
    private async fetchPageGroup(
        startPage: number,
        endPage: number,
        fromTimestamp: Date,
        toTimestamp: Date,
        traceId?: string
    ): Promise<{ billable: Trace[]; skippedCount: number }> {
        // Build page requests
        const pageRequests = []
        for (let page = startPage; page <= endPage; page++) {
            pageRequests.push(
                this.fetchTraces({
                    fromTimestamp: fromTimestamp.toISOString(),
                    toTimestamp: toTimestamp.toISOString(),
                    limit: 100,
                    page,
                    filter: LangfuseProvider.UNPROCESSED_FILTER
                })
            )
        }

        // Fetch all pages in parallel
        const responses = await Promise.all(pageRequests)

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
    private async convertUsageToCredits(usageData: Trace[]): Promise<Array<{ creditsData: CreditsData; fullTrace: any }>> {
        const validTraces = await Promise.all(usageData.map((trace) => this.validateUsageData(trace)))
        const filteredData = usageData.filter((_, index) => validTraces[index])
        const processedData: Array<{ creditsData: CreditsData; fullTrace: any }> = []

        // Use UTC timestamp for consistency
        const nowUtc = new Date()
        const nowUtcSeconds = Math.floor(nowUtc.getTime() / 1000)

        log.info('Starting trace processing with reference time', {
            nowUtc: nowUtc.toISOString(),
            nowUtcSeconds,
            totalTraces: filteredData.length
        })

        // Process traces in batches
        const BATCH_SIZE = 15
        const RATE_LIMIT_DELAY = 1000 // 1 second delay between batches

        for (let i = 0; i < filteredData.length; i += BATCH_SIZE) {
            const batch = filteredData.slice(i, i + BATCH_SIZE)
            const batchResults = await Promise.all(batch.map((trace) => this.processTrace(trace, nowUtcSeconds)))

            // Filter out failed traces (undefined results)
            const validResults = batchResults.filter((result): result is { creditsData: CreditsData; fullTrace: any } => !!result)
            processedData.push(...validResults)

            // Apply rate limiting between batches
            if (i + BATCH_SIZE < filteredData.length) {
                await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
            }
        }

        return processedData
    }

    private async processTrace(trace: Trace, nowUtcSeconds: number): Promise<{ creditsData: CreditsData; fullTrace: any } | undefined> {
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

            const metadata = {
                ...((trace.metadata || {}) as TraceMetadata),
                aiCredentialsOwnership: 'user'
            } as TraceMetadata
            const fullTrace = await this.fetchTrace(trace.id)
            // TODO: Update calculateCosts, getModelUsage, and buildCreditsData to work with v4 API response types
            const costs = await this.calculateCosts(fullTrace as any)
            metadata.aiCredentialsOwnership = costs.aiCredentialsOwnership
            const credits = this.convertCostsToCredits(costs)
            const modelUsage = await this.getModelUsage(fullTrace as any)

            const creditsData = this.buildCreditsData(fullTrace as any, metadata, costs, credits, modelUsage, traceTimestampSeconds)
            return { creditsData, fullTrace: fullTrace }
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
            stripeCustomerId: metadata.customerId || DEFAULT_CUSTOMER_ID!,
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
        const { userId, customerId, page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = params
        // TODO: Admins should be able to see all events
        try {
            // Determine time range - default to last 30 days
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 30)

            // Fetch traces from Langfuse API with pagination
            const langfuseResponse = await this.fetchTraces({
                fromTimestamp: startDate.toISOString(),
                toTimestamp: endDate.toISOString(),
                limit,
                page,
                userId,
                filter: LangfuseProvider.UNPROCESSED_FILTER
                // Note: We can't directly filter by customerId in the API call
                // We'll filter the results after fetching
            })

            // Filter traces by customerId
            const filteredTraces = (langfuseResponse?.data || []).filter((trace: Trace) => {
                const metadata = trace.metadata as TraceMetadata
                return (
                    trace.userId === userId ||
                    trace.userId === params.user.id ||
                    params.user.roles?.includes('Admin') ||
                    (metadata && metadata.stripeCustomerId === customerId)
                )
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
