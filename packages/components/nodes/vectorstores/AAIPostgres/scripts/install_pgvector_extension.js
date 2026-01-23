#!/usr/bin/env node
/* eslint-disable no-console */

// Script to install pgvector extension in your AAI database
// This script uses the same environment variables as your AAI Postgres node

require('dotenv').config()
const { Pool } = require('pg')

async function installPgvectorExtension() {
    // Get connection parameters from environment variables (same as AAI node)
    const user =
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_USER ||
        process.env.POSTGRES_VECTORSTORE_USER ||
        process.env.POSTGRES_USER ||
        'postgres'

    const password =
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_PASSWORD ||
        process.env.POSTGRES_VECTORSTORE_PASSWORD ||
        process.env.POSTGRES_PASSWORD ||
        'postgres'

    const host =
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_HOST ||
        process.env.POSTGRES_VECTORSTORE_HOST ||
        process.env.POSTGRES_HOST ||
        'localhost'

    const database =
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_DATABASE ||
        process.env.POSTGRES_VECTORSTORE_DATABASE ||
        process.env.POSTGRES_DB ||
        process.env.POSTGRES_DATABASE ||
        'postgres'

    const port =
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_PORT || process.env.POSTGRES_VECTORSTORE_PORT || process.env.POSTGRES_PORT || '5432'

    const tableName = process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_TABLE_NAME || process.env.POSTGRES_VECTORSTORE_TABLE_NAME || 'documents'

    console.log('🔧 Installing pgvector extension...')
    console.log('📍 Connection details:')
    console.log(`   Host: ${host}`)
    console.log(`   Database: ${database}`)
    console.log(`   User: ${user}`)
    console.log(`   Port: ${port}`)
    console.log(`   Table: ${tableName}`)
    console.log('')

    const pool = new Pool({
        user,
        password,
        host,
        database,
        port: parseInt(port),
        ssl: false // Adjust if needed
    })

    try {
        const client = await pool.connect()

        // 1. Check if extension is available
        console.log('📋 Checking available extensions...')
        const availableCheck = await client.query(`
            SELECT name, default_version 
            FROM pg_available_extensions 
            WHERE name = 'vector';
        `)

        if (availableCheck.rows.length === 0) {
            console.log('❌ pgvector extension is not available on this PostgreSQL server.')
            console.log('📋 Installation required:')
            console.log('   macOS: brew install pgvector')
            console.log('   Ubuntu/Debian: sudo apt install postgresql-15-pgvector')
            console.log('   Docker: Use pgvector/pgvector:pg15 image')
            console.log('   Manual: https://github.com/pgvector/pgvector#installation')
            console.log('')
            console.log('💡 After server installation, restart PostgreSQL and run this script again.')
            return
        }

        console.log(`✅ pgvector extension is available (version: ${availableCheck.rows[0].default_version})`)

        // 2. Check if extension is already installed
        console.log('📋 Checking installed extensions...')
        const extCheck = await client.query(`
            SELECT extname, extversion 
            FROM pg_extension 
            WHERE extname = 'vector';
        `)

        if (extCheck.rows.length > 0) {
            console.log('✅ pgvector extension is already installed!')
            console.log(`   Version: ${extCheck.rows[0].extversion}`)
        } else {
            console.log('📦 Installing pgvector extension...')

            // 3. Install pgvector extension
            await client.query('CREATE EXTENSION IF NOT EXISTS vector;')

            // 4. Verify installation
            const verifyCheck = await client.query(`
                SELECT extname, extversion 
                FROM pg_extension 
                WHERE extname = 'vector';
            `)

            if (verifyCheck.rows.length > 0) {
                console.log('✅ pgvector extension installed successfully!')
                console.log(`   Version: ${verifyCheck.rows[0].extversion}`)
            } else {
                console.log('❌ Extension installation failed. Check your database permissions.')
                return
            }
        }

        // 3. Check if table exists
        console.log(`📋 Checking if table '${tableName}' exists...`)
        const tableCheck = await client.query(
            `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = $1 AND table_schema = 'public';
        `,
            [tableName]
        )

        if (tableCheck.rows.length > 0) {
            console.log(`✅ Table '${tableName}' already exists!`)

            // Check table structure
            const tableInfo = await client.query(
                `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position;
            `,
                [tableName]
            )

            console.log('📊 Table structure:')
            tableInfo.rows.forEach((row) => {
                console.log(`   ${row.column_name}: ${row.data_type}${row.is_nullable === 'YES' ? ' (nullable)' : ' (not null)'}`)
            })
        } else {
            console.log(`ℹ️  Table '${tableName}' doesn't exist yet.`)
            console.log('💡 The table will be created automatically when you first insert documents.')
        }

        // 5. Test vector functionality
        console.log('🧪 Testing vector functionality...')
        try {
            // Create a temporary test table
            await client.query(`
                CREATE TEMPORARY TABLE test_vectors (
                    id SERIAL PRIMARY KEY,
                    embedding vector(3)
                );
            `)

            // Insert test data
            await client.query(`
                INSERT INTO test_vectors (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');
            `)

            // Test similarity search
            const similarityTest = await client.query(`
                SELECT id, embedding, embedding <-> '[1,2,3]' AS distance 
                FROM test_vectors 
                ORDER BY distance 
                LIMIT 1;
            `)

            if (similarityTest.rows.length > 0) {
                console.log('✅ Vector operations working correctly!')
                console.log(`   Test result: id=${similarityTest.rows[0].id}, distance=${similarityTest.rows[0].distance}`)
            } else {
                console.log('⚠️  Vector test returned no results')
            }
        } catch (testError) {
            console.log('❌ Vector functionality test failed:', testError.message)
            console.log('💡 This might indicate a partial installation. Try reinstalling pgvector.')
        }

        // 6. Test connection
        console.log('🧪 Testing database connection...')
        const testQuery = await client.query('SELECT version();')
        console.log(`✅ Database connection successful!`)
        console.log(`   PostgreSQL version: ${testQuery.rows[0].version.split(' ')[1]}`)

        client.release()

        console.log('')
        console.log('🎉 Setup complete! Your AAI Vector (Postgres) node should work now.')
        console.log('💡 Next steps:')
        console.log('   1. Restart your AAI application if it was running')
        console.log('   2. Try using the AAI Vector (Postgres) node in a workflow')
        console.log('   3. Test upserting some documents to verify everything works')
    } catch (error) {
        console.error('❌ Error:', error.message)
        console.error('')
        console.error('🔧 Troubleshooting:')
        console.error('1. Check your environment variables are set correctly')
        console.error('2. Ensure your database user has CREATE privileges')
        console.error('3. Make sure pgvector is installed on your PostgreSQL server')

        if (error.message.includes('permission denied')) {
            console.error('4. You may need superuser privileges to install extensions')
            console.error('   Try connecting as a superuser or ask your DBA to install pgvector')
        }
    } finally {
        await pool.end()
    }
}

// Run the script
installPgvectorExtension().catch(console.error)
