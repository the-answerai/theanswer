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
    GitPullRequest,
    GitBranch,
    FileCode,
    MessageSquare,
    Shield,
    Workflow
} from 'lucide-react'

import styles from '../index.module.css'

const LayoutComponent: any = Layout

const LOGOKIT_TOKEN = 'pk_fr8710fea017bdf10b13fe'

function GitHubHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <div style={{ marginBottom: '2rem' }}>
                    <img
                        src={`https://img.logokit.com/github.com?token=${LOGOKIT_TOKEN}`}
                        alt='GitHub Logo'
                        height={80}
                        style={{ marginBottom: '1rem' }}
                    />
                </div>
                <h1 className={styles.heroTitle}>GitHub AI Agent Integration</h1>
                <p className={styles.heroSubtitle} style={{ fontSize: '1.5rem', maxWidth: '900px', margin: '0 auto 2rem' }}>
                    Transform your development workflow with intelligent GitHub automation.
                    <strong> AI that actually works.</strong> Set up in minutes, not hours.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
                    <CheckCircle size={24} color='#10b981' />
                    <span style={{ fontSize: '1.2rem' }}>Save 15+ hours per week</span>
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
                        href='/docs/integrations/github'
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
                'Connect your GitHub account in under 5 minutes. Just generate a Personal Access Token and start automating. No complex configuration required.'
        },
        {
            icon: <Clock size={48} strokeWidth={1.5} />,
            title: 'Save 15+ Hours Weekly',
            description:
                'Automate code reviews, issue triage, documentation generation, and PR management. Let AI handle repetitive tasks while you focus on building.'
        },
        {
            icon: <TrendingUp size={48} strokeWidth={1.5} />,
            title: 'Be Better at Your Job',
            description:
                'Catch bugs before humans review. Generate consistent documentation. Prioritize issues intelligently. Ship higher quality code faster than ever.'
        }
    ]

    return (
        <section className={styles.featuresSection} style={{ background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <h2 className='text--center' style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Why Developers Choose AnswerAgent for GitHub
                </h2>
                <p
                    className='text--center'
                    style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem' }}
                >
                    <strong>AI that actually works.</strong> Built by developers, for developers.
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
            icon: <GitPullRequest size={32} />,
            title: 'Automated Code Reviews',
            description: 'AI reviews every PR for security issues, performance problems, and style violations before human review.',
            time: '8 hours saved/week'
        },
        {
            icon: <MessageSquare size={32} />,
            title: 'Intelligent Issue Triage',
            description: 'Automatically categorize, label, and assign issues. Add helpful responses asking for clarification.',
            time: '5 hours saved/week'
        },
        {
            icon: <FileCode size={32} />,
            title: 'Auto-Generated Documentation',
            description: 'Keep README, API docs, and wikis up-to-date automatically from your codebase comments and structure.',
            time: '10 hours saved/week'
        },
        {
            icon: <Workflow size={32} />,
            title: 'Release Note Generation',
            description: 'Generate professional release notes from commits and PRs. Never write changelogs manually again.',
            time: '3 hours saved/week'
        },
        {
            icon: <Shield size={32} />,
            title: 'Security Scanning',
            description: 'Scan for vulnerabilities, hardcoded secrets, and security anti-patterns in every commit.',
            time: '6 hours saved/week'
        },
        {
            icon: <GitBranch size={32} />,
            title: 'Dependency Updates',
            description: 'Automatically create PRs for dependency updates with compatibility analysis and test results.',
            time: '4 hours saved/week'
        }
    ]

    return (
        <section className={styles.featuresSection}>
            <div className='container'>
                <h2 className='text--center' style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    What You Can Automate
                </h2>
                <p className='text--center' style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '3rem' }}>
                    Real use cases from real development teams
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
            title: 'Generate GitHub Token',
            description: 'Create a Personal Access Token in GitHub settings. Takes 60 seconds. Paste it into AnswerAgent.'
        },
        {
            number: '2',
            title: 'Choose Your Workflows',
            description: 'Pick from pre-built automation templates or create custom workflows with our visual builder.'
        },
        {
            number: '3',
            title: 'Watch AI Work',
            description: 'Your agents start reviewing code, triaging issues, and generating docs immediately. Customize as you go.'
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
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>Ready to Transform Your GitHub Workflow?</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Join thousands of developers using AI agents to <strong>ship faster</strong>, <strong>code smarter</strong>, and{' '}
                    <strong>build better software</strong>.
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
                        href='/docs/integrations/github'
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

export default function GitHubIntegration() {
    const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'GitHub AI Agent Integration by AnswerAgentAI',
        applicationCategory: 'DeveloperApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        description:
            'Transform your GitHub workflow with AI agents that automate code reviews, issue triage, documentation generation, and PR management. AI that actually works. Save 15+ hours per week. Setup in under 5 minutes.',
        operatingSystem: 'Cloud',
        featureList: [
            'Automated code review and security scanning',
            'Intelligent issue triage and labeling',
            'Auto-generated documentation from code',
            'Release note generation from commits and PRs',
            'Dependency update management',
            'Pull request automation and management'
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '243'
        },
        provider: {
            '@type': 'Organization',
            name: 'AnswerAgentAI',
            url: 'https://theanswer.ai'
        }
    }

    return (
        <LayoutComponent
            title='GitHub AI Agent Integration'
            description='Transform your GitHub workflow with AI agents. Save 15+ hours per week with automated code reviews, issue triage, and documentation generation. AI that actually works. Setup in 5 minutes.'
        >
            <JsonLd data={jsonLdData} />
            <GitHubHero />
            <ValueProps />
            <UseCases />
            <HowItWorks />
            <FinalCTA />
        </LayoutComponent>
    )
}
