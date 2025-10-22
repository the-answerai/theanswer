/* eslint-disable react/no-unescaped-entities */
import React, { FormEvent, useEffect, useState } from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import LazyThreeScene from '@site/src/components/LazyThreeScene'
import WebinarCountdown from '@site/src/components/WebinarCountdown'
import WebinarCalendarButtons from '@site/src/components/WebinarCalendarButtons'
import WebinarLegalFooter from '@site/src/components/WebinarLegalFooter'
import ElevenLabsInlineWidget from '@site/src/components/ElevenLabsInlineWidget'
import { marketingConfig } from '@site/src/config/marketingConfig'
import { webinarConfig, getWebinarDateTime, getLocalWebinarDateTime } from '@site/src/config/webinarContent'
import { mailerLiteService } from '@site/src/services/mailerLiteService'
import { trackingService } from '@site/src/services/trackingService'
import {
    CheckCircle2,
    Star,
    ClipboardList,
    Target,
    Lightbulb,
    BarChart3,
    Settings,
    TrendingUp,
    Briefcase,
    Zap,
    Clock,
    Lock,
    Gift,
    Users,
    Circle,
    FileText,
    Mail,
    Bot,
    Compass,
    Calendar,
    PartyPopper
} from 'lucide-react'

import styles from './index.module.css'

// Work around React type mismatch by using any-typed Layout component, as used elsewhere
const LayoutComponent: any = Layout

const ELEVEN_LABS_AGENT_ID = 'agent_01k03gnw7xe11btz2vprkf7ay5' as const

const trackVoiceStart = (context: string) => () =>
    trackingService.trackEvent({
        event: 'voice_assessment_started',
        eventCategory: 'voice_assessment',
        eventLabel: context
    })

const trackVoiceEnd = (context: string) => () =>
    trackingService.trackEvent({
        event: 'voice_assessment_completed',
        eventCategory: 'voice_assessment',
        eventLabel: context,
        value: 1
    })

function ThankYouHero() {
    const [localEventTime, setLocalEventTime] = useState(() => getLocalWebinarDateTime())

    useEffect(() => {
        setLocalEventTime(getLocalWebinarDateTime())
    }, [])

    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <LazyThreeScene className={styles.threeJsCanvas} fallbackClassName={styles.heroFallback} />
            </div>
            <div className={styles.heroContent}>
                <span className={styles.heroCelebration} aria-hidden='true'>
                    <PartyPopper size={48} strokeWidth={1.5} />
                </span>
                <p className={styles.heroEyebrow}>Registration confirmed</p>
                <h1 className={styles.heroHeadline}>You&apos;re locked in for Thursday&apos;s Enterprise AI playbook</h1>
                <p className={styles.heroSubhead}>
                    We go live <strong>{localEventTime}</strong>. Take a minute now so the workshop zeroes in on the workflow your leaders
                    care about most.
                </p>

                <ul className={styles.heroChecklist}>
                    <li className={styles.heroChecklistItem}>
                        <span className={styles.heroChecklistIcon}>
                            <Calendar size={32} strokeWidth={1.5} />
                        </span>
                        Add the calendar invite and forward the join link to your decision-makers.
                    </li>
                    <li className={styles.heroChecklistItem}>
                        <span className={styles.heroChecklistIcon}>
                            <Compass size={32} strokeWidth={1.5} />
                        </span>
                        Tell us the metric or workflow you want solved in the form below—Bradley will prioritize it live.
                    </li>
                    <li className={styles.heroChecklistItem}>
                        <span className={styles.heroChecklistIcon}>
                            <Bot size={32} strokeWidth={1.5} />
                        </span>
                        Prefer a conversation? Jump into our AI voice coach to pressure-test the agenda in 2 minutes.
                    </li>
                </ul>

                <div className={styles.heroActionRow}>
                    <div className={styles.heroActionPrimary}>
                        <WebinarCountdown className={styles.countdownSection} />
                        <WebinarCalendarButtons />
                        <div className={styles.heroActionFooter}>
                            <a
                                href='mailto:?subject=Enterprise AI Webinar - Deploy AI in weeks&body=I just registered for this free webinar on enterprise AI deployment. Thought you might be interested: https://theanswer.ai/webinar-enterprise-ai'
                                className={clsx(styles.ctaButton, styles.ctaPrimary)}
                            >
                                Share with your team
                            </a>
                        </div>
                    </div>

                    <div className={styles.heroVoiceCard}>
                        <div className={styles.heroVoiceHeader}>
                            <span className={styles.bonusBadge}>Instant option</span>
                            <h3 className={styles.heroVoiceTitle}>Talk through your use case now</h3>
                        </div>
                        <p className={styles.heroVoiceCopy}>
                            Spin up our ElevenLabs-powered AnswerAgent for a quick readiness call. It’ll confirm fit, capture context for
                            the team, and send a recap before we go live.
                        </p>
                        <ElevenLabsInlineWidget
                            agentId={ELEVEN_LABS_AGENT_ID}
                            text='Start the readiness call'
                            buttonClassName={styles.heroVoiceButton}
                            onConversationStart={trackVoiceStart('hero_voice_widget')}
                            onConversationEnd={trackVoiceEnd('hero_voice_widget')}
                        />
                        <p className={styles.heroVoiceAssurance}>No scheduling. Instant answers. Replay emailed automatically.</p>
                    </div>
                </div>

                <div className={styles.heroSecondaryLinks}>
                    <a href='#what-to-expect' className={styles.secondaryLink}>
                        <ClipboardList size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        See the agenda
                    </a>
                    <a href='#prep' className={styles.secondaryLink}>
                        <Gift size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Prep materials
                    </a>
                </div>
            </div>
        </header>
    )
}

