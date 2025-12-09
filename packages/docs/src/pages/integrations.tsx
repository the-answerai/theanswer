import { useState } from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import HeroCTA from '@site/src/components/HeroCTA'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Search, Filter } from 'lucide-react'

import styles from './integrations.module.css'

const LayoutComponent: any = Layout

const LOGOKIT_TOKEN = 'pk_fr8710fea017bdf10b13fe'

const INTEGRATIONS = [
    {
        name: 'Salesforce',
        domain: 'salesforce.com',
        category: 'CRM',
        difficulty: 'Easy',
        description: 'Connect to Salesforce for customer data, leads, and opportunities.'
    },
    {
        name: 'Jira',
        domain: 'atlassian.com',
        category: 'Project Management',
        difficulty: 'Easy',
        description: 'Sync issues, sprints, and project data from Jira.'
    },
    {
        name: 'Slack',
        domain: 'slack.com',
        category: 'Communication',
        difficulty: 'Easy',
        description: 'Integrate with Slack for team communication and notifications.'
    },
    {
        name: 'GitHub',
        domain: 'github.com',
        category: 'Development',
        difficulty: 'Easy',
        description: 'Automate code reviews, issue triage, and documentation generation with AI-powered GitHub workflows.'
    },
    {
        name: 'Google Workspace',
        domain: 'google.com',
        category: 'Productivity',
        difficulty: 'Easy',
        description: 'Connect to Gmail, Drive, Docs, Sheets, and Calendar.'
    },
    {
        name: 'Microsoft 365',
        domain: 'microsoft.com',
        category: 'Productivity',
        difficulty: 'Easy',
        description: 'Integrate with Outlook, OneDrive, Teams, and Office apps.'
    },
    {
        name: 'HubSpot',
        domain: 'hubspot.com',
        category: 'CRM',
        difficulty: 'Easy',
        description: 'Sync contacts, deals, and marketing data from HubSpot.'
    },
    {
        name: 'Zendesk',
        domain: 'zendesk.com',
        category: 'Support',
        difficulty: 'Easy',
        description: 'Connect to Zendesk for support tickets and customer service.'
    },
    {
        name: 'Linear',
        domain: 'linear.app',
        category: 'Project Management',
        difficulty: 'Easy',
        description: 'Sync issues and project tracking from Linear.'
    },
    {
        name: 'Notion',
        domain: 'notion.so',
        category: 'Knowledge Management',
        difficulty: 'Medium',
        description: 'Access Notion databases, pages, and workspaces.'
    },
    {
        name: 'Asana',
        domain: 'asana.com',
        category: 'Project Management',
        difficulty: 'Easy',
        description: 'Connect to Asana for task and project management.'
    },
    {
        name: 'Monday.com',
        domain: 'monday.com',
        category: 'Project Management',
        difficulty: 'Easy',
        description: 'Integrate with Monday.com boards and workflows.'
    },
    {
        name: 'Airtable',
        domain: 'airtable.com',
        category: 'Database',
        difficulty: 'Easy',
        description: 'Access Airtable bases and records.'
    },
    {
        name: 'Contentful',
        domain: 'contentful.com',
        category: 'CMS',
        difficulty: 'Easy',
        description: 'Integrate Contentful CMS to load and manage structured content through AI workflows.'
    },
    {
        name: 'Dropbox',
        domain: 'dropbox.com',
        category: 'Storage',
        difficulty: 'Easy',
        description: 'Connect to Dropbox for file storage and sharing.'
    },
    {
        name: 'Zoom',
        domain: 'zoom.us',
        category: 'Communication',
        difficulty: 'Easy',
        description: 'Integrate with Zoom for meetings and recordings.'
    },
    { name: 'Figma', domain: 'figma.com', category: 'Design', difficulty: 'Medium', description: 'Access Figma designs and prototypes.' },
    {
        name: 'Fiddler',
        domain: 'fiddler.ai',
        category: 'AI Safety & Compliance',
        difficulty: 'Intermediate',
        description:
            'Add AI safety guardrails with multi-dimensional content validation, PII detection, and hallucination prevention for RAG systems.'
    },
    {
        name: 'Intercom',
        domain: 'intercom.com',
        category: 'Support',
        difficulty: 'Easy',
        description: 'Connect to Intercom for customer messaging.'
    },
    {
        name: 'Stripe',
        domain: 'stripe.com',
        category: 'Payments',
        difficulty: 'Medium',
        description: 'Access Stripe payment and customer data.'
    },
    {
        name: 'Shopify',
        domain: 'shopify.com',
        category: 'E-commerce',
        difficulty: 'Easy',
        description: 'Connect to Shopify for store and order data.'
    },
    {
        name: 'Twilio',
        domain: 'twilio.com',
        category: 'Communication',
        difficulty: 'Medium',
        description: 'Integrate Twilio for SMS and voice communications.'
    }
]

