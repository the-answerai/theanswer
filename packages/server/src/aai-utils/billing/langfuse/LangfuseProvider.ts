import { SparksData, TraceMetadata, SyncUsageResponse } from '../core/types'
import { langfuse, log, DEFAULT_CUSTOMER_ID, BILLING_CONFIG } from '../config'
import type { GetLangfuseTraceResponse, GetLangfuseTracesResponse } from 'langfuse-core'
import { StripeProvider } from '../stripe/StripeProvider'
import { stripe as stripeClient } from '../config'
import Stripe from 'stripe'

type Trace = GetLangfuseTracesResponse['data'][number]
type FullTrace = GetLangfuseTraceResponse

export class LangfuseProvider {
    // async getUsageStats(customerId: string): Promise<UsageStats> {
    //     try {
    //         const traces = await this.fetchUsageData()
    //         const sparksData = await this.convertUsageToSparks(traces)

    //         // Calculate totals
    //         const totalSparks = sparksData.reduce((acc, data) => acc + data.sparks.total, 0)
    //         const totalCost = sparksData.reduce((acc, data) => acc + data.usage.totalCost, 0)

    //         // Get billing period
    //         const now = new Date()
    //         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    //         const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    //         return {
    //             // ai_tokens: {
    //             //     used: Math.round(totalSparks * BILLING_CONFIG.AI_TOKENS.TOKENS_PER_SPARK),
    //             //     total: 1000000, // Default limit
    //             //     sparks: totalSparks,
    //             //     cost: totalSparks * BILLING_CONFIG.SPARK_TO_USD,
    //             //     rate: BILLING_CONFIG.AI_TOKENS.TOKENS_PER_SPARK
    //             // },
    //             // compute: {
    //             //     used: 0,
    //             //     total: 10000,
    //             //     sparks: 0,
    //             //     cost: 0,
    //             //     rate: BILLING_CONFIG.COMPUTE.MINUTES_PER_SPARK
    //             // },
    //             // storage: {
    //             //     used: 0,
    //             //     total: 100,
    //             //     sparks: 0,
    //             //     cost: 0,
    //             //     rate: BILLING_CONFIG.STORAGE.GB_PER_SPARK
    //             // },
    //             total_sparks: totalSparks,
    //             dailyUsageByMeter: {},
    //             usageByMeter: {},
    //             lastUpdated: new Date(),
    //             // total_cost: totalCost,
    //             // billing_period: {
    //             //     start: startOfMonth.toISOString(),
    //             //     end: endOfMonth.toISOString()
    //             // }
    //         }
    //     } catch (error: any) {
    //         log.error('Failed to get Langfuse usage stats', { error, customerId })
    //         throw error
    //     }
    // }

    async syncUsageToStripe(traceId?: string): Promise<SyncUsageResponse> {
        let traces: Trace[] = []
        let sparksDataWithTraces: Array<{ sparksData: SparksData; fullTrace: any }> = []
        let failedTraces: Array<{ traceId: string; error: string }> = []
        let processedTraces: string[] = []
        let meterEvents: Stripe.Billing.MeterEvent[] = []

        try {
            traces = await this.fetchUsageData(traceId)
            sparksDataWithTraces = await this.convertUsageToSparks(traces)

            // Create meter events in Stripe
            const stripeProvider = new StripeProvider(stripeClient)
            const stripeResponse = await stripeProvider.syncUsageToStripe(
                sparksDataWithTraces.map((item) => ({
                    ...item.sparksData,
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
            traces,
            sparksData: sparksDataWithTraces.map((item) => item.sparksData),
            meterEvents
        }
    }

    private async fetchUsageData(traceId?: string): Promise<GetLangfuseTracesResponse['data']> {
        try {
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
            trace.id &&
            typeof trace.totalCost === 'number' &&
            typeof trace.latency === 'number' &&
            metadata.billing_status !== 'processed'
        )
    }
    private async convertUsageToSparks(usageData: Trace[]): Promise<Array<{ sparksData: SparksData; fullTrace: any }>> {
        const validTraces = await Promise.all(usageData.map((trace) => this.validateUsageData(trace)))
        const filteredData = usageData.filter((_, index) => validTraces[index])
        const processedData: Array<{ sparksData: SparksData; fullTrace: any }> = []

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
            const validResults = batchResults.filter((result): result is { sparksData: SparksData; fullTrace: any } => !!result)
            processedData.push(...validResults)

            // Apply rate limiting between batches
            if (i + BATCH_SIZE < filteredData.length) {
                await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
            }
        }

        return processedData
    }

    private async processTrace(trace: Trace, nowUtcSeconds: number): Promise<{ sparksData: SparksData; fullTrace: any } | undefined> {
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
            const sparks = this.convertCostsToSparks(costs)
            const modelUsage = await this.getModelUsage(fullTrace as any)

            const sparksData = this.buildSparksData(fullTrace, metadata, costs, sparks, modelUsage, traceTimestampSeconds)
            return { sparksData, fullTrace: fullTrace }
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
        const aiCost = trace.totalCost
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

    private convertCostsToSparks(costs: { ai: number; compute: number; storage: number; withMargin: number }) {
        return {
            ai_tokens: Math.ceil((costs.ai * BILLING_CONFIG.MARGIN_MULTIPLIER) / BILLING_CONFIG.SPARK_TO_USD),
            compute: Math.ceil((costs.compute * BILLING_CONFIG.MARGIN_MULTIPLIER) / BILLING_CONFIG.SPARK_TO_USD),
            storage: Math.ceil((costs.storage * BILLING_CONFIG.MARGIN_MULTIPLIER) / BILLING_CONFIG.SPARK_TO_USD)
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

    private buildSparksData(
        trace: FullTrace,
        metadata: TraceMetadata,
        costs: { ai: number; compute: number; storage: number; total: number; withMargin: number },
        sparks: { ai_tokens: number; compute: number; storage: number },
        modelUsage: Array<any>,
        timestampSeconds: number
    ): SparksData {
        const totalSparks = sparks.ai_tokens + sparks.compute + sparks.storage
        const computeMinutes = trace.latency / (1000 * 60)

        return {
            traceId: trace.id,
            stripeCustomerId: metadata.customerId || DEFAULT_CUSTOMER_ID!,
            subscriptionTier: metadata.subscriptionTier || 'free',
            timestamp: trace.timestamp.toString(),
            timestampEpoch: timestampSeconds,
            sparks: {
                ...sparks,
                total: totalSparks
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
}
