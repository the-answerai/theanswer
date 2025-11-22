import clsx from 'clsx'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import HeroCTA from '@site/src/components/HeroCTA'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Code2, Target, Users, FileText, BarChart3 } from 'lucide-react'

import styles from './use-cases.module.css'

const LayoutComponent: any = Layout

const USE_CASES_BY_ROLE = [
    {
        role: 'Engineering',
        icon: <Code2 size={32} />,
        useCases: [
            { name: 'Daily Standup Briefings', description: 'Automated summaries of commits, PRs, and issues across your team.' },
            { name: 'Ticket Triage', description: 'AI-powered categorization and routing of support tickets.' },
            { name: 'Sprint Summaries', description: 'End-of-sprint reports with velocity metrics and accomplishments.' },
            { name: 'Code Review Assistant', description: 'Automated code review suggestions and PR summaries.' },
            { name: 'Deployment Notifications', description: 'Real-time alerts and rollback suggestions for deployments.' }
        ]
    },
    {
        role: 'Marketing',
        icon: <Target size={32} />,
        useCases: [
            { name: 'Campaign Analytics', description: 'Real-time dashboards of campaign performance across all channels.' },
            { name: 'Content Calendars', description: 'Automated content scheduling and social media planning.' },
            { name: 'Social Listening', description: 'Monitor brand mentions and sentiment across social platforms.' },
            { name: 'Lead Scoring', description: 'AI-powered lead qualification and nurture recommendations.' },
            { name: 'Competitor Analysis', description: 'Automated tracking of competitor activities and market trends.' }
        ]
    },
    {
        role: 'Sales',
        icon: <Users size={32} />,
        useCases: [
            { name: 'Pipeline Updates', description: 'Real-time deal tracking and forecasting dashboards.' },
            { name: 'Deal Tracking', description: 'Automated follow-ups and next-best-action recommendations.' },
            { name: 'Customer Insights', description: 'AI-generated customer profiles and engagement history.' },
            { name: 'Meeting Preparation', description: 'Pre-meeting briefings with account history and talking points.' },
            { name: 'CRM Data Entry', description: 'Automated data capture from emails, calls, and meetings.' }
        ]
    },
    {
        role: 'Support',
        icon: <FileText size={32} />,
        useCases: [
            { name: 'Case Summaries', description: 'AI-generated ticket summaries for faster resolution.' },
            { name: 'Escalation Alerts', description: 'Proactive alerts for high-priority or at-risk tickets.' },
            { name: 'Satisfaction Tracking', description: 'Real-time CSAT and NPS monitoring with trend analysis.' },
            { name: 'Knowledge Base Assistant', description: 'AI-powered article suggestions for common issues.' },
            { name: 'Response Templates', description: 'Context-aware response generation for faster replies.' }
        ]
    },
    {
        role: 'Leadership',
        icon: <BarChart3 size={32} />,
        useCases: [
            { name: 'OKR Dashboards', description: 'Real-time objective and key result tracking across teams.' },
            { name: 'Team Productivity', description: 'Automated productivity metrics and bottleneck identification.' },
            { name: 'Strategic Insights', description: 'AI-powered analysis of business trends and opportunities.' },
            { name: 'Executive Briefings', description: 'Daily or weekly summaries of key metrics and events.' },
            { name: 'Budget Tracking', description: 'Real-time spending analysis and forecast updates.' }
        ]
    }
]

function UseCasesHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Use Cases</h1>
                <p className={styles.heroSubtitle}>Real-world examples of how teams use AnswerAgent to save time and get insights</p>

                <HeroCTA
                    context={{
                        page: 'use-cases',
                        section: 'hero'
                    }}
                    variant='centered'
                />
            </div>
        </header>
    )
}

function UseCasesByRoleSection() {
    return (
        <section className={styles.useCasesSection}>
            <div className='container'>
                <h2 className='text--center' style={{ marginBottom: '4rem' }}>
                    Use Cases by Role
                </h2>
                {USE_CASES_BY_ROLE.map((roleGroup, idx) => (
                    <div key={idx} className={styles.roleSection}>
                        <div className={styles.roleHeader}>
                            <div className={styles.roleIcon}>{roleGroup.icon}</div>
                            <h3>{roleGroup.role}</h3>
                        </div>
                        <div className={styles.useCaseGrid}>
                            {roleGroup.useCases.map((useCase, ucIdx) => (
                                <div key={ucIdx} className={styles.useCaseCard}>
                                    <h4>{useCase.name}</h4>
                                    <p>{useCase.description}</p>
                                    <a href={`#${useCase.name.toLowerCase().replace(/\s+/g, '-')}`} className={styles.useCaseLink}>
                                        Learn More →
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

function BottomCTASection() {
    return (
        <section className={styles.bottomCTASection}>
            <div className='container text--center'>
                <h2 style={{ marginBottom: '1rem' }}>Ready to build your use case?</h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
                    See how AnswerAgent can transform your team&apos;s workflow
                </p>
                <HeroCTA
                    context={{
                        page: 'use-cases',
                        section: 'bottom-cta'
                    }}
                    variant='centered'
                />
            </div>
        </section>
    )
}

export default function UseCases(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Use Cases'
                description='Real-world examples of how teams use AnswerAgent to automate workflows and get instant insights.'
            >
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'AnswerAgent Use Cases',
                        description: 'Discover how different teams use AnswerAgent for automation, insights, and productivity.'
                    }}
                />
                <UseCasesHero />
                <main>
                    <UseCasesByRoleSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
