import clsx from 'clsx'
import Layout from '@theme/Layout'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { CheckCircle2, Calendar, Mail, MessageSquare, BookOpen, Sparkles, ClipboardList } from 'lucide-react'
import styles from './index.module.css'

const LayoutComponent: any = Layout

function ConfirmationHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <CheckCircle2 size={64} strokeWidth={1.5} style={{ color: '#4caf50', marginBottom: '1rem' }} />
                </div>
                <h1 className={styles.heroTitle} style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    You&apos;re All Set!
                </h1>
                <p className={styles.heroSubtitle} style={{ fontSize: '1.3rem', maxWidth: '700px', margin: '0 auto 2rem' }}>
                    Thanks for scheduling your intro meeting with AnswerAgent. We&apos;ve sent a calendar invite to your email.
                </p>
            </div>
        </header>
    )
}

function NextStepsSection() {
    const steps = [
        {
            icon: Calendar,
            title: 'Check Your Calendar',
            description:
                "A calendar invite with the meeting link has been sent to your email. Add it to your calendar so you don't miss it!"
        },
        {
            icon: Mail,
            title: 'Watch for Confirmation',
            description: "You'll receive a confirmation email shortly with all the details and a link to join the meeting."
        },
        {
            icon: BookOpen,
            title: 'Explore the Docs',
            description: 'Want to learn more before our call? Check out our documentation to see what AnswerAgent can do.',
            link: '/docs/intro',
            linkText: 'Browse Documentation'
        },
        {
            icon: MessageSquare,
            title: 'Questions?',
            description: 'Have questions before our meeting? Feel free to reach out or ask Alpha, our AI assistant.',
            link: 'mailto:brad@theanswer.ai',
            linkText: 'Contact Us'
        }
    ]

    return (
        <section style={{ padding: '6rem 0', background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>What Happens Next?</h2>
                <div className='row'>
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <div key={index} className='col col--6' style={{ marginBottom: '2rem' }}>
                                <div
                                    style={{
                                        padding: '2rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        height: '100%'
                                    }}
                                >
                                    <Icon size={40} style={{ color: 'var(--ifm-color-primary)', marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{step.title}</h3>
                                    <p style={{ opacity: 0.85, marginBottom: step.link ? '1.5rem' : 0 }}>{step.description}</p>
                                    {step.link && (
                                        <a
                                            href={step.link}
                                            className='button button--outline button--primary'
                                            style={{ marginTop: '1rem' }}
                                        >
                                            {step.linkText}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

function WhatToBringSection() {
    const items = [
        'Questions about your current workflows and pain points',
        'Ideas for how AI could help your team',
        'Any specific use cases you want to discuss',
        'Your team size and organizational structure (if relevant)'
    ]

    return (
        <section style={{ padding: '6rem 0' }}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <Sparkles size={48} style={{ color: 'var(--ifm-color-primary)', marginBottom: '1rem' }} />
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Prepare for Our Call</h2>
                            <p style={{ fontSize: '1.1rem', opacity: 0.85 }}>
                                To make the most of our time together, here&apos;s what to bring:
                            </p>
                        </div>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                maxWidth: '600px',
                                margin: '0 auto'
                            }}
                        >
                            {items.map((item, index) => (
                                <li
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1rem',
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        background: 'rgba(102, 126, 234, 0.08)',
                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <CheckCircle2 size={24} style={{ color: '#4caf50', flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '1.05rem' }}>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

function AssessmentCalloutSection() {
    return (
        <section style={{ padding: '6rem 0', background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div
                            style={{
                                padding: '3rem',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                                border: '2px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '16px',
                                textAlign: 'center'
                            }}
                        >
                            <ClipboardList size={56} style={{ color: 'var(--ifm-color-primary)', marginBottom: '1.5rem' }} />
                            <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>Haven&apos;t Taken the Assessment Yet?</h2>
                            <p style={{ fontSize: '1.15rem', opacity: 0.9, marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                It&apos;s completely optional, but taking our quick assessment now will help our team prepare for your
                                meeting and personalize it specifically for you.
                            </p>
                            <p style={{ fontSize: '1.05rem', opacity: 0.8, marginBottom: '2.5rem' }}>
                                Choose voice, chat, or skip it for now—whatever works best for your schedule!
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <a href='/assessment' className='button button--primary button--lg'>
                                    Take Assessment Now
                                </a>
                                <span style={{ opacity: 0.7, fontSize: '0.95rem', alignSelf: 'center' }}>Takes only 5-10 minutes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function RescheduleSection() {
    return (
        <section
            style={{
                padding: '4rem 0',
                textAlign: 'center'
            }}
        >
            <div className='container'>
                <div className='row'>
                    <div className='col col--6 col--offset-3'>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Need to Reschedule?</h2>
                        <p style={{ fontSize: '1.1rem', opacity: 0.85, marginBottom: '2rem' }}>
                            No problem! You can reschedule or cancel anytime using the link in your confirmation email.
                        </p>
                        <a
                            href='https://calendly.com/brad-theanswer/answeragent-intro'
                            className='button button--secondary button--lg'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            Manage Booking
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function IntroMeetingConfirmation(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Meeting Confirmed - AnswerAgent'
                description='Your intro meeting with AnswerAgent has been confirmed. We look forward to speaking with you!'
            >
                <ConfirmationHero />
                <main>
                    <NextStepsSection />
                    <WhatToBringSection />
                    <AssessmentCalloutSection />
                    <RescheduleSection />
                </main>
            </LayoutComponent>
        </div>
    )
}
