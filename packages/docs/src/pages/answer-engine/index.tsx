import Layout from '@theme/Layout'
import styles from '../new-brand.module.css'
import { Shield, Lock, Link as LinkIcon, Server, Network, Zap, Database, Tags, FileText } from 'lucide-react'
import Link from '@docusaurus/Link'
import { MagneticCard, TiltHero, OrchestrationFlow, MagneticGrid } from '../../components/Modern/CreativeSections'
import IntegrationLogo from '../../components/IntegrationLogo'

// All available integrations
const INTEGRATIONS = [
    { name: 'Salesforce', domain: 'salesforce.com', category: 'CRM' },
    { name: 'Jira', domain: 'atlassian.com', category: 'Project Management' },
    { name: 'Slack', domain: 'slack.com', category: 'Communication' },
    { name: 'GitHub', domain: 'github.com', category: 'Development' },
    { name: 'Google Workspace', domain: 'google.com', category: 'Productivity' },
    { name: 'Microsoft 365', domain: 'microsoft.com', category: 'Productivity' },
    { name: 'HubSpot', domain: 'hubspot.com', category: 'CRM' },
    { name: 'Zendesk', domain: 'zendesk.com', category: 'Support' },
    { name: 'Linear', domain: 'linear.app', category: 'Project Management' },
    { name: 'Notion', domain: 'notion.so', category: 'Knowledge Management' },
    { name: 'Asana', domain: 'asana.com', category: 'Project Management' },
    { name: 'Monday.com', domain: 'monday.com', category: 'Project Management' },
    { name: 'Airtable', domain: 'airtable.com', category: 'Database' },
    { name: 'Dropbox', domain: 'dropbox.com', category: 'Storage' },
    { name: 'Zoom', domain: 'zoom.us', category: 'Communication' },
    { name: 'Figma', domain: 'figma.com', category: 'Design' },
    { name: 'Intercom', domain: 'intercom.com', category: 'Support' },
    { name: 'Stripe', domain: 'stripe.com', category: 'Payments' },
    { name: 'Shopify', domain: 'shopify.com', category: 'E-commerce' },
    { name: 'Twilio', domain: 'twilio.com', category: 'Communication' }
]

