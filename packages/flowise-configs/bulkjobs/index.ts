const { processEntriesInBatches } = require('./questionExtraction')
const { convertEntryToPlainText } = require('./richTextParser')

const processor = {
    name: 'statementExtractor',
    description: 'Extract questions from articles and store them in a new content type',
    chatflowId: '6b5da243-c3b8-4ddf-9076-22178f0d5c65', // IAS
    // chatflowId: 'e955a6ae-1363-4bfe-a305-fc23719559e2', // Localhost
    sourceContentTypeId: 'article',
    targetContentTypeId: 'articleFineTunedQuestions',
    persona: 'Publisher + Platform Solutions',
    // filter: {
    //     'sys.id': 'kA03k0000003lnKCAQ_en_US_3'
    // },
    questionTypes: [
        {
            type: 'Fact-based Questions',
            description: `Direct questions seeking specific concise information, e.g., "What is brand safety in digital advertising?"`,
            numberOfQuestions: 5
        },
        {
            type: 'Procedural Questions',
            description: `Questions about the steps or processes, e.g., "How do I set up a new campaign in Integral Ad Science?"`,
            numberOfQuestions: 5
        },
        {
            type: 'Exploratory Questions',
            description: `Open-ended questions that require detailed explanations, e.g., "Can you explain how ad viewability is measured?"`,
            numberOfQuestions: 5
        },
        {
            type: 'Comparative Question',
            description: `Questions that compare different features or products, e.g., "What's the difference between basic and advanced fraud protection?" Your Responses should included tables when comparing differences`,
            numberOfQuestions: 5
        },
        {
            type: 'Scenario-based Questions',
            description: `Questions that present a scenario and ask for a response, e.g., "What would you do if you suspect fraud in a campaign?"`,
            numberOfQuestions: 5
        },
        {
            type: 'Problem-solving Questions',
            description: `Questions that present a problem and ask for a solution, e.g., "How would you address a discrepancy in campaign reporting?"`,
            numberOfQuestions: 5
        },
        {
            type: 'Yes/No Questions',
            description: `Simple queries that can be answered affirmatively or negatively, e.g., "Is there a free trial available?"`,
            numberOfQuestions: 10
        },
        {
            type: 'Multiple Choice Questions',
            description: `Questions that provide a list of options to choose from, e.g., "Questions where users choose from a set of given options, e.g., "Should I report an issue via email or use the online form?""`,
            numberOfQuestions: 5
        }
    ],
    promptProcessor: (entry: any) => {
        const fieldsToParse = ['title', 'summary', 'body', 'relatedLinks']
        const richTextParsingRules = {
            'embedded-asset-block': true,
            'embedded-entry-block': true,
            'embedded-entry-inline': true,
            embeddedContentTypes: {
                table: ['table', 'internalTitle'],
                section: ['contents'],
                text: ['body'],
                media: ['asset'],
                article: ['title', 'slug', 'summary']
            }
        }
        const plainTextEntry = convertEntryToPlainText(entry, fieldsToParse, richTextParsingRules)
        return plainTextEntry
    }
}

;(async () => {
    for (const questionType of processor.questionTypes) {
        try {
            console.log(`Processing ${questionType.type} questions...`)
            await processEntriesInBatches(processor, questionType)
        } catch (err: any) {
            console.error(`Error processing ${questionType.type} questions: ${err.message}`)
        }
    }
})()
