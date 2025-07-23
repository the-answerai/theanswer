const fs = require('fs')
const path = require('path')

/**
 * Convert FAQ JSON files to a single markdown file with separators
 */
function convertFaqToMarkdown() {
    const faqDir = path.join(__dirname, '../src/data/faq')
    const outputFile = path.join(__dirname, '../faq-combined.md')

    console.log('🔍 Reading FAQ directory:', faqDir)

    // Read all JSON files from the FAQ directory
    const files = fs
        .readdirSync(faqDir)
        .filter((file) => file.endsWith('.json'))
        .sort() // Sort alphabetically for consistent output

    console.log(`📁 Found ${files.length} FAQ files:`, files)

    let markdownContent = ''
    let totalQuestions = 0

    // Process each FAQ file
    files.forEach((file, fileIndex) => {
        const filePath = path.join(faqDir, file)

        try {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            const faqData = JSON.parse(fileContent)

            console.log(`📝 Processing: ${file} - ${faqData.faqs.length} questions`)

            // Add file header (optional, for context)
            markdownContent += `<!-- Source: ${file} - ${faqData.title} -->\n\n`

            // Process each FAQ in the file
            faqData.faqs.forEach((faq, faqIndex) => {
                // Add question
                markdownContent += `**Q: ${faq.question}**\n\n`

                // Add answer
                markdownContent += `${faq.answer}\n\n`

                // Add separator (except for the very last Q&A)
                const isLastFileAndLastFaq = fileIndex === files.length - 1 && faqIndex === faqData.faqs.length - 1
                if (!isLastFileAndLastFaq) {
                    markdownContent += `>>>>>>\n\n`
                }

                totalQuestions++
            })
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message)
        }
    })

    // Write the combined markdown file
    try {
        fs.writeFileSync(outputFile, markdownContent, 'utf8')
        console.log(`✅ Successfully created combined FAQ markdown file: ${outputFile}`)
        console.log(`📊 Total questions processed: ${totalQuestions}`)
        console.log(`📏 File size: ${(markdownContent.length / 1024).toFixed(2)} KB`)

        // Count separators for verification
        const separatorCount = (markdownContent.match(/>>>>>/g) || []).length
        console.log(`🔗 Separators added: ${separatorCount} (should be ${totalQuestions - 1})`)
    } catch (error) {
        console.error('❌ Error writing output file:', error.message)
    }
}

// Run the conversion
if (require.main === module) {
    console.log('🚀 Starting FAQ to Markdown conversion...\n')
    convertFaqToMarkdown()
    console.log('\n🎉 Conversion complete!')
}

module.exports = convertFaqToMarkdown
