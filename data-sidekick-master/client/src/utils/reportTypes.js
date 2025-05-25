/**
 * Report types and their base configurations
 */

export const REPORT_TYPES = {
    CALL_ANALYSIS: {
        id: 'call_analysis',
        label: 'Call Analysis',
        baseTitle: 'Call Analysis Report',
        description: 'Detailed analysis of individual calls focusing on conversation flow, key topics, and interaction quality.',
        basePrompt: `Please analyze the selected calls focusing on:
1. Conversation Flow and Structure
2. Key Topics and Pain Points
3. Customer Interaction Quality
4. Resolution Effectiveness
5. Learning Opportunities`
    },
    PERFORMANCE: {
        id: 'performance',
        label: 'Performance Report',
        baseTitle: 'Agent Performance Analysis',
        description: 'Analyze agent performance metrics and customer interaction patterns.',
        basePrompt: `Please analyze the selected calls for agent performance focusing on:
1. Customer Service Quality
2. Problem Resolution Rate
3. Communication Effectiveness
4. Technical Knowledge
5. Process Adherence`
    },
    TROUBLESHOOTING: {
        id: 'troubleshooting',
        label: 'Troubleshooting Report',
        baseTitle: 'Technical Issue Analysis',
        description: 'Analyze technical issues, resolution patterns, and system-related challenges.',
        basePrompt: `Please analyze the selected calls for troubleshooting patterns focusing on:
1. Common Technical Issues
2. Resolution Methods
3. System Dependencies
4. Customer Impact
5. Prevention Opportunities`
    },
    CUSTOM: {
        id: 'custom',
        label: 'Create New',
        description: 'Create a custom report type with your own structure and analysis focus.'
    }
}
