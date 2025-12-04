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
    Database,
    Globe,
    FileText,
    MessageSquare,
    Settings,
    Workflow
} from 'lucide-react'

import styles from '../index.module.css'

const LayoutComponent: any = Layout

const LOGOKIT_TOKEN = 'pk_fr8710fea017bdf10b13fe'

function ContentfulHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <div style={{ marginBottom: '2rem' }}>
                    <img
                        src={`https://img.logokit.com/contentful.com?token=${LOGOKIT_TOKEN}`}
                        alt='Contentful Logo'
                        height={80}
                        style={{ marginBottom: '1rem' }}
                    />
                </div>
                <h1 className={styles.heroTitle}>Contentful AI Agent Integration</h1>
                <p className={styles.heroSubtitle} style={{ fontSize: '1.5rem', maxWidth: '900px', margin: '0 auto 2rem' }}>
                    Transform your Contentful CMS into an intelligent content powerhouse.
                    <strong> AI that actually works.</strong> Set up in minutes, not days.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
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
                        href='/docs/integrations/contentful'
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
                'Connect your Contentful account in under 5 minutes. No complex configuration, no technical expertise required. Just paste your API key and start building.'
        },
        {
            icon: <Clock size={48} strokeWidth={1.5} />,
            title: 'Save 10+ Hours Weekly',
            description:
                'Automate repetitive content tasks. Let AI handle content updates, translations, SEO optimization, and multi-channel distribution while you focus on strategy.'
        },
        {
            icon: <TrendingUp size={48} strokeWidth={1.5} />,
            title: 'Be Better at Your Job',
            description:
                'Make smarter decisions with AI-powered content insights. Get suggestions, spot trends, and create higher quality content faster than ever before.'
        }
    ]

    return (
        <section className={styles.featuresSection} style={{ background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <h2 className='text--center' style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Why Teams Choose AnswerAgent for Contentful
                </h2>
                <p
                    className='text--center'
                    style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem' }}
                >
                    <strong>AI that actually works.</strong> Built by content teams, for content teams.
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
            icon: <MessageSquare size={32} />,
            title: 'AI-Powered Support',
            description: 'Turn your help docs into an intelligent chatbot that answers customer questions 24/7.',
            time: '15 hours saved/week'
        },
        {
            icon: <Globe size={32} />,
            title: 'Automated Localization',
            description: 'Translate content to 100+ languages instantly. Maintain brand voice across markets.',
            time: '20 hours saved/week'
        },
        {
            icon: <FileText size={32} />,
            title: 'SEO Optimization',
            description: 'Auto-optimize meta descriptions, headings, and content structure for search engines.',
            time: '8 hours saved/week'
        },
        {
            icon: <Workflow size={32} />,
            title: 'Multi-Channel Publishing',
            description: 'Automatically adapt content for social media, email, and web from a single source.',
            time: '12 hours saved/week'
        },
        {
            icon: <Database size={32} />,
            title: 'Content Analysis',
            description: 'Get AI insights on content gaps, trending topics, and optimization opportunities.',
            time: '6 hours saved/week'
        },
        {
            icon: <Settings size={32} />,
            title: 'Smart Workflows',
            description: 'Automate content reviews, approvals, and publishing with intelligent agents.',
            time: '10 hours saved/week'
        }
    ]

    return (
        <section className={styles.featuresSection}>
            <div className='container'>
                <h2 className='text--center' style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    What You Can Build
                </h2>
                <p className='text--center' style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '3rem' }}>
                    Real use cases from real teams
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
            description: "Add your Contentful API credentials. That's it. Seriously."
        },
        {
            number: '2',
            title: 'Choose Your AI Workflow',
            description: 'Pick from pre-built templates or create custom workflows with our visual builder.'
        },
        {
            number: '3',
            title: 'Watch the Magic Happen',
            description: 'Your AI agents start working immediately. Automate content tasks while you focus on strategy.'
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
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>Ready to Transform Your Contentful Workflow?</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Join hundreds of teams using AI agents to <strong>save time</strong>, <strong>work smarter</strong>, and{' '}
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
                        href='/docs/integrations/contentful'
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

export default function ContentfulIntegration() {
    const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Contentful AI Agent Integration by AnswerAgentAI',
        applicationCategory: 'BusinessApplication',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        description:
            'Transform your Contentful CMS with AI agents that automate content tasks, save 10+ hours per week, and help you be better at your job. AI that actually works. Setup in under 5 minutes.',
        operatingSystem: 'Cloud',
        featureList: [
            'AI-powered content automation',
            'Automated content translation and localization',
            'SEO optimization and analysis',
            'Multi-channel content distribution',
            'Intelligent chatbots powered by CMS content',
            'Content workflow automation'
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '127'
        },
        provider: {
            '@type': 'Organization',
            name: 'AnswerAgentAI',
            url: 'https://theanswer.ai'
        }
    }

    return (
        <LayoutComponent
            title='Contentful AI Agent Integration'
            description='Transform your Contentful CMS with AI agents. Save 10+ hours per week, automate content tasks, and be better at your job. AI that actually works. Setup in 5 minutes.'
        >
            <JsonLd data={jsonLdData} />
            <ContentfulHero />
            <ValueProps />
            <UseCases />
            <HowItWorks />
            <FinalCTA />
        </LayoutComponent>
    )
}
