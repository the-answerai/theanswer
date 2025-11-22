import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import HeroCTA from '@site/src/components/HeroCTA'
import { Database, Cpu, BarChart3 } from 'lucide-react'

import styles from './index.module.css'

const LayoutComponent: any = Layout

function HomepageHeader() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Stop Managing AI Tools. Start Using AI.</h1>
                <p className={styles.heroSubtitle}>
                    AnswerAgent connects your data, builds your agents, and delivers instant insights—all in one platform.
                </p>

                <HeroCTA
                    context={{
                        page: 'homepage',
                        section: 'hero',
                        url: '/'
                    }}
                    variant='centered'
                />

                <div className={styles.heroSecondary}>
                    <a href='#video-demo' className={styles.secondaryLink}>
                        Watch 2-Min Demo →
                    </a>
                </div>
            </div>
        </header>
    )
}

function ThreePillarsSection() {
    const pillars = [
        {
            icon: <Database size={48} strokeWidth={1.5} />,
            title: 'Connect Your Data',
            description: 'All your business tools in one secure place. Salesforce, Jira, Slack, GitHub, and 50+ more.',
            link: '/how-it-works#connect',
            linkText: 'See How'
        },
        {
            icon: <Cpu size={48} strokeWidth={1.5} />,
            title: 'Build Your Agents',
            description: 'Visual builder on open-source you trust. LangChain + Flowise. Deploy anywhere.',
            link: '/how-it-works#build',
            linkText: 'Try Free Studio'
        },
        {
            icon: <BarChart3 size={48} strokeWidth={1.5} />,
            title: 'Get Instant Insights',
            description: 'Dashboards and reports on-demand. Stop preparing. Start doing.',
            link: '/how-it-works#insights',
            linkText: 'Calculate ROI'
        }
    ]

    return (
        <section className={styles.pillarsSection}>
            <div className='container'>
                <div className='row'>
                    {pillars.map((pillar, idx) => (
                        <div key={idx} className='col col--4'>
                            <div className={styles.pillarCard}>
                                <div className={styles.pillarIcon}>{pillar.icon}</div>
                                <h3>{pillar.title}</h3>
                                <p>{pillar.description}</p>
                                <a href={pillar.link} className={styles.pillarLink}>
                                    {pillar.linkText} →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function SocialProofSection() {
    return (
        <section className={styles.socialProofSection}>
            <div className='container text--center'>
                <p className={styles.proofText}>
                    <strong>Built on open-source:</strong> LangChain, Flowise
                </p>
                <p className={styles.proofSubtext}>Trusted by teams building the future of AI</p>
            </div>
        </section>
    )
}

function UseCasesPreviewSection() {
    const useCases = [
        {
            title: 'Daily Briefing from All Your Tools',
            description: 'Get a comprehensive summary of updates from Slack, Jira, GitHub, and more—delivered every morning.',
            image: '/img/use-cases/daily-briefing.png'
        },
        {
            title: 'Automated Ticket Triage',
            description: 'AI-powered categorization and routing of support tickets based on content, urgency, and team availability.',
            image: '/img/use-cases/ticket-triage.png'
        },
        {
            title: 'Real-Time OKR Dashboards',
            description: 'Track team objectives and key results across all platforms with live, auto-updating visualizations.',
            image: '/img/use-cases/okr-dashboard.png'
        }
    ]

    return (
        <section className={styles.useCasesSection}>
            <div className='container'>
                <h2 className='text--center' style={{ marginBottom: '3rem' }}>
                    What can you build?
                </h2>
                <div className='row'>
                    {useCases.map((useCase, idx) => (
                        <div key={idx} className='col col--4'>
                            <div className={styles.useCaseCard}>
                                <div className={styles.useCaseImage} style={{ backgroundImage: `url(${useCase.image})` }}>
                                    <div className={styles.useCaseOverlay}>
                                        <span>Coming Soon</span>
                                    </div>
                                </div>
                                <div className={styles.useCaseContent}>
                                    <h3>{useCase.title}</h3>
                                    <p>{useCase.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='text--center' style={{ marginTop: '2rem' }}>
                    <a href='/use-cases' className='button button--secondary button--lg'>
                        Browse All Use Cases
                    </a>
                </div>
            </div>
        </section>
    )
}

function PricingTeaserSection() {
    return (
        <section className={styles.pricingTeaserSection}>
            <div className='container'>
                <h2 className='text--center' style={{ marginBottom: '1rem' }}>
                    Simple Pricing
                </h2>
                <p className='text--center' style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '3rem' }}>
                    Starting at $500/month, unlimited users
                    <br />
                    Or self-host on your infrastructure
                </p>
                <div className='text--center'>
                    <a href='/pricing' className='button button--primary button--lg'>
                        View Pricing
                    </a>
                </div>
            </div>
        </section>
    )
}

function BottomCTASection() {
    return (
        <section className={styles.bottomCTASection}>
            <div className='container text--center'>
                <h2 style={{ marginBottom: '2rem' }}>Ready to get started?</h2>
                <HeroCTA
                    context={{
                        page: 'homepage',
                        section: 'bottom-cta',
                        url: '/'
                    }}
                    variant='centered'
                />
            </div>
        </section>
    )
}

export default function Home(): JSX.Element {
    const { siteConfig: _siteConfig } = useDocusaurusContext()
    return (
        <div data-theme='dark'>
            <LayoutComponent title={'AnswerAgent: AI Agent Platform'} description='Stop Managing AI Tools. Start Using AI.'>
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: 'AnswerAgent',
                        url: 'https://answeragent.ai',
                        description: 'Connect your data, build your agents, and get instant insights—all in one platform.'
                    }}
                />
                <HomepageHeader />
                <main>
                    <ThreePillarsSection />
                    <SocialProofSection />
                    <UseCasesPreviewSection />
                    <PricingTeaserSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
