import { CreditsData, TraceMetadata, SyncUsageResponse, UsageEvent, UsageEventsResponse, GetUsageEventsParams } from '../core/types'
import { langfuse, log, DEFAULT_CUSTOMER_ID, BILLING_CONFIG } from '../config'
import type { GetLangfuseTraceResponse, GetLangfuseTracesResponse } from 'langfuse-core'
import { StripeProvider } from '../stripe/StripeProvider'
import Stripe from 'stripe'
import { extractCredentialsAndModels } from 'flowise-components'
import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'

type Trace = GetLangfuseTracesResponse['data'][number]
type FullTrace = GetLangfuseTraceResponse

export class LangfuseProvider {
    // Cache for flow platform status (resets each sync)
    private platformNodeCache = new Map<string, boolean>()

    /**
     * Sync usage data from Langfuse to Stripe
     *
     * Tag-based filtering:
     * - When BILLING_USE_TAG_FILTERING=true, only fetches traces with 'billing:pending' tag
     * - Requires backfill script to have run (packages/server/scripts/backfill-billing-tags.ts)
     * - Significantly reduces API calls and memory usage for large datasets (40k → ~100s traces)
     * - Self-healing logic still runs in-memory as defensive measure
     *
     * ⚠️ IMPORTANT LIMITATION with tag filtering:
     * - New traces created AFTER backfill won't have 'billing:pending' tag
     * - These traces will be COMPLETELY MISSED by tag-filtered sync
     * - Solutions:
     *   1. Keep tag filtering DISABLED (recommended until auto-tagging implemented)
     *   2. Run backfill script periodically (e.g., daily) to tag new traces
     *   3. Implement auto-tagging on trace creation (future work)
     *
     * When disabled (default - RECOMMENDED):
     * - Fetches all traces from lookback period
     * - Filters in-memory based on metadata.billing_status and tags
     * - Self-healing catches ALL untagged traces automatically
     * - Slower but guarantees no traces are missed
     *
     * @param traceId - Optional specific trace ID to sync
     */
    async syncUsageToStripe(traceId?: string): Promise<SyncUsageResponse> {
        let allTraces: Trace[] = []
        let allCreditsData: CreditsData[] = []
        let failedTraces: Array<{ traceId: string; error: string }> = []
        let processedTraces: string[] = []
        let skippedTraces: Array<{ traceId: string; reason: string }> = []
        let meterEvents: Stripe.Billing.MeterEvent[] = []

        try {
            // Handle single trace lookup separately (no pagination needed)
            if (traceId) {
                const traces = await this.fetchUsageData(traceId)
                const creditsDataWithTraces = await this.convertUsageToCredits(traces)

                // Sync to Stripe
                const stripeProvider = new StripeProvider()
                const stripeResponse = await stripeProvider.syncUsageToStripe(
                    creditsDataWithTraces.map((item) => ({
                        ...item.creditsData,
                        fullTrace: item.fullTrace
                    }))
                )

                return {
                    processedTraces: stripeResponse.processedTraces,
                    failedTraces: stripeResponse.failedEvents,
                    skippedTraces: [],
                    traces,
                    creditsData: creditsDataWithTraces.map((item) => item.creditsData),
                    meterEvents: stripeResponse.meterEvents
                }
            }

            // Calculate lookback timestamp
            const fromTimestamp = new Date()
            fromTimestamp.setDate(fromTimestamp.getDate() - BILLING_CONFIG.SYNC.LOOKBACK_DAYS)

            log.info('Starting streaming sync', {
                lookbackDays: BILLING_CONFIG.SYNC.LOOKBACK_DAYS,
                fromTimestamp: fromTimestamp.toISOString(),
                useTagFiltering: BILLING_CONFIG.SYNC.USE_TAG_FILTERING
            })

            // Get total pages count with initial request
            // If tag filtering is enabled, only fetch traces with 'billing:pending' tag
            const fetchParams: any = {
                fromTimestamp,
                limit: 100,
                page: 1
            }

            if (BILLING_CONFIG.SYNC.USE_TAG_FILTERING) {
                fetchParams.tags = ['billing:pending']
            }

            const initialResponse = await langfuse.fetchTraces(fetchParams)

            const totalPages = initialResponse.meta.totalPages
            log.info('Total pages to process', { totalPages })

            // Process first page
            let firstPageUntaggedCount = 0
            const firstPageTraces = initialResponse.data.filter((trace) => {
                const hasTokenCost = trace.totalCost > 0
                const hasComputeTime = trace.latency > 0
                const metadata = (trace.metadata as TraceMetadata) || {}
                const tags = (trace.tags || []) as string[]

                // Self-healing: Check both metadata AND tags for processed status
                // A trace is considered processed if EITHER:
                // 1. metadata.billing_status === 'processed', OR
                // 2. tags includes 'billing:processed'
                const isProcessed = metadata.billing_status === 'processed' || tags.includes('billing:processed')
                const isNotProcessed = !isProcessed

                // Track untagged traces for logging
                const hasNoBillingTags = !tags.includes('billing:processed') && !tags.includes('billing:pending')
                if (isNotProcessed && hasNoBillingTags && (hasTokenCost || hasComputeTime)) {
                    firstPageUntaggedCount++
                }

                if (isProcessed) {
                    skippedTraces.push({ traceId: trace.id, reason: 'Already processed' })
                }
                if (!(hasTokenCost || hasComputeTime)) {
                    skippedTraces.push({ traceId: trace.id, reason: 'No billable usage' })
                }

                return (hasTokenCost || hasComputeTime) && isNotProcessed
            })

            // Log if we found untagged traces on first page (self-healing scenario)
            if (firstPageUntaggedCount > 0) {
                log.info('Self-healing: Found untagged traces on first page', {
                    count: firstPageUntaggedCount
                })
            }

            if (firstPageTraces.length > 0) {
                const creditsDataWithTraces = await this.convertUsageToCredits(firstPageTraces)
                const stripeProvider = new StripeProvider()
                const stripeResponse = await stripeProvider.syncUsageToStripe(
                    creditsDataWithTraces.map((item) => ({
                        ...item.creditsData,
                        fullTrace: item.fullTrace
                    }))
                )

                processedTraces.push(...stripeResponse.processedTraces)
                failedTraces.push(...stripeResponse.failedEvents)
                meterEvents.push(...stripeResponse.meterEvents)
                allTraces.push(...firstPageTraces)
                allCreditsData.push(...creditsDataWithTraces.map((item) => item.creditsData))
            }

            // Process remaining pages in groups
            const PAGE_BATCH_SIZE = BILLING_CONFIG.SYNC.PAGE_BATCH_SIZE
            const RATE_LIMIT_DELAY_MS = BILLING_CONFIG.SYNC.RATE_LIMIT_DELAY_MS

            for (let startPage = 2; startPage <= totalPages; startPage += PAGE_BATCH_SIZE) {
                const endPage = Math.min(startPage + PAGE_BATCH_SIZE - 1, totalPages)

                log.info('Processing page group', {
                    startPage,
                    endPage,
                    progress: `${endPage}/${totalPages}`
                })

                // Fetch page group
                const traces = await this.fetchPageGroup(startPage, endPage, fromTimestamp, undefined, skippedTraces)

                // Track for final response (only needed for compatibility)
                allTraces.push(...traces)

                if (traces.length > 0) {
                    // Convert to credits
                    const creditsDataWithTraces = await this.convertUsageToCredits(traces)

                    // Sync to Stripe
                    const stripeProvider = new StripeProvider()
                    const stripeResponse = await stripeProvider.syncUsageToStripe(
                        creditsDataWithTraces.map((item) => ({
                            ...item.creditsData,
                            fullTrace: item.fullTrace
                        }))
                    )

                    // Accumulate results
                    processedTraces.push(...stripeResponse.processedTraces)
                    failedTraces.push(...stripeResponse.failedEvents)
                    meterEvents.push(...stripeResponse.meterEvents)
                    allCreditsData.push(...creditsDataWithTraces.map((item) => item.creditsData))
                }

                // Rate limit between page groups (skip on last batch)
                if (endPage < totalPages) {
                    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS))
                }
            }

