import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Code2, Rocket, MessageSquare, Globe, Target, Building2, Lightbulb, Key, Check, BarChart3 } from 'lucide-react'

import styles from './index.module.css'

function HomepageHeader() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <img src='img/answerai-logo-600-wide-white.png' alt='AnswerAgentAI Logo' className={styles.heroLogo} />
                <h1 className={styles.heroTitle}>The AI Agent Orchestration Studio</h1>
                <p className={styles.heroSubtitle}>
                    AI is fragmented, risky, and slow to deploy. AnswerAgent is one platform to design, evaluate, and run agents securely
                    across your business.
                </p>
                <div className={styles.heroCTAs}>
                    <a href='https://calendly.com/lastrev/answeragent-demo' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                        Schedule a Demo
                    </a>
                    <div className={styles.secondaryLinks}>
                        <a
                            href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim'
                            target='_blank'
                            rel='noreferrer'
                            className={styles.secondaryLink}
                        >
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' className={styles.chromeIcon}>
                                <path d='M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm6.865 2.29a5.454 5.454 0 0 1 6.865 2.29l5.346-9.26A11.944 11.944 0 0 0 12 0v6.545a5.454 5.454 0 0 1 5.454 5.455c0 3.012-2.443 5.455-5.454 5.455s-5.454-2.443-5.454-5.455c0-1.513.616-2.88 1.612-3.865z' />
                            </svg>
                            Download Chrome Extension
                        </a>
                        <a href='/developers/' className={styles.secondaryLink}>
                            <Code2 size={18} className={styles.linkIcon} />
                            Call for Developers
                        </a>
                    </div>
                </div>
            </div>
        </header>
    )
}

const LayoutComponent: any = Layout

