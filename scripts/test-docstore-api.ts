import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'
import { randomUUID } from 'crypto'

dotenv.config({ path: path.join(__dirname, '../.env') })

const DOCS_API_HOST = process.env.DOCS_API_HOST!
const DOCS_API_KEY = process.env.DOCS_API_KEY!
const DOCS_STORE_ID = process.env.DOCS_STORE_ID!

async function testAPI() {
    console.log('Testing document store API...')
    console.log('API Host:', DOCS_API_HOST)
    console.log('Store ID:', DOCS_STORE_ID)

    const testContent = 'This is a test document with some content to verify the API is working correctly.'
    const loaderId = randomUUID()
    console.log('Loader ID:', loaderId)

    try {
        // Step 1: Save the loader configuration
        console.log('\nStep 1: Saving loader configuration...')
        const saveResponse = await axios.post(
            `${DOCS_API_HOST}/api/v1/document-store/loader/save`,
            {
                storeId: DOCS_STORE_ID,
                loaderId: loaderId,
                loaderName: 'Plain Text',
                loaderConfig: {
                    text: testContent,
                    textSplitter: '',
                    metadata: JSON.stringify({
                        source: 'test',
                        url: 'https://test.com/test-page'
                    }),
                    omitMetadataKeys: ''
                },
                splitterId: 'characterTextSplitter',
                splitterName: 'Character Text Splitter',
                splitterConfig: {
                    chunkSize: '1000',
                    chunkOverlap: '200',
                    separators: JSON.stringify(['\n\n', '\n', ' ', ''])
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${DOCS_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )
        console.log('✅ Loader saved')
        console.log('Loader ID:', saveResponse.data.id)

        // Step 2: Process the loader using the returned ID
        console.log('\nStep 2: Processing loader...')
        const response = await axios.post(
            `${DOCS_API_HOST}/api/v1/document-store/loader/process/${saveResponse.data.id}`,
            {
                storeId: DOCS_STORE_ID,
                loaderName: 'Plain Text',
                loaderConfig: {
                    text: testContent,
                    textSplitter: '',
                    metadata: JSON.stringify({
                        source: 'test',
                        url: 'https://test.com/test-page'
                    }),
                    omitMetadataKeys: ''
                },
                splitterId: 'characterTextSplitter',
                splitterName: 'Character Text Splitter',
                splitterConfig: {
                    chunkSize: '1000',
                    chunkOverlap: '200',
                    separators: JSON.stringify(['\n\n', '\n', ' ', ''])
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${DOCS_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        console.log('✅ Processing complete')
        console.log('Chunks:', response.data.count)
        console.log('Status:', response.data.file.status)

        // Step 3: Sync/refresh chunks if needed
        if (response.data.file.status === 'STALE' || response.data.count === 0) {
            console.log('\nStep 3: Syncing chunks...')
            const syncResponse = await axios.post(
                `${DOCS_API_HOST}/api/v1/document-store/chunks/sync/${DOCS_STORE_ID}/${saveResponse.data.id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${DOCS_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            console.log('✅ Sync complete:', syncResponse.data)
        }
    } catch (error: any) {
        console.log('❌ Error!')
        if (error.response) {
            console.log('Status:', error.response.status)
            console.log('Data:', error.response.data)
        } else {
            console.log('Error:', error.message)
        }
    }
}

testAPI()
