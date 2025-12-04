/* eslint-disable react/no-unescaped-entities */
import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { useLocation } from '@docusaurus/router'
import useIsBrowser from '@docusaurus/useIsBrowser'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import type { LucideIcon } from 'lucide-react'
import { Check, Presentation, Shuffle, Users, BriefcaseBusiness, PlugZap, MessageSquare, Sparkles } from 'lucide-react'

import styles from './index.module.css'

const LayoutComponent: any = Layout

const SCHEDULE_DEMO_URL = 'https://calendly.com/brad-theanswer/answeragent-intro'
const GAMMA_VIDEO_URL = 'https://www.youtube.com/embed/hgghHXmYCmU'
const GAMMA_DECK_URL = 'https://gamma.app/docs/Acme-Quarterly-Business-Review-3xyyirgqj4pziac'

type HeroVariantKey = 'frustrated' | 'ready'

type HeroVariantContent = {
    key: HeroVariantKey
    headline: string
    subheading: string
    bullets: string[]
    secondaryCtaLabel: string
    videoCaption: string
}

const HERO_VARIANTS: Record<HeroVariantKey, HeroVariantContent> = {
    frustrated: {
        key: 'frustrated',
        headline: 'Are you frustrated that every deck still takes half a day?',
        subheading:
            'Connect AnswerAgent to Gamma and turn your live CRM, support, and project data into on-brand decks in minutes — not hours.',
        bullets: [
            'Stop copy-pasting from Salesforce, HubSpot, Jira, and tickets into slides.',
            'Auto-generate QBRs, team updates, and investor decks straight from your real data.',
            'Keep every deck fresh, accurate, and on-brand without redesigning from scratch.'
        ],
        secondaryCtaLabel: 'Watch the 2-minute Demo',
        videoCaption: 'See how Gamma + AnswerAgent builds this deck automatically →'
    },
    ready: {
        key: 'ready',
        headline: 'Are you ready for your decks to write themselves?',
        subheading:
            'Let AnswerAgent feed Gamma with your live business data so you can ship QBRs, updates, and pitches in 10 minutes instead of 6 hours.',
        bullets: [
            'Pull live CRM, support, and product data into Gamma with one request.',
            'Auto-generate presentations your team actually wants to present.',
            'Spend your time on strategy and clients, not slide formatting.'
        ],
        secondaryCtaLabel: 'See It in Action',
        videoCaption: 'See how Gamma + AnswerAgent builds this deck automatically →'
    }
}

const HERO_VARIANT_OVERRIDES: Record<string, HeroVariantKey> = {
    'gamma-ready': 'ready',
    'gamma-variant-b': 'ready',
    'hero-b': 'ready',
    ready: 'ready',
    'gamma-default': 'frustrated',
    'hero-a': 'frustrated',
    frustrated: 'frustrated'
}

const WHO_THIS_IS_FOR = [
    'You’re building decks from Salesforce / HubSpot / Pipedrive every week.',
    'Your CS team spends half their time preparing QBRs and renewal decks.',
    'Product, eng, or ops burn hours making show-and-tell / sprint recap slides.',
    'You’re already using Gamma and want it connected to your real business story.'
]

const TESTIMONIALS = [
    {
        quote: '“We went from blocking a full day to prep QBRs to spinning them up in under 20 minutes. My team will fight you if you try to take this away.”',
        name: 'Sofia Martinez',
        title: 'Head of Customer Success',
        company: 'BrightPath Health'
    },
    {
        quote: '“We were already using Gamma, but once we hooked it to AnswerAgent, the decks basically started building themselves. Now we just tweak the story instead of chasing numbers.”',
        name: 'Jason Lee',
        title: 'RevOps Manager',
        company: 'Northbridge Software'
    },
    {
        quote: '“Launch reports, campaign recaps, board updates—everything stays on-brand and, more importantly, accurate. No more ‘sorry, those numbers were last week.’”',
        name: 'Amira Khan',
        title: 'Director of Marketing',
        company: 'Lumen Retail'
    },
    {
        quote: '“As a small team, this is the difference between ‘we’ll update the deck next week’ and ‘we’ll have something ready this afternoon.’ It genuinely bought us back days every month.”',
        name: 'Tom Nguyen',
        title: 'Founder & CEO',
        company: 'ClearStack Labs'
    },
    {
        quote: '“Our reps now walk into renewals and upsells with Gamma decks built from real usage and ticket history. Close rates are up, and prep time is way down.”',
        name: 'Rachel Adams',
        title: 'Sales Manager',
        company: 'Peakline Logistics'
    },
    {
        quote: '“Monthly retros used to be a mess of screenshots and spreadsheets. Now AnswerAgent just narrates the month, and Gamma turns it into a deck. We actually look forward to them.”',
        name: 'Marco DeLuca',
        title: 'Operations Lead',
        company: 'HarborPoint Services'
    }
]

