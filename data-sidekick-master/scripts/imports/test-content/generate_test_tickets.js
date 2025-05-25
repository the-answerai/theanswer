import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { faker } from '@faker-js/faker'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

// Predefined test data
const predefinedJiraTickets = [
    {
        key: 'TECH-1001',
        project_key: 'TECH',
        summary: 'Unable to access cloud storage after recent update',
        description:
            "Customer reports being unable to access their cloud storage after the latest software update. Error message states 'Access Denied'.",
        status: 'open',
        priority: 'high',
        reporter: 'sarah.support@company.com',
        assignee: 'john.tech@company.com',
        labels: ['Technical Issues', 'Cloud Storage', 'Access Issues'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            ticket_type: 'email',
            sentiment_score: 0.2,
            escalated: true,
            external_url: 'https://jira.company.com/browse/TECH-1001'
        },
        ai_summary: 'Customer cannot access cloud storage after update with Access Denied error.'
    },
    {
        key: 'BILL-985',
        project_key: 'BILL',
        summary: 'Billing discrepancy on enterprise plan',
        description: 'Customer noticed they were charged twice for their enterprise plan subscription in the last billing cycle.',
        status: 'in_progress',
        priority: 'high',
        reporter: 'support@company.com',
        assignee: 'mary.billing@company.com',
        labels: ['Payment & Billing', 'Enterprise', 'Billing Issues'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            ticket_type: 'call',
            sentiment_score: 0.1,
            escalated: false,
            external_url: 'https://jira.company.com/browse/BILL-985'
        },
        ai_summary: 'Customer was charged twice for enterprise plan subscription.'
    },
    {
        key: 'FEAT-456',
        project_key: 'FEAT',
        summary: 'Feature request: Dark mode for dashboard',
        description: 'Enterprise customer requesting dark mode option for the admin dashboard to reduce eye strain.',
        status: 'open',
        priority: 'medium',
        reporter: 'feedback@company.com',
        assignee: 'product@company.com',
        labels: ['Feature Request', 'UI/UX', 'Dashboard'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            ticket_type: 'support_portal',
            sentiment_score: 0.8,
            escalated: false,
            external_url: 'https://jira.company.com/browse/FEAT-456'
        },
        ai_summary: 'Enterprise customer requests dark mode for admin dashboard to reduce eye strain.'
    },
    {
        key: 'API-789',
        project_key: 'API',
        summary: 'API integration failing with timeout errors',
        description: "Customer's automated workflows are failing due to API timeout issues during peak hours.",
        status: 'in_progress',
        priority: 'critical',
        reporter: 'api.support@company.com',
        assignee: 'dave.backend@company.com',
        labels: ['Technical Issues', 'API', 'Performance'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            ticket_type: 'email',
            sentiment_score: 0.3,
            escalated: true,
            external_url: 'https://jira.company.com/browse/API-789'
        },
        ai_summary: "Customer's workflows failing due to API timeout issues during peak hours."
    },
    {
        key: 'HELP-234',
        project_key: 'HELP',
        summary: 'Need help with user permissions setup',
        description: 'New customer requesting assistance with setting up role-based access control for their team.',
        status: 'resolved',
        priority: 'medium',
        reporter: 'chat.support@company.com',
        assignee: 'alice.support@company.com',
        labels: ['Account Management', 'Permissions', 'Setup'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        metadata: {
            ticket_type: 'slack',
            sentiment_score: 0.7,
            resolution: 'Provided step-by-step guide and assisted with initial setup',
            external_url: 'https://jira.company.com/browse/HELP-234'
        },
        ai_summary: 'New customer needs help setting up role-based access control for their team.'
    },
    {
        key: 'TECH-567',
        project_key: 'TECH',
        summary: 'Data migration tool crashing',
        description: 'Enterprise customer experiencing crashes when trying to migrate large datasets using our migration tool.',
        status: 'open',
        priority: 'high',
        reporter: 'enterprise.support@company.com',
        assignee: 'mike.engineering@company.com',
        labels: ['Technical Issues', 'Data Migration', 'Enterprise'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            ticket_type: 'email',
            sentiment_score: 0.2,
            escalated: true,
            external_url: 'https://jira.company.com/browse/TECH-567'
        },
        ai_summary: "Enterprise customer's data migration tool crashes with large datasets."
    },
    {
        key: 'FEAT-890',
        project_key: 'FEAT',
        summary: 'Request for custom reporting feature',
        description: 'Customer needs ability to generate custom reports for compliance requirements.',
        status: 'in_progress',
        priority: 'medium',
        reporter: 'sales@company.com',
        assignee: 'product@company.com',
        labels: ['Feature Request', 'Reporting', 'Compliance'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            ticket_type: 'call',
            sentiment_score: 0.6,
            escalated: false,
            external_url: 'https://jira.company.com/browse/FEAT-890'
        },
        ai_summary: 'Customer needs custom reporting feature for compliance requirements.'
    },
    {
        key: 'SEC-123',
        project_key: 'SEC',
        summary: 'SSO integration not working',
        description: 'Unable to authenticate users through company SSO after recent security update.',
        status: 'resolved',
        priority: 'critical',
        reporter: 'security@company.com',
        assignee: 'security.team@company.com',
        labels: ['Technical Issues', 'Security', 'SSO'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        metadata: {
            ticket_type: 'email',
            sentiment_score: 0.4,
            resolution: 'Updated SSL certificates and fixed configuration issue',
            external_url: 'https://jira.company.com/browse/SEC-123'
        },
        ai_summary: 'SSO authentication failing after recent security update.'
    },
    {
        key: 'PERF-345',
        project_key: 'PERF',
        summary: 'Bulk import feature timing out',
        description: 'Customer unable to import large CSV files through the bulk import feature.',
        status: 'open',
        priority: 'medium',
        reporter: 'support@company.com',
        assignee: 'jane.developer@company.com',
        labels: ['Technical Issues', 'Data Import', 'Performance'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
            ticket_type: 'support_portal',
            sentiment_score: 0.3,
            escalated: false,
            external_url: 'https://jira.company.com/browse/PERF-345'
        },
        ai_summary: "Customer can't import large CSV files due to bulk import feature timing out."
    },
    {
        key: 'SALES-678',
        project_key: 'SALES',
        summary: 'Need upgrade pricing information',
        description: 'Current customer interested in upgrading to enterprise plan, requesting detailed pricing information.',
        status: 'resolved',
        priority: 'low',
        reporter: 'sales@company.com',
        assignee: 'account.manager@company.com',
        labels: ['Sales', 'Enterprise', 'Pricing'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        metadata: {
            ticket_type: 'email',
            sentiment_score: 0.9,
            resolution: 'Provided enterprise pricing details and scheduled demo',
            external_url: 'https://jira.company.com/browse/SALES-678'
        },
        ai_summary: 'Customer requesting pricing information for enterprise plan upgrade.'
    }
]

// Function to generate random tickets
function generateRandomTickets(count = 30) {
    const statuses = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']
    const priorities = ['low', 'medium', 'high', 'critical']
    const ticketTypes = ['incident', 'bug', 'feature_request', 'task', 'maintenance']
    const labels = [
        'bug',
        'feature',
        'enhancement',
        'documentation',
        'security',
        'performance',
        'frontend',
        'backend',
        'database',
        'api',
        'ui',
        'ux'
    ]
    const environments = ['production', 'staging', 'development']
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
    const operatingSystems = ['Windows', 'MacOS', 'Linux']

    return Array.from({ length: count }, (_, i) => {
        const createdAt = faker.date.past({ days: 90 })
        const updatedAt = faker.date.between({ from: createdAt, to: new Date() })
        const status = faker.helpers.arrayElement(statuses)
        const resolvedAt = status === 'resolved' || status === 'closed' ? faker.date.between({ from: updatedAt, to: new Date() }) : null

        return {
            key: `TEST-${1000 + i}`,
            project_key: 'TEST',
            summary: faker.lorem.sentence({ min: 3, max: 8 }),
            description: faker.lorem.paragraphs({ min: 1, max: 3 }),
            status,
            priority: faker.helpers.arrayElement(priorities),
            reporter: faker.internet.email(),
            assignee: faker.number.float({ min: 0, max: 1 }) > 0.2 ? faker.internet.email() : null,
            labels: faker.helpers.arrayElements(labels, { min: 1, max: 3 }),
            created_at: createdAt.toISOString(),
            updated_at: updatedAt.toISOString(),
            resolved_at: resolvedAt?.toISOString(),
            metadata: {
                ticket_type: faker.helpers.arrayElement(ticketTypes),
                sentiment_score: faker.number.float({ min: -0.5, max: 0.5, precision: 0.1 }),
                escalated: faker.number.float({ min: 0, max: 1 }) > 0.8,
                external_url: `https://jira.example.com/browse/TEST-${1000 + i}`,
                resolution:
                    status === 'resolved' || status === 'closed' ? faker.helpers.arrayElement(['Fixed', "Won't Fix", 'Duplicate']) : null,
                story_points: faker.number.int({ min: 1, max: 8 }),
                environment: faker.helpers.arrayElement(environments),
                browser: faker.helpers.arrayElement(browsers),
                os: faker.helpers.arrayElement(operatingSystems),
                version: `1.${faker.number.int(9)}.${faker.number.int(9)}`
            },
            concise_ticket_details: faker.lorem.sentence(),
            ai_summary: faker.lorem.paragraph(),
            comments:
                faker.number.float({ min: 0, max: 1 }) > 0.5
                    ? [
                          {
                              id: faker.string.uuid(),
                              author: faker.internet.email(),
                              content: faker.lorem.paragraph(),
                              created_at: faker.date.between({ from: createdAt, to: updatedAt }).toISOString()
                          },
                          {
                              id: faker.string.uuid(),
                              author: faker.internet.email(),
                              content: faker.lorem.paragraph(),
                              created_at: faker.date.between({ from: createdAt, to: updatedAt }).toISOString()
                          }
                      ]
                    : []
        }
    })
}

// Create test projects
const testJiraProjects = [
    {
        key: 'TEST',
        name: 'Test Project',
        description: 'A project for testing purposes',
        lead: 'test.lead@example.com',
        url: 'https://jira.example.com/projects/TEST',
        metadata: {
            category: 'Testing'
        }
    }
    // Add your existing projects here
]

async function generateTestJiraData() {
    try {
        console.log('Starting to generate test Jira data...')

        // Clear existing data
        await supabase.from('jira_projects').delete().neq('project_id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('jira_tickets').delete().neq('ticket_id', '00000000-0000-0000-0000-000000000000')

        console.log('Cleared existing Jira data')

        // Insert projects
        const { data: projectsData, error: projectsError } = await supabase.from('jira_projects').insert(testJiraProjects).select()

        if (projectsError) {
            console.error('Error inserting jira_projects:', projectsError)
            return
        }

        console.log(`Successfully generated ${projectsData.length} Jira projects!`)

        // Combine predefined and random tickets
        const allTickets = [...predefinedJiraTickets, ...generateRandomTickets(30)]

        // Insert tickets in batches of 10
        for (let i = 0; i < allTickets.length; i += 10) {
            const batch = allTickets.slice(i, i + 10)
            const { error: ticketsError } = await supabase.from('jira_tickets').insert(batch)

            if (ticketsError) {
                console.error(`Error inserting tickets batch ${i / 10 + 1}:`, ticketsError)
                return
            }
        }

        console.log(`Successfully generated ${allTickets.length} Jira tickets!`)
    } catch (error) {
        console.error('Error in generateTestJiraData:', error)
    }
}

generateTestJiraData()
