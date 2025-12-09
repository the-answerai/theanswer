import clsx from 'clsx'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import {
    BookOpen,
    Zap,
    Clock,
    TrendingUp,
    CheckCircle,
    Sparkles,
    ListChecks,
    Users,
    BarChart3,
    FileText,
    GitBranch,
    Target
} from 'lucide-react'

import styles from '../index.module.css'

const LayoutComponent: any = Layout

const LOGOKIT_TOKEN = 'pk_fr8710fea017bdf10b13fe'

function LinearHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <div style={{ marginBottom: '2rem' }}>
                    <img
                        src={`https://img.logokit.com/linear.app?token=${LOGOKIT_TOKEN}`}
                        alt='Linear Logo'
                        height={80}
                        style={{ marginBottom: '1rem' }}
                    />
                </div>
                <h1 className={styles.heroTitle}>Linear AI Agent Integration</h1>
                <p className={styles.heroSubtitle} style={{ fontSize: '1.5rem', maxWidth: '900px', margin: '0 auto 2rem' }}>
                    Transform your Linear workflow with AI-powered automation.
                    <strong> AI that actually works.</strong> Setup in 5 minutes. Save 10+ hours every week.
                </p>
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '2rem',
                        flexWrap: 'wrap'
                    }}
                >
                    <CheckCircle size={24} color='#10b981' />
                    <span style={{ fontSize: '1.2rem' }}>Save 10+ hours per week</span>
                    <CheckCircle size={24} color='#10b981' />
                    <span style={{ fontSize: '1.2rem' }}>Be better at your job</span>
                    <CheckCircle size={24} color='#10b981' />
                    <span style={{ fontSize: '1.2rem' }}>Setup in under 5 minutes</span>
                </div>
                <div className={styles.heroCTAs}>
                    <a
                        href='https://calendly.com/brad-theanswer/answeragent-intro'
                        className={clsx(styles.ctaButton, styles.ctaPrimary)}
                        style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                    >
                        <Sparkles size={20} style={{ marginRight: '0.5rem' }} />
                        Book a Demo
                    </a>
                    <a
                        href='/docs/integrations/linear'
                        className={clsx(styles.ctaButton, styles.ctaSecondary)}
                        style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                    >
                        <BookOpen size={20} style={{ marginRight: '0.5rem' }} />
                        Setup Guide
                    </a>
                </div>
            </div>
        </header>
    )
}

