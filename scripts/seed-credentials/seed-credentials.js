/**
 * Seed all default credentials from AAI_DEFAULT environment variables
 * This script automatically detects all AAI_DEFAULT_* variables and creates credentials for them
 *
 * ⚠️  REQUIRED PREREQUISITES:
 * ============================
 * This script REQUIRES these environment variables or it will fail:
 *
 * MANDATORY - SCRIPT WILL EXIT WITHOUT THESE:
 * • USER_ID="your-user-uuid"        - UUID of the user who will own these credentials
 * • ORG_ID="your-organization-uuid" - UUID of the organization these credentials belong to
 *
 * CREDENTIAL API KEYS (set any you want to seed):
 * • AAI_DEFAULT_OPENAI_API_KEY      - OpenAI API key
 * • AAI_DEFAULT_ANTHROPHIC          - Anthropic API key
 * • AAI_DEFAULT_GROQ                - Groq API key
 * • AAI_DEFAULT_REPLICATE           - Replicate API key
 * • And many more... (see ENV_TO_CREDENTIAL_MAP below)
 *
 * EXAMPLE USAGE:
 * export USER_ID="123e4567-e89b-12d3-a456-426614174000"
 * export ORG_ID="987fcdeb-51d2-43a1-b123-456789abcdef"
 * export AAI_DEFAULT_OPENAI_API_KEY="sk-your-openai-key-here"
 * node scripts/seed-credentials/seed-credentials.js
 */
