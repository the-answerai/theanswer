import clsx from 'clsx'
import Layout from '@theme/Layout'
import { TerminalHero } from '@site/src/components/Modern/CreativeSections'
import HeroCTA from '@site/src/components/HeroCTA'
import IntegrationLogo from '@site/src/components/IntegrationLogo'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Check, Database, Code2, BarChart3, Shield, Zap, Image } from 'lucide-react'
import styles from './how-it-works.module.css'

const LayoutComponent: any = Layout

function HowItWorksHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>How AnswerAgent Works</h1>
                <p className={styles.heroSubtitle}>Three steps to AI-powered productivity</p>
                <HeroCTA
                    context={{
                        page: 'how-it-works',
                        section: 'hero'
                    }}
                />
            </div>
        </header>
    )
}

function ConnectDataSection() {
    return (
        <section className={styles.section}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={styles.sectionIcon}>
                            <Database size={64} strokeWidth={1.5} />
                        </div>
                        <h2 className={styles.sectionTitle}>Step 1: Connect Your Data Sources</h2>
                        <p className={styles.sectionDescription}>
                            AnswerAgent integrates with all your business tools. Connect once, use everywhere.
                        </p>
                        <ul className={styles.featureList}>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>50+ integrations (Salesforce, Jira, Slack, GitHub, Google, Microsoft, etc.)</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Enterprise security & permissions</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>J-Link for regulated companies (SOX, FINRA, HIPAA compliance)</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Encrypted, secure, auditable</span>
                            </li>
                        </ul>
                        <div className={styles.ctaGroup}>
                            <a href='/how-it-works#integrations' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                See All Integrations
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.visualContainer}>
                            <div className={styles.integrationGrid}>
                                {[
                                    { domain: 'salesforce.com', name: 'Salesforce' },
                                    { domain: 'atlassian.com', name: 'Jira' },
                                    { domain: 'slack.com', name: 'Slack' },
                                    { domain: 'github.com', name: 'GitHub' },
                                    { domain: 'google.com', name: 'Google' },
                                    { domain: 'microsoft.com', name: 'Microsoft' }
                                ].map((integration) => (
                                    <div key={integration.domain} className={styles.integrationCard}>
                                        <IntegrationLogo domain={integration.domain} alt={integration.name} size='md' />
                                        <span className={styles.integrationName}>{integration.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.moreIntegrations}>
                                <p>+ 50+ more integrations</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.subsection} id='jlink'>
                    <div className='row'>
                        <div className='col col--6'>
                            <div className={styles.highlightCard}>
                                <Shield size={48} className={styles.highlightIcon} />
                                <h3>J-Link for Regulated Companies</h3>
                                <p>
                                    Need cryptographic audit trails? J-Link provides immutable tracking for financial services, healthcare,
                                    legal, and public companies.
                                </p>
                                <a href='/jlinc-partnership' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                    Learn About J-Link
                                </a>
                            </div>
                        </div>
                        <div className='col col--6'>
                            <div className={styles.codeBoxContainer}>
                                <TerminalHero />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function BuildAgentsSection() {
    return (
        <section className={styles.section}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={styles.visualContainer}>
                            <div className={styles.screenshotPlaceholder}>
                                <Image size={64} className={styles.placeholderIcon} />
                                <p className={styles.placeholderText}>Agent Studio Screenshot</p>
                                <p className={styles.placeholderSubtext}>Visual builder interface with drag-and-drop components</p>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.sectionIcon}>
                            <Code2 size={64} strokeWidth={1.5} />
                        </div>
                        <h2 className={styles.sectionTitle}>Step 2: Build Your AI Agents</h2>
                        <p className={styles.sectionDescription}>Visual builder on the open-source stack you trust. No vendor lock-in.</p>
                        <ul className={styles.featureList}>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Built on LangChain & Flowise</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Visual drag-and-drop builder (no coding required)</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Code editor for advanced users</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>100+ pre-built templates</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Deploy to your infrastructure (cloud, on-prem, hybrid)</span>
                            </li>
                        </ul>
                        <div className={styles.ctaGroup}>
                            <a href='https://studio.theanswer.ai' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                                Try Free Studio
                            </a>
                            <a href='/developers' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                Browse Templates
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <div className='row'>
                        <div className='col col--8 col--offset-2'>
                            <div className={styles.highlightCard}>
                                <Zap size={48} className={styles.highlightIcon} />
                                <h3>Open-Source Foundation</h3>
                                <p>
                                    We build on LangChain and Flowise—proven, trusted, community-driven. You own your orchestration layer.
                                </p>
                                <a href='/developers' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                    Learn More for Developers
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function GetInsightsSection() {
    return (
        <section className={styles.section}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={styles.sectionIcon}>
                            <BarChart3 size={64} strokeWidth={1.5} />
                        </div>
                        <h2 className={styles.sectionTitle}>Step 3: Get Instant Insights</h2>
                        <p className={styles.sectionDescription}>Stop spending hours on reports and updates. Get them instantly.</p>
                        <ul className={styles.featureList}>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Real-time dashboards</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>On-demand reports</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Automated summaries</span>
                            </li>
                            <li>
                                <Check size={20} className='text--success' />
                                <span>Multi-platform views</span>
                            </li>
                        </ul>
                        <div className={styles.useCasesGrid}>
                            <div className={styles.useCaseCard}>
                                <h4>Engineering</h4>
                                <p>Daily standup briefings, ticket triage, sprint summaries</p>
                            </div>
                            <div className={styles.useCaseCard}>
                                <h4>Marketing</h4>
                                <p>Campaign analytics, content calendars, social listening</p>
                            </div>
                            <div className={styles.useCaseCard}>
                                <h4>Sales</h4>
                                <p>Pipeline updates, deal tracking, customer insights</p>
                            </div>
                            <div className={styles.useCaseCard}>
                                <h4>Support</h4>
                                <p>Case summaries, escalation alerts, satisfaction tracking</p>
                            </div>
                            <div className={styles.useCaseCard}>
                                <h4>Leadership</h4>
                                <p>OKR dashboards, team productivity, strategic insights</p>
                            </div>
                        </div>
                        <div className={styles.ctaGroup}>
                            <a href='/get-started#roi' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                                See ROI Calculator
                            </a>
                            <a href='/docs/use-cases' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                Browse Use Cases
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.visualContainer}>
                            <div className={styles.screenshotPlaceholder}>
                                <Image size={64} className={styles.placeholderIcon} />
                                <p className={styles.placeholderText}>On-Demand Dashboard Screenshot</p>
                                <p className={styles.placeholderSubtext}>Real-time insights and reports across all your data sources</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.subsection}>
                    <div className='row'>
                        <div className='col col--8 col--offset-2'>
                            <div className={styles.highlightCard}>
                                <BarChart3 size={48} className={styles.highlightIcon} />
                                <h3>Time Savings Calculator</h3>
                                <p>Find out how much time your team could save</p>
                                <a href='/get-started#roi' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                    Calculate Your ROI
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function CustomerStorySection() {
    return (
        <section className={styles.customerStorySection}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <h2 className={styles.sectionTitle}>Trusted by Teams Building the Future</h2>
                        <div className={styles.customerStoryCard}>
                            <div className={styles.customerQuote}>
                                <p className={styles.quoteText}>
                                    &quot;AnswerAgent transformed how we work with AI. We connected all our tools in minutes and built
                                    agents that save our team hours every week. The open-source foundation gives us confidence we&apos;re
                                    not locked into proprietary systems.&quot;
                                </p>
                                <div className={styles.customerInfo}>
                                    <div className={styles.customerAvatar}>
                                        <span>JD</span>
                                    </div>
                                    <div>
                                        <p className={styles.customerName}>John Doe</p>
                                        <p className={styles.customerTitle}>CTO, TechCorp</p>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.customerMetrics}>
                                <div className={styles.metric}>
                                    <div className={styles.metricValue}>10+</div>
                                    <div className={styles.metricLabel}>Hours Saved/Week</div>
                                </div>
                                <div className={styles.metric}>
                                    <div className={styles.metricValue}>50+</div>
                                    <div className={styles.metricLabel}>Integrations Connected</div>
                                </div>
                                <div className={styles.metric}>
                                    <div className={styles.metricValue}>100%</div>
                                    <div className={styles.metricLabel}>Team Adoption</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function BottomCTASection() {
    return (
        <section className={styles.bottomCTASection}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <h2 className={styles.bottomCTATitle}>Ready to get started?</h2>
                        <p className={styles.bottomCTADescription}>
                            Choose the path that works best for you—schedule a demo, try Studio free, or start an assessment.
                        </p>
                        <HeroCTA
                            context={{
                                page: 'how-it-works',
                                section: 'bottom-cta'
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function HowItWorks(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='How It Works - AnswerAgent'
                description='Learn how AnswerAgent connects your data, builds your agents, and delivers instant insights.'
            >
                <HowItWorksHero />
                <main>
                    <ConnectDataSection />
                    <BuildAgentsSection />
                    <GetInsightsSection />
                    <CustomerStorySection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