export default function AnswerEngine(): JSX.Element {
    return (
        <Layout title='AnswerEngine' description='Connect everything. Control everything. All your data connections in one place.'>
            <div className={styles.container}>
                {/* Hero Section - Orchestration Flow */}
                <section
                    className={styles.section}
                    style={{ paddingTop: '4rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                    <div className='row' style={{ alignItems: 'center' }}>
                        <div className='col col--5'>
                            <div className='badge badge--primary margin-bottom--md'>Pillar 1: AnswerEngine</div>
                            <h1 className={styles.heroTitle} style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                                Your Data,
                                <br /> Your Rules
                            </h1>
                            <p className={styles.heroSubtitle} style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
                                Connect all your business tools with enterprise-grade security and control. AnswerEngine handles all
                                connections, permissions, and compliance so your agents can act safely.
                            </p>

                            <div className={styles.buttonGrid} style={{ marginTop: '2rem' }}>
                                <Link to='/ai-workshops' className='button button--primary button--lg'>
                                    Start Data Assessment
                                </Link>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <Link to='https://calendly.com/answerai/enterprise-ai-fit-call' className='button button--link'>
                                    Schedule Demo &rarr;
                                </Link>
                            </div>
                        </div>
                        <div className='col col--7'>
                            <OrchestrationFlow />
                        </div>
                    </div>
                </section>

                {/* All Integrations Grid */}
                <section
                    className={styles.section}
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        padding: '4rem 2rem',
                        background: 'rgba(255,255,255,0.02)'
                    }}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem' }}>Connect All Your Business Tools</h2>
                    <p style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', opacity: 0.8 }}>
                        20+ integrations ready to use, with 50+ more coming soon
                    </p>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '2rem',
                            maxWidth: '1200px',
                            margin: '0 auto'
                        }}
                    >
                        {INTEGRATIONS.map((integration, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '1.5rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)'
                                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                                    e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
                                }}
                            >
                                <IntegrationLogo domain={integration.domain} alt={integration.name} size='md' />
                                <div
                                    style={{
                                        marginTop: '0.75rem',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        textAlign: 'center',
                                        color: 'var(--ifm-font-color-base)'
                                    }}
                                >
                                    {integration.name}
                                </div>
                                <div
                                    style={{
                                        marginTop: '0.25rem',
                                        fontSize: '0.75rem',
                                        opacity: 0.6,
                                        textAlign: 'center'
                                    }}
                                >
                                    {integration.category}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <Link to='/integrations' className='button button--outline button--primary button--lg'>
                            View All Integrations
                        </Link>
                    </div>
                </section>

                {/* Data Lake, Tagging, Summarization */}
                <section className={styles.section} style={{ paddingTop: '4rem' }}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        Why Connect Your Data to AnswerAgent?
                    </h2>
                    <p className='lead text--center margin-bottom--xl' style={{ maxWidth: '800px', margin: '0 auto 4rem' }}>
                        Beyond simple integrations—AnswerAgent transforms your scattered data into unified, actionable intelligence.
                    </p>

                    <MagneticGrid>
                        <MagneticCard>
                            <Database size={48} className='text--success margin-bottom--md' />
                            <h3>Unified Data Lake</h3>
                            <p>
                                All your business data in one secure, queryable repository. Stop switching between 20 different tools.
                                AnswerAgent creates a unified index across every data source while keeping your raw data exactly where it
                                is.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.8, fontSize: '0.9rem' }}>
                                <li>✓ Cross-platform search in milliseconds</li>
                                <li>✓ No data migration required</li>
                                <li>✓ Real-time sync with source systems</li>
                                <li>✓ Smart de-duplication and merging</li>
                            </ul>
                        </MagneticCard>

                        <MagneticCard>
                            <Tags size={48} className='text--info margin-bottom--md' />
                            <h3>Intelligent Tagging</h3>
                            <p>
                                AI-powered metadata tagging that automatically categorizes, labels, and organizes your data as it flows in.
                                Find what you need, when you need it—no manual organization required.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.8, fontSize: '0.9rem' }}>
                                <li>✓ Auto-classification by topic, sentiment, priority</li>
                                <li>✓ Custom taxonomy support</li>
                                <li>✓ Entity extraction (people, companies, dates)</li>
                                <li>✓ Smart relationship mapping</li>
                            </ul>
                        </MagneticCard>

                        <MagneticCard>
                            <FileText size={48} className='text--warning margin-bottom--md' />
                            <h3>AI Summarization</h3>
                            <p>
                                Cut through the noise. AnswerAgent automatically generates concise summaries of documents, threads,
                                meetings, and updates—so you get the insights without the information overload.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.8, fontSize: '0.9rem' }}>
                                <li>✓ Multi-document synthesis</li>
                                <li>✓ Key takeaways and action items</li>
                                <li>✓ Trend analysis across time periods</li>
                                <li>✓ Executive briefings on demand</li>
                            </ul>
                        </MagneticCard>
                    </MagneticGrid>
                </section>

                {/* Security & Permissions Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        Enterprise Security Core
                    </h2>
                    <p className='lead text--center margin-bottom--xl' style={{ maxWidth: '700px', margin: '0 auto 4rem' }}>
                        The only AI platform built with a security-first architecture designed for regulated industries.
                    </p>

                    <MagneticGrid>
                        <MagneticCard>
                            <Shield size={48} className='text--primary margin-bottom--md' />
                            <h3>Permission Management</h3>
                            <p>
                                Granular control over who sees what. We ingest and mirror your existing Access Control Lists (ACLs) from
                                source systems.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <Lock size={48} className='text--primary margin-bottom--md' />
                            <h3>Zero-Trust Architecture</h3>
                            <p>
                                Military-grade encryption at rest (AES-256) and in transit (TLS 1.3). Your data never leaves the secure
                                enclave without authorization.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <LinkIcon size={48} className='text--primary margin-bottom--md' />
                            <h3>J-Link Partnership</h3>
                            <p>
                                Cryptographic provenance for compliance. Every agent action is signed and verifiable. Ideal for Finance,
                                Healthcare, and Legal.
                            </p>
                            <div className='margin-top--md'>
                                <Link to='/jlinc-partnership' className='button button--sm button--secondary'>
                                    Learn about J-Link
                                </Link>
                            </div>
                        </MagneticCard>
                        <MagneticCard>
                            <Network size={48} className='text--primary margin-bottom--md' />
                            <h3>Private Cloud Ready</h3>
                            <p>Deploy AnswerEngine in your own VPC. Keep data residency within your controlled environment.</p>
                        </MagneticCard>
                    </MagneticGrid>
                </section>

                {/* How It Works - Process Steps */}
                <section
                    className={styles.section}
                    style={{ background: 'var(--ifm-background-surface-color)', padding: '6rem 2rem', borderRadius: '24px' }}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '2.5rem' }}>How It Works</h2>
                    <div className='row'>
                        <div className='col col--4'>
                            <TiltHero>
                                <div
                                    className='card'
                                    style={{
                                        padding: '2rem',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '4rem',
                                            fontWeight: 'bold',
                                            color: 'var(--ifm-color-primary)',
                                            opacity: 0.2,
                                            marginBottom: '-2rem'
                                        }}
                                    >
                                        01
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', position: 'relative' }}>Connect Data</h3>
                                    <div
                                        style={{ margin: '1.5rem 0', height: '2px', width: '50px', background: 'var(--ifm-color-primary)' }}
                                    ></div>
                                    <p>
                                        Connect your data sources in minutes using our secure OAuth connectors. We index metadata while
                                        keeping raw data secure.
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <Server size={32} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                            </TiltHero>
                        </div>
                        <div className='col col--4'>
                            <TiltHero>
                                <div
                                    className='card'
                                    style={{
                                        padding: '2rem',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '4rem',
                                            fontWeight: 'bold',
                                            color: 'var(--ifm-color-primary)',
                                            opacity: 0.2,
                                            marginBottom: '-2rem'
                                        }}
                                    >
                                        02
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', position: 'relative' }}>Set Permissions</h3>
                                    <div
                                        style={{ margin: '1.5rem 0', height: '2px', width: '50px', background: 'var(--ifm-color-primary)' }}
                                    ></div>
                                    <p>
                                        Define who can access what. AnswerEngine enforces your rules at the query level, ensuring agents
                                        never leak sensitive info.
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <Shield size={32} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                            </TiltHero>
                        </div>
                        <div className='col col--4'>
                            <TiltHero>
                                <div
                                    className='card'
                                    style={{
                                        padding: '2rem',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '4rem',
                                            fontWeight: 'bold',
                                            color: 'var(--ifm-color-primary)',
                                            opacity: 0.2,
                                            marginBottom: '-2rem'
                                        }}
                                    >
                                        03
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', position: 'relative' }}>Enable Agents</h3>
                                    <div
                                        style={{ margin: '1.5rem 0', height: '2px', width: '50px', background: 'var(--ifm-color-primary)' }}
                                    ></div>
                                    <p>
                                        Your agents can now use this data safely to answer questions and perform tasks, with full audit
                                        trails of every access.
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <Zap size={32} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                            </TiltHero>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className={styles.section} style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem' }}>Ready to secure your AI data layer?</h2>
                    <p className='lead'>Start your free data assessment today.</p>
                    <div className={styles.buttonGrid} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                        <Link to='/ai-workshops' className='button button--primary button--lg' style={{ minWidth: '200px' }}>
                            Start Assessment
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    )
}
