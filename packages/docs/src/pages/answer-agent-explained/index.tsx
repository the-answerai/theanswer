import Layout from '@theme/Layout'
import styles from '../new-brand.module.css'
import { Check, Shield, Zap, Cpu, Globe, Database, Layers, BarChart3, ArrowRight } from 'lucide-react'
import Link from '@docusaurus/Link'
import { MagneticGrid, MagneticCard, BeamSection, TiltHero } from '../../components/Modern/CreativeSections'
import NetworkBackground from '../../components/Annimations/NetworkBackground'

export default function AnswerAgentExplained(): JSX.Element {
    return (
        <Layout
            title='AnswerAgent Explained'
            description='The Complete AI Agent Platform. Connect your data. Build your agents. Get insights instantly.'
        >
            <div className={styles.container}>
                {/* Immersive Hero Section */}
                <section
                    className={styles.section}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '80vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                        <NetworkBackground color='var(--ifm-color-primary)' />
                    </div>

                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '1000px', padding: '0 20px' }}>
                        <div className='badge badge--secondary margin-bottom--md' style={{ fontSize: '1rem', padding: '0.5em 1em' }}>
                            The Complete AI Platform
                        </div>
                        <h1 className={styles.heroTitle} style={{ fontSize: '5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                            AnswerAgent <span style={{ color: 'var(--ifm-color-primary)' }}>Explained</span>
                        </h1>
                        <p className={styles.heroSubtitle} style={{ fontSize: '1.5rem', marginBottom: '3rem', opacity: 0.9 }}>
                            Connect your data. Build your agents. Get insights instantly.
                            <br />
                            The only platform that unifies data connections, agent orchestration, and on-demand apps.
                        </p>

                        <div className={styles.buttonGrid} style={{ justifyContent: 'center' }}>
                            <Link
                                to='https://calendly.com/brad-theanswer/answeragent-intro'
                                className='button button--primary button--lg'
                                style={{ minWidth: '200px', fontSize: '1.2rem' }}
                            >
                                Schedule Demo
                            </Link>
                            <Link
                                to='/assessment'
                                className='button button--outline button--secondary button--lg'
                                style={{ minWidth: '200px', fontSize: '1.2rem' }}
                            >
                                Start Assessment
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Three Pillars Visual - Tilt Cards */}
                <section className={styles.section}>
                    <div className='container'>
                        <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            Three Pillars of Intelligence
                        </h2>
                        <div className='row'>
                            <div className='col col--4'>
                                <TiltHero>
                                    <div
                                        className={styles.card}
                                        style={{
                                            height: '100%',
                                            minHeight: '400px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div>
                                            <div style={{ color: 'var(--ifm-color-primary)', marginBottom: '1.5rem' }}>
                                                <Database size={64} />
                                            </div>
                                            <h3 className={styles.cardTitle} style={{ fontSize: '2rem' }}>
                                                AnswerEngine
                                            </h3>
                                            <p className='lead' style={{ fontSize: '1.1rem' }}>
                                                <strong>Your Data, Your Rules.</strong>
                                            </p>
                                            <p style={{ opacity: 0.8 }}>
                                                Connect everything. Control everything. Secure data connections with enterprise permissions.
                                            </p>
                                        </div>
                                        <div className='margin-top--lg'>
                                            <Link to='/data-engine' className='button button--primary button--outline button--block'>
                                                Explore AnswerEngine{' '}
                                                <ArrowRight size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
                                            </Link>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>

                            <div className='col col--4'>
                                <TiltHero>
                                    <div
                                        className={styles.card}
                                        style={{
                                            height: '100%',
                                            minHeight: '400px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div>
                                            <div style={{ color: '#27c93f', marginBottom: '1.5rem' }}>
                                                <Cpu size={64} />
                                            </div>
                                            <h3 className={styles.cardTitle} style={{ fontSize: '2rem' }}>
                                                Agent Studio
                                            </h3>
                                            <p className='lead' style={{ fontSize: '1.1rem' }}>
                                                <strong>Build Agents You Own.</strong>
                                            </p>
                                            <p style={{ opacity: 0.8 }}>
                                                Open-source power. Your infrastructure. Built on LangChain & Flowise.
                                            </p>
                                        </div>
                                        <div className='margin-top--lg'>
                                            <Link to='/agent-studio' className='button button--success button--outline button--block'>
                                                Explore Studio{' '}
                                                <ArrowRight size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
                                            </Link>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>

                            <div className='col col--4'>
                                <TiltHero>
                                    <div
                                        className={styles.card}
                                        style={{
                                            height: '100%',
                                            minHeight: '400px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div>
                                            <div style={{ color: '#a44aff', marginBottom: '1.5rem' }}>
                                                <BarChart3 size={64} />
                                            </div>
                                            <h3 className={styles.cardTitle} style={{ fontSize: '2rem' }}>
                                                On-Demand Apps
                                            </h3>
                                            <p className='lead' style={{ fontSize: '1.1rem' }}>
                                                <strong>Insights When You Need Them.</strong>
                                            </p>
                                            <p style={{ opacity: 0.8 }}>Stop preparing. Start doing. Real-time dashboards and reports.</p>
                                        </div>
                                        <div className='margin-top--lg'>
                                            <Link to='/intelligence-hub' className='button button--secondary button--outline button--block'>
                                                Explore Apps <ArrowRight size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
                                            </Link>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Integration Beam Teaser */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>
                        Unified Intelligence
                    </h2>
                    <p className='text--center lead margin-bottom--lg'>Connecting the world&apos;s best models to your proprietary data.</p>
                    <BeamSection />
                </section>

                {/* Why AnswerAgent - Magnetic Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        Why AnswerAgent?
                    </h2>
                    <MagneticGrid>
                        <MagneticCard>
                            <Globe size={48} className='margin-bottom--md text--primary' />
                            <h3>Complete Platform</h3>
                            <p>
                                Don&apos;t piece together 3 different tools—get data, agents, and insights in one unified platform designed
                                for enterprise scale.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <Layers size={48} className='margin-bottom--md text--success' />
                            <h3>Open-Source Foundation</h3>
                            <p>
                                Built on trusted open-source (LangChain, Flowise). Your orchestration layer should be transparent,
                                extensible, and owned by you.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <Shield size={48} className='margin-bottom--md text--danger' />
                            <h3>Enterprise Security</h3>
                            <p>
                                J-Link Partnership ensures cryptographic provenance and immutable audit trails. SOC2 and HIPAA compliant
                                ready.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <Zap size={48} className='margin-bottom--md text--warning' />
                            <h3>Real-Time Data</h3>
                            <p>On-demand dashboards with real-time data streaming, not overnight batch reports. Make decisions faster.</p>
                        </MagneticCard>
                    </MagneticGrid>
                </section>

                {/* Enterprise Security Deep Dive */}
                <section
                    className={styles.section}
                    style={{
                        background: 'var(--ifm-background-surface-color)',
                        padding: '6rem 2rem',
                        borderRadius: '24px',
                        margin: '4rem 0'
                    }}
                >
                    <div className='container'>
                        <div className='row'>
                            <div className='col col--6'>
                                <div className='badge badge--danger margin-bottom--md'>Security First</div>
                                <h2 style={{ fontSize: '3rem' }}>Enterprise Security</h2>
                                <p className='lead margin-bottom--lg'>
                                    Security isn&apos;t an afterthought. It&apos;s the foundation of autonomous agents.
                                </p>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    <li style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                        <div style={{ background: 'rgba(39, 201, 63, 0.2)', borderRadius: '50%', padding: '5px' }}>
                                            <Check size={20} className='text--success' />
                                        </div>
                                        <div>
                                            <strong>Permission Management</strong>
                                            <div style={{ opacity: 0.7 }}>
                                                Granular control over who sees what. Mirror your existing org chart.
                                            </div>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                        <div style={{ background: 'rgba(39, 201, 63, 0.2)', borderRadius: '50%', padding: '5px' }}>
                                            <Check size={20} className='text--success' />
                                        </div>
                                        <div>
                                            <strong>End-to-End Encryption</strong>
                                            <div style={{ opacity: 0.7 }}>AES-256 encryption at rest and TLS 1.3 in transit.</div>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                        <div style={{ background: 'rgba(39, 201, 63, 0.2)', borderRadius: '50%', padding: '5px' }}>
                                            <Check size={20} className='text--success' />
                                        </div>
                                        <div>
                                            <strong>Immutable Audit Logs</strong>
                                            <div style={{ opacity: 0.7 }}>Track every decision your agents make.</div>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                        <div style={{ background: 'rgba(39, 201, 63, 0.2)', borderRadius: '50%', padding: '5px' }}>
                                            <Check size={20} className='text--success' />
                                        </div>
                                        <div>
                                            <strong>J-Link Partnership</strong>
                                            <div style={{ opacity: 0.7 }}>
                                                Cryptographic provenance for Regulated Companies (SOX, HIPAA).
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                                <div className='margin-top--xl'>
                                    <Link to='/jlinc-partnership' className='button button--primary button--lg'>
                                        Learn About J-Link Security
                                    </Link>
                                </div>
                            </div>
                            <div className='col col--6'>
                                {/* Visual representation of security layers */}
                                <TiltHero>
                                    <div
                                        style={{
                                            background: 'linear-gradient(135deg, #1a1b26 0%, #000 100%)',
                                            height: '100%',
                                            minHeight: '500px',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
                                            <NetworkBackground color='#ff4444' />
                                        </div>
                                        <Shield
                                            size={180}
                                            style={{ color: '#ff4444', filter: 'drop-shadow(0 0 30px rgba(255, 68, 68, 0.4))' }}
                                        />
                                        <div style={{ position: 'absolute', bottom: '40px', textAlign: 'center', width: '100%' }}>
                                            <div className='badge badge--outline' style={{ borderColor: '#ff4444', color: '#ff4444' }}>
                                                SOC 2 Type II Ready
                                            </div>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className={styles.section} style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Ready to transform your workflow?</h2>
                    <p className='lead margin-bottom--xl'>Join the enterprise teams already shipping agents in weeks, not months.</p>
                    <div className={styles.buttonGrid} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                        <Link
                            to='https://calendly.com/brad-theanswer/answeragent-intro'
                            className='button button--primary button--lg'
                            style={{ minWidth: '200px', padding: '1rem 2rem', fontSize: '1.2rem' }}
                        >
                            Schedule Demo
                        </Link>
                        <Link
                            to='/assessment'
                            className='button button--secondary button--lg'
                            style={{ minWidth: '200px', padding: '1rem 2rem', fontSize: '1.2rem' }}
                        >
                            Start Assessment
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    )
}
