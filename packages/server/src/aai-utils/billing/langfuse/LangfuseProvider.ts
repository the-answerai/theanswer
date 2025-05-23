import { CreditsData, TraceMetadata, SyncUsageResponse, UsageEvent, UsageEventsResponse, GetUsageEventsParams } from '../core/types'
import { langfuse, log, DEFAULT_CUSTOMER_ID, BILLING_CONFIG } from '../config'
import type { GetLangfuseTraceResponse, GetLangfuseTracesResponse } from 'langfuse-core'
import { StripeProvider } from '../stripe/StripeProvider'
import Stripe from 'stripe'

type Trace = GetLangfuseTracesResponse['data'][number]
type FullTrace = GetLangfuseTraceResponse

export class LangfuseProvider {
    async syncUsageToStripe(traceId?: string): Promise<SyncUsageResponse> {
        let traces: Trace[] = []
        let creditsDataWithTraces: Array<{ creditsData: CreditsData; fullTrace: any }> = []
        let failedTraces: Array<{ traceId: string; error: string }> = []
        let processedTraces: string[] = []
        let skippedTraces: Array<{ traceId: string; reason: string }> = []
        let meterEvents: Stripe.Billing.MeterEvent[] = []

        try {
            traces = await this.fetchUsageData(traceId)
            // Track skipped traces from initial filtering
            const skippedFromInitialFilter = traces.filter((trace) => {
                const metadata = (trace.metadata as TraceMetadata) || {}
                if (metadata.billing_status === 'processed') {
                    skippedTraces.push({ traceId: trace.id, reason: 'Already processed' })
                    return true
                }
                if (!(trace.totalCost > 0 || trace.latency > 0)) {
                    skippedTraces.push({ traceId: trace.id, reason: 'No billable usage' })
                    return true
                }
                return false
            })

            creditsDataWithTraces = await this.convertUsageToCredits(traces)

            // Create meter events in Stripe
            const stripeProvider = new StripeProvider()
            const stripeResponse = await stripeProvider.syncUsageToStripe(
                creditsDataWithTraces.map((item) => ({
                    ...item.creditsData,
                    fullTrace: item.fullTrace
                }))
            )
            meterEvents = stripeResponse.meterEvents
            failedTraces = stripeResponse.failedEvents
            processedTraces = stripeResponse.processedTraces
        } catch (error: any) {
            log.error('Error syncing usage data:', error)
            failedTraces = [{ traceId: traceId || 'unknown', error: error.message }]
        }

        return {
            processedTraces,
            failedTraces,
            skippedTraces,
            traces,
            creditsData: creditsDataWithTraces.map((item) => item.creditsData),
            meterEvents
        }
    }

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

            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            // Get total pages first
            const initialResponse = await langfuse.fetchTraces({
                fromTimestamp: startOfMonth,
                limit: 100,
                page: 1
            })

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
                const isNotProcessed = metadata.billing_status !== 'processed'
                return (hasTokenCost || hasComputeTime) && isNotProcessed
            })
            allTraces = allTraces.concat(validInitialTraces)

            // Fetch remaining pages in parallel with rate limiting
            const BATCH_SIZE = 15 // Number of concurrent requests
            const RATE_LIMIT_DELAY = 1000 // 1 second delay between batches

            for (let i = 2; i <= totalPages; i += BATCH_SIZE) {
                const batch = []
                for (let j = 0; j < BATCH_SIZE && i + j <= totalPages; j++) {
                    batch.push(
                        langfuse.fetchTraces({
                            fromTimestamp: startOfMonth,
                            limit: 100,
                            page: i + j
                        })
                    )
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
                        const isNotProcessed = metadata.billing_status !== 'processed'
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

            const metadata = (trace.metadata || {}) as TraceMetadata
            const { data: fullTrace } = await langfuse.fetchTrace(trace.id)
            const costs = await this.calculateCosts(fullTrace)
            const credits = this.convertCostsToCredits(costs)
            const modelUsage = await this.getModelUsage(fullTrace as any)

            const creditsData = this.buildCreditsData(fullTrace, metadata, costs, credits, modelUsage, traceTimestampSeconds)
            return { creditsData, fullTrace: fullTrace }
        } catch (error: any) {
            log.error('Error processing trace', { traceId: trace.id, error: error.message })
            return undefined
        }
    }

    private async calculateCosts(trace: FullTrace): Promise<{
        ai: number
        compute: number
        storage: number
        total: number
        withMargin: number
    }> {
        const computeMinutes = trace.latency / (1000 * 60)
        const aiCost = trace.metadata.aiCredentialsOwnership === 'platform' ? trace.totalCost : 0
        const computeCost = computeMinutes * 0.05
        const storageCost = 0
        const totalBase = aiCost + computeCost + storageCost
        const withMargin = totalBase * BILLING_CONFIG.MARGIN_MULTIPLIER

        return {
            ai: aiCost,
            compute: computeCost,
            storage: storageCost,
            total: totalBase,
            withMargin
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
