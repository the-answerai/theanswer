import Layout from '@theme/Layout'
import styles from '../new-brand.module.css'
import { TiltHero, MagneticGrid, MagneticCard } from '../../components/Modern/CreativeSections'
import InteractiveGrid from '../../components/Annimations/InteractiveGrid'
import { PieChart, TrendingUp, ClipboardList, Calendar, FileText, Activity, BarChart3, Chrome, Sparkles } from 'lucide-react'
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
                                <Link to='/assessment' className='button button--primary button--lg'>
                                    Start AI Assessment
                                </Link>
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <Link to='https://calendly.com/brad-theanswer/answeragent-intro' className='button button--link'>
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

                {/* Three Core Features: Dashboards, Reports, Chrome Extension */}
                <section className={styles.section} style={{ padding: '6rem 0', background: 'var(--ifm-background-surface-color)' }}>
                    <div className='container'>
                        <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            Three Ways to Get Instant Insights
                        </h2>
                        <p className='lead text--center margin-bottom--xl' style={{ maxWidth: '800px', margin: '0 auto 4rem' }}>
                            Whether you&apos;re at your desk, in a meeting, or on the go—AnswerAgent delivers the insights you need, when
                            you need them.
                        </p>

                        <div className='row' style={{ marginBottom: '4rem' }}>
                            <div className='col col--4'>
                                <TiltHero>
                                    <div
                                        className='card'
                                        style={{
                                            padding: '3rem',
                                            height: '100%',
                                            background:
                                                'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                            border: '2px solid rgba(102, 126, 234, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.1 }}>
                                            <BarChart3 size={100} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <BarChart3 size={48} className='text--primary margin-bottom--md' />
                                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Real-Time Dashboards</h3>
                                            <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
                                                Live dashboards that auto-update with data from all your tools. No manual refreshes. No
                                                outdated spreadsheets. Just real-time visibility into what matters.
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 0 }}>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--primary'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Sales pipeline, team velocity, customer health scores</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--primary'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Customizable views per role (executive, manager, IC)</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--primary'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Embeddable in Slack, Teams, or your intranet</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--primary'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Smart alerts when metrics deviate</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>

                            <div className='col col--4'>
                                <TiltHero>
                                    <div
                                        className='card'
                                        style={{
                                            padding: '3rem',
                                            height: '100%',
                                            background:
                                                'linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
                                            border: '2px solid rgba(118, 75, 162, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.1 }}>
                                            <FileText size={100} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <FileText size={48} className='text--warning margin-bottom--md' />
                                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>On-Demand Reports</h3>
                                            <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
                                                Generate polished reports in seconds, not hours. AnswerAgent pulls data, creates
                                                visualizations, and writes executive summaries automatically.
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 0 }}>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--warning'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Weekly/monthly/quarterly business reviews</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--warning'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Export to PDF, PowerPoint, or Google Slides</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--warning'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>AI-written summaries and insights</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--warning'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Scheduled delivery to stakeholders</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>

                            <div className='col col--4'>
                                <TiltHero>
                                    <div
                                        className='card'
                                        style={{
                                            padding: '3rem',
                                            height: '100%',
                                            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)',
                                            border: '2px solid rgba(76, 175, 80, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.1 }}>
                                            <Chrome size={100} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <Chrome size={48} className='text--success margin-bottom--md' />
                                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Chrome Extension</h3>
                                            <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
                                                Your AI assistant follows you everywhere on the web. Get context, summaries, and answers
                                                without leaving your current tab.
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 0 }}>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--success'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Summarize any webpage or document instantly</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--success'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Search your company data from anywhere</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--success'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Side-panel chat with full context awareness</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                                    <Sparkles
                                                        size={16}
                                                        className='text--success'
                                                        style={{ marginTop: '0.2rem', flexShrink: 0 }}
                                                    />
                                                    <span>Works in Salesforce, Jira, Gmail, LinkedIn</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Link to='/assessment' className='button button--primary button--lg'>
                                Get AI Assessment
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Use Cases Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        Agents for Every Workflow
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

                {/* CTA */}
                <section className={styles.section} style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem' }}>Stop preparing. Start doing.</h2>
                    <p className='lead'>Get back to the work that actually matters.</p>
                    <div className={styles.buttonGrid} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                        <Link to='https://calendly.com/brad-theanswer/answeragent-intro' className='button button--primary button--lg'>
                            Schedule Demo
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    )
}
