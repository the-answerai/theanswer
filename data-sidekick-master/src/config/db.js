import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import dotenv from 'dotenv'

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV
switch (env) {
    case 'wow':
        dotenv.config({ path: '.env.wow' })
        break
    case 'prime':
        dotenv.config({ path: '.env.prime' })
        break
    case 'rds':
        dotenv.config({ path: '.env.rds' })
        break
    case 'lastrev':
        dotenv.config({ path: '.env.lastrev' })
        break
    case 'local':
        dotenv.config({ path: '.env.local' })
        break
    default:
        // Fallback to .env for production
        dotenv.config()
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})

// Initialize Twilio client only if credentials are available
export const twilioClient =
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        : null

// Constants
export const PORT = process.env.PORT || 3001
export const ANSWERAI_ENDPOINT = process.env.ANSWERAI_ENDPOINT
export const API_CALL_TIMEOUT = Number.parseInt(process.env.API_CALL_TIMEOUT) || 120000 // 2 minutes
export const REPORT_GENERATION_TIMEOUT = Number.parseInt(process.env.REPORT_GENERATION_TIMEOUT) || 300000 // 5 minutes