function ConfirmationDetails() {
    return (
        <section className={clsx(styles.missionSection, styles.confirmationSection)} id='confirmation'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--10 col--offset-1'>
                        <div className={styles.confirmationCard}>
                            <p className={styles.sectionEyebrow}>Step 1 · check your inbox</p>
                            <h2 className={styles.sectionHeading}>Pick how you want to get ready before we go live</h2>
                            <p className={styles.sectionLead}>
                                Your confirmation email is waiting with the join link, calendar invite, and prep checklist. Forward it to
                                the people who need to be in the room—then choose the path that fits your style.
                            </p>

                            <div className={styles.confirmationGrid}>
                                <div className={styles.confirmationItem}>
                                    <span className={styles.confirmationIcon}>📧</span>
                                    <h3>Email package</h3>
                                    <p className={styles.confirmationCopy}>
                                        Subject line: <em>“Enterprise AI Webinar – You’re confirmed.”</em> It includes the live link, replay
                                        access, and the readiness toolkit.
                                    </p>
                                </div>
                                <div className={styles.confirmationItem}>
                                    <span className={styles.confirmationIcon}>
                                        <Calendar size={48} strokeWidth={1.5} />
                                    </span>
                                    <h3>Calendar invite</h3>
                                    <p className={styles.confirmationCopy}>
                                        {getWebinarDateTime()} — add it now so you get the automatic reminders and can loop in stakeholders
                                        with one click.
                                    </p>
                                </div>
                                <div className={styles.confirmationItem}>
                                    <span className={styles.confirmationIcon}>
                                        <Target size={48} strokeWidth={1.5} />
                                    </span>
                                    <h3>4-week deployment roadmap</h3>
                                    <p className={styles.confirmationCopy}>
                                        The note links to our live demo outline and the KPI worksheet you’ll use during the session.
                                    </p>
                                </div>
                            </div>

                            <div className={styles.confirmationProTip}>
                                <span className={styles.confirmationProTipIcon}>
                                    <Lightbulb size={24} strokeWidth={1.5} />
                                </span>
                                <div>
                                    <strong>Pro tip:</strong> Add the calendar invite now, then jump to “Tailor the workshop” so we know
                                    which workflow or metric to prioritize for your team.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function PrepResources() {
    const video = webinarConfig.introVideo
    const videoReady = Boolean(video?.url && !video.url.includes('TODO_REPLACE'))

    return (
        <section className={styles.videoSection} id='prep'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--10 col--offset-1'>
                        <div className={styles.videoCard}>
                            <div className={styles.videoHeader}>
                                <span className={styles.bonusBadge}>Prep in 5 minutes</span>
                                <h2>Preview the workshop & grab your starter kit</h2>
                                <p>
                                    Bradley recorded a quick walkthrough of what to bring, which metrics to benchmark, and how to brief
                                    stakeholders so you ship outcomes the Monday after.
                                </p>
                                <ul className={styles.videoTakeaways}>
                                    <li>
                                        <Users
                                            size={16}
                                            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}
                                        />{' '}
                                        Who to invite so approvals happen fast
                                    </li>
                                    <li>
                                        <BarChart3
                                            size={16}
                                            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}
                                        />{' '}
                                        The 3 metrics he&apos;ll ask you to benchmark during the live build
                                    </li>
                                    <li>
                                        <Settings
                                            size={16}
                                            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}
                                        />{' '}
                                        How to prep your data sources for the 4-week deployment sprint
                                    </li>
                                </ul>
                            </div>
                            {videoReady ? (
                                <div className={styles.videoEmbed}>
                                    <iframe
                                        src={video?.url}
                                        title='Webinar orientation video'
                                        loading='lazy'
                                        frameBorder='0'
                                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className={styles.videoPlaceholder}>
                                    <strong>Orientation video coming soon.</strong> We’ll email you as soon as the recording is live.
                                </div>
                            )}
                            {video?.caption && <p className={styles.videoCaption}>{video.caption}</p>}
                            <div className={styles.videoResources}>
                                <div className={styles.bonusGrid}>
                                    <div className={styles.bonusCard}>
                                        <span className={styles.bonusIcon}>
                                            <Compass size={32} strokeWidth={1.5} />
                                        </span>
                                        <h3>Readiness Checklist</h3>
                                        <p>Hand it to IT, data, and compliance so provisioning happens before Thursday.</p>
                                        <div className={styles.bonusMeta}>Includes SOC 2 & privacy prompts</div>
                                    </div>
                                    <div className={styles.bonusCard}>
                                        <span className={styles.bonusIcon}>
                                            <TrendingUp size={32} strokeWidth={1.5} />
                                        </span>
                                        <h3>Executive Briefing Deck</h3>
                                        <p>Forward-ready slides with ROI benchmarks and the exact 4-week rollout sequence.</p>
                                        <div className={styles.bonusMeta}>Perfect for leadership updates</div>
                                    </div>
                                    <div className={styles.bonusCard}>
                                        <span className={styles.bonusIcon}>🎥</span>
                                        <h3>Replay & Highlight Reel</h3>
                                        <p>Full session plus a 7-minute recap delivered Sunday morning for anyone who can’t join live.</p>
                                        <div className={styles.bonusMeta}>Share with busy stakeholders</div>
                                    </div>
                                </div>
                                <p className={styles.videoFootnote}>Submit the form below and we’ll email the bundle automatically.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function ProgressiveProfileForm() {
    const [formState, setFormState] = useState({
        email: '',
        firstName: '',
        company: '',
        jobTitle: '',
        biggestChallenge: '',
        wantsCall: false,
        timezone: ''
    })
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        try {
            const storedEmail =
                window.localStorage.getItem('webinar_registration_confirmed_email') ||
                window.localStorage.getItem('webinar_registration_email')

            if (storedEmail) {
                setFormState((prev) => ({ ...prev, email: storedEmail }))
            }

            const storedProfile = window.localStorage.getItem('webinar_registration_profile')
            if (storedProfile) {
                const parsed = JSON.parse(storedProfile)
                setFormState((prev) => ({
                    ...prev,
                    firstName: parsed.firstName || prev.firstName,
                    company: parsed.company || prev.company,
                    jobTitle: parsed.jobTitle || prev.jobTitle,
                    biggestChallenge: parsed.biggestChallenge || prev.biggestChallenge,
                    wantsCall: Boolean(parsed.wantsCall || false),
                    timezone: parsed.timezone || prev.timezone
                }))
            }

            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
            if (tz) {
                setFormState((prev) => ({ ...prev, timezone: tz }))
            }
        } catch (storageError) {
            console.warn('Unable to hydrate saved profile data', storageError)
        }
    }, [])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement
        const name = (target as HTMLInputElement).name
        const isCheckbox = (target as HTMLInputElement).type === 'checkbox'
        const nextValue = isCheckbox ? (target as HTMLInputElement).checked : (target as HTMLInputElement | HTMLTextAreaElement).value

        if (status === 'error') {
            setStatus('idle')
            setError(null)
        }

        setFormState((prev) => ({
            ...prev,
            [name]: nextValue
        }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!formState.email) {
            setStatus('error')
            setError('Please confirm your email so we can attach these details to your registration.')
            return
        }

        setStatus('saving')
        setError(null)
        trackingService.trackFormInteraction('start', 'webinar-follow-up-form')

        try {
            if (!marketingConfig.mailerLite.enabled || !marketingConfig.mailerLite.webformId) {
                console.warn('MailerLite configuration missing. Ensure NEXT_PUBLIC_MAILERLITE_WEBFORM_ID is set.')
                setStatus('error')
                setError('Registration system is being updated. Please try again later or email hello@theanswer.ai.')
                return
            }

            const result = await mailerLiteService.subscribe({
                email: formState.email,
                name: formState.firstName,
                fields: {
                    company: formState.company,
                    job_title: formState.jobTitle,
                    primary_use_case: formState.biggestChallenge,
                    wants_call: formState.wantsCall,
                    timezone: formState.timezone,
                    utm_source: 'webinar-thank-you',
                    utm_medium: 'progressive-profile',
                    utm_campaign: 'webinar-enterprise-ai',
                    registration_stage: 'thank-you-follow-up'
                }
            })

            if (!result.success) {
                throw new Error(result.message || 'Follow-up submission failed')
            }

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                    'webinar_registration_profile',
                    JSON.stringify({
                        firstName: formState.firstName,
                        company: formState.company,
                        jobTitle: formState.jobTitle,
                        biggestChallenge: formState.biggestChallenge,
                        wantsCall: formState.wantsCall,
                        timezone: formState.timezone
                    })
                )
            }

            setStatus('success')
            trackingService.trackFormInteraction('complete', 'webinar-follow-up-form')
        } catch (submissionError) {
            console.error('Follow-up submission failed', submissionError)
            setStatus('error')
            setError('Something went wrong saving your details. Please try again or email hello@theanswer.ai.')
        }
    }

    return (
        <section className={styles.progressiveSection} id='attendee-prep'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div className={styles.progressiveCard}>
                            <span className={styles.bonusBadge}>Optional prep</span>
                            <h2>Shape Thursday around your KPIs</h2>
                            <p>
                                Choose your path: spend two minutes with the AI coach or drop the details below so Bradley can tailor the
                                live walkthrough to your stack.
                            </p>

                            <div className={styles.progressiveChoice}>
                                <div className={styles.progressiveChoiceColumn}>
                                    <h3>Prefer typing?</h3>
                                    <p className={styles.progressiveChoiceCopy}>
                                        Tell us the workflow, metric, or stakeholder you want solved. We’ll queue it for the live demo and
                                        send the follow-up deck tuned to your answers.
                                    </p>
                                </div>
                                <div className={clsx(styles.progressiveChoiceColumn, styles.progressiveVoiceColumn)}>
                                    <h3>Prefer chatting?</h3>
                                    <p className={styles.progressiveChoiceCopy}>
                                        Launch the AnswerAgent voice assessment to share the same context conversationally. We’ll log the
                                        highlights and email you a recap for easy forwarding.
                                    </p>
                                    <ElevenLabsInlineWidget
                                        agentId={ELEVEN_LABS_AGENT_ID}
                                        text='Voice my priorities instead'
                                        variant='outline'
                                        showStatus={false}
                                        buttonClassName={styles.progressiveVoiceButton}
                                        wrapperClassName={styles.progressiveVoiceButtonWrap}
                                        onConversationStart={trackVoiceStart('progressive_voice_widget')}
                                        onConversationEnd={trackVoiceEnd('progressive_voice_widget')}
                                    />
                                </div>
                            </div>

                            <form className={styles.progressiveForm} onSubmit={handleSubmit}>
                                <div className={styles.formGrid}>
                                    <label className={styles.formField}>
                                        <span>Email (so we can match your registration)</span>
                                        <input
                                            type='email'
                                            name='email'
                                            value={formState.email}
                                            onChange={handleChange}
                                            placeholder='you@company.com'
                                            required
                                        />
                                    </label>
                                    <label className={styles.formField}>
                                        <span>First name</span>
                                        <input
                                            type='text'
                                            name='firstName'
                                            value={formState.firstName}
                                            onChange={handleChange}
                                            placeholder='Optional'
                                        />
                                    </label>
                                    <label className={styles.formField}>
                                        <span>Company</span>
                                        <input
                                            type='text'
                                            name='company'
                                            value={formState.company}
                                            onChange={handleChange}
                                            placeholder='Optional'
                                        />
                                    </label>
                                    <label className={styles.formField}>
                                        <span>Role / title</span>
                                        <input
                                            type='text'
                                            name='jobTitle'
                                            value={formState.jobTitle}
                                            onChange={handleChange}
                                            placeholder='Optional'
                                        />
                                    </label>
                                </div>

                                <label className={clsx(styles.formField, styles.formFieldFull)}>
                                    <span>What’s the #1 workflow or metric you want solved?</span>
                                    <textarea
                                        name='biggestChallenge'
                                        value={formState.biggestChallenge}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder='Optional, but it helps us bring the right playbook.'
                                    />
                                </label>

                                <label className={clsx(styles.formField, styles.formCheckbox)}>
                                    <input type='checkbox' name='wantsCall' checked={formState.wantsCall} onChange={handleChange} />
                                    <span>I’m up for a quick human follow-up after the webinar (we’ll send scheduling options).</span>
                                </label>

                                {error && <div className={styles.formError}>{error}</div>}
                                {status === 'success' && (
                                    <div className={styles.formSuccess}>
                                        <CheckCircle2
                                            size={18}
                                            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}
                                        />
                                        Got it! We&#39;ll tailor the workshop follow-ups to your goals.
                                    </div>
                                )}

                                <button type='submit' className={styles.formSubmit} disabled={status === 'saving'}>
                                    {status === 'saving' ? 'Saving...' : 'Save my details'}
                                </button>
                            </form>

                            <div className={styles.progressiveProof}>
                                <span>
                                    <Star size={24} fill='currentColor' />
                                </span>
                                <p>
                                    Last month’s attendees who used the form or voice coach were 3× more likely to book a pilot follow-up
                                    because the team had their roadmap ready.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function WhatToExpect() {
    return (
        <section className={styles.featuresSection} id='what-to-expect'>
            <div className='container'>
                <h2 className='text--center'>What to Expect on Thursday</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    A 60-minute working session that shows you exactly how teams like IAS, Palatine Capital, and Moonstruck Medical shipped
                    governed AI agents in four weeks.
                </p>

                <div className='row'>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>1</div>
                            <h3>Live Platform Demo</h3>
                            <p>
                                Watch Bradley Taylor rebuild actual AnswerAgent workflows using attendee submissions. See how six
                                disconnected tools collapse into one governed assistant in under 15 minutes.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Circle size={16} fill='red' color='red' /> Live, not pre-recorded
                                </span>
                                <span>
                                    <Briefcase size={16} /> Metrics surfaced from your submissions
                                </span>
                                <span>
                                    <Zap size={16} /> Interactive Q&A
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>2</div>
                            <h3>Proven Case Studies</h3>
                            <p>
                                Deep dive into how Palatine Capital saved 120 hours a month, how IAS launched in four weeks, and how
                                Moonstruck unified nine reps—complete with dashboards, compliance notes, and stakeholder scripts.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <BarChart3 size={16} /> Real ROI numbers
                                </span>
                                <span>
                                    <Clock size={16} /> Deployment timelines
                                </span>
                                <span>
                                    <CheckCircle2 size={16} /> Measurable outcomes
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>3</div>
                            <h3>Framework Walkthrough</h3>
                            <p>
                                Get the exact four-week methodology used by IAS and other enterprise clients with week-by-week deliverables,
                                sample Jira boards, and governance checkpoints.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <ClipboardList size={16} /> Weekly deliverables
                                </span>
                                <span>
                                    <Target size={16} /> Success criteria
                                </span>
                                <span>
                                    <Zap size={16} /> Implementation tips
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>4</div>
                            <h3>90-Day Pilot Program</h3>
                            <p>
                                Decide if the risk-free pilot program is a match. We’ll cover pricing guardrails, data residency, and how we
                                handle exec reviews for Fortune 500 clients.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Lock size={16} /> No vendor lock-in
                                </span>
                                <span>
                                    <TrendingUp size={16} /> Measurable ROI
                                </span>
                                <span>
                                    <Target size={16} /> 90-day timeline
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.expectationVoiceNote}>
                    <span>
                        <Bot size={24} strokeWidth={1.5} />
                    </span>
                    <p>
                        Want your scenario featured? Share it via the form or the voice coach before Friday and we’ll weave it into the live
                        demo.
                    </p>
                </div>
            </div>
        </section>
    )
}

