import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to 'local' if no environment is specified

console.log(`Using environment: ${env}`)

// Load environment variables
dotenv.config({ path: `.env.${env}` })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Required environment variables are missing!')
    console.error(`Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.${env}`)
    process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const documentTypes = ['faq', 'guide', 'policy', 'tutorial', 'api-doc']
const categories = ['product', 'billing', 'technical', 'account', 'general']

const testDocuments = [
    {
        title: 'Password Reset Guide',
        content: `
How to Reset Your Password

1. Go to the login page and click "Forgot Password"
2. Enter your email address
3. Check your email for a password reset link
4. Click the link and enter your new password
5. Confirm your new password
6. Log in with your new password

Tips:
- Make sure your new password is at least 8 characters long
- Use a mix of letters, numbers, and special characters
- Don't reuse passwords from other accounts
- If you don't receive the email, check your spam folder`,
        category_ai: 'account',
        file_type: 'guide'
    },
    {
        title: 'Billing FAQ',
        content: `
Frequently Asked Questions About Billing

Q: When will I be charged?
A: You'll be charged on the same day each month, based on your subscription start date.

Q: What payment methods do you accept?
A: We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.

Q: How do I update my payment method?
A: Go to Settings > Billing > Payment Methods and click "Add New Method"

Q: Can I get a refund?
A: Yes, we offer refunds within 30 days of purchase. Contact support for assistance.

Q: How do I view my billing history?
A: Visit Settings > Billing > History to see all past transactions.`,
        category_ai: 'billing',
        file_type: 'faq'
    },
    {
        title: 'Product Features Overview',
        content: `
Complete Guide to Product Features

Dashboard:
- Real-time analytics
- Customizable widgets
- Export capabilities
- Team collaboration tools

Project Management:
- Task tracking
- Timeline views
- Resource allocation
- Progress reporting

Integration Options:
- API access
- Webhook support
- Third-party connectors
- Custom extensions

Security Features:
- Two-factor authentication
- Role-based access control
- Audit logging
- Data encryption`,
        category_ai: 'product',
        file_type: 'guide'
    },
    {
        title: 'API Documentation',
        content: `
API Integration Guide

Authentication:
- Use Bearer token authentication
- Tokens can be generated in the dashboard
- Include token in Authorization header

Endpoints:
GET /api/v1/users
- Retrieve user information
- Supports pagination and filtering
- Returns JSON response

POST /api/v1/projects
- Create new projects
- Required fields: name, description
- Optional: team_id, status

Error Handling:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error`,
        category_ai: 'technical',
        file_type: 'api-doc'
    },
    {
        title: 'Shipping Policy',
        content: `
Shipping Policy and Guidelines

Delivery Times:
- Standard Shipping: 3-5 business days
- Express Shipping: 1-2 business days
- International: 7-14 business days

Shipping Costs:
- Free shipping on orders over $50
- Standard shipping: $5.99
- Express shipping: $15.99
- International rates vary by location

Order Tracking:
- Tracking number provided via email
- Real-time updates available
- Track orders through your account dashboard

Returns:
- 30-day return window
- Free returns on defective items
- Return label provided upon request`,
        category_ai: 'general',
        file_type: 'policy'
    },
    {
        title: 'Installation Tutorial',
        content: `
Step-by-Step Installation Guide

Prerequisites:
- Node.js v14 or higher
- npm or yarn package manager
- 2GB free disk space
- Active internet connection

Installation Steps:
1. Download the latest release
2. Extract files to your desired location
3. Open terminal in project directory
4. Run 'npm install' or 'yarn install'
5. Configure environment variables
6. Start the application with 'npm start'

Troubleshooting:
- Clear npm cache if installation fails
- Check system requirements
- Verify network connectivity
- Review error logs in /var/log`,
        category_ai: 'technical',
        file_type: 'tutorial'
    }
]

async function generateTestData() {
    // Clean up existing test data
    console.log('Cleaning up existing test data...')

    // Delete existing documents first (due to foreign key constraints)
    const { error: docDeleteError } = await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all except system docs if any

    if (docDeleteError) {
        console.error('Error deleting existing documents:', docDeleteError)
    }

    // Delete existing data sources
    const { error: sourceDeleteError } = await supabase.from('data_sources').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    if (sourceDeleteError) {
        console.error('Error deleting existing data sources:', sourceDeleteError)
    }

    // Delete existing research views
    const { error: viewDeleteError } = await supabase.from('research_views').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    if (viewDeleteError) {
        console.error('Error deleting existing research views:', viewDeleteError)
    }

    console.log('Cleanup complete')

    // First create a test research view
    const { data: researchView, error: viewError } = await supabase
        .from('research_views')
        .insert({
            name: 'Test Documentation',
            description: 'Research view for test help documentation'
        })
        .select()
        .single()

    if (viewError) {
        console.error('Error creating research view:', viewError)
        return
    }

    console.log('Created research view:', researchView.id)

    // Then create a test data source
    const { data: dataSource, error: sourceError } = await supabase
        .from('data_sources')
        .insert({
            research_view_id: researchView.id,
            source_type: 'file',
            status: 'completed'
        })
        .select()
        .single()

    if (sourceError) {
        console.error('Error creating data source:', sourceError)
        return
    }

    console.log('Created data source:', dataSource.id)

    // Insert test documents
    for (const doc of testDocuments) {
        const { error } = await supabase.from('documents').insert({
            ...doc,
            source_id: dataSource.id,
            content_summary: doc.content.substring(0, 100),
            token_count: doc.content.split(' ').length,
            word_count: doc.content.split(' ').length,
            status: 'processed'
        })

        if (error) {
            console.error('Error inserting document:', error)
        } else {
            console.log(`Successfully inserted document: ${doc.title}`)
        }
    }
}

// Export the document types for use in other scripts
export const DOCUMENT_TYPES = documentTypes
export const DOCUMENT_CATEGORIES = categories

generateTestData()
    .then(() => console.log('Test documents generation complete'))
    .catch(console.error)
