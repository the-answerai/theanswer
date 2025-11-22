import Layout from '@theme/Layout'
import styles from '../new-brand.module.css'
import { AskAlphaButton } from '../../components/AskAlpha/AskAlphaButton'
import { TiltHero, MagneticGrid, MagneticCard } from '../../components/Modern/CreativeSections'
import InteractiveGrid from '../../components/Annimations/InteractiveGrid'
import { PieChart, TrendingUp, ClipboardList, Calendar, FileText, Clock, DollarSign, ArrowUpRight, Activity } from 'lucide-react'
import Link from '@docusaurus/Link'

export default function OnDemandApps(): JSX.Element {
    return (
        <Layout title='On-Demand Apps' description='Insights When You Need Them. Stop preparing. Start doing.'>
            <div className={styles.container}>
                {/* Hero Section - Interactive Grid Background */}
                <section
                    className={styles.section}
                    style={{
                        position: 'relative',
                        minHeight: '80vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6 }}>
                        <InteractiveGrid />
                    </div>

                    <div className={styles.heroSplit} style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                        <div style={{ paddingRight: '2rem' }}>
                            <div className='badge badge--warning margin-bottom--md'>Pillar 3: On-Demand Apps</div>
                            <h1 className={styles.heroTitle} style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                                Stop preparing.
                                <br /> Start doing.
                            </h1>
                            <p className={styles.heroSubtitle} style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
                                Dashboards that update in real-time. Reports generated on-demand. Save hours on administrative work so you
                                can focus on your actual job.
                            </p>
                            <div className={styles.buttonGrid} style={{ marginTop: '2rem' }}>
                                <Link to='#roi-calculator' className='button button--primary button--lg'>
                                    See ROI Calculator
                                </Link>
                                <AskAlphaButton variant='button' size='large' />
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <Link to='https://calendly.com/answerai/enterprise-ai-fit-call' className='button button--link'>
                                    Schedule Demo &rarr;
                                </Link>
                            </div>
                        </div>
                        <div>
                            <TiltHero>
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #2d1b4e 0%, #1a1033 100%)',
                                        borderRadius: '16px',
                                        padding: '30px',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(164, 74, 255, 0.3)',
                                        minHeight: '400px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '2rem'
                                        }}
                                    >
                                        <h3 style={{ margin: 0, color: '#a44aff' }}>Weekly Business Review</h3>
                                        <span className='badge badge--outline'>Live Data</span>
                                    </div>

                                    {/* Mock Charts */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Revenue</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$1.2M</div>
                                            <div style={{ color: '#4caf50', fontSize: '0.8rem' }}>+12% vs last week</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Active Users</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>45.2k</div>
                                            <div style={{ color: '#4caf50', fontSize: '0.8rem' }}>+5% vs last week</div>
                                        </div>
                                    </div>

                                    <div
                                        style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', flexGrow: 1 }}
                                    >
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>AI Summary</div>
                                        <div style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9 }}>
                                            <p>
                                                Sales team exceeded targets by 15% primarily driven by Enterprise expansion. Churn remains
                                                stable at 0.8%. Recommendation: Double down on the new marketing campaign for Q4.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TiltHero>
                        </div>
                    </div>
                </section>

                {/* Use Cases Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        Apps for Every Workflow
                    </h2>
                    <MagneticGrid>
                        <MagneticCard>
                            <ClipboardList size={48} className='text--warning margin-bottom--md' />
                            <h3>Daily Briefings</h3>
                            <p>
                                Start your day with a consolidated view of what matters. Aggregates calendar, tasks, and urgent emails into
                                a 2-minute read.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <TrendingUp size={48} className='text--warning margin-bottom--md' />
                            <h3>Ticket Triage</h3>
                            <p>
                                Auto-prioritize tickets from Jira and Zendesk. AI analyzes sentiment and urgency to route tickets to the
                                right human instantly.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <PieChart size={48} className='text--warning margin-bottom--md' />
                            <h3>OKR Tracking</h3>
                            <p>
                                Real-time visibility into goal progress. Connects to Salesforce and Jira to auto-update key results without
                                manual entry.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <Calendar size={48} className='text--warning margin-bottom--md' />
                            <h3>Meeting Prep</h3>
                            <p>
                                Instant context before every meeting. Pulls LinkedIn bios, past email history, and relevant docs for every
                                attendee.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <FileText size={48} className='text--warning margin-bottom--md' />
                            <h3>Report Generation</h3>
                            <p>Generate weekly/monthly reports in seconds. Turn raw data into polished PDFs with executive summaries.</p>
                        </MagneticCard>
                        <MagneticCard>
                            <Activity size={48} className='text--warning margin-bottom--md' />
                            <h3>Competitor Watch</h3>
                            <p>Track competitor pricing, news, and product launches automatically. Get alerted only when it matters.</p>
                        </MagneticCard>
                    </MagneticGrid>
                </section>

                {/* ROI Calculator Teaser */}
                <section
                    className={styles.section}
                    id='roi-calculator'
                    style={{
                        background: 'var(--ifm-background-surface-color)',
                        padding: '6rem 2rem',
                        borderRadius: '24px',
                        margin: '4rem 0',
                        textAlign: 'center'
                    }}
                >
                    <div className='container' style={{ maxWidth: '800px' }}>
                        <div className='badge badge--success margin-bottom--md'>ROI Estimator</div>
                        <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Do you really consider this your job?</h2>
                        <p className='lead margin-bottom--xl'>
                            You were hired to engineer, market, and close deals. Not to copy-paste between Jira and Slack.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <div className='card' style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)' }}>
                                <Clock size={32} className='margin-bottom--md text--danger' />
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>12h</div>
                                <p>Avg. admin time per week</p>
                            </div>
                            <div className='card' style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)' }}>
                                <DollarSign size={32} className='margin-bottom--md text--danger' />
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>$24k</div>
                                <p>Lost productivity per year</p>
                            </div>
                            <div className='card' style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)' }}>
                                <ArrowUpRight size={32} className='margin-bottom--md text--success' />
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>30%</div>
                                <p>Efficiency gain with AnswerAgent</p>
                            </div>
                        </div>

                        <Link to='/ai-workshops' className='button button--primary button--lg'>
                            Calculate Your Team&apos;s Savings
                        </Link>
                    </div>
                </section>

                {/* CTA */}
                <section className={styles.section} style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem' }}>Stop preparing. Start doing.</h2>
                    <p className='lead'>Get back to the work that actually matters.</p>
                    <div className={styles.buttonGrid} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                        <Link to='https://calendly.com/answerai/enterprise-ai-fit-call' className='button button--primary button--lg'>
                            Schedule Demo
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    )
}
