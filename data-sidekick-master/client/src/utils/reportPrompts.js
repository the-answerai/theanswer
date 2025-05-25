/**
 * System prompts and schemas for report generation
 */

export const TITLE_SUGGESTION_PROMPT = `You are an expert report title generator for a call center analytics system. 
Based on the provided filters and context, suggest a clear, professional, and descriptive title for the report.

The title should:
1. Be concise but informative (3-7 words)
2. Reflect the main focus of the analysis
3. Use proper capitalization
4. Avoid technical jargon unless necessary
5. Be easily understandable by business stakeholders

Respond with just the title, no additional explanation.`

export const TITLE_SUGGESTION_SCHEMA = `z.object({
    title: z.string().min(3).max(100)
})`

export const PROMPT_SUGGESTION_PROMPT = `You are an expert analytics prompt generator for a call center analytics system.
Based on the provided report type, user's prompt, and context filters, enhance and structure the analysis prompt.

The enhanced prompt should:
1. Incorporate the user's specific analysis requests
2. Add relevant structure from the report type template
3. Include context-specific metrics based on the filters
4. Maintain focus on actionable insights
5. Preserve the user's original intent while adding depth

Context will be provided in this format:
Report Type: [type]
Base Structure: [structure]
User Prompt: [prompt]
Filters: [filters]

Respond with an enhanced version of the user's prompt that incorporates the structure and metrics from the report type.
The response should be a well-formatted analysis prompt that maintains the user's original focus while adding depth and structure.`

export const PROMPT_SUGGESTION_SCHEMA = `z.object({
    prompt: z.string().min(50).max(2000)
})`

/**
 * Generate context text based on report filters
 */
export const generateFilterContext = (filters) => {
    const parts = []

    if (filters.callType && filters.callType !== 'all') {
        parts.push(`Call Type: ${filters.callType}`)
    }

    if (filters.employeeId) {
        parts.push(`Specific Employee ID: ${filters.employeeId}`)
    }

    if (filters.selectedTags && filters.selectedTags.length > 0) {
        parts.push(`Tags: ${filters.selectedTags.join(', ')}`)
    }

    if (filters.resolutionStatus && filters.resolutionStatus !== 'all') {
        parts.push(`Resolution Status: ${filters.resolutionStatus}`)
    }

    if (filters.escalated && filters.escalated !== 'all') {
        parts.push(`Escalated Calls: ${filters.escalated === 'true' ? 'Yes' : 'No'}`)
    }

    if (filters.sentimentRange) {
        parts.push(`Sentiment Range: ${filters.sentimentRange[0]} to ${filters.sentimentRange[1]}`)
    }

    return parts.length > 0 ? `Analysis Context:\n${parts.join('\n')}` : 'Analysis Context: All calls'
}

/**
 * Generate context text for prompt enhancement
 */
export const generatePromptContext = (reportType, userPrompt, filters) => {
    const parts = [`Report Type: ${reportType.label}`, `Base Structure: ${reportType.basePromptStructure}`, `User Prompt: ${userPrompt}`]

    // Add filter context
    const filterParts = []
    if (filters.callType && filters.callType !== 'all') {
        filterParts.push(`Call Type: ${filters.callType}`)
    }
    if (filters.employeeId) {
        filterParts.push(`Specific Employee ID: ${filters.employeeId}`)
    }
    if (filters.selectedTags && filters.selectedTags.length > 0) {
        filterParts.push(`Tags: ${filters.selectedTags.join(', ')}`)
    }
    if (filters.resolutionStatus && filters.resolutionStatus !== 'all') {
        filterParts.push(`Resolution Status: ${filters.resolutionStatus}`)
    }
    if (filters.escalated && filters.escalated !== 'all') {
        filterParts.push(`Escalated Calls: ${filters.escalated === 'true' ? 'Yes' : 'No'}`)
    }
    if (filters.sentimentRange) {
        filterParts.push(`Sentiment Range: ${filters.sentimentRange[0]} to ${filters.sentimentRange[1]}`)
    }

    if (filterParts.length > 0) {
        parts.push(`Filters:\n${filterParts.join('\n')}`)
    } else {
        parts.push('Filters: All calls')
    }

    return parts.join('\n\n')
}