const HOW_IT_WORKS_STEPS: { title: string; description: string; icon: LucideIcon }[] = [
    {
        title: 'Connect your tools and Gamma',
        description:
            'Hook AnswerAgent to your CRM, support tools, repos, and docs. Add your Gamma API key once, and choose your preferred templates.',
        icon: PlugZap
    },
    {
        title: 'Ask for the deck you need',
        description:
            'Type what you want: “Create a QBR deck for Acme using the last 90 days of CRM, support, and product data.” AnswerAgent pulls the live data, synthesizes the story, and sends it to Gamma.',
        icon: MessageSquare
    },
    {
        title: 'Review, tweak, and present',
        description:
            'Gamma generates an on-brand deck with narrative, charts, and sections. You make quick edits, hit share, and walk into the room with slides that are fresh and accurate.',
        icon: Sparkles
    }
]

const USE_CASES = [
    {
        icon: Presentation,
        title: 'Customer QBRs & Renewals',
        description: 'Auto-generate QBRs from product usage, support history, and open opportunities.',
        detail: 'Show customers exactly how you’ve been helping them—without a day of prep.'
    },
    {
        icon: Shuffle,
        title: 'Team Updates & Show & Tells',
        description: 'Summarize shipped features, key PRs, major tickets closed, and customer feedback.',
        detail: 'Turn sprint recaps into decks your team and stakeholders will actually read.'
    },
    {
        icon: BriefcaseBusiness,
        title: 'Executive & Investor Updates',
        description: 'Build board and investor updates with live revenue, pipeline, and product progress.',
        detail: 'Cut the time spent on “deck work” so leadership stays focused on decisions.'
    }
]

const TRUST_MICROCOPY = [
    'Works with your existing stack: Salesforce, HubSpot, Jira, GitHub, and more.',
    'Built for teams that care about data accuracy and real customer stories.',
    'Self-hosted and secure options available for regulated industries.'
]

const deriveVariantKey = (campaign: string | null | undefined): HeroVariantKey => {
    if (!campaign) {
        return 'frustrated'
    }

    const normalized = campaign.trim().toLowerCase()
    if (HERO_VARIANT_OVERRIDES[normalized]) {
        return HERO_VARIANT_OVERRIDES[normalized]
    }

    if (normalized.includes('ready')) {
        return 'ready'
    }

    return 'frustrated'
}

function useHeroVariant(search: string): HeroVariantContent {
    const isBrowser = useIsBrowser()

    return useMemo(() => {
        if (!isBrowser) {
            return HERO_VARIANTS.frustrated
        }

        const params = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''))
        const utmCampaign = params.get('utm_campaign')
        return HERO_VARIANTS[deriveVariantKey(utmCampaign)]
    }, [isBrowser, search])
}