function FitCallCTA() {
    const schedulingUrl = 'https://cal.com/answerai/enterprise-ai-fit-call?duration=15'

    return (
        <section className={styles.fitCallSection} id='fit-call'>
            <div className='container'>
                <div className={styles.fitCallGrid}>
                    <div className={styles.fitCallContent}>
                        <span className={styles.bonusBadge}>High-intent next step</span>
                        <h2>Reserve your pilot review slot</h2>
                        <p>
                            We open just ten 15-minute fit calls the week after the webinar. Bring your stack, procurement realities, and
                            desired ROI—they’re designed to confirm if the 90-day pilot is a match.
                        </p>
                        <ul className={styles.fitCallList}>
                            <li>
                                <CheckCircle2
                                    size={16}
                                    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}
                                />{' '}
                                We map your fastest measurable win
                            </li>
                            <li>
                                <CheckCircle2
                                    size={16}
                                    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}
                                />{' '}
                                Security & compliance checklist walkthrough
                            </li>
                            <li>
                                <CheckCircle2
                                    size={16}
                                    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}
                                />{' '}
                                Pilot timeline aligned to your stakeholders
                            </li>
                        </ul>
                        <a
                            className={styles.fitCallButton}
                            href={schedulingUrl}
                            target='_blank'
                            rel='noreferrer'
                            onClick={() =>
                                trackingService.trackEvent({
                                    event: 'fit_call_clicked',
                                    eventCategory: 'conversion',
                                    eventLabel: 'thank-you-fit-call'
                                })
                            }
                        >
                            Book my 15-minute fit call
                        </a>
                        <p className={styles.fitCallScarcity}>
                            These calls historically fill within 36 hours—profile submissions from this page get first review.
                        </p>
                    </div>

                    <div className={styles.fitCallVoicePanel}>
                        <div className={styles.fitCallVoiceCard}>
                            <h3>Already shared your goals?</h3>
                            <p>
                                Once your form or voice notes are in, the team reviews them during the workshop and follows up if the pilot
                                looks like a fit. Keep an eye on your inbox the week after.
                            </p>
                            <p className={styles.fitCallVoiceHint}>Need to add more detail? Hop back to the prep section above.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function SocialSharing() {
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
    const [copiedLabel, setCopiedLabel] = useState<string>('')
    const webinarUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/webinar-enterprise-ai` : 'https://theanswer.ai/webinar-enterprise-ai'
    const shareText =
        'Just booked AnswerAI’s “Deploy AI Agents in weeks” workshop. Live build, governance checklist, and playbooks from IAS & Palatine. Join me:'
    const opsMessage = `Hey team — I locked in our seat for AnswerAI's Enterprise AI workshop (${getLocalWebinarDateTime()}). It shows the exact 4-week rollout we want. Grab a spot here: ${webinarUrl}\n\nPS: Add your workflow so they cover it live: ${webinarUrl}#attendee-prep`
    const execMessage = `Flagging an Enterprise AI session (${getLocalWebinarDateTime()}) that walks through the 4-week deployment model we’ve been evaluating. Includes ROI benchmarks + compliance templates. Register: ${webinarUrl}`

    const shareLinks = {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(webinarUrl)}&title=${encodeURIComponent(
            shareText
        )}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(webinarUrl)}`,
        email: `mailto:?subject=${encodeURIComponent('Enterprise AI Webinar - You Should Join!')}&body=${encodeURIComponent(
            `${shareText}\n\nRegister here: ${webinarUrl}`
        )}`
    }

    const handleCopyMessage = async (text: string, label: string) => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
            setCopyState('error')
            return
        }

        try {
            await navigator.clipboard.writeText(text)
            setCopyState('copied')
            setCopiedLabel(label)
            trackingService.trackEvent({
                event: 'share_snippet_copied',
                eventCategory: 'sharing',
                eventLabel: label
            })
            setTimeout(() => setCopyState('idle'), 3000)
        } catch (err) {
            console.warn('Unable to copy share snippet', err)
            setCopyState('error')
        }
    }

    const copyLabel = copyState === 'copied' ? `Copied ${copiedLabel}!` : copyState === 'error' ? 'Copy failed' : 'Copy snippet'

    const personaSnippets = [
        {
            label: 'Ops / Enablement Slack note',
            text: opsMessage
        },
        {
            label: 'Executive forward email',
            text: execMessage
        }
    ]

    return (
        <section className={styles.featuresSection} id='share'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div className={clsx(styles.featureCard, styles.commandment)} style={{ textAlign: 'center' }}>
                            <div className={styles.comingSoonIcon}>📢</div>
                            <h2>Invite Your Team</h2>
                            <p style={{ marginBottom: '2rem' }}>
                                Perfect for CTOs, operations, and enablement leaders. Copy the snippet below for Slack/Teams or share via
                                your favorite channel.
                            </p>

                            <div className={styles.shareActions}>
                                <a
                                    href={shareLinks.linkedin}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className={clsx(styles.ctaButton, styles.ctaSecondary)}
                                    onClick={() => trackingService.trackExternalLinkClick(shareLinks.linkedin)}
                                >
                                    Share on LinkedIn
                                </a>

                                <a
                                    href={shareLinks.twitter}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className={clsx(styles.ctaButton, styles.ctaSecondary)}
                                    onClick={() => trackingService.trackExternalLinkClick(shareLinks.twitter)}
                                >
                                    Post on X
                                </a>

                                <a
                                    href={shareLinks.email}
                                    className={clsx(styles.ctaButton, styles.ctaSecondary)}
                                    onClick={() =>
                                        trackingService.trackEvent({
                                            event: 'email_share',
                                            eventCategory: 'sharing',
                                            eventLabel: 'webinar-email-colleagues'
                                        })
                                    }
                                >
                                    Email colleagues
                                </a>
                            </div>

                            <div className={styles.shareSnippetsGrid}>
                                {personaSnippets.map((snippet) => (
                                    <div key={snippet.label} className={styles.shareSnippet}>
                                        <label className={styles.shareSnippetLabel}>{snippet.label}</label>
                                        <textarea value={snippet.text} readOnly aria-label={snippet.label} />
                                        <button
                                            type='button'
                                            onClick={() => handleCopyMessage(snippet.text, snippet.label)}
                                            className={styles.copyButton}
                                        >
                                            {copyLabel}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function FinalAssurance() {
    return (
        <section className={styles.finalAssuranceSection}>
            <div className='container'>
                <div className={styles.finalAssuranceCard}>
                    <div className={styles.finalAssuranceCopy}>
                        <h2>Share as much (or as little) as you like—your data stays with us</h2>
                        <p>
                            Everything you submit—whether typed or voiced—is used only to personalize Thursday and the optional pilot
                            review. No cold calls, no surprise sequences.
                        </p>
                        <ul className={styles.finalAssuranceList}>
                            <li>
                                <Lock size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />{' '}
                                Secure ElevenLabs session with end-to-end encryption
                            </li>
                            <li>
                                <FileText size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />{' '}
                                Transcript and highlights emailed only to you (or teammates you specify)
                            </li>
                            <li>
                                <Mail size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Opt
                                out anytime—every follow-up email includes a one-click preference link
                            </li>
                        </ul>
                        <div className={styles.finalAssuranceFaqs}>
                            <div>
                                <h3>Is the voice call required?</h3>
                                <p>Nope. The form and the call capture the same details—use whichever gets you answers faster.</p>
                            </div>
                            <div>
                                <h3>Can I do both?</h3>
                                <p>
                                    Absolutely. Many teams voice their goals first, then jot quick notes in the form so leadership sees
                                    everything in writing.
                                </p>
                            </div>
                            <div>
                                <h3>What if I need a human?</h3>
                                <p>Check the “human follow-up” box in the form and we’ll reach out once the workshop wraps.</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.finalAssuranceAction}>
                        <div className={styles.finalAssuranceWidget}>
                            <span className={styles.bonusBadge}>Your roadmap</span>
                            <h3>Need to add more context?</h3>
                            <p>
                                Head back to the prep section any time to update your notes or launch the voice coach. That keeps the team
                                aligned to your goals.
                            </p>
                            <a href='#attendee-prep' className={styles.finalAssuranceButton}>
                                Update my workshop goals
                            </a>
                            <p className={styles.finalAssuranceCaption}>
                                Questions before then? Reply to the confirmation email—we read every note.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function WebinarThankYou(): JSX.Element {
    // Initialize page tracking
    useEffect(() => {
        // Track ViewContent for Facebook Pixel (PageView fires on init)
        if (window.fbq) {
            window.fbq('track', 'ViewContent', {
                content_name: 'Webinar Registration Confirmed',
                content_category: 'webinar',
                content_type: 'product'
            })
        }

        // Track successful conversion landing
        trackingService.trackEvent({
            event: 'thank_you_page_view',
            eventCategory: 'conversion',
            eventLabel: 'webinar-registration-confirmed',
            value: 1
        })
    }, [])

    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Registration Confirmed - Enterprise AI Webinar'
                description="You're registered for Thursday's enterprise AI webinar. Check your email for the webinar link, calendar invitation, and bonus Enterprise AI Readiness Checklist."
            >
                <ThankYouHero />
                <main>
                    <ConfirmationDetails />
                    <PrepResources />
                    <ProgressiveProfileForm />
                    <WhatToExpect />
                    <FitCallCTA />
                    <SocialSharing />
                    <FinalAssurance />
                </main>
                <WebinarLegalFooter />
            </LayoutComponent>
        </div>
    )
}
