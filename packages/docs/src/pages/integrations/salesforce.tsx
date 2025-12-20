import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { CheckCircle2, Zap, Clock, TrendingUp, Users, BarChart3, Target, Lightbulb, Shield } from 'lucide-react'
import styles from './salesforce.module.css'

const LayoutComponent: any = Layout

const LOGOKIT_TOKEN = 'pk_fr8710fea017bdf10b13fe'
const CALENDLY_URL = 'https://calendly.com/brad-theanswer/answeragent-intro'
const DOCS_URL = '/docs/integrations/salesforce'

export default function SalesforcePage() {
    const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AnswerAgent AI - Salesforce Integration',
        applicationCategory: 'BusinessApplication',
        description:
            'AI-powered Salesforce automation that saves 50+ hours per week. Automate lead qualification, opportunity management, case routing, and more with AI that actually works.',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '127'
        },
        featureList: [
            'AI-powered lead qualification',
            'Automated opportunity management',
            'Intelligent case routing',
            'Sales forecasting with AI',
            'Account enrichment',
            'Automated report generation',
            'OAuth 2.0 & API authentication',
            'SOQL query execution',
            'Sandbox & production support',
            'Multi-org connections'
        ],
        provider: {
            '@type': 'Organization',
            name: 'AnswerAgent AI',
            url: 'https://theanswer.ai'
        }
    }

    return (
        <LayoutComponent
            title='Salesforce Integration - AI that actually works'
            description='Save 50+ hours per week with AI-powered Salesforce automation. Set up in under 5 minutes. Be better at your job with intelligent CRM workflows.'
        >
            <JsonLd data={jsonLdData} />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <ThreeJsScene />
                </div>
                <div className={styles.heroContent}>
                    <div className={styles.logoContainer}>
                        <img
                            src={`https://img.logokit.com/salesforce.com?token=${LOGOKIT_TOKEN}`}
                            alt='Salesforce Logo'
                            className={styles.logo}
                        />
                    </div>
                    <h1 className={styles.heroTitle}>
                        Salesforce AI Automation <span className={styles.highlight}>That Actually Works</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Save 50+ hours per week with intelligent CRM automation. Set up in under 5 minutes. Be better at your job with AI
                        agents that qualify leads, manage opportunities, and extract insights automatically.
                    </p>

                    <div className={styles.heroBadges}>
                        <div className={styles.badge}>
                            <CheckCircle2 size={16} />
                            <span>AI that actually works</span>
                        </div>
                        <div className={styles.badge}>
                            <Zap size={16} />
                            <span>Set up in under 5 minutes</span>
                        </div>
                        <div className={styles.badge}>
                            <Clock size={16} />
                            <span>Save 50+ hours/week</span>
                        </div>
                        <div className={styles.badge}>
                            <TrendingUp size={16} />
                            <span>Be better at your job</span>
                        </div>
                    </div>

                    <div className={styles.ctaGroup}>
                        <a href={CALENDLY_URL} target='_blank' rel='noopener noreferrer' className={styles.primaryCta}>
                            <Users size={20} />
                            Book a Demo
                        </a>
                        <a href={DOCS_URL} className={styles.secondaryCta}>
                            <Lightbulb size={20} />
                            View Setup Guide
                        </a>
                    </div>

                    <p className={styles.trustIndicator}>
                        <Shield size={14} />
                        No credit card required • Cancel anytime • 14-day free trial
                    </p>
                </div>
            </section>

            {/* Value Props Section */}
            <section className={styles.valueProps}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Why Teams Choose AnswerAgent for Salesforce</h2>
                    <div className={styles.valueGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <Zap size={32} />
                            </div>
                            <h3>Lightning Fast Setup</h3>
                            <p>
                                Connect Salesforce in under 5 minutes with OAuth or API authentication. No complex configuration, no
                                technical expertise required.
                            </p>
                            <div className={styles.metric}>⚡ 5 min setup</div>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <Clock size={32} />
                            </div>
                            <h3>Save 50+ Hours Weekly</h3>
                            <p>
                                Automate lead qualification, opportunity updates, case routing, and reporting. Let AI handle the repetitive
                                work while you focus on strategy.
                            </p>
                            <div className={styles.metric}>⏰ 50+ hrs/week saved</div>
                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>
                                <TrendingUp size={32} />
                            </div>
                            <h3>Be Better at Your Job</h3>
                            <p>
                                Make smarter decisions with AI-powered insights. Close deals faster with automated follow-ups. Deliver
                                better customer experiences with intelligent case resolution.
                            </p>
                            <div className={styles.metric}>📈 10x productivity</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className={styles.useCases}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>What You Can Automate</h2>
                    <p className={styles.sectionSubtitle}>Real-world use cases that save time and drive results</p>

                    <div className={styles.useCaseGrid}>
                        <div className={styles.useCaseCard}>
                            <div className={styles.useCaseIcon}>
                                <Target size={28} />
                            </div>
                            <h3>AI-Powered Lead Qualification</h3>
                            <p>
                                Automatically score and qualify leads based on custom criteria. Enrich with external data. Route to the
                                right sales rep instantly.
                            </p>
                            <div className={styles.timeSaved}>⏱️ 12 hours saved/week</div>
                        </div>

                        <div className={styles.useCaseCard}>
                            <div className={styles.useCaseIcon}>
                                <TrendingUp size={28} />
                            </div>
                            <h3>Automated Opportunity Management</h3>
                            <p>
                                Update opportunity stages automatically. Identify at-risk deals. Generate next best actions and follow-up
                                tasks for sales reps.
                            </p>
                            <div className={styles.timeSaved}>⏱️ 10 hours saved/week</div>
                        </div>

                        <div className={styles.useCaseCard}>
                            <div className={styles.useCaseIcon}>
                                <Users size={28} />
                            </div>
                            <h3>Intelligent Case Routing</h3>
                            <p>
                                Route support cases to the right team instantly. Suggest knowledge base articles. Draft responses
                                automatically. Escalate complex issues with context.
                            </p>
                            <div className={styles.timeSaved}>⏱️ 15 hours saved/week</div>
                        </div>

                        <div className={styles.useCaseCard}>
                            <div className={styles.useCaseIcon}>
                                <BarChart3 size={28} />
                            </div>
                            <h3>Sales Forecasting & Insights</h3>
                            <p>
                                Generate intelligent forecasts from historical data. Identify trends and patterns. Create executive
                                dashboards and reports automatically.
                            </p>
                            <div className={styles.timeSaved}>⏱️ 8 hours saved/week</div>
                        </div>

                        <div className={styles.useCaseCard}>
                            <div className={styles.useCaseIcon}>
                                <CheckCircle2 size={28} />
                            </div>
                            <h3>Account Enrichment</h3>
                            <p>
                                Identify and merge duplicate records. Enrich accounts with external data. Standardize formats. Validate
                                contact information automatically.
                            </p>
                            <div className={styles.timeSaved}>⏱️ 6 hours saved/week</div>
                        </div>

                        <div className={styles.useCaseCard}>
                            <div className={styles.useCaseIcon}>
                                <BarChart3 size={28} />
                            </div>
                            <h3>Automated Report Generation</h3>
                            <p>
                                Create custom reports on schedule. Summarize key metrics with natural language insights. Distribute via
                                email or Slack automatically.
                            </p>
                            <div className={styles.timeSaved}>⏱️ 5 hours saved/week</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className={styles.howItWorks}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>How It Works</h2>
                    <p className={styles.sectionSubtitle}>Get started in minutes, not weeks</p>

                    <div className={styles.stepsContainer}>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>1</div>
                            <div className={styles.stepContent}>
                                <h3>Connect Salesforce</h3>
                                <p>
                                    Choose OAuth for secure user access or API authentication for service accounts. Set up in under 5
                                    minutes with our guided setup.
                                </p>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.stepNumber}>2</div>
                            <div className={styles.stepContent}>
                                <h3>Build Your Workflow</h3>
                                <p>
                                    Use our visual builder to create AI-powered automations. No coding required. Choose from pre-built
                                    templates or create custom workflows.
                                </p>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <div className={styles.stepContent}>
                                <h3>Watch AI Work</h3>
                                <p>
                                    Let AI agents handle the repetitive work. Get instant results. Monitor performance. Adjust and optimize
                                    as needed. Be better at your job.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.ctaCenter}>
                        <a href={CALENDLY_URL} target='_blank' rel='noopener noreferrer' className={styles.primaryCta}>
                            <Users size={20} />
                            Book a Demo Now
                        </a>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className={styles.finalCta}>
                <div className={styles.container}>
                    <h2 className={styles.finalCtaTitle}>
                        Ready to Save 50+ Hours Per Week <span className={styles.highlight}>with Salesforce AI?</span>
                    </h2>
                    <p className={styles.finalCtaSubtitle}>
                        Join hundreds of teams using AnswerAgent to automate their Salesforce workflows. Set up in under 5 minutes. No
                        credit card required.
                    </p>

                    <div className={styles.ctaGroup}>
                        <a href={CALENDLY_URL} target='_blank' rel='noopener noreferrer' className={styles.primaryCtaLarge}>
                            <Users size={24} />
                            Book a Demo
                        </a>
                        <a href={DOCS_URL} className={styles.secondaryCtaLarge}>
                            <Lightbulb size={24} />
                            View Setup Guide
                        </a>
                    </div>

                    <div className={styles.finalTrustIndicators}>
                        <div className={styles.trustBadge}>
                            <CheckCircle2 size={18} />
                            <span>AI that actually works</span>
                        </div>
                        <div className={styles.trustBadge}>
                            <Shield size={18} />
                            <span>Enterprise-grade security</span>
                        </div>
                        <div className={styles.trustBadge}>
                            <Users size={18} />
                            <span>Trusted by 500+ teams</span>
                        </div>
                        <div className={styles.trustBadge}>
                            <TrendingUp size={18} />
                            <span>4.9/5 rating</span>
                        </div>
                    </div>
                </div>
            </section>
        </LayoutComponent>
    )
}
