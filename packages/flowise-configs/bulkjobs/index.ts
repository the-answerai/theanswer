// const { processEntriesInBatches } = require('./questionExtraction')
// const { convertEntryToPlainText } = require('./richTextParser')
// const { queryEntriesForReport } = require('./queryEntriesForReport')
// const createFineTuneQuestions = require('./processors/createFineTuneQuestions')
// const fineTuneQuestionsReportProcessor = require('./processors/fineTuneQuestionsReport')
const {
    analyzeComms,
    documentTagging,
    shortSummary,
    summaryReport,
    relatedGlossaryTerms,
    helpCenterArticleTagging,
    createFineTuneQuestions
} = require('./processors')
const { fetchEntriesFromContentful, deleteContentEntries, callChatflow } = require('./functions')
const analyzeDocument = require('./jobTypes/labeling/analyzeDocument')
const questionExtraction = require('./jobTypes/questionExtraction/questionExtraction')
const relatedContentEntries = require('./jobTypes/labeling/relatedContentEntries')
const categorizeDocumentsFromContentful = require('./jobTypes/labeling/categorizeDocumentsFromContentful')
const entryListFieldReport = require('./jobTypes/reports/entryListFieldReport')

;(async () => {
    // Creating Fine Tuned Questions.
    // for (const questionType of createFineTuneQuestions.questionTypes) {
    //     try {
    //         console.log(`Processing ${questionType.type} questions...`)
    //         await processEntriesInBatches(createFineTuneQuestions, questionType)
    //     } catch (err: any) {
    //         console.error(`Error processing ${questionType.type} questions: ${err.message}`)
    //     }
    // }
    // const report = await questionExtraction(createFineTuneQuestions)
    // Fine Tuned Questions Report.
    // const report = await queryEntriesForReport(fineTuneQuestionsReportProcessor)
    // const report = await categorizeDocumentsFromContentful(helpCenterArticleTagging)
    // const report = await analyzeDocument(analyzeComms)
    // const report = await analyzeDocument(shortSummary)
    // const report = await relatedContentEntries(relatedGlossaryTerms)
    const report = entryListFieldReport(summaryReport)
    // const entries = await fetchEntriesFromContentful('articleFineTunedQuestions')
    // const report = await deleteContentEntries(entries)
    console.log(report)
})()
