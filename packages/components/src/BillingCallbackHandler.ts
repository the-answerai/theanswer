// @ts-nocheck
import { BaseTracer, Run } from '@langchain/core/tracers/base'
import { AIMessage, AIMessageChunk } from '@langchain/core/messages'

interface ChainMetrics {
    startTime: Date
    totalInputTokens: number
    totalOutputTokens: number
    totalDuration: number
    models: Set<string>
    llmCalls: number
}

export class BillingCallbackHandler extends BaseTracer {
    name = 'billing_callback_handler' as const
    private completionStartTimes: { [key: string]: Date } = {}
    private chainMetrics: { [key: string]: ChainMetrics } = {}
    private llmToChainMap: { [key: string]: string } = {} // Maps LLM runs to their parent chain
    private traceId?: string
    private rootRunId?: string

    protected persistRun(_run: Run) {
        return Promise.resolve()
    }

    constructor() {
        super()
    }

    onChainStart(run: Run) {
        // If this is a root chain (no parent), set it as the trace
        if (!run.parent_run_id) {
            this.traceId = this.traceId || run.id
            this.rootRunId = run.id
        }

        this.chainMetrics[run.id] = {
            startTime: new Date(),
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalDuration: 0,
            models: new Set(),
            llmCalls: 0
        }

        console.log({
            chainId: run.id,
            traceId: this.traceId,
            event: 'chain_start',
            parent_run_id: run.parent_run_id,
            timestamp: new Date().toISOString()
        })
    }

    onChainEnd(run: Run) {
        const metrics = this.chainMetrics[run.id]
        if (!metrics) return

        const endTime = new Date()
        const chainDuration = endTime.getTime() - metrics.startTime.getTime()

        // Log cumulative chain metrics
        console.log({
            chainId: run.id,
            traceId: this.traceId,
            event: 'chain_end',
            total_input_tokens: metrics.totalInputTokens,
            total_output_tokens: metrics.totalOutputTokens,
            total_tokens: metrics.totalInputTokens + metrics.totalOutputTokens,
            total_duration_ms: metrics.totalDuration,
            chain_duration_ms: chainDuration,
            models: Array.from(metrics.models),
            llm_calls: metrics.llmCalls,
            start_time: metrics.startTime.toISOString(),
            end_time: endTime.toISOString()
        })

        // If this is the root chain, clear trace info
        if (run.id === this.rootRunId) {
            this.traceId = undefined
            this.rootRunId = undefined
        }

        // Cleanup chain data
        delete this.chainMetrics[run.id]
    }

    onLLMStart(run: Run) {
        const startTime = new Date()
        this.completionStartTimes[run.id] = startTime

        // Find parent chain if it exists
        const parentChainId = run.parent_run_id
        if (parentChainId) {
            this.llmToChainMap[run.id] = parentChainId
        }

        // Extract model information following langfuse pattern
        const invocationParams = ('kwargs' in run && run.kwargs?.invocation_params) || {}
        const model = invocationParams?.model || run.kwargs?.metadata?.ls_model_name || 'unknown'

        // Update chain metrics if this is part of a chain
        if (parentChainId && this.chainMetrics[parentChainId]) {
            this.chainMetrics[parentChainId].models.add(model)
            this.chainMetrics[parentChainId].llmCalls++
        }

        console.log({
            runId: run.id,
            traceId: this.traceId,
            chainId: parentChainId,
            event: 'start',
            model,
            model_parameters: {
                temperature: invocationParams?.temperature,
                max_tokens: invocationParams?.max_tokens,
                top_p: invocationParams?.top_p,
                frequency_penalty: invocationParams?.frequency_penalty,
                presence_penalty: invocationParams?.presence_penalty,
                request_timeout: invocationParams?.request_timeout
            },
            timestamp: startTime.toISOString()
        })
    }

