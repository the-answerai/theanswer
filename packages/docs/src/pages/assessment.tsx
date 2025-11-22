import clsx from 'clsx'
import Link from '@docusaurus/Link'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import ElevenLabsInlineWidget from '@site/src/components/ElevenLabsInlineWidget'
import { Phone, MessageSquare, Sparkles } from 'lucide-react'

import styles from './assessment.module.css'

const LayoutComponent: any = Layout

function AssessmentHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Start Your AI Assessment</h1>
                <p className={styles.heroSubtitle}>Get a custom recommendation for your team in minutes</p>
            </div>
        </header>
    )
}

function AssessmentOptionsSection() {
    return (
        <section className={styles.optionsSection}>
            <div className='container'>
                <h2 className='text--center' style={{ marginBottom: '1rem' }}>
                    Choose Your Assessment Method
                </h2>
                <p className='text--center' style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '4rem' }}>
                    Pick the way you&apos;d like to share your needs
                </p>

                <div className='row'>
                    {/* Voice Assessment Option */}
                    <div className='col col--6'>
                        <div className={styles.optionCard}>
                            <div className={styles.optionIcon}>
                                <Phone size={48} />
                            </div>
                            <h3>Voice Assessment</h3>
                            <p>
                                Have a natural conversation with our AI assistant. Just speak your answers, and we&apos;ll guide you through
                                the questions.
                            </p>

                            <ul className={styles.featuresList}>
                                <li>⏱️ ~5-10 minutes</li>
                                <li>🎤 Natural conversation flow</li>
                                <li>💬 Real-time clarifications</li>
                                <li>✨ Powered by ElevenLabs</li>
                            </ul>

                            <div className={styles.optionCTA}>
                                <ElevenLabsInlineWidget
                                    agentId='agent_01k03gnw7xe11btz2vprkf7ay5'
                                    text='Start Voice Assessment'
                                    variant='cta'
                                    showStatus={true}
                                />
                            </div>

                            <p className={styles.optionNote}>Best for: Those who prefer speaking over typing</p>
                        </div>
                    </div>

                    {/* Chat Assessment Option */}
                    <div className='col col--6'>
                        <div className={styles.optionCard}>
                            <div className={styles.optionIcon}>
                                <MessageSquare size={48} />
                            </div>
                            <h3>Chat Assessment</h3>
                            <p>Type your answers in a guided chat interface. Take your time and edit your responses as needed.</p>

                            <ul className={styles.featuresList}>
                                <li>⏱️ ~5-10 minutes</li>
                                <li>⌨️ Type at your own pace</li>
                                <li>📝 Edit answers anytime</li>
                                <li>🤖 AI-powered guidance</li>
                            </ul>

                            <div className={styles.optionCTA}>
                                <Link to='/ai-workshops' className='button button--primary button--lg'>
                                    Start Chat Assessment
                                </Link>
                            </div>

                            <p className={styles.optionNote}>Best for: Those who prefer writing and reviewing</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function WhatWeAskSection() {
    const questions = [
        {
            category: 'Current Setup',
            questions: [
                'What data sources do you currently use?',
                'How many team members will use AnswerAgent?',
                'What tools do you integrate with daily?'
            ]
        },
        {
            category: 'Use Cases',
            questions: [
                'What workflows take up most of your time?',
                'What reports or dashboards do you need?',
                'What tasks would you like to automate?'
            ]
        },
        {
            category: 'Requirements',
            questions: [
                'Do you have compliance requirements? (SOX, FINRA, HIPAA)',
                'What is your preferred deployment? (Cloud, On-Prem, Hybrid)',
                'What is your timeline for implementation?'
            ]
        }
    ]

    return (
        <section className={styles.whatWeAskSection}>
            <div className='container'>
                <h2 className='text--center' style={{ marginBottom: '3rem' }}>
                    What We&apos;ll Ask
                </h2>
                <div className='row'>
                    {questions.map((section, idx) => (
                        <div key={idx} className='col col--4'>
                            <div className={styles.questionCard}>
                                <h3>{section.category}</h3>
                                <ul>
                                    {section.questions.map((q, qIdx) => (
                                        <li key={qIdx}>{q}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
                <p className='text--center' style={{ marginTop: '2rem', opacity: 0.8 }}>
                    Don&apos;t worry—the questions adapt based on your answers. We&apos;ll only ask what&apos;s relevant to you.
                </p>
            </div>
        </section>
    )
}

function WhatYouGetSection() {
    return (
        <section className={styles.whatYouGetSection}>
            <div className='container'>
                <h2 className='text--center' style={{ marginBottom: '1.5rem', fontSize: '2.5rem' }}>
                    What You&apos;ll Get
                </h2>
                <p className='lead text--center' style={{ marginBottom: '4rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto 4rem' }}>
                    A detailed, customized proposal unique to your business—emailed to you within 24 hours
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>
                                <Sparkles size={32} />
                            </div>
                            <h3>Custom Recommendation</h3>
                            <p>
                                Personalized setup guide tailored to your industry, team size, and specific use cases. Not a generic
                                template—this is built for YOU.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                                <li>✓ Industry-specific agent configurations</li>
                                <li>✓ Recommended integrations for your stack</li>
                                <li>✓ ROI projections based on your data</li>
                            </ul>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>
                                <Sparkles size={32} />
                            </div>
                            <h3>Implementation Plan</h3>
                            <p>
                                Step-by-step roadmap with realistic timelines, integration priorities, and team training recommendations.
                                Know exactly what to expect before you commit.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                                <li>✓ Phased rollout strategy (pilot → full deployment)</li>
                                <li>✓ Resource requirements and timeline estimates</li>
                                <li>✓ Risk mitigation and security considerations</li>
                            </ul>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>
                                <Sparkles size={32} />
                            </div>
                            <h3>Personalized Demo Invitation</h3>
                            <p>
                                Schedule a live demo where we&apos;ll show AnswerAgent configured for your specific use cases. See your data
                                in action (securely sandboxed).
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                                <li>✓ Live walkthrough with your use cases</li>
                                <li>✓ Q&A with technical experts</li>
                                <li>✓ Optional: POC scoping session</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: '3rem',
                        padding: '2rem',
                        background: 'rgba(102, 126, 234, 0.1)',
                        border: '2px solid rgba(102, 126, 234, 0.3)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}
                >
                    <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                        📧 Delivered to your inbox within 24 hours • No sales pressure • 100% customized
                    </p>
                </div>
            </div>
        </section>
    )
}

function BottomCTASection() {
    return (
        <section className={styles.bottomCTASection}>
            <div className='container text--center'>
                <h2 style={{ marginBottom: '1rem' }}>Not ready for an assessment?</h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
                    That&apos;s okay! Schedule a quick demo or explore our documentation first.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                        href='https://calendly.com/lastrev/answeragent-demo'
                        className='button button--primary button--lg'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        Schedule Demo
                    </a>
                    <a href='/how-it-works' className='button button--secondary button--lg'>
                        Learn How It Works
                    </a>
                    <a href='/pricing' className='button button--secondary button--lg'>
                        View Pricing
                    </a>
                </div>
            </div>
        </section>
    )
}

export default function Assessment(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Start Your Assessment'
                description='Get a custom recommendation for your team. Choose voice or chat assessment.'
            >
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'AnswerAgent Assessment',
                        description: 'Get a personalized recommendation for implementing AnswerAgent in your organization.'
                    }}
                />
                <AssessmentHero />
                <main>
                    <AssessmentOptionsSection />
                    <WhatWeAskSection />
                    <WhatYouGetSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
