import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import HeroCTA from '@site/src/components/HeroCTA'
import { GradientText } from '@site/src/components/Modern'
import { Database, Code2, BarChart3, ArrowRight } from 'lucide-react'

import styles from './index.module.css'

function HomepageHeader() {
    return (
        <header
            className='hero'
            style={{
                position: 'relative',
                minHeight: '70vh',
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%)'
            }}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.3 }}>
                <ThreeJsScene />
            </div>
            <div className='container' style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>Build AI Agents That Work.</h1>
                <h2 style={{ fontSize: '2.7rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                    <GradientText>Get Insights That Matter.</GradientText>
                </h2>
                <p className='hero__subtitle' style={{ fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto 3rem', opacity: 0.9 }}>
                    AnswerAgent connects your data, builds your agents, and delivers instant insights—all in one platform.
                </p>
                <HeroCTA
                    context={{
                        page: 'homepage',
                        section: 'hero'
                    }}
                />
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

function ThreePillarsSection() {
    return (
        <section className={styles.threePillarsSection}>
            <div className='container'>
                <h2 className={styles.sectionTitle}>Three Steps to AI-Powered Productivity</h2>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={styles.pillarCard}>
                            <div className={styles.pillarIcon}>
                                <Database size={64} strokeWidth={1.5} />
                            </div>
                            <h3 className={styles.pillarTitle}>Connect Your Data</h3>
                            <p className={styles.pillarDescription}>
                                Unified data lake with intelligent tagging and AI summarization. 20+ integrations, secure and compliant.
                            </p>
                            <a href='/data-engine' className={styles.pillarLink}>
                                Learn More <ArrowRight size={18} />
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.pillarCard}>
                            <div className={styles.pillarIcon}>
                                <Code2 size={64} strokeWidth={1.5} />
                            </div>
                            <h3 className={styles.pillarTitle}>Build Your Agents</h3>
                            <p className={styles.pillarDescription}>
                                Visual builder, code editor, templates. Create images and videos with AI. Deploy anywhere you want.
                            </p>
                            <a href='/agent-studio' className={styles.pillarLink}>
                                Explore Studio <ArrowRight size={18} />
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.pillarCard}>
                            <div className={styles.pillarIcon}>
                                <BarChart3 size={64} strokeWidth={1.5} />
                            </div>
                            <h3 className={styles.pillarTitle}>Get Instant Insights</h3>
                            <p className={styles.pillarDescription}>
                                Real-time dashboards, on-demand reports, and Chrome extension. Insights when you need them.
                            </p>
                            <a href='/intelligence-hub' className={styles.pillarLink}>
                                See Insights <ArrowRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function UseCasesPreviewSection() {
    return (
        <section className={styles.useCasesSection}>
            <div className='container'>
                <h2 className={styles.sectionTitle}>What can you build?</h2>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={styles.useCaseCard}>
                            <h3>Daily Briefing</h3>
                            <p>Get a comprehensive briefing from all your tools every morning—Salesforce, Jira, Slack, and more.</p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.useCaseCard}>
                            <h3>Automated Ticket Triage</h3>
                            <p>Automatically categorize, prioritize, and route support tickets based on content and context.</p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.useCaseCard}>
                            <h3>Real-Time OKR Dashboards</h3>
                            <p>Track OKRs across all your platforms with real-time updates and automated progress tracking.</p>
                        </div>
                    </div>
                </div>
                <div className={styles.useCasesCTA}>
                    <a href='/docs/use-cases' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
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
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div className={styles.pricingTeaserCard}>
                            <h2 className={styles.pricingTeaserTitle}>Simple Pricing</h2>
                            <div className={styles.pricingTeaserAmount}>
                                $500<span className={styles.pricingTeaserPeriod}>/month</span>
                            </div>
                            <p className={styles.pricingTeaserDescription}>Unlimited users, or self-host on your infrastructure</p>
                            <a href='/pricing' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                                View Pricing
                            </a>
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
                        <HeroCTA
                            context={{
                                page: 'homepage',
                                section: 'bottom-cta'
                            }}
                        />
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
                    <ThreePillarsSection />
                    <UseCasesPreviewSection />
                    <PricingTeaserSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
