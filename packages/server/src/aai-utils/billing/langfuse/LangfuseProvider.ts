import { UsageStats, SparksData, TraceMetadata } from '../core/types'
import { langfuse, log, DEFAULT_CUSTOMER_ID, BILLING_CONFIG } from '../config'
import type { GetLangfuseTraceResponse, GetLangfuseTracesResponse } from 'langfuse-core'
import { Console } from 'winston/lib/winston/transports'

type Trace = GetLangfuseTracesResponse['data'][number]

export class LangfuseProvider {
    async getUsageStats(customerId: string): Promise<UsageStats> {
        try {
            const traces = await this.fetchUsageData()
            const sparksData = await this.convertUsageToSparks(traces)

            // Calculate totals
            const totalSparks = sparksData.reduce((acc, data) => acc + data.sparks.total, 0)
            const totalCost = sparksData.reduce((acc, data) => acc + data.usage.totalCost, 0)

            // Get billing period
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

            return {
                ai_tokens: {
                    used: Math.round(totalSparks * BILLING_CONFIG.AI_TOKENS.TOKENS_PER_SPARK),
                    total: 1000000, // Default limit
                    sparks: totalSparks,
                    cost: totalSparks * BILLING_CONFIG.AI_TOKENS.COST_PER_SPARK,
                    rate: BILLING_CONFIG.AI_TOKENS.TOKENS_PER_SPARK
                },
                compute: {
                    used: 0,
                    total: 10000,
                    sparks: 0,
                    cost: 0,
                    rate: BILLING_CONFIG.COMPUTE.MINUTES_PER_SPARK
                },
                storage: {
                    used: 0,
                    total: 100,
                    sparks: 0,
                    cost: 0,
                    rate: BILLING_CONFIG.STORAGE.GB_PER_SPARK
                },
                total_sparks: totalSparks,
                total_cost: totalCost,
                billing_period: {
                    start: startOfMonth.toISOString(),
                    end: endOfMonth.toISOString()
                }
            }
        } catch (error: any) {
            log.error('Failed to get Langfuse usage stats', { error, customerId })
            throw error
        }
    }

    async syncUsageToStripe(traceId?: string): Promise<{
        processedTraces: string[]
        failedTraces: Array<{ traceId: string; error: string }>
    }> {
        let traces: Trace[] = []
        let sparksData: SparksData[] = []
        let failedTraces: Array<{ traceId: string; error: string }> = []
        let processedTraces: string[] = []

        try {
            traces = await this.fetchUsageData(traceId)
            sparksData = await this.convertUsageToSparks(traces)
        } catch (error: any) {
            console.log('Error fetching usage data from Langfuse:', error)
            failedTraces = [{ traceId: traceId || 'unknown', error: error.message }]
        }

        processedTraces = sparksData.map((data) => data.traceId)
        return {
            ...(process.env.NODE_ENV === 'development' ? { traces, sparksData } : {}),
            processedTraces,
            failedTraces
        }
    }

    private async fetchUsageData(traceId?: string): Promise<GetLangfuseTracesResponse['data']> {
        try {
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            let allTraces: GetLangfuseTracesResponse['data'] = []
            let currentPage = 1
            let hasMore = true

            while (hasMore) {
                const response = await langfuse.fetchTraces({
                    fromTimestamp: startOfMonth,
                    limit: 100,
                    page: currentPage
                })

                const validTraces = response.data.filter((trace) => {
                    const hasTokenCost = trace.totalCost > 0
                    const hasComputeTime = trace.latency > 0
                    return hasTokenCost || hasComputeTime
                })

                allTraces = allTraces.concat(validTraces)
                hasMore = response.meta.totalPages > currentPage
                currentPage++
            }

            return allTraces
        } catch (error) {
            log.error('Error fetching usage data from Langfuse:', error)
            throw new Error('Failed to fetch usage data from Langfuse')
        }
    }

    private async validateUsageData(trace: Trace): Promise<boolean> {
        return !!(trace.id && typeof trace.totalCost === 'number' && typeof trace.latency === 'number')
    }

    private async convertUsageToSparks(usageData: Trace[]): Promise<SparksData[]> {
        const validTraces = await Promise.all(usageData.map((trace) => this.validateUsageData(trace)))
        const filteredData = usageData.filter((_, index) => validTraces[index])
        const processedData: SparksData[] = []

        for (const trace of filteredData) {
            const metadata = (trace.metadata || {}) as TraceMetadata
            const computeMinutes = trace.latency / (1000 * 60)
            const fullTrace = await langfuse.fetchTrace(trace.id)
            const modelUsage = fullTrace.data.observations
                .filter((obs) => obs.model && (obs.calculatedTotalCost || obs.calculatedTotalCost === 0))
                .map((obs) => ({
                    model: obs.model!,
                    inputTokens: obs.usage?.input || 0,
                    outputTokens: obs.usage?.output || 0,
                    totalTokens: obs.usage?.total || 0,
                    costUSD: obs.calculatedTotalCost || 0
                }))

            const aiTokensSparks = modelUsage.reduce((total: number, model) => {
                const costBasedSparks = Math.ceil(model.costUSD * BILLING_CONFIG.AI_TOKENS.USD_TO_SPARKS)
                const tokenBasedSparks = Math.max(1, Math.ceil(model.totalTokens / 100))
                return total + Math.max(costBasedSparks, tokenBasedSparks)
            }, 0)

            const finalAiTokensSparks =
                aiTokensSparks === 0 && trace.totalCost > 0
                    ? Math.max(1, Math.ceil(trace.totalCost * BILLING_CONFIG.AI_TOKENS.USD_TO_SPARKS))
                    : Math.max(
                          aiTokensSparks,
                          Math.ceil(fullTrace.data.observations.reduce((sum: number, obs) => sum + (obs.usage?.total || 0), 0) / 100)
                      )

            const computeSparks = Math.max(1, Math.ceil(computeMinutes * 60))

            const sparksData: SparksData = {
                traceId: trace.id,
                customerId: metadata.customerId || DEFAULT_CUSTOMER_ID!,
                subscriptionTier: metadata.subscriptionTier || 'free',
                sparks: {
                    ai_tokens: finalAiTokensSparks,
                    compute: computeSparks,
                    storage: 0,
                    cost: 0,
                    total: finalAiTokensSparks + computeSparks
                },
                metadata,
                usage: {
                    tokens: modelUsage.reduce((sum: number, model) => sum + model.totalTokens, 0),
                    computeMinutes,
                    storageGB: 0,
                    totalCost: trace.totalCost,
                    models: modelUsage
                }
            }

            processedData.push(sparksData)
        }

        return processedData
    }
}