function GammaHero() {
    const location = useLocation()
    const heroContent = useHeroVariant(location?.search ?? '')

    return (
        <section className={styles.landingHero}>
            <div className='container'>
                <div className={styles.heroCenter}>
                    <div className={styles.heroEyebrow}>Gamma × AnswerAgent</div>
                    <h1 className={styles.heroHeadline} style={{ textAlign: 'center' }}>
                        {heroContent.headline}
                    </h1>
                    <p className={styles.heroSubhead} style={{ textAlign: 'center', margin: '0 auto' }}>
                        {heroContent.subheading}
                    </p>
                    <div className={clsx(styles.heroCTAs, styles.heroCTAInline)}>
                        <a href={SCHEDULE_DEMO_URL} className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                            Schedule a Demo
                        </a>
                        <a href={GAMMA_DECK_URL} className={styles.secondaryLink} target='_blank' rel='noreferrer'>
                            View the Sample Gamma Deck
                        </a>
                    </div>

                    <div className={styles.heroVideoWrap}>
                        <div className={styles.videoFrame}>
                            <iframe
                                src={`${GAMMA_VIDEO_URL}?rel=0`}
                                title='Gamma + AnswerAgent demo'
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                allowFullScreen
                            />
                        </div>
                        <p className={styles.videoCaption} style={{ textAlign: 'center' }}>
                            See AnswerAgent feed Gamma with live CRM, support, and product data.
                        </p>
                    </div>
                </div>

                <ul className={styles.heroBulletRow}>
                    {heroContent.bullets.map((bullet) => (
                        <li key={bullet}>
                            <Check size={18} />
                            <span>{bullet}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

function ProblemAudienceSection() {
    return (
        <section className={styles.missionSection}>
            <div className='container'>
                <div className={styles.sectionEyebrow}>If you live in decks, this will feel like cheating</div>
                <h2 className={clsx(styles.sectionHeading, 'text--center')}>Finally fix the part of Gamma work that eats the clock</h2>
                <p className={clsx(styles.sectionLead, 'text--center')} style={{ maxWidth: '820px', margin: '1rem auto 2.5rem' }}>
                    If you’re a Gamma power user, sales leader, CS lead, or founder who lives in QBRs, renewal decks, and weekly updates,
                    you already know the pain. The design is the easy part. The hard part is chasing data, reconciling tools, and fixing
                    slides 5 minutes before the meeting.
                </p>

                <div className='row'>
                    {WHO_THIS_IS_FOR.map((item) => (
                        <div key={item} className='col col--6' style={{ marginBottom: '1.25rem' }}>
                            <div
                                className={styles.featureCard}
                                style={{
                                    height: '100%',
                                    textAlign: 'left',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.85rem'
                                }}
                            >
                                <Users size={28} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                                <p style={{ margin: 0 }}>{item}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function SocialProofSection() {
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        if (TESTIMONIALS.length <= 1) return undefined

        const id = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length)
        }, 6000)

        return () => window.clearInterval(id)
    }, [])

    const activeTestimonial = TESTIMONIALS[activeIndex]

    return (
        <section className={styles.carouselSection}>
            <div className='container'>
                <div className={styles.sectionEyebrow}>What teams are saying</div>
                <h2 className={clsx(styles.sectionHeading, 'text--center')}>Proof from people who can’t afford stale decks</h2>

                <div className={clsx(styles.carouselCard, styles.carouselCardActive)} aria-live='polite' style={{ marginTop: '3rem' }}>
                    <p className={styles.carouselQuote}>{activeTestimonial.quote}</p>
                    <div className={styles.carouselAuthor}>
                        {activeTestimonial.name} · {activeTestimonial.title}, {activeTestimonial.company}
                    </div>

                    <div className={styles.carouselDots}>
                        {TESTIMONIALS.map((_testimonial, idx) => (
                            <button
                                key={_testimonial.name}
                                type='button'
                                className={clsx(styles.carouselDot, idx === activeIndex && styles.carouselDotActive)}
                                onClick={() => setActiveIndex(idx)}
                                aria-label={`Show testimonial ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function HowItWorksSection() {
    return (
        <section className={styles.missionSection}>
            <div className='container'>
                <div className={styles.sectionEyebrow}>How it works (in 3 simple steps)</div>
                <h2 className={clsx(styles.sectionHeading, 'text--center')}>Hook your data once, generate decks forever</h2>

                <div className={styles.verticalSteps}>
                    {HOW_IT_WORKS_STEPS.map((step, index) => (
                        <div key={step.title} className={styles.verticalStep}>
                            <div className={styles.verticalStepNumberWrap}>
                                <div className={styles.verticalStepNumber}>{index + 1}</div>
                                <div className={styles.verticalStepIcon}>
                                    <step.icon size={18} strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className={styles.verticalStepContent}>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className='text--center' style={{ marginTop: '2rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                    No more copy-paste. No more stale screenshots. Just decks that match what’s actually happening in your business.
                </p>
            </div>
        </section>
    )
}

function UseCaseSection() {
    return (
        <section className={styles.featuresSection}>
            <div className='container'>
                <div className={styles.sectionEyebrow}>Built for the decks that actually matter</div>
                <h2 className={clsx(styles.sectionHeading, 'text--center')}>Three snapshots, infinite hours saved</h2>

                <div className='row' style={{ marginTop: '3rem' }}>
                    {USE_CASES.map((useCase) => (
                        <div key={useCase.title} className='col col--4'>
                            <div className={clsx(styles.featureCard, styles.integrationCard)} style={{ height: '100%' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <useCase.icon size={40} />
                                </div>
                                <h3>{useCase.title}</h3>
                                <p>{useCase.description}</p>
                                <div
                                    style={{
                                        background: 'rgba(0, 255, 123, 0.08)',
                                        border: '1px solid rgba(0, 255, 123, 0.25)',
                                        borderRadius: '10px',
                                        padding: '0.85rem',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    {useCase.detail}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function FinalCtaSection() {
    return (
        <section className={clsx(styles.featuresSection, styles.ctaSection)}>
            <div className='container'>
                <div className={styles.finalCtaCard}>
                    <h2 className={styles.finalCtaHeadline}>Ready to stop losing days to decks?</h2>
                    <p className={styles.finalCtaCopy}>
                        If you’re already using Gamma—or if your team creates decks for a living—connecting AnswerAgent will feel like
                        flipping a cheat code. Your data stays live, your story stays true, and your slides stop owning your calendar.
                    </p>
                    <a href={SCHEDULE_DEMO_URL} className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                        Schedule a Demo
                    </a>
                    <p className={styles.finalCtaFooter}>
                        We’ll use your real tools and workflows so you can see exactly how it would work for your team.
                    </p>

                    <ul className={styles.heroBulletRow} style={{ marginTop: '2.5rem' }}>
                        {TRUST_MICROCOPY.map((item) => (
                            <li key={item}>
                                <Check size={18} />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}

export default function GammaLandingPage(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Gamma Integration - AnswerAgent'
                description='Connect AnswerAgent to Gamma to generate QBRs, renewals, and executive decks with live CRM and product data in minutes.'
            >
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'AnswerAgent × Gamma Integration',
                        description: 'Generate on-brand Gamma decks directly from live CRM, support, and product data.',
                        url: 'https://answeragent.ai/gamma',
                        about: {
                            '@type': 'SoftwareApplication',
                            name: 'AnswerAgent for Gamma',
                            applicationCategory: 'BusinessApplication'
                        }
                    }}
                />
                <GammaHero />
                <main>
                    <ProblemAudienceSection />
                    <SocialProofSection />
                    <HowItWorksSection />
                    <UseCaseSection />
                    <FinalCtaSection />
                </main>
            </LayoutComponent>
        </div>
    )
}
