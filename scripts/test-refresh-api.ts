import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env') })

const DOCS_API_HOST = process.env.DOCS_API_HOST!
const DOCS_API_KEY = process.env.DOCS_API_KEY!
const DOCS_STORE_ID = process.env.DOCS_STORE_ID!

async function testRefresh() {
    console.log('Testing document store refresh...')
    console.log('API Host:', DOCS_API_HOST)
    console.log('Store ID:', DOCS_STORE_ID)

    try {
        const response = await axios.post(
            `${DOCS_API_HOST}/api/v1/document-store/refresh/${DOCS_STORE_ID}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${DOCS_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        )

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

testRefresh()
