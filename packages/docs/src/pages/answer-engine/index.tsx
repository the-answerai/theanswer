import Layout from '@theme/Layout'
import styles from '../new-brand.module.css'
import { AskAlphaButton } from '../../components/AskAlpha/AskAlphaButton'
import { Shield, Lock, Link as LinkIcon, Server, Network, Zap } from 'lucide-react'
import Link from '@docusaurus/Link'
import { MagneticCard, TiltHero, OrchestrationFlow, MagneticGrid } from '../../components/Modern/CreativeSections'
import InfiniteMarquee from '../../components/Modern/InfiniteMarquee'

export default function AnswerEngine(): JSX.Element {
    return (
        <Layout title='AnswerEngine' description='Connect everything. Control everything. All your data connections in one place.'>
            <div className={styles.container}>
                {/* Hero Section - Orchestration Flow */}
                <section
                    className={styles.section}
                    style={{ paddingTop: '4rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                    <div className='row' style={{ alignItems: 'center' }}>
                        <div className='col col--5'>
                            <div className='badge badge--primary margin-bottom--md'>Pillar 1: AnswerEngine</div>
                            <h1 className={styles.heroTitle} style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                                Your Data,
                                <br /> Your Rules
                            </h1>
                            <p className={styles.heroSubtitle} style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
                                Connect all your business tools with enterprise-grade security and control. AnswerEngine handles all
                                connections, permissions, and compliance so your agents can act safely.
                            </p>

                            <div className={styles.buttonGrid} style={{ marginTop: '2rem' }}>
                                <Link to='/ai-workshops' className='button button--primary button--lg'>
                                    Start Data Assessment
                                </Link>
                                <AskAlphaButton variant='button' size='large' />
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <Link to='https://calendly.com/answerai/enterprise-ai-fit-call' className='button button--link'>
                                    Schedule Demo &rarr;
                                </Link>
                            </div>
                        </div>
                        <div className='col col--7'>
                            <OrchestrationFlow />
                        </div>
                    </div>
                </section>

                {/* Integrations Marquee */}
                <section
                    className={styles.section}
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        padding: '4rem 0',
                        background: 'rgba(255,255,255,0.02)'
                    }}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem', opacity: 0.7 }}>
                        Connects with 50+ Enterprise Data Sources
                    </h2>
                    <InfiniteMarquee speed={30}>
                        <div
                            style={{
                                display: 'flex',
                                gap: '4rem',
                                opacity: 0.8,
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: 'var(--ifm-color-emphasis-800)',
                                alignItems: 'center'
                            }}
                        >
                            <span>Salesforce</span>
                            <span>Jira</span>
                            <span>Slack</span>
                            <span>GitHub</span>
                            <span>Google Drive</span>
                            <span>SharePoint</span>
                            <span>Zendesk</span>
                            <span>HubSpot</span>
                            <span>Notion</span>
                            <span>Linear</span>
                            <span>Confluence</span>
                            <span>ServiceNow</span>
                            <span>PostgreSQL</span>
                            <span>Snowflake</span>
                        </div>
                    </InfiniteMarquee>
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <Link to='/docs/integrations' className='button button--outline button--primary'>
                            View All Integrations
                        </Link>
                    </div>
                </section>

                {/* Security & Permissions Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        Enterprise Security Core
                    </h2>
                    <p className='lead text--center margin-bottom--xl' style={{ maxWidth: '700px', margin: '0 auto 4rem' }}>
                        The only AI platform built with a security-first architecture designed for regulated industries.
                    </p>

                    <MagneticGrid>
                        <MagneticCard>
                            <Shield size={48} className='text--primary margin-bottom--md' />
                            <h3>Permission Management</h3>
                            <p>
                                Granular control over who sees what. We ingest and mirror your existing Access Control Lists (ACLs) from
                                source systems.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <Lock size={48} className='text--primary margin-bottom--md' />
                            <h3>Zero-Trust Architecture</h3>
                            <p>
                                Military-grade encryption at rest (AES-256) and in transit (TLS 1.3). Your data never leaves the secure
                                enclave without authorization.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <LinkIcon size={48} className='text--primary margin-bottom--md' />
                            <h3>J-Link Partnership</h3>
                            <p>
                                Cryptographic provenance for compliance. Every agent action is signed and verifiable. Ideal for Finance,
                                Healthcare, and Legal.
                            </p>
                            <div className='margin-top--md'>
                                <Link to='/jlinc-partnership' className='button button--sm button--secondary'>
                                    Learn about J-Link
                                </Link>
                            </div>
                        </MagneticCard>
                        <MagneticCard>
                            <Network size={48} className='text--primary margin-bottom--md' />
                            <h3>Private Cloud Ready</h3>
                            <p>Deploy AnswerEngine in your own VPC. Keep data residency within your controlled environment.</p>
                        </MagneticCard>
                    </MagneticGrid>
                </section>

                {/* How It Works - Process Steps */}
                <section
                    className={styles.section}
                    style={{ background: 'var(--ifm-background-surface-color)', padding: '6rem 2rem', borderRadius: '24px' }}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '2.5rem' }}>How It Works</h2>
                    <div className='row'>
                        <div className='col col--4'>
                            <TiltHero>
                                <div
                                    className='card'
                                    style={{
                                        padding: '2rem',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '4rem',
                                            fontWeight: 'bold',
                                            color: 'var(--ifm-color-primary)',
                                            opacity: 0.2,
                                            marginBottom: '-2rem'
                                        }}
                                    >
                                        01
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', position: 'relative' }}>Connect Data</h3>
                                    <div
                                        style={{ margin: '1.5rem 0', height: '2px', width: '50px', background: 'var(--ifm-color-primary)' }}
                                    ></div>
                                    <p>
                                        Connect your data sources in minutes using our secure OAuth connectors. We index metadata while
                                        keeping raw data secure.
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <Server size={32} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                            </TiltHero>
                        </div>
                        <div className='col col--4'>
                            <TiltHero>
                                <div
                                    className='card'
                                    style={{
                                        padding: '2rem',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '4rem',
                                            fontWeight: 'bold',
                                            color: 'var(--ifm-color-primary)',
                                            opacity: 0.2,
                                            marginBottom: '-2rem'
                                        }}
                                    >
                                        02
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', position: 'relative' }}>Set Permissions</h3>
                                    <div
                                        style={{ margin: '1.5rem 0', height: '2px', width: '50px', background: 'var(--ifm-color-primary)' }}
                                    ></div>
                                    <p>
                                        Define who can access what. AnswerEngine enforces your rules at the query level, ensuring agents
                                        never leak sensitive info.
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <Shield size={32} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                            </TiltHero>
                        </div>
                        <div className='col col--4'>
                            <TiltHero>
                                <div
                                    className='card'
                                    style={{
                                        padding: '2rem',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '4rem',
                                            fontWeight: 'bold',
                                            color: 'var(--ifm-color-primary)',
                                            opacity: 0.2,
                                            marginBottom: '-2rem'
                                        }}
                                    >
                                        03
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', position: 'relative' }}>Enable Agents</h3>
                                    <div
                                        style={{ margin: '1.5rem 0', height: '2px', width: '50px', background: 'var(--ifm-color-primary)' }}
                                    ></div>
                                    <p>
                                        Your agents can now use this data safely to answer questions and perform tasks, with full audit
                                        trails of every access.
                                    </p>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <Zap size={32} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                            </TiltHero>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className={styles.section} style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem' }}>Ready to secure your AI data layer?</h2>
                    <p className='lead'>Start your free data assessment today.</p>
                    <div className={styles.buttonGrid} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                        <Link to='/ai-workshops' className='button button--primary button--lg' style={{ minWidth: '200px' }}>
                            Start Assessment
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    )
}