    onLLMEnd(run: Run) {
        const endTime = new Date()
        const startTime = this.completionStartTimes[run.id]

        if (!startTime) {
            console.log(`Warning: No start time found for run ${run.id}`)
            return
        }

        const duration = endTime.getTime() - startTime.getTime()
        const chainId = this.llmToChainMap[run.id]

        try {
            // Extract the last response and its usage metadata
            const generations = run.outputs?.generations || []
            const lastGeneration = generations[generations.length - 1]?.[generations[generations.length - 1]?.length - 1]

            // Extract usage metadata from either the message or llmOutput
            const usageMetadata = this.extractUsageMetadata(lastGeneration) || run.outputs?.llmOutput?.tokenUsage

            // Normalize token counts across different model outputs
            const usageDetails = {
                input_tokens: usageMetadata?.input_tokens || usageMetadata?.prompt_tokens || usageMetadata?.promptTokens || 0,
                output_tokens: usageMetadata?.output_tokens || usageMetadata?.completion_tokens || usageMetadata?.completionTokens || 0,
                total_tokens: usageMetadata?.total_tokens || usageMetadata?.totalTokens || 0
            }

            // Extract model information following langfuse pattern
            const invocationParams = ('kwargs' in run && run.kwargs?.invocation_params) || {}
            const model = invocationParams?.model || run.kwargs?.metadata?.ls_model_name || 'unknown'

            // Update chain metrics if this is part of a chain
            if (chainId && this.chainMetrics[chainId]) {
                const chainMetrics = this.chainMetrics[chainId]
                chainMetrics.totalInputTokens += usageDetails.input_tokens
                chainMetrics.totalOutputTokens += usageDetails.output_tokens
                chainMetrics.totalDuration += duration
            }

            // Log individual LLM call metrics
            console.log({
                runId: run.id,
                traceId: this.traceId,
                chainId,
                event: 'end',
                model,
                model_parameters: {
                    temperature: invocationParams?.temperature,
                    max_tokens: invocationParams?.max_tokens,
                    top_p: invocationParams?.top_p,
                    frequency_penalty: invocationParams?.frequency_penalty,
                    presence_penalty: invocationParams?.presence_penalty,
                    request_timeout: invocationParams?.request_timeout
                },
                input_tokens: usageDetails.input_tokens,
                output_tokens: usageDetails.output_tokens,
                total_tokens: usageDetails.total_tokens,
                duration_ms: duration,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
            })
        } catch (e) {
            console.error('Error processing LLM end metrics:', e)
        } finally {
            // Cleanup
            delete this.completionStartTimes[run.id]
            delete this.llmToChainMap[run.id]
        }
    }

    onLLMError(run: Run) {
        const endTime = new Date()
        const startTime = this.completionStartTimes[run.id]
        const chainId = this.llmToChainMap[run.id]

        if (!startTime) {
            console.log(`Warning: No start time found for errored run ${run.id}`)
            return
        }

        const duration = endTime.getTime() - startTime.getTime()
        const invocationParams = ('kwargs' in run && run.kwargs?.invocation_params) || {}
        const model = invocationParams?.model || run.kwargs?.metadata?.ls_model_name || 'unknown'

        // Update chain duration even for errors
        if (chainId && this.chainMetrics[chainId]) {
            this.chainMetrics[chainId].totalDuration += duration
        }

        console.log({
            runId: run.id,
            traceId: this.traceId,
            chainId,
            event: 'error',
            error: run.error,
            model,
            model_parameters: {
                temperature: invocationParams?.temperature,
                max_tokens: invocationParams?.max_tokens,
                top_p: invocationParams?.top_p,
                frequency_penalty: invocationParams?.frequency_penalty,
                presence_penalty: invocationParams?.presence_penalty,
                request_timeout: invocationParams?.request_timeout
            },
            duration_ms: duration,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
        })

        // Cleanup
        delete this.completionStartTimes[run.id]
        delete this.llmToChainMap[run.id]
    }

    onChainError(run: Run) {
        const metrics = this.chainMetrics[run.id]
        if (!metrics) return

        const endTime = new Date()
        const chainDuration = endTime.getTime() - metrics.startTime.getTime()

        // Log chain error with accumulated metrics
        console.log({
            chainId: run.id,
            traceId: this.traceId,
            event: 'chain_error',
            error: run.error,
            total_input_tokens: metrics.totalInputTokens,
            total_output_tokens: metrics.totalOutputTokens,
            total_tokens: metrics.totalInputTokens + metrics.totalOutputTokens,
            total_duration_ms: metrics.totalDuration,
            chain_duration_ms: chainDuration,
            models: Array.from(metrics.models),
            llm_calls: metrics.llmCalls,
            start_time: metrics.startTime.toISOString(),
            end_time: endTime.toISOString()
        })

        // If this is the root chain, clear trace info
        if (run.id === this.rootRunId) {
            this.traceId = undefined
            this.rootRunId = undefined
        }

        // Cleanup chain data
        delete this.chainMetrics[run.id]
    }

    /** Extract usage metadata from the generation output */
    private extractUsageMetadata(generation: any) {
        try {
            if (!generation) return undefined

            // Try to get usage metadata from AIMessage
            if ('message' in generation && (generation.message instanceof AIMessage || generation.message instanceof AIMessageChunk)) {
                return generation.message.usage_metadata
            }

            // Try to get usage metadata directly from the generation
            if ('usage_metadata' in generation) {
                return generation.usage_metadata
            }

            return undefined
        } catch (err) {
            console.error('Error extracting usage metadata:', err)
            return undefined
        }
    }

    // Empty implementations for other required methods
    onToolStart(_run: Run) {}
    onToolEnd(_run: Run) {}
    onToolError(_run: Run) {}
    onAgentAction(_run: Run) {}
}