const path = require('node:path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { DataSource } = require('typeorm')
const fs = require('node:fs')
const crypto = require('node:crypto')

// Map of environment variable prefixes to credential configurations
const ENV_TO_CREDENTIAL_MAP = {
    // Direct mappings for single API key credentials
    AAI_DEFAULT_OPENAI_API_KEY: {
        name: 'OpenAI - AAI - Default',
        credentialName: 'openAIApi',
        mapFn: (value) => ({ openAIApiKey: value })
    },
    AAI_DEFAULT_ANTHROPHIC: {
        name: 'Anthropic - AAI - Default',
        credentialName: 'anthropicApi',
        mapFn: (value) => ({ anthropicApiKey: value })
    },
    AAI_DEFAULT_GROQ: {
        name: 'Groq - AAI - Default',
        credentialName: 'groqApi',
        mapFn: (value) => ({ groqApiKey: value })
    },
    AAI_DEFAULT_DEEPSEEK: {
        name: 'Deepseek - AAI - Default',
        credentialName: 'deepseekApi',
        mapFn: (value) => ({ deepseekApiKey: value })
    },
    AAI_DEFAULT_EXASEARCH: {
        name: 'ExaSearchAI - AAI - Default',
        credentialName: 'exaSearchApi',
        mapFn: (value) => ({ exaSearchApiKey: value })
    },
    AAI_DEFAULT_REPLICATE: {
        name: 'Replicate - AAI - Default',
        credentialName: 'replicateApi',
        mapFn: (value) => ({ replicateApiKey: value })
    },
    AAI_DEFAULT_SERPAPI: {
        name: 'SerpAPI - AAI - Default',
        credentialName: 'serpApi',
        mapFn: (value) => ({ serpApiKey: value })
    },
    AAI_DEFAULT_PINCONE: {
        name: 'Pinecone - AAI - Default',
        credentialName: 'pineconeApi',
        mapFn: (value) => ({ pineconeApiKey: value })
    },
    AAI_DEFAULT_GITHUB_TOKEN: {
        name: 'GitHub - AAI - Default',
        credentialName: 'githubApi',
        mapFn: (value) => ({ accessToken: value })
    },
    AAI_DEFAULT_BRAVE_SEARCH: {
        name: 'Brave Search - AAI - Default',
        credentialName: 'braveSearchApi',
        mapFn: (value) => ({ braveSearchApiKey: value })
    },

    // Group mappings for multi-field credentials
    AAI_DEFAULT_AWS_BEDROCK: {
        name: 'AWS - AAI - Default',
        credentialName: 'awsApi',
        requiredVars: ['ACCESS_KEY', 'SECRET_KEY'],
        mapFn: (vars) => ({
            awsKey: vars['ACCESS_KEY'],
            awsSecret: vars['SECRET_KEY'],
            awsSession: vars['SESSION_TOKEN'] // Optional
        })
    },
    AAI_DEFAULT_SUPABASE: {
        name: 'Supabase - AAI - Default',
        credentialName: 'supabaseApi',
        requiredVars: ['URL', 'API'],
        mapFn: (vars) => ({
            supabaseApiKey: vars['API'],
            supabaseUrl: vars['URL'] // Assuming URL is used for auth
        })
    },
    AAI_DEFAULT_GOOGLE_SEARCH_API: {
        name: 'Google Search API - AAI - Default',
        credentialName: 'googleCustomSearchApi',
        requiredVars: ['ENGINE_ID'],
        mapFn: (vars, apiKey) => ({
            googleCustomSearchApiKey: apiKey,
            googleCustomSearchApiId: vars['ENGINE_ID']
        })
    },
    AAI_DEFAULT_REDIS: {
        name: 'Redis - AAI - Default',
        credentialName: 'redisCacheApi',
        optionalVars: ['HOST', 'PORT', 'USERNAME', 'PASSWORD'],
        mapFn: (vars) => ({
            redisCacheHost: vars['HOST'] || 'localhost',
            redisCachePort: vars['PORT'] || '6379',
            redisCacheUser: vars['USERNAME'] || 'default',
            redisCachePwd: vars['PASSWORD'] || ''
        })
    },
    AAI_DEFAULT_DATA_ANALYZER: {
        name: 'Data Analyzer - AAI - Default',
        credentialName: 'dataAnalyzerApi',
        mapFn: (value) => ({ dataAnalyzerApiKey: value })
    }
}

// Helper to encrypt credential data
function encryptCredentialData(plainDataObj) {
    // Use the same encryption key as the server
    const encryptKey = process.env.FLOWISE_SECRETKEY_OVERWRITE || 'theanswerencryptionkey'

    // Use CryptoJS exactly as the server does
    const CryptoJS = require('crypto-js')

    // This is exactly how the server encrypts credentials
    return CryptoJS.AES.encrypt(JSON.stringify(plainDataObj), encryptKey).toString()
}

async function createDataSource() {
    // Database configuration from .env
    const dbType = process.env.DATABASE_TYPE || 'postgres'
    const dbHost = process.env.DATABASE_HOST || 'localhost'
    const dbPort = Number.parseInt(process.env.DATABASE_PORT || '5432', 10)
    const dbUser = process.env.DATABASE_USER || 'postgres'
    const dbPassword = process.env.DATABASE_PASSWORD || 'postgres'
    const dbName = process.env.DATABASE_NAME || 'flowise'

    console.log(`Connecting to ${dbType} database at ${dbHost}:${dbPort}/${dbName}`)

    const dataSource = new DataSource({
        type: dbType,
        host: dbHost,
        port: dbPort,
        username: dbUser,
        password: dbPassword,
        database: dbName,
        synchronize: false
    })

    await dataSource.initialize()
    console.log('Database connection initialized')
    return dataSource
}

// Find all environment variables with AAI_DEFAULT prefix
function findDefaultEnvVars() {
    // Get all environment variables
    const envVars = process.env
    const defaultVars = {}

    // Filter variables with AAI_DEFAULT prefix
    Object.keys(envVars).forEach((key) => {
        if (key.startsWith('AAI_DEFAULT_') && envVars[key]) {
            defaultVars[key] = envVars[key]
        }
    })

    return defaultVars
}

// Group related environment variables
function groupRelatedEnvVars(defaultVars) {
    const groupedVars = {}

    // First handle direct mappings
    Object.keys(ENV_TO_CREDENTIAL_MAP).forEach((key) => {
        if (defaultVars[key]) {
            const config = ENV_TO_CREDENTIAL_MAP[key]
            if (!config.requiredVars) {
                // This is a direct mapping
                groupedVars[key] = {
                    name: config.name,
                    credentialName: config.credentialName,
                    plainDataObj: config.mapFn(defaultVars[key])
                }
            }
        }
    })

    // Then handle group mappings that require multiple env vars
    Object.keys(ENV_TO_CREDENTIAL_MAP).forEach((prefix) => {
        const config = ENV_TO_CREDENTIAL_MAP[prefix]
        if (config.requiredVars || config.optionalVars) {
            const basePrefix = prefix
            const vars = {}

            // Check if we have all required variables for this group
            let hasAllRequired = true
            if (config.requiredVars) {
                config.requiredVars.forEach((suffix) => {
                    const fullKey = `${basePrefix}_${suffix}`
                    if (defaultVars[fullKey]) {
                        vars[suffix] = defaultVars[fullKey]
                    } else {
                        hasAllRequired = false
                    }
                })
            }

            // Add optional variables if they exist
            if (config.optionalVars) {
                config.optionalVars.forEach((suffix) => {
                    const fullKey = `${basePrefix}_${suffix}`
                    if (defaultVars[fullKey]) {
                        vars[suffix] = defaultVars[fullKey]
                    }
                })
            }

            // Only create credential if all required vars are present
            if (hasAllRequired && (Object.keys(vars).length > 0 || !config.requiredVars)) {
                groupedVars[basePrefix] = {
                    name: config.name,
                    credentialName: config.credentialName,
                    plainDataObj: config.mapFn(vars, defaultVars[basePrefix])
                }
            }
        }
    })

    return Object.values(groupedVars)
}

// Auto-detect credentials from unmapped AAI_DEFAULT_ environment variables
function detectUnmappedCredentials(defaultVars, mappedCredentials) {
    const unmappedCredentials = []
    const mappedKeys = new Set()

    // Collect all mapped keys
    mappedCredentials.forEach((cred) => {
        Object.keys(ENV_TO_CREDENTIAL_MAP).forEach((prefix) => {
            const config = ENV_TO_CREDENTIAL_MAP[prefix]
            if (config.name === cred.name) {
                mappedKeys.add(prefix)
                if (config.requiredVars || config.optionalVars) {
                    const varsToCheck = [...(config.requiredVars || []), ...(config.optionalVars || [])]
                    varsToCheck.forEach((suffix) => {
                        mappedKeys.add(`${prefix}_${suffix}`)
                    })
                }
            }
        })
    })

    // Find unmapped variables
    Object.keys(defaultVars).forEach((key) => {
        if (!mappedKeys.has(key)) {
            // Try to guess credential type from key name
            const parts = key.replace('AAI_DEFAULT_', '').split('_')
            const apiName = parts[0].toLowerCase()

            // Attempt to find matching credential file
            try {
                const credentialFiles = fs.readdirSync(path.resolve(__dirname, '../components/credentials'))
                const matchingFiles = credentialFiles.filter(
                    (file) => file.toLowerCase().includes(apiName) && file.endsWith('.credential.ts')
                )

                if (matchingFiles.length > 0) {
                    const credentialFile = matchingFiles[0]
                    const credName = credentialFile.replace('.credential.ts', '')

                    // Create a default mapping for this credential
                    const fieldName = `${apiName}ApiKey`
                    const plainData = {}
                    plainData[fieldName] = defaultVars[key]

                    // Capitalize the API name properly for prettier display
                    const prettyApiName = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                    unmappedCredentials.push({
                        name: `${prettyApiName} - AAI - Default`,
                        credentialName: `${apiName}Api`,
                        plainDataObj: plainData,
                        autoDetected: true
                    })

                    console.log(`Auto-detected credential for ${key} as ${credName}`)
                }
            } catch (error) {
                console.warn(`Could not auto-detect credential for ${key}:`, error.message)
            }
        }
    })

    return unmappedCredentials
}

async function seedCredentials() {
    console.log('Starting auto credential seeding process...')

    let dataSource

    try {
        // Initialize database connection
        dataSource = await createDataSource()

        // =====================================================
        // ⚠️  IMPORTANT: USER_ID AND ORG_ID CONFIGURATION  ⚠️
        // =====================================================
        console.log('\n' + '='.repeat(60))
        console.log('🔍 CHECKING USER_ID AND ORG_ID CONFIGURATION')
        console.log('='.repeat(60))

        // Get user ID and org ID (ensuring they're either valid UUIDs or null)
        let userId = process.env.USER_ID
        let orgId = process.env.ORG_ID

        // Make sure the ID values are valid UUIDs or null
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        // Validate and provide detailed feedback for USER_ID
        const hasValidUserId = userId && uuidRegex.test(userId)
        const hasValidOrgId = orgId && uuidRegex.test(orgId)

        if (!hasValidUserId && !hasValidOrgId) {
            console.log('❌ CRITICAL ERROR: Both USER_ID and ORG_ID are missing or invalid!')
            console.log('')
            console.log('🚫 SCRIPT EXECUTION TERMINATED')
            console.log('   Cannot create credentials without proper owner assignment.')
            console.log('   This would create orphaned credentials with access issues.')
            console.log('')
            console.log('🔧 TO FIX THIS, SET THE FOLLOWING ENVIRONMENT VARIABLES:')
            console.log('   export USER_ID="your-user-uuid-here"')
            console.log('   export ORG_ID="your-organization-uuid-here"')
            console.log('')
            console.log('📋 HOW TO GET THESE VALUES:')
            console.log('   1. USER_ID: Query your users table or check the Flowise admin panel')
            console.log('   2. ORG_ID: Query your organizations table or check the Flowise admin panel')
            console.log('   3. Both values must be valid UUIDs (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)')
            console.log('')
            console.log('💡 EXAMPLE:')
            console.log('   export USER_ID="123e4567-e89b-12d3-a456-426614174000"')
            console.log('   export ORG_ID="987fcdeb-51d2-43a1-b123-456789abcdef"')
            console.log('   node scripts/seed-credentials/seed-credentials.js')
            console.log('')
            console.log('='.repeat(60))

            process.exit(1)
        } else if (!hasValidUserId) {
            console.log('❌ CRITICAL ERROR: USER_ID is missing or invalid!')
            console.log(`   Current value: "${userId || '(not set)'}"`)
            console.log('')
            console.log('🚫 SCRIPT EXECUTION TERMINATED')
            console.log('   USER_ID is required for proper credential ownership.')
            console.log('')
            console.log('🔧 SET USER_ID ENVIRONMENT VARIABLE:')
            console.log('   export USER_ID="your-user-uuid-here"')
            console.log('   (must be a valid UUID format)')
            console.log('')
            console.log('='.repeat(60))

            process.exit(1)
        } else if (!hasValidOrgId) {
            console.log('❌ CRITICAL ERROR: ORG_ID is missing or invalid!')
            console.log(`   Current value: "${orgId || '(not set)'}"`)
            console.log('')
            console.log('🚫 SCRIPT EXECUTION TERMINATED')
            console.log('   ORG_ID is required for proper credential organization.')
            console.log('')
            console.log('🔧 SET ORG_ID ENVIRONMENT VARIABLE:')
            console.log('   export ORG_ID="your-organization-uuid-here"')
            console.log('   (must be a valid UUID format)')
            console.log('')
            console.log('='.repeat(60))

            process.exit(1)
        } else {
            console.log('✅ USER_ID and ORG_ID are properly configured!')
        }

        console.log('')
        console.log('📊 FINAL CONFIGURATION:')
        console.log(`   User ID: ${userId ? `✅ ${userId}` : '❌ NULL (not set)'}`)
        console.log(`   Organization ID: ${orgId ? `✅ ${orgId}` : '❌ NULL (not set)'}`)
        console.log('='.repeat(60) + '\n')

        // Find all AAI_DEFAULT environment variables
        const defaultVars = findDefaultEnvVars()
        console.log(`Found ${Object.keys(defaultVars).length} AAI_DEFAULT variables`)

        // Group related environment variables
        let credentialsToCreate = groupRelatedEnvVars(defaultVars)
        console.log(`Mapped ${credentialsToCreate.length} credential configurations`)

        // Auto-detect unmapped credentials
        const unmappedCredentials = detectUnmappedCredentials(defaultVars, credentialsToCreate)
        console.log(`Auto-detected ${unmappedCredentials.length} additional credentials`)

        // Combine mapped and auto-detected credentials
        credentialsToCreate = [...credentialsToCreate, ...unmappedCredentials]

        // Ensure credential table exists
        try {
            const tableExistsQuery = `SELECT to_regclass('public.credential') as exists;`
            const tableCheck = await dataSource.query(tableExistsQuery)
            const tableExists = tableCheck[0].exists !== null

            if (!tableExists) {
                console.log('Credentials table not found, creating it...')
                const createTableSql = `
                CREATE TABLE IF NOT EXISTS credential (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    "credentialName" VARCHAR(255) NOT NULL,
                    "encryptedData" TEXT NOT NULL,
                    "createdDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "updatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "userId" UUID,
                    "organizationId" UUID,
                    visibility TEXT[] DEFAULT '{Private}'
                );`
                await dataSource.query(createTableSql)
                console.log('Created credentials table')
            }
        } catch (error) {
            console.warn('Error checking/creating table, will try to proceed anyway:', error.message)
        }

        const results = {
            created: [],
            failed: [],
            existing: []
        }

        // Process each credential
        for (const credential of credentialsToCreate) {
            console.log(`Processing credential: ${credential.name} (${credential.credentialName})`)

            // Check if we have data for this credential
            const requiredFieldsCount = Object.keys(credential.plainDataObj).length
            const providedFieldsCount = Object.values(credential.plainDataObj).filter((v) => v).length

            if (providedFieldsCount === 0) {
                console.error(`Error: No valid data found for ${credential.name}`)
                results.failed.push({ name: credential.name, reason: 'No valid data provided' })
                continue
            }

            if (providedFieldsCount < requiredFieldsCount) {
                console.warn(`Warning: Only ${providedFieldsCount}/${requiredFieldsCount} fields found for ${credential.name}`)
            }

            try {
                // Encrypt the credential data
                const encryptedData = encryptCredentialData(credential.plainDataObj)

                // Check if credential already exists using raw SQL
                const existingCredentialSql = `
                    SELECT id FROM credential WHERE name = $1 LIMIT 1
                `
                const existingCredentials = await dataSource.query(existingCredentialSql, [credential.name])

                let credentialId
                let isUpdate = false

                if (existingCredentials.length > 0) {
                    // Update existing credential to preserve UUID
                    credentialId = existingCredentials[0].id
                    console.log(`Updating existing credential '${credential.name}' with ID: ${credentialId}`)

                    const updateSql = `
                        UPDATE credential 
                        SET "credentialName" = $1,
                            "encryptedData" = $2,
                            "userId" = $3,
                            "organizationId" = $4,
                            "updatedDate" = CURRENT_TIMESTAMP,
                            visibility = ARRAY[$5]::text[]
                        WHERE id = $6
                    `

                    const updateValues = [credential.credentialName, encryptedData, userId || null, orgId || null, 'Private', credentialId]

                    await dataSource.query(updateSql, updateValues)
                    console.log(`Updated credential '${credential.name}' (preserved UUID: ${credentialId})`)
                    isUpdate = true
                } else {
                    // Create new credential
                    console.log(`Creating new credential '${credential.name}'`)

                    const insertSql = `
                        INSERT INTO credential (
                            name, 
                            "credentialName", 
                            "encryptedData", 
                            "userId", 
                            "organizationId", 
                            visibility
                        ) 
                        VALUES ($1, $2, $3, $4, $5, ARRAY[$6]::text[])
                        RETURNING id
                    `

                    const insertValues = [
                        credential.name,
                        credential.credentialName,
                        encryptedData,
                        userId || null,
                        orgId || null,
                        'Private'
                    ]

                    const result = await dataSource.query(insertSql, insertValues)
                    credentialId = result[0].id
                    console.log(`Created new credential '${credential.name}' with ID: ${credentialId}`)
                }

                results.created.push({
                    name: credential.name,
                    id: credentialId,
                    autoDetected: credential.autoDetected,
                    isUpdate: isUpdate
                })
            } catch (error) {
                console.error(`Error creating credential for ${credential.name}:`, error.message)
                results.failed.push({
                    name: credential.name,
                    reason: error.message
                })
            }
        }

        // Show summary
        console.log('\n===== CREDENTIAL SEEDING SUMMARY =====')
        const createdCount = results.created.filter((cred) => !cred.isUpdate).length
        const updatedCount = results.created.filter((cred) => cred.isUpdate).length

        console.log(`New credentials created: ${createdCount}`)
        console.log(`Existing credentials updated: ${updatedCount}`)
        console.log(`Failed: ${results.failed.length}`)

        if (results.created.length > 0) {
            // Show updated credentials first
            const updatedCreds = results.created.filter((cred) => cred.isUpdate)
            if (updatedCreds.length > 0) {
                console.log('\n📝 UPDATED CREDENTIALS (UUID preserved):')

                const updatedManual = updatedCreds.filter((cred) => !cred.autoDetected)
                if (updatedManual.length > 0) {
                    console.log('\n  Mapped credentials:')
                    for (const cred of updatedManual) {
                        console.log(`  ✅ ${cred.name}: ${cred.id}`)
                    }
                }

                const updatedAuto = updatedCreds.filter((cred) => cred.autoDetected)
                if (updatedAuto.length > 0) {
                    console.log('\n  Auto-detected credentials:')
                    for (const cred of updatedAuto) {
                        console.log(`  ✅ ${cred.name}: ${cred.id}`)
                    }
                }
            }

            // Show new credentials
            const newCreds = results.created.filter((cred) => !cred.isUpdate)
            if (newCreds.length > 0) {
                console.log('\n🆕 NEW CREDENTIALS CREATED:')

                const newManual = newCreds.filter((cred) => !cred.autoDetected)
                if (newManual.length > 0) {
                    console.log('\n  Mapped credentials:')
                    for (const cred of newManual) {
                        console.log(`  ➕ ${cred.name}: ${cred.id}`)
                    }
                }

                const newAuto = newCreds.filter((cred) => cred.autoDetected)
                if (newAuto.length > 0) {
                    console.log('\n  Auto-detected credentials:')
                    for (const cred of newAuto) {
                        console.log(`  ➕ ${cred.name}: ${cred.id}`)
                    }
                }
            }
        }

        if (results.failed.length > 0) {
            console.log('\nFailed credentials:')
            for (const cred of results.failed) {
                console.log(`- ${cred.name}: ${cred.reason}`)
            }
        }

        return results
    } catch (error) {
        console.error('Error:', error)
        console.error('Make sure your database connection settings are correct')
        process.exit(1)
    } finally {
        // Close database connection
        if (dataSource?.isInitialized) {
            await dataSource.destroy()
            console.log('Database connection closed')
        }
    }
}

// Execute if run directly
if (require.main === module) {
    seedCredentials()
        .then(() => {
            console.log('Auto credential seeding completed')
        })
        .catch((error) => {
            console.error('Unhandled error during credential seeding:', error)
            process.exit(1)
        })
}

module.exports = {
    seedCredentials
}