function ValueProps() {
    const valueProps = [
        {
            icon: <Zap size={48} strokeWidth={1.5} />,
            title: 'Lightning Fast Setup',
            description:
                'Connect your Linear workspace in under 5 minutes. Just paste your API key and start automating. No complex configuration, no technical expertise required.'
        },
        {
            icon: <Clock size={48} strokeWidth={1.5} />,
            title: 'Save 10+ Hours Weekly',
            description:
                'Automate issue triage, sprint planning, and project reporting. Let AI handle the repetitive tasks while you focus on building great products.'
        },
        {
            icon: <TrendingUp size={48} strokeWidth={1.5} />,
            title: 'Be Better at Your Job',
            description:
                'Make smarter decisions with AI-powered insights. Identify bottlenecks, balance workloads, and predict project risks before they become problems.'
        }
    ]

    return (
        <section className={styles.featuresSection} style={{ background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <h2 className='text--center' style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Why Teams Choose AnswerAgent for Linear
                </h2>
                <p
                    className='text--center'
                    style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem' }}
                >
                    <strong>AI that actually works.</strong> Built for high-performing engineering teams.
                </p>
                <div className='row'>
                    {valueProps.map((prop, idx) => (
                        <div key={idx} className='col col--4'>
                            <div className={styles.featureCard} style={{ height: '100%', padding: '2rem' }}>
                                <div className={styles.appIcon} style={{ color: 'var(--ifm-color-primary)' }}>
                                    {prop.icon}
                                </div>
                                <h3 style={{ fontSize: '1.5rem' }}>{prop.title}</h3>
                                <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{prop.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function UseCases() {
    const cases = [
        {
            icon: <ListChecks size={32} />,
            title: 'Automated Issue Triage',
            description: 'AI categorizes, prioritizes, and assigns new issues automatically based on content and context.',
            time: '8 hours saved/week'
        },
        {
            icon: <GitBranch size={32} />,
            title: 'Sprint Planning Assistant',
            description: 'Balance workloads, estimate complexity, and create optimal sprint compositions with AI analysis.',
            time: '6 hours saved/week'
        },
        {
            icon: <BarChart3 size={32} />,
            title: 'Project Status Reports',
            description: 'Generate comprehensive project health reports automatically. Track velocity, identify risks.',
            time: '4 hours saved/week'
        },
        {
            icon: <Users size={32} />,
            title: 'Team Workload Balancing',
            description: 'Monitor capacity and automatically rebalance work to prevent burnout and optimize productivity.',
            time: '5 hours saved/week'
        },
        {
            icon: <FileText size={32} />,
            title: 'Documentation Generation',
            description: 'Create and maintain project documentation from Linear issues, comments, and project data.',
            time: '7 hours saved/week'
        },
        {
            icon: <Target size={32} />,
            title: 'Risk Detection',
            description: 'Identify project risks early with AI analysis of velocity, blockers, and dependency patterns.',
            time: '3 hours saved/week'
        }
    ]

    return (
        <section className={styles.featuresSection}>
            <div className='container'>
                <h2 className='text--center' style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    What You Can Build
                </h2>
                <p className='text--center' style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '3rem' }}>
                    Real use cases from engineering teams using AnswerAgent
                </p>
                <div className='row'>
                    {cases.map((useCase, idx) => (
                        <div key={idx} className='col col--4' style={{ marginBottom: '2rem' }}>
                            <div className={styles.featureCard} style={{ height: '100%' }}>
                                <div style={{ color: 'var(--ifm-color-primary)', marginBottom: '1rem' }}>{useCase.icon}</div>
                                <h3>{useCase.title}</h3>
                                <p style={{ marginBottom: '1rem' }}>{useCase.description}</p>
                                <div
                                    style={{
                                        background: 'var(--ifm-color-primary-lightest)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--ifm-color-primary-darkest)'
                                    }}
                                >
                                    ⏱️ {useCase.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function HowItWorks() {
    const steps = [
        {
            number: '1',
            title: 'Connect in 60 Seconds',
            description: "Get your Linear API key and paste it. That's it. You're ready to build."
        },
        {
            number: '2',
            title: 'Choose Your Workflow',
            description: 'Pick from pre-built automation templates or create custom AI agents with our visual builder.'
        },
        {
            number: '3',
            title: 'Watch Productivity Soar',
            description: 'Your AI agents start working immediately. Automate triage, planning, and reporting while you focus on shipping.'
        }
    ]

    return (
        <section className={styles.featuresSection} style={{ background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <h2 className='text--center' style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>
                    Get Started in 3 Easy Steps
                </h2>
                <div className='row'>
                    {steps.map((step, idx) => (
                        <div key={idx} className='col col--4'>
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'var(--ifm-color-primary)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        margin: '0 auto 1.5rem'
                                    }}
                                >
                                    {step.number}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{step.title}</h3>
                                <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <a
                        href='https://calendly.com/brad-theanswer/answeragent-intro'
                        className={clsx(styles.ctaButton, styles.ctaPrimary)}
                        style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                    >
                        <Sparkles size={20} style={{ marginRight: '0.5rem' }} />
                        See It In Action - Book a Demo
                    </a>
                </div>
            </div>
        </section>
    )
}

function FinalCTA() {
    return (
        <section
            className={styles.featuresSection}
            style={{
                background: 'linear-gradient(135deg, var(--ifm-color-primary-darkest) 0%, var(--ifm-color-primary-darker) 100%)',
                color: 'white',
                padding: '4rem 0'
            }}
        >
            <div className='container' style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>Ready to Supercharge Your Linear Workflow?</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Join engineering teams using AI to <strong>ship faster</strong>, <strong>work smarter</strong>, and{' '}
                    <strong>deliver better results</strong>.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                        href='https://calendly.com/brad-theanswer/answeragent-intro'
                        className={clsx(styles.ctaButton)}
                        style={{
                            fontSize: '1.2rem',
                            padding: '1rem 2rem',
                            background: 'white',
                            color: 'var(--ifm-color-primary)',
                            border: 'none'
                        }}
                    >
                        <Sparkles size={20} style={{ marginRight: '0.5rem' }} />
                        Book Your Demo Now
                    </a>
                    <a
                        href='/docs/integrations/linear'
                        className={clsx(styles.ctaButton)}
                        style={{
                            fontSize: '1.2rem',
                            padding: '1rem 2rem',
                            background: 'transparent',
                            color: 'white',
                            border: '2px solid white'
                        }}
                    >
                        <BookOpen size={20} style={{ marginRight: '0.5rem' }} />
                        Or Start With the Setup Guide
                    </a>
                </div>
                <p style={{ marginTop: '2rem', opacity: 0.8, fontSize: '1rem' }}>
                    ✓ No credit card required ✓ Setup in under 5 minutes ✓ Cancel anytime
                </p>
            </div>
        </section>
    )
}

export default function LinearIntegration() {
    const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Linear AI Agent Integration by AnswerAgentAI',
        applicationCategory: 'BusinessApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        description:
            'Transform your Linear project management with AI agents that automate issue triage, sprint planning, and project reporting. AI that actually works. Save 10+ hours per week. Setup in 5 minutes.',
        operatingSystem: 'Cloud',
        featureList: [
            'Automated issue triage and categorization',
            'AI-powered sprint planning and capacity analysis',
            'Automated project status reporting',
            'Team workload balancing and optimization',
            'Documentation generation from Linear data',
            'Project risk detection and analysis'
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '143'
        },
        provider: {
            '@type': 'Organization',
            name: 'AnswerAgentAI',
            url: 'https://theanswer.ai'
        }
    }

    return (
        <LayoutComponent
            title='Linear AI Agent Integration'
            description='Transform your Linear workflow with AI automation. Save 10+ hours per week on issue triage, sprint planning, and project reporting. AI that actually works. Setup in 5 minutes.'
        >
            <JsonLd data={jsonLdData} />
            <LinearHero />
            <ValueProps />
            <UseCases />
            <HowItWorks />
            <FinalCTA />
        </LayoutComponent>
    )
}
