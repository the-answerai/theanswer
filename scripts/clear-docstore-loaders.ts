#!/usr/bin/env node
/**
 * Script to clear all loaders from a document store
 *
 * This cleans up corrupted or test loaders to reset the document store
 *
 * Usage:
 *   npx tsx scripts/clear-docstore-loaders.ts
 */

import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env') })

const DOCS_API_HOST = process.env.DOCS_API_HOST!
const DOCS_API_KEY = process.env.DOCS_API_KEY!
const DOCS_STORE_ID = process.env.DOCS_STORE_ID!

async function clearLoaders() {
    console.log('🧹 Clearing document store loaders...\n')
    console.log('API Host:', DOCS_API_HOST)
    console.log('Store ID:', DOCS_STORE_ID)
    console.log('')

    if (!DOCS_API_KEY || !DOCS_STORE_ID) {
        console.error('❌ Missing required environment variables')
        process.exit(1)
    }

    try {
        // Get current store info
        const storeResponse = await axios.get(`${DOCS_API_HOST}/api/v1/document-store/store/${DOCS_STORE_ID}`, {
            headers: {
                Authorization: `Bearer ${DOCS_API_KEY}`
            }
        })

        const store = storeResponse.data
        console.log(`📦 Store: ${store.name}`)
        console.log(`📊 Current loaders: ${store.loaders?.length || 0}`)
        console.log(`📄 Total chunks: ${store.totalChunks || 0}`)
        console.log(`📝 Total chars: ${store.totalChars || 0}`)
        console.log('')

        if (!store.loaders || store.loaders.length === 0) {
            console.log('✨ Store is already empty!')
            return
        }

        // Delete each loader
        console.log(`🗑️  Deleting ${store.loaders.length} loaders...\n`)
        let successCount = 0
        let failCount = 0

        for (const loader of store.loaders) {
            try {
                console.log(`  Deleting: ${loader.loaderName || loader.id}`)
                await axios.delete(`${DOCS_API_HOST}/api/v1/document-store/loader/${DOCS_STORE_ID}/${loader.id}`, {
                    headers: {
                        Authorization: `Bearer ${DOCS_API_KEY}`
                    }
                })
                console.log(`  ✅ Deleted`)
                successCount++
            } catch (error: any) {
                console.log(`  ❌ Failed: ${error.response?.data?.message || error.message}`)
                failCount++
            }
        }

        // Verify cleanup
        console.log('')
        const finalResponse = await axios.get(`${DOCS_API_HOST}/api/v1/document-store/store/${DOCS_STORE_ID}`, {
            headers: {
                Authorization: `Bearer ${DOCS_API_KEY}`
            }
        })

        const finalStore = finalResponse.data
        console.log('='.repeat(60))
        console.log('✨ Cleanup complete!')
        console.log(`✅ Successfully deleted: ${successCount}`)
        console.log(`❌ Failed to delete: ${failCount}`)
        console.log(`📊 Remaining loaders: ${finalStore.loaders?.length || 0}`)
        console.log('='.repeat(60))
    } catch (error: any) {
        console.error('❌ Error:', error.response?.data?.message || error.message)
        process.exit(1)
    }
}

clearLoaders()
