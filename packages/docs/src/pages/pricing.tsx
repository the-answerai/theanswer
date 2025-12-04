import clsx from 'clsx'
import Layout from '@theme/Layout'
import HeroCTA from '@site/src/components/HeroCTA'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Check, Globe, Building2, Shield, HelpCircle } from 'lucide-react'
import styles from './pricing.module.css'

const LayoutComponent: any = Layout

function PricingHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Simple, Transparent Pricing</h1>
                <p className={styles.heroSubtitle}>Choose the deployment that fits your needs</p>
                <HeroCTA
                    context={{
                        page: 'pricing',
                        section: 'hero'
                    }}
                />
            </div>
        </header>
    )
}

function PricingCards() {
    return (
        <section className={styles.pricingSection}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={styles.pricingCard}>
                            <div className={styles.pricingIcon}>
                                <Globe size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className={styles.pricingTitle}>Shared Cloud</h3>
                            <div className={styles.pricingAmount}>
                                Starting at $500<span className={styles.pricingPeriod}>/month</span>
                            </div>
                            <p className={styles.pricingDescription}>
                                Usage-based pricing for compute and storage. Secure, organization-ready managed cloud with SSO and
                                governance. Fastest path to value with zero maintenance.
                            </p>
                            <ul className={styles.pricingFeatures}>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Unlimited seats</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>200,000 credits + usage included</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Compute & storage based pricing</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Secure managed cloud</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>SSO & governance</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>All integrations</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Community support</span>
                                </li>
                            </ul>
                            <a
                                href='https://calendly.com/brad-theanswer/answeragent-intro'
                                className={clsx(styles.ctaButton, styles.ctaPrimary)}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Get Started
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.pricingCard, styles.pricingCardEnterprise)}>
                            <div className={styles.pricingIcon}>
                                <Building2 size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className={styles.pricingTitle}>Private Cloud</h3>
                            <div className={styles.pricingAmount}>
                                Custom<span className={styles.pricingPeriod}> Pricing</span>
                            </div>
                            <p className={styles.pricingDescription}>
                                Dedicated single-tenant cloud deployment with enhanced security, compliance controls, and custom SLAs. Fully
                                managed infrastructure with enterprise support.
                            </p>
                            <ul className={styles.pricingFeatures}>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Single-tenant isolation</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Dedicated resources</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Custom compliance controls</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Advanced security</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Dedicated support</span>
                                </li>
                                <li>
                                    <Check size={20} className='text--success' />
                                    <span>Custom SLA guarantees</span>
                                </li>
                            </ul>
                            <a
                                href='https://calendly.com/brad-theanswer/answeragent-intro'
                                className={clsx(styles.ctaButton, styles.ctaSecondary)}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function AddOnsSection() {
    return (
        <section className={styles.addOnsSection}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <h2 className={styles.sectionTitle}>Enterprise Add-Ons</h2>
                        <div className={styles.addOnCard}>
                            <div className={styles.addOnIcon}>
                                <Shield size={48} strokeWidth={1.5} />
                            </div>
                            <h3>J-Link Immutable Tracking</h3>
                            <p>
                                Cryptographic audit trails for regulated companies (SOX, FINRA, HIPAA). Provides tamper-evident data trails
                                for compliance and trust.
                            </p>
                            <div className={styles.addOnCTAs}>
                                <a href='/jlinc-partnership' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                                    Learn More
                                </a>
                                <a
                                    href='https://calendly.com/brad-theanswer/answeragent-intro'
                                    className={clsx(styles.ctaButton, styles.ctaSecondary)}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    Contact Sales
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function FAQSection() {
    const faqs = [
        {
            question: 'Is there a free trial?',
            answer: 'Yes. Try Studio free for 14 days. No credit card required.'
        },
        {
            question: "What's included in 'unlimited users'?",
            answer: 'All team members can use AnswerAgent. No per-seat fees.'
        },
        {
            question: 'Can I switch between cloud and self-hosted?',
            answer: "Yes. We'll help you migrate."
        },
        {
            question: 'What integrations are included?',
            answer: 'All 50+ integrations at no extra cost.'
        },
        {
            question: 'Do you offer volume discounts?',
            answer: 'Contact sales for custom enterprise pricing.'
        }
    ]

    return (
        <section className={styles.faqSection}>
            <div className='container'>
                <h2 className={styles.sectionTitle}>Common Questions</h2>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div className={styles.faqList}>
                            {faqs.map((faq, index) => (
                                <div key={index} className={styles.faqItem}>
                                    <div className={styles.faqQuestion}>
                                        <HelpCircle size={24} className={styles.faqIcon} />
                                        <h3>{faq.question}</h3>
                                    </div>
                                    <p className={styles.faqAnswer}>{faq.answer}</p>
                                </div>
                            ))}
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
                        <h2 className={styles.bottomCTATitle}>Questions about pricing?</h2>
                        <HeroCTA
                            context={{
                                page: 'pricing',
                                section: 'bottom-cta'
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function Pricing(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='Pricing - AnswerAgent'
                description='Simple, transparent pricing for AnswerAgent. Choose Secure Cloud or Self-Hosted Enterprise.'
            >
                <PricingHero />
                <main>
                    <PricingCards />
                    <AddOnsSection />
                    <FAQSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
