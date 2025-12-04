import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'
import FormData from 'form-data'

dotenv.config({ path: path.join(__dirname, '../.env') })

const DOCS_API_HOST = process.env.DOCS_API_HOST!
const DOCS_API_KEY = process.env.DOCS_API_KEY!
const DOCS_STORE_ID = process.env.DOCS_STORE_ID!

async function testUpsertAPI() {
    console.log('Testing document store upsert API...')
    console.log('API Host:', DOCS_API_HOST)
    console.log('Store ID:', DOCS_STORE_ID)

    const testContent = `# Test Document

This is a test document with multiple paragraphs to verify the API is working correctly.

## Section 1

Some content in section 1 with enough text to create multiple chunks when split.

## Section 2

More content in section 2. This should help test the chunking functionality properly.

The text needs to be long enough to actually create meaningful chunks for testing purposes.`

    try {
        // Create form data with text file and doc ID
        const form = new FormData()

        // Add the docId (the database ID of the existing loader, not the loader type)
        form.append('docId', '4625556f-7955-4bed-b5fa-c2ad79b47896')

        form.append('files', Buffer.from(testContent), {
            filename: 'test-doc.txt',
            contentType: 'text/plain'
        })

        const response = await axios.post(`${DOCS_API_HOST}/api/v1/document-store/upsert/${DOCS_STORE_ID}`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${DOCS_API_KEY}`
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        })

        console.log('✅ Success!')
        console.log('Response:', JSON.stringify(response.data, null, 2))
    } catch (error: any) {
        console.log('❌ Error!')
        if (error.response) {
            console.log('Status:', error.response.status)
            console.log('Data:', JSON.stringify(error.response.data, null, 2))
        } else {
            console.log('Error:', error.message)
        }
    }
}

testUpsertAPI()
