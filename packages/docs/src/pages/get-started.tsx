import clsx from 'clsx'
import Layout from '@theme/Layout'
import HeroCTA from '@site/src/components/HeroCTA'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Zap, Calculator, Calendar, MessageSquare, ArrowRight } from 'lucide-react'
import styles from './get-started.module.css'

const LayoutComponent: any = Layout

function GetStartedHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>How would you like to get started?</h1>
                <p className={styles.heroSubtitle}>Choose the path that works best for you</p>
            </div>
        </header>
    )
}

function GetStartedOptions() {
    const options = [
        {
            icon: Zap,
            title: 'Get AI Assessment',
            description: 'Get a customized proposal for your business, emailed within 24 hours.',
            link: '/assessment',
            linkText: 'Start Assessment →',
            external: false,
            color: 'primary'
        },
        {
            icon: Calculator,
            title: 'Start AI Assessment',
            description: 'Get personalized insights on how AnswerAgent can transform your team.',
            link: '/assessment',
            linkText: 'Start Assessment →',
            external: false,
            color: 'secondary'
        },
        {
            icon: Calendar,
            title: 'Schedule Demo',
            description: 'Talk to our team (30 minutes). See AnswerAgent in action.',
            link: 'https://calendly.com/brad-theanswer/answeragent-intro',
            linkText: 'Schedule Demo →',
            external: true,
            color: 'primary'
        },
        {
            icon: MessageSquare,
            title: 'Start Assessment',
            description: 'Get custom recommendations based on your needs.',
            link: '/get-started#assessment',
            linkText: 'Start Assessment →',
            external: false,
            color: 'secondary'
        }
    ]

    return (
        <section className={styles.optionsSection}>
            <div className='container'>
                <div className='row'>
                    {options.map((option, index) => {
                        const Icon = option.icon
                        return (
                            <div key={index} className='col col--6'>
                                <a
                                    href={option.link}
                                    className={clsx(
                                        styles.optionCard,
                                        option.color === 'primary' ? styles.optionCardPrimary : styles.optionCardSecondary
                                    )}
                                    target={option.external ? '_blank' : undefined}
                                    rel={option.external ? 'noopener noreferrer' : undefined}
                                >
                                    <div className={styles.optionIcon}>
                                        <Icon size={48} strokeWidth={1.5} />
                                    </div>
                                    <h3 className={styles.optionTitle}>{option.title}</h3>
                                    <p className={styles.optionDescription}>{option.description}</p>
                                    <span className={styles.optionLink}>
                                        {option.linkText}
                                        <ArrowRight size={20} className={styles.optionArrow} />
                                    </span>
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

function ROICalculatorSection() {
    return (
        <section className={styles.roiSection} id='roi'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <h2 className={styles.sectionTitle}>Get Your AI Assessment</h2>
                        <p className={styles.sectionDescription}>
                            Do you really consider this your job? Take our AI Assessment to discover how much time your team spends on
                            administrative work that could be automated.
                        </p>
                        <div className={styles.roiCard}>
                            <div className={styles.roiPlaceholder}>
                                <Calculator size={64} className={styles.roiIcon} />
                                <p>AI Assessment Available Now</p>
                                <p className={styles.roiPlaceholderSubtext}>
                                    Chat with our AI to discover how AnswerAgent can save your team time and boost productivity.
                                </p>
                                <a href='/assessment' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                                    Start Assessment
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function AssessmentSection() {
    return (
        <section className={styles.assessmentSection} id='assessment'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <h2 className={styles.sectionTitle}>Start Your AI Assessment</h2>
                        <p className={styles.sectionDescription}>
                            Get custom recommendations based on your data sources, team size, use cases, and compliance requirements.
                        </p>
                        <div className={styles.assessmentCard}>
                            <div className={styles.assessmentOptions}>
                                <div className={styles.assessmentOption}>
                                    <h3>Voice Assessment</h3>
                                    <p>Have a conversation with our AI agent to share your needs.</p>
                                    <HeroCTA
                                        showScheduleDemo={false}
                                        showAskAlpha={false}
                                        showAssessment={true}
                                        assessmentText='Start Voice Assessment'
                                        context={{
                                            page: 'get-started',
                                            section: 'assessment',
                                            type: 'voice'
                                        }}
                                    />
                                </div>
                                <div className={styles.assessmentDivider}>or</div>
                                <div className={styles.assessmentOption}>
                                    <h3>Chat Assessment</h3>
                                    <p>Answer a few questions via chat to get personalized recommendations.</p>
                                    <HeroCTA
                                        showScheduleDemo={false}
                                        showAskAlpha={false}
                                        showAssessment={false}
                                        context={{
                                            page: 'get-started',
                                            section: 'assessment',
                                            type: 'chat'
                                        }}
                                    />
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
                        <h2 className={styles.bottomCTATitle}>Still not sure where to start?</h2>
                        <p className={styles.bottomCTADescription}>Schedule a demo and we&apos;ll help you find the best path forward.</p>
                        <HeroCTA
                            context={{
                                page: 'get-started',
                                section: 'bottom-cta'
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function GetStarted(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Get Started - AnswerAgent'
                description='Get started with AnswerAgent. Try Studio free, calculate ROI, schedule a demo, or start an assessment.'
            >
                <GetStartedHero />
                <main>
                    <GetStartedOptions />
                    {/* <ROICalculatorSection /> */}
                    <AssessmentSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