const CATEGORIES = ['All', ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))]
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Advanced']

function IntegrationsHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Integrations</h1>
                <p className={styles.heroSubtitle}>Connect AnswerAgent to all your business tools. 50+ integrations and growing.</p>

                <HeroCTA
                    context={{
                        page: 'integrations',
                        section: 'hero'
                    }}
                    variant='centered'
                    secondaryLabel='Request Integration'
                    secondaryHref='mailto:integrations@theanswer.ai'
                />
            </div>
        </header>
    )
}

function IntegrationsCatalogSection() {
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [difficultyFilter, setDifficultyFilter] = useState('All')

    const filteredIntegrations = INTEGRATIONS.filter((integration) => {
        const matchesSearch =
            integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            integration.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === 'All' || integration.category === categoryFilter
        const matchesDifficulty = difficultyFilter === 'All' || integration.difficulty === difficultyFilter
        return matchesSearch && matchesCategory && matchesDifficulty
    })

    return (
        <section className={styles.catalogSection}>
            <div className='container'>
                {/* Search and Filters */}
                <div className={styles.filtersContainer}>
                    <div className={styles.searchBox}>
                        <Search size={20} />
                        <input
                            type='text'
                            placeholder='Search integrations...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <Filter size={18} />
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={styles.filterSelect}>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === 'All' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>

                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {DIFFICULTIES.map((diff) => (
                                <option key={diff} value={diff}>
                                    {diff === 'All' ? 'All Difficulties' : diff}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results Count */}
                <p className={styles.resultsCount}>
                    Showing {filteredIntegrations.length} of {INTEGRATIONS.length} integrations
                </p>

                {/* Integration Grid */}
                <div className={styles.integrationGrid}>
                    {filteredIntegrations.map((integration, idx) => (
                        <div key={idx} className={styles.integrationCard}>
                            <div className={styles.integrationLogo}>
                                <img
                                    src={`https://img.logokit.com/${integration.domain}?token=${LOGOKIT_TOKEN}`}
                                    alt={integration.name}
                                    height={60}
                                    loading='lazy'
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                    }}
                                />
                            </div>
                            <h3>{integration.name}</h3>
                            <div className={styles.integrationMeta}>
                                <span className={styles.category}>{integration.category}</span>
                                <span className={clsx(styles.difficulty, styles[integration.difficulty.toLowerCase()])}>
                                    {integration.difficulty}
                                </span>
                            </div>
                            <p className={styles.integrationDescription}>{integration.description}</p>
                            <div className={styles.integrationActions}>
                                <a href={`/docs/integrations/${integration.name.toLowerCase()}`} className={styles.actionLink}>
                                    Setup Guide →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredIntegrations.length === 0 && (
                    <div className={styles.noResults}>
                        <p>No integrations found matching your criteria.</p>
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setCategoryFilter('All')
                                setDifficultyFilter('All')
                            }}
                            className='button button--secondary'
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

function RequestIntegrationSection() {
    return (
        <section className={styles.requestSection}>
            <div className='container text--center'>
                <h2>Don&apos;t see your integration?</h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
                    We&apos;re constantly adding new integrations. Let us know what you need.
                </p>
                <a href='mailto:integrations@theanswer.ai?subject=Integration Request' className='button button--primary button--lg'>
                    Request an Integration
                </a>
            </div>
        </section>
    )
}

export default function Integrations(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent title='Integrations' description='Connect AnswerAgent to all your business tools. 50+ integrations available.'>
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'AnswerAgent Integrations',
                        description:
                            'Browse all available integrations for AnswerAgent. Connect to Salesforce, Jira, Slack, GitHub, and more.'
                    }}
                />
                <IntegrationsHero />
                <main>
                    <IntegrationsCatalogSection />
                    <RequestIntegrationSection />
                </main>
            </LayoutComponent>
        </div>
    )
}