            log.info('Streaming sync completed', {
                totalPagesProcessed: totalPages,
                processedCount: processedTraces.length,
                failedCount: failedTraces.length,
                skippedCount: skippedTraces.length
            })
        } catch (error: any) {
            log.error('Error syncing usage data:', error)
            failedTraces = [{ traceId: traceId || 'unknown', error: error.message }]
        } finally {
            // Clear cache after sync
            this.platformNodeCache.clear()
        }

        return {
            processedTraces,
            failedTraces,
            skippedTraces,
            traces: allTraces,
            creditsData: allCreditsData,
            meterEvents
        }
    }

    /**
     * Fetch usage data for a specific trace ID
     * NOTE: This method is now only used for single trace lookups.
     * Bulk syncing uses the streaming approach in syncUsageToStripe() which calls fetchPageGroup()
     * @param traceId - Specific trace ID to fetch
     * @returns Array containing the single trace (for compatibility with existing code)
     */
    private async fetchUsageData(traceId?: string): Promise<GetLangfuseTracesResponse['data']> {
        try {
            if (traceId) {
                const trace = await langfuse.fetchTrace(traceId)
                if (trace.data) {
                    return [
                        {
                            ...trace.data,
                            observations: trace.data.observations?.map((obs: any) => obs?.id)
                        } as any
                    ]
                }
            }

            // DEPRECATED: The code below is no longer used for bulk syncing
            // Bulk syncing now uses streaming approach in syncUsageToStripe() with fetchPageGroup()
            // Kept for backwards compatibility in case this method is called without traceId
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            // Build base fetch parameters
            const baseFetchParams: any = {
                fromTimestamp: startOfMonth,
                limit: 100,
                page: 1
            }

            // Use tag-based filtering if enabled
            if (BILLING_CONFIG.SYNC.USE_TAG_FILTERING) {
                baseFetchParams.tags = ['billing:pending']
            }

            // Get total pages first
            const initialResponse = await langfuse.fetchTraces(baseFetchParams)

            const totalPages = initialResponse.meta.totalPages
            let allTraces: GetLangfuseTracesResponse['data'] = []

            // Process initial response
            const validInitialTraces = initialResponse.data.filter((trace) => {
                if (traceId && trace.id !== traceId) {
                    return false
                }
                const hasTokenCost = trace.totalCost > 0
                const hasComputeTime = trace.latency > 0
                const metadata = (trace.metadata as TraceMetadata) || {}
                const tags = (trace.tags || []) as string[]

                // Self-healing: Check both metadata AND tags for processed status
                const isProcessed = metadata.billing_status === 'processed' || tags.includes('billing:processed')
                const isNotProcessed = !isProcessed

                return (hasTokenCost || hasComputeTime) && isNotProcessed
            })
            allTraces = allTraces.concat(validInitialTraces)

            // Fetch remaining pages in parallel with rate limiting
            const BATCH_SIZE = 15 // Number of concurrent requests
            const RATE_LIMIT_DELAY = 1000 // 1 second delay between batches

            for (let i = 2; i <= totalPages; i += BATCH_SIZE) {
                const batch = []
                for (let j = 0; j < BATCH_SIZE && i + j <= totalPages; j++) {
                    const pageParams: any = {
                        fromTimestamp: startOfMonth,
                        limit: 100,
                        page: i + j
                    }

                    // Use tag-based filtering if enabled
                    if (BILLING_CONFIG.SYNC.USE_TAG_FILTERING) {
                        pageParams.tags = ['billing:pending']
                    }

                    batch.push(langfuse.fetchTraces(pageParams))
                }

                const responses = await Promise.all(batch)

                responses.forEach((response) => {
                    const validTraces = response.data.filter((trace) => {
                        if (traceId && trace.id !== traceId) {
                            return false
                        }
                        const hasTokenCost = trace.totalCost > 0
                        const hasComputeTime = trace.latency > 0
                        const metadata = (trace.metadata as TraceMetadata) || {}
                        const tags = (trace.tags || []) as string[]

                        // Self-healing: Check both metadata AND tags for processed status
                        const isProcessed = metadata.billing_status === 'processed' || tags.includes('billing:processed')
                        const isNotProcessed = !isProcessed

                        return (hasTokenCost || hasComputeTime) && isNotProcessed
                    })
                    allTraces = allTraces.concat(validTraces)
                })

                // Rate limit delay between batches
                if (i + BATCH_SIZE <= totalPages) {
                    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
                }
            }

            return allTraces
        } catch (error) {
            log.error('Error fetching usage data from Langfuse:', error)
            console.log(error)
            throw error
        }
    }

    /**
     * Fetch a group of pages in parallel (memory-efficient batch processing)
     * @param startPage - Starting page number (1-indexed)
     * @param endPage - Ending page number (inclusive)
     * @param fromTimestamp - Timestamp to fetch traces from
     * @param traceId - Optional specific trace ID to filter for
     * @param skippedTraces - Optional array to track skipped traces
     * @returns Array of filtered traces from the page range
     */
    private async fetchPageGroup(
        startPage: number,
        endPage: number,
        fromTimestamp: Date,
        traceId?: string,
        skippedTraces?: Array<{ traceId: string; reason: string }>
    ): Promise<GetLangfuseTracesResponse['data']> {
        const batch = []

        // Build base fetch parameters
        const baseFetchParams: any = {
            fromTimestamp,
            limit: 100
        }

        // If tag filtering is enabled, only fetch traces with 'billing:pending' tag
        if (BILLING_CONFIG.SYNC.USE_TAG_FILTERING) {
            baseFetchParams.tags = ['billing:pending']
        }

        // Build batch of page requests
        for (let page = startPage; page <= endPage; page++) {
            batch.push(
                langfuse.fetchTraces({
                    ...baseFetchParams,
                    page
                })
            )
        }

        // Fetch all pages in parallel
        const responses = await Promise.all(batch)

        // Filter and combine traces from all responses
        // Note: If USE_TAG_FILTERING is enabled, we already filtered at API level,
        // but we still do in-memory filtering as a defensive measure for self-healing
        const traces: GetLangfuseTracesResponse['data'] = []
        let untaggedCount = 0

        responses.forEach((response) => {
            const validTraces = response.data.filter((trace) => {
                if (traceId && trace.id !== traceId) {
                    return false
                }
                const hasTokenCost = trace.totalCost > 0
                const hasComputeTime = trace.latency > 0
                const metadata = (trace.metadata as TraceMetadata) || {}
                const tags = (trace.tags || []) as string[]

                // Self-healing: Check both metadata AND tags for processed status
                // A trace is considered processed if EITHER:
                // 1. metadata.billing_status === 'processed', OR
                // 2. tags includes 'billing:processed'
                const isProcessed = metadata.billing_status === 'processed' || tags.includes('billing:processed')
                const isNotProcessed = !isProcessed

                // Track untagged traces for logging (self-healing scenario)
                const hasNoBillingTags = !tags.includes('billing:processed') && !tags.includes('billing:pending')
                if (isNotProcessed && hasNoBillingTags && (hasTokenCost || hasComputeTime)) {
                    untaggedCount++
                }

                // Track skipped traces (if tracking array provided)
                if (skippedTraces) {
                    if (isProcessed) {
                        skippedTraces.push({ traceId: trace.id, reason: 'Already processed' })
                    }
                    if (!(hasTokenCost || hasComputeTime)) {
                        skippedTraces.push({ traceId: trace.id, reason: 'No billable usage' })
                    }
                }

                return (hasTokenCost || hasComputeTime) && isNotProcessed
            })
            traces.push(...validTraces)
        })

        // Log if we found untagged traces (self-healing scenario)
        // This should be rare when tag filtering is enabled
        if (untaggedCount > 0) {
            log.info('Self-healing: Found untagged traces with billable usage', {
                count: untaggedCount,
                pageRange: `${startPage}-${endPage}`,
                tagFilteringEnabled: BILLING_CONFIG.SYNC.USE_TAG_FILTERING
            })
        }

        return traces
    }

    private async validateUsageData(trace: Trace): Promise<boolean> {
        const metadata = (trace.metadata as TraceMetadata) || {}
        return !!(
            (trace.id && typeof trace.totalCost === 'number' && typeof trace.latency === 'number')
            // && metadata.billing_status !== 'processed'
        )
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
            if (traceTimestampSeconds > nowUtcSeconds + 300) {
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
            const { data: fullTrace } = await langfuse.fetchTrace(trace.id)
            const costs = await this.calculateCosts(fullTrace)
            metadata.aiCredentialsOwnership = costs.aiCredentialsOwnership
            const credits = this.convertCostsToCredits(costs)
            const modelUsage = await this.getModelUsage(fullTrace as any)

            const creditsData = this.buildCreditsData(fullTrace, metadata, costs, credits, modelUsage, traceTimestampSeconds)
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
            const result = await appServer.AppDataSource.query('SELECT flow_data FROM chat_flow WHERE id = $1', [chatflowId])

            if (result?.[0]?.flow_data) {
                const { hasPlatformAINodes } = extractCredentialsAndModels(result[0].flow_data)
                this.platformNodeCache.set(chatflowId, hasPlatformAINodes)
                return hasPlatformAINodes
            }
        } catch (error) {
            log.debug('Failed to check AAI nodes', { chatflowId, error })
        }

        this.platformNodeCache.set(chatflowId, false)
        return false
    }

    private async calculateCosts(trace: FullTrace): Promise<{
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

    private async getModelUsage(trace: FullTrace) {
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
        trace: FullTrace,
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

            // Fetch traces from Langfuse with pagination
            const langfuseResponse = await langfuse.fetchTraces({
                fromTimestamp: startDate,
                toTimestamp: endDate,
                limit,
                page,
                userId,
                orderBy: sortBy === 'timestamp' ? (sortOrder === 'desc' ? 'timestamp.DESC' : 'timestamp.ASC') : undefined
                // Note: We can't directly filter by customerId in the API call
                // We'll filter the results after fetching
            })

            // Filter traces by customerId
            const filteredTraces = (langfuseResponse?.data || []).filter((trace) => {
                const metadata = trace.metadata as TraceMetadata
                return (
                    trace.userId === userId ||
                    trace.userId === params.user.id ||
                    params.user.roles?.includes('Admin') ||
                    (metadata && metadata.stripeCustomerId === customerId)
                )
            })

            // Transform traces to UsageEvent format
            const events: UsageEvent[] = filteredTraces.map((trace) => {
                const metadata = (trace.metadata as TraceMetadata) || {}

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
