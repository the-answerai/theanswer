import clsx from 'clsx'
import Layout from '@theme/Layout'
import HeroCTA from '@site/src/components/HeroCTA'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Code2, Globe, Zap, BookOpen, Github, MessageSquare, Rocket, Settings } from 'lucide-react'
import styles from './developers.module.css'

const LayoutComponent: any = Layout

function DevelopersHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Build on Open-Source You Trust</h1>
                <p className={styles.heroSubtitle}>
                    AnswerAgent is built on LangChain and Flowise—proven infrastructure, vibrant community.
                </p>
                <HeroCTA
                    context={{
                        page: 'developers',
                        section: 'hero'
                    }}
                />
            </div>
        </header>
    )
}

function WhyBuildSection() {
    return (
        <section className={styles.section}>
            <div className='container'>
                <h2 className={styles.sectionTitle}>Why Build on AnswerAgent?</h2>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={styles.featureCard}>
                            <Code2 size={48} className={styles.featureIcon} />
                            <h3>Open-Source Foundation</h3>
                            <p>Built on LangChain & Flowise. No vendor lock-in. Fork it if you want.</p>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.featureCard}>
                            <Globe size={48} className={styles.featureIcon} />
                            <h3>Deploy Anywhere</h3>
                            <p>Your infrastructure, your rules. Cloud, on-prem, or hybrid.</p>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.featureCard}>
                            <Settings size={48} className={styles.featureIcon} />
                            <h3>Extensible</h3>
                            <p>Build custom nodes, integrations, and tools. Contribute back to the community.</p>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.featureCard}>
                            <Zap size={48} className={styles.featureIcon} />
                            <h3>API-First</h3>
                            <p>RESTful APIs for everything. Embed agents anywhere.</p>
                        </div>
                    </div>
                    <div className='col col--6 col--offset-3'>
                        <div className={styles.featureCard}>
                            <MessageSquare size={48} className={styles.featureIcon} />
                            <h3>Active Community</h3>
                            <p>Join 10,000+ developers building on AnswerAgent.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function QuickStartSection() {
    return (
        <section className={styles.quickStartSection}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <h2 className={styles.sectionTitle}>Get Started in 5 Minutes</h2>
                        <div className={styles.stepsList}>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>1</div>
                                <div className={styles.stepContent}>
                                    <h3>Sign up for free account</h3>
                                    <p>Create your account and get instant access to Studio.</p>
                                </div>
                            </div>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>2</div>
                                <div className={styles.stepContent}>
                                    <h3>Clone starter template</h3>
                                    <p>Start with a pre-built agent template or build from scratch.</p>
                                </div>
                            </div>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>3</div>
                                <div className={styles.stepContent}>
                                    <h3>Customize your agent</h3>
                                    <p>Use the visual builder or code editor to customize your agent.</p>
                                </div>
                            </div>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>4</div>
                                <div className={styles.stepContent}>
                                    <h3>Deploy</h3>
                                    <p>Deploy to web widget, Slack bot, API, or your own infrastructure.</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.quickStartCTAs}>
                            <a href='https://studio.theanswer.ai' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                                Try Free Studio
                            </a>
                            <a href='/docs/developers' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                View Docs
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function ResourcesSection() {
    const resources = [
        {
            icon: BookOpen,
            title: 'Documentation',
            description: 'Complete guides, API reference, tutorials',
            link: '/docs/developers',
            linkText: 'View Docs'
        },
        {
            icon: Rocket,
            title: 'Quick Start Guide',
            description: 'Build your first agent in 10 minutes',
            link: '/docs/developers',
            linkText: 'Get Started'
        },
        {
            icon: Code2,
            title: 'API Reference',
            description: 'RESTful APIs for all platform features',
            link: '/docs/api',
            linkText: 'View API Docs'
        },
        {
            icon: Settings,
            title: 'Build Custom Nodes',
            description: 'Extend AnswerAgent with your own components',
            link: '/docs/developers',
            linkText: 'Building Guide'
        },
        {
            icon: Zap,
            title: 'Join the Sprint',
            description: 'Contribute to open-source development',
            link: '/docs/developers',
            linkText: 'Contribution Guide'
        },
        {
            icon: MessageSquare,
            title: 'Community Discord',
            description: 'Get help, share ideas, collaborate',
            link: 'https://discord.gg/X54ywt8pzj',
            linkText: 'Join Discord',
            external: true
        },
        {
            icon: Github,
            title: 'GitHub',
            description: 'View source, report issues, contribute',
            link: 'https://github.com/the-answerai',
            linkText: 'View on GitHub',
            external: true
        }
    ]

    return (
        <section className={styles.resourcesSection}>
            <div className='container'>
                <h2 className={styles.sectionTitle}>Developer Resources</h2>
                <div className='row'>
                    {resources.map((resource, index) => {
                        const Icon = resource.icon
                        return (
                            <div key={index} className='col col--4'>
                                <div className={styles.resourceCard}>
                                    <Icon size={32} className={styles.resourceIcon} />
                                    <h3>{resource.title}</h3>
                                    <p>{resource.description}</p>
                                    <a
                                        href={resource.link}
                                        className={styles.resourceLink}
                                        target={resource.external ? '_blank' : undefined}
                                        rel={resource.external ? 'noopener noreferrer' : undefined}
                                    >
                                        {resource.linkText} →
                                    </a>
                                </div>
                            </div>
                        )
                    })}
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
                        <h2 className={styles.bottomCTATitle}>Ready to build?</h2>
                        <HeroCTA
                            context={{
                                page: 'developers',
                                section: 'bottom-cta'
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function Developers(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Developers - AnswerAgent'
                description='Build on open-source you trust. AnswerAgent is built on LangChain and Flowise.'
            >
                <DevelopersHero />
                <main>
                    <WhyBuildSection />
                    <QuickStartSection />
                    <ResourcesSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