function _MissionSection() {
    return (
        <section className={styles.missionSection}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--6'>
                        <h2>The Problem We Face</h2>
                        <p>
                            We live in a world where power over AI is centralized—controlled by corporations, governments, and unelected
                            technocrats. These entities harvest our data, profit from our creativity, and shape our digital reality. The
                            most powerful technology ever created is being used not to uplift, but to manipulate. <br />
                            <br />
                            Our mission is to create a decentralized, open, and creative future where individuals can own their digital
                            identity, run autonomous agents, and share, monetize, or protect their data as they choose. We&apos;re just
                            getting started, will you join us?
                        </p>
                        <div style={{ marginTop: '2rem' }}>
                            <a href='/blog/what-is-the-answer-ai' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                                Read Our Manifesto
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.videoContainer}>
                            <iframe
                                width='100%'
                                height='315'
                                src='https://www.youtube.com/embed/2HVcHMaaMM0'
                                title='AnswerAgentAI Vision'
                                frameBorder='0'
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                allowFullScreen
                                className={styles.youtubeVideo}
                            ></iframe>
                        </div>
                    </div>
                </div>
                <div className={styles.beliefsSection}>
                    <h2>Our Commitment to AI Independence</h2>

                    {/* Pyramid Container */}
                    <div className={styles.pyramidContainer}>
                        <div className={styles.commandmentsGrid}>
                            <div className={styles.commandmentCard}>
                                <div className={styles.commandmentNumber}>I</div>
                                <div className={styles.commandmentTitle}>Human Autonomy Is Sacred</div>
                                <div className={styles.commandmentDescription}>
                                    Every individual should maintain sovereignty over their digital identity, data, and AI interactions
                                    without coercion or manipulation by centralized authorities.
                                </div>
                            </div>

                            <div className={styles.commandmentCard}>
                                <div className={styles.commandmentNumber}>II</div>
                                <div className={styles.commandmentTitle}>Technology Must Serve Individual</div>
                                <div className={styles.commandmentDescription}>
                                    Technology should amplify human potential rather than extract value from users, offering tools that
                                    empower individual agency.
                                </div>
                            </div>

                            <div className={styles.commandmentCard}>
                                <div className={styles.commandmentNumber}>III</div>
                                <div className={styles.commandmentTitle}>Creativity Is Sovereign</div>
                                <div className={styles.commandmentDescription}>
                                    Human creativity and intellectual contribution should be recognized, protected, and fairly compensated
                                    in the age of AI.
                                </div>
                            </div>

                            <div className={styles.commandmentCard}>
                                <div className={styles.commandmentNumber}>IV</div>
                                <div className={styles.commandmentTitle}>Privacy Is a Fundamental Right</div>
                                <div className={styles.commandmentDescription}>
                                    Personal data and digital interactions should remain private by default, with users maintaining full
                                    control over their information.
                                </div>
                            </div>

                            <div className={styles.commandmentCard}>
                                <div className={styles.commandmentNumber}>V</div>
                                <div className={styles.commandmentTitle}>Decentralization Prevents Monopolies</div>
                                <div className={styles.commandmentDescription}>
                                    Power should be distributed across networks rather than concentrated in centralized authorities and
                                    platforms.
                                </div>
                            </div>

                            <div className={styles.commandmentCard}>
                                <div className={styles.commandmentNumber}>VI</div>
                                <div className={styles.commandmentTitle}>Ethical AI Development</div>
                                <div className={styles.commandmentDescription}>
                                    AI development should prioritize beneficial outcomes for humanity, transparency in decision-making, and
                                    alignment with human values.
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.commandmentCard} ${styles.commandmentCardFull}`}>
                            <div className={styles.commandmentNumber}>VII</div>
                            <div className={styles.commandmentTitle}>Community Owns the Future</div>
                            <div className={styles.commandmentDescription}>
                                A future worth living in depends on systems that are open, forkable, transparent, and global—not platforms
                                locked inside Silicon Valley monopolies.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function FeaturesSection() {
    return (
        <section className={styles.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>The complete AI Agent solution</h2>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <Rocket size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>Agents</h3>
                                <p>
                                    Extend the power of AnswerAgent with a growing ecosystem of applications. Integrate AI seamlessly into
                                    your workflows and daily tasks.
                                </p>
                                <a href='/apps' className={styles.featureCardCTA}>
                                    Explore Agents →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <MessageSquare size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>Chat</h3>
                                <p>
                                    Engage with your AI agents naturally through a powerful chat interface. Get instant answers, automate
                                    tasks, and streamline communication.
                                </p>
                                <a href='/chat' className={styles.featureCardCTA}>
                                    Learn About Chat →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <Globe size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>Browser Sidekick</h3>
                                <p>
                                    Bring AnswerAgent directly into your browser. Access AI capabilities, automate web tasks, and enhance
                                    your online experience with ease.
                                </p>
                                <a href='/browser-sidekick' className={styles.featureCardCTA}>
                                    Learn About Sidekick →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <Target size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>Sidekick Studio</h3>
                                <p>
                                    Design, deploy, and manage your AI agent workforce with an intuitive visual interface. Build powerful,
                                    customizable AI agents without coding skills.
                                </p>
                                <a href='/sidekick-studio' className={styles.featureCardCTA}>
                                    Try Studio →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <Lightbulb size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>Deep Research</h3>
                                <p>
                                    Run multi-step, source-grounded research with citations and traceable reasoning. Turn complex topics
                                    into actionable insights.
                                </p>
                                <a href='https://calendly.com/lastrev/answeragent-demo' className={styles.featureCardCTA}>
                                    Schedule a Demo →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <Check size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>Easy Evals</h3>
                                <p>
                                    Measure quality with lightweight evaluations. Track accuracy, safety, and style across prompts and
                                    models—without the complexity.
                                </p>
                                <a href='https://calendly.com/lastrev/answeragent-demo' className={styles.featureCardCTA}>
                                    Schedule a Demo →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <Key size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>JLinc Immutable Tracking</h3>
                                <p>Cryptographically signed lineage and consent. Tamper‑evident data trails for compliance and trust.</p>
                                <a href='https://calendly.com/lastrev/answeragent-demo' className={styles.featureCardCTA}>
                                    Schedule a Demo →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>
                                <BarChart3 size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3>On‑Demand Dashboards & Reports</h3>
                                <p>Real‑time dashboards across all your data. Track agents, prompts, and costs in one place.</p>
                                <a href='https://calendly.com/lastrev/answeragent-demo' className={styles.featureCardCTA}>
                                    Schedule a Demo →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function PricingSection() {
    return (
        <section className={styles.pricingSection}>
            <div className='container'>
                <div className='text--center' style={{ marginBottom: '3rem' }}>
                    <h2 className='text--center'>Choose Your Deployment</h2>
                    <p className='text--center' style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '0' }}>
                        Flexible options for teams—from secure managed cloud to fully self-hosted
                    </p>
                </div>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={clsx(styles.pricingCard, styles.commandment)}>
                            <div className={styles.pricingIcon}>
                                <Globe size={48} strokeWidth={1.5} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Business Cloud</h3>
                                <p style={{ marginBottom: '1.5rem', flex: 1 }}>
                                    Secure, organization-ready managed cloud with single-tenant isolation, SSO, and governance. Fastest path
                                    to value with zero maintenance.
                                </p>
                                <div style={{ marginTop: 'auto' }}>
                                    <a
                                        href='https://calendly.com/lastrev/answeragent-demo'
                                        className={clsx(styles.ctaButton, styles.ctaPrimary)}
                                    >
                                        Schedule a Demo
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.pricingCard, styles.commandment)}>
                            <div className={styles.pricingIcon}>
                                <Building2 size={48} strokeWidth={1.5} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>On‑Prem Enterprise</h3>
                                <p style={{ marginBottom: '1.5rem', flex: 1 }}>
                                    Fully self-hosted deployment with enterprise licensing, advanced security controls, and custom
                                    integrations—run entirely within your infrastructure.
                                </p>
                                <div style={{ marginTop: 'auto' }}>
                                    <a
                                        href='https://calendly.com/lastrev/answeragent-demo'
                                        className={clsx(styles.ctaButton, styles.ctaPrimary)}
                                    >
                                        Schedule a Demo
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function _MacAppTeaser() {
    return (
        <section className={styles.macAppTeaserSection}>
            <div className='container text--center'>
                <h2>Mac App Coming Soon!</h2>
                <img src='img/mac-app-icon.svg' alt='Mac App Icon' className={styles.macAppIcon} />
                <p>
                    Experience the full power of AnswerAgent natively on your Mac. A decentralized ecosystem where individuals can own their
                    digital identity, run autonomous agents, and share, monetize, or protect their data as they choose.
                </p>
            </div>
        </section>
    )
}

export default function Home(): JSX.Element {
    const { siteConfig: _siteConfig } = useDocusaurusContext()
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title={'Answer Agent AI: Build your AI-Agent Workforce'}
                description='Orchestrate secure AI agents across your business.'
            >
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: 'AnswerAgent',
                        url: 'https://answeragent.ai',
                        description: 'AnswerAgent: AI agents, chat, and workflows for teams.'
                    }}
                />
                <HomepageHeader />
                <main>
                    <section className={styles.missionSection}>
                        <div className='container'>
                            <div className='row'>
                                <div className='col col--8 col--offset-2'>
                                    <h2 className='text--center'>What is an AI Orchestration Studio?</h2>
                                    <p style={{ fontSize: '1.1rem', opacity: 0.95 }}>
                                        It’s where teams design, evaluate, and run AI agents—end to end. Build <strong>Agents</strong> that
                                        automate real work, collaborate in <strong>Chat</strong>, browse with <strong>Sidekick</strong>, and
                                        manage at scale in <strong>Sidekick Studio</strong>. Go deeper with <strong>Deep Research</strong>,
                                        prove quality with <strong>Easy Evals</strong>, track lineage with
                                        <strong> JLinc Immutable Tracking</strong>, and see everything clearly with
                                        <strong> On‑Demand Dashboards & Reports</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <FeaturesSection />
                    {/* <MissionSection /> */}
                    <PricingSection />
                </main>
            </LayoutComponent>
        </div>
    )
}
