import { supabase } from '../config/db.js'

// Token pricing based on model (approximate, can be updated)
const TOKEN_PRICING = {
    embedding: 0.0001, // per 1K tokens
    completion: 0.002, // per 1K tokens for input
    output: 0.002, // per 1K tokens for output
    default: 0.001 // default fallback
}

/**
 * Log token usage for AI operations
 * @param {string} researchViewId - ID of the research view
 * @param {string} operationType - Type of operation (embedding, summarization, analysis, etc.)
 * @param {number} tokensInput - Number of input tokens used
 * @param {number} tokensOutput - Number of output tokens used
 * @param {number} totalTokens - Total tokens (if available)
 */
export const logTokenUsage = async (researchViewId, operationType, tokensInput = 0, tokensOutput = 0, totalTokens = null) => {
    try {
        // Skip logging if no tokens were used
        if ((tokensInput <= 0 && tokensOutput <= 0) || !researchViewId) {
            return
        }

        // Get current user ID
        const { data: session } = await supabase.auth.getSession()
        const userId = session?.user?.id

        // Calculate total tokens if not provided
        if (totalTokens === null) {
            totalTokens = tokensInput + tokensOutput
        }

        // Calculate estimated cost
        let estimatedCost = 0

        if (operationType === 'embedding') {
            estimatedCost = (totalTokens / 1000) * TOKEN_PRICING.embedding
        } else {
            estimatedCost = (tokensInput / 1000) * TOKEN_PRICING.completion + (tokensOutput / 1000) * TOKEN_PRICING.output
        }

        // Round to 6 decimal places
        estimatedCost = Math.round(estimatedCost * 1000000) / 1000000

        // Log to database
        const { error } = await supabase.from('usage_logs').insert({
            user_id: userId,
            research_view_id: researchViewId,
            operation_type: operationType,
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            estimated_cost: estimatedCost
        })

        if (error) {
            console.error('Error logging token usage:', error)
        }
    } catch (error) {
        console.error('Error in logTokenUsage:', error)
        // Non-critical, so we just log the error
    }
}

/**
 * Get token usage for a research view
 * @param {string} researchViewId - ID of the research view
 * @returns {Object} Usage statistics
 */
export const getUsageStats = async (researchViewId) => {
    try {
        // Get aggregate token usage
        const { data, error } = await supabase
            .from('usage_logs')
            .select('operation_type, tokens_input, tokens_output, estimated_cost')
            .eq('research_view_id', researchViewId)

        if (error) throw error

        // Initialize stats object
        const stats = {
            total_tokens: 0,
            total_cost: 0,
            by_operation: {}
        }

        // Calculate totals
        for (const log of data) {
            const totalTokens = log.tokens_input + log.tokens_output
            stats.total_tokens += totalTokens
            stats.total_cost += log.estimated_cost

            // Group by operation type
            if (!stats.by_operation[log.operation_type]) {
                stats.by_operation[log.operation_type] = {
                    tokens: 0,
                    cost: 0,
                    count: 0
                }
            }

            stats.by_operation[log.operation_type].tokens += totalTokens
            stats.by_operation[log.operation_type].cost += log.estimated_cost
            stats.by_operation[log.operation_type].count += 1
        }

        // Round the total cost to 2 decimal places
        stats.total_cost = Math.round(stats.total_cost * 100) / 100

        // Round costs in by_operation to 4 decimal places
        for (const op in stats.by_operation) {
            stats.by_operation[op].cost = Math.round(stats.by_operation[op].cost * 10000) / 10000
        }

        return stats
    } catch (error) {
        console.error('Error getting usage stats:', error)
        throw error
    }
}
