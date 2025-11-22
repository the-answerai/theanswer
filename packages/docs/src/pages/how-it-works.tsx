import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import { TiltHero, MagneticCard, MagneticGrid } from '@site/src/components/Modern/CreativeSections'
import { GradientText } from '@site/src/components/Modern'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import IntegrationLogo from '@site/src/components/IntegrationLogo'
import {
    Database,
    Code2,
    BarChart3,
    ArrowRight,
    Shield,
    Zap,
    GitBranch,
    Chrome,
    FileText,
    Image as ImageIcon,
    Video,
    Tags,
    Sparkles
} from 'lucide-react'

const LayoutComponent: any = Layout

function HowItWorksHero() {
    return (
        <header className='hero hero--primary' style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.3 }}>
                <ThreeJsScene />
            </div>
            <div className='container' style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                    How <GradientText>AnswerAgent</GradientText> Works
                </h1>
                <p className='hero__subtitle' style={{ fontSize: '1.5rem', maxWidth: '800px', margin: '0 auto 3rem', opacity: 0.9 }}>
                    Three simple steps to transform how your team works with data
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to='/assessment' className='button button--primary button--lg'>
                        Get AI Assessment
                    </Link>
                    <Link to='https://calendly.com/answerai/enterprise-ai-fit-call' className='button button--secondary button--lg'>
                        Schedule Demo
                    </Link>
                </div>
            </div>
        </header>
    )
}

function ThreeStepsOverview() {
    return (
        <section style={{ padding: '8rem 0', background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--4'>
                        <Link to='/answer-engine' style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div
                                style={{
                                    padding: '3rem 2rem',
                                    textAlign: 'center',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '16px',
                                    border: '2px solid rgba(102, 126, 234, 0.3)',
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)'
                                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.8)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                                        marginBottom: '2rem'
                                    }}
                                >
                                    <Database size={40} className='text--primary' />
                                </div>
                                <div
                                    style={{
                                        fontSize: '3rem',
                                        fontWeight: 'bold',
                                        opacity: 0.3,
                                        marginBottom: '1rem'
                                    }}
                                >
                                    01
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Connect Your Data</h3>
                                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                                    Unified data lake with 20+ integrations, intelligent tagging, and AI summarization
                                </p>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--ifm-color-primary)'
                                    }}
                                >
                                    Learn More <ArrowRight size={18} />
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className='col col--4'>
                        <Link to='/agent-studio' style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div
                                style={{
                                    padding: '3rem 2rem',
                                    textAlign: 'center',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '16px',
                                    border: '2px solid rgba(118, 75, 162, 0.3)',
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)'
                                    e.currentTarget.style.borderColor = 'rgba(118, 75, 162, 0.8)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.borderColor = 'rgba(118, 75, 162, 0.3)'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.2) 0%, rgba(102, 126, 234, 0.2) 100%)',
                                        marginBottom: '2rem'
                                    }}
                                >
                                    <Code2 size={40} className='text--info' />
                                </div>
                                <div
                                    style={{
                                        fontSize: '3rem',
                                        fontWeight: 'bold',
                                        opacity: 0.3,
                                        marginBottom: '1rem'
                                    }}
                                >
                                    02
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Build Your Agents</h3>
                                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                                    Visual builder, code editor, and templates. Create images and videos with AI
                                </p>
                                <div
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ifm-color-info)' }}
                                >
                                    Explore Studio <ArrowRight size={18} />
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className='col col--4'>
                        <Link to='/on-demand-apps' style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div
                                style={{
                                    padding: '3rem 2rem',
                                    textAlign: 'center',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '16px',
                                    border: '2px solid rgba(76, 175, 80, 0.3)',
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)'
                                    e.currentTarget.style.borderColor = 'rgba(76, 175, 80, 0.8)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.borderColor = 'rgba(76, 175, 80, 0.3)'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.2) 100%)',
                                        marginBottom: '2rem'
                                    }}
                                >
                                    <BarChart3 size={40} className='text--success' />
                                </div>
                                <div
                                    style={{
                                        fontSize: '3rem',
                                        fontWeight: 'bold',
                                        opacity: 0.3,
                                        marginBottom: '1rem'
                                    }}
                                >
                                    03
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Get Instant Insights</h3>
                                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                                    Real-time dashboards, on-demand reports, and Chrome extension
                                </p>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--ifm-color-success)'
                                    }}
                                >
                                    See Insights <ArrowRight size={18} />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

function DetailedStep1() {
    const integrations = [
        { domain: 'salesforce.com', name: 'Salesforce' },
        { domain: 'atlassian.com', name: 'Jira' },
        { domain: 'slack.com', name: 'Slack' },
        { domain: 'github.com', name: 'GitHub' },
        { domain: 'google.com', name: 'Google' },
        { domain: 'microsoft.com', name: 'Microsoft' },
        { domain: 'hubspot.com', name: 'HubSpot' },
        { domain: 'zendesk.com', name: 'Zendesk' }
    ]

    return (
        <section style={{ padding: '8rem 0' }}>
            <div className='container'>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            background: 'rgba(102, 126, 234, 0.1)',
                            border: '1px solid rgba(102, 126, 234, 0.3)',
                            borderRadius: '50px',
                            marginBottom: '1.5rem'
                        }}
                    >
                        Step 1
                    </div>
                    <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Connect Your Data</h2>
                    <p className='lead' style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem', opacity: 0.9 }}>
                        All your business tools in one secure, unified platform
                    </p>
                </div>

                <div className='row' style={{ marginBottom: '5rem' }}>
                    <div className='col col--6'>
                        <TiltHero>
                            <div
                                style={{
                                    padding: '3rem',
                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                    borderRadius: '16px',
                                    border: '2px solid rgba(102, 126, 234, 0.3)',
                                    height: '100%'
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: '1.75rem',
                                        marginBottom: '2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}
                                >
                                    <Database size={32} className='text--primary' />
                                    20+ Integrations Ready
                                </h3>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '1.5rem',
                                        marginBottom: '2rem'
                                    }}
                                >
                                    {integrations.map((integration) => (
                                        <div key={integration.domain} style={{ textAlign: 'center' }}>
                                            <IntegrationLogo domain={integration.domain} alt={integration.name} size='md' />
                                        </div>
                                    ))}
                                </div>
                                <Link to='/answer-engine' className='button button--primary button--block'>
                                    View All Integrations →
                                </Link>
                            </div>
                        </TiltHero>
                    </div>

                    <div className='col col--6'>
                        <MagneticGrid>
                            <MagneticCard>
                                <Database size={32} className='text--primary margin-bottom--md' />
                                <h4>Unified Data Lake</h4>
                                <p>Cross-platform search, real-time sync, smart de-duplication across all your tools.</p>
                            </MagneticCard>
                            <MagneticCard>
                                <Tags size={32} className='text--info margin-bottom--md' />
                                <h4>Intelligent Tagging</h4>
                                <p>Auto-classification by topic, sentiment, priority with entity extraction.</p>
                            </MagneticCard>
                            <MagneticCard>
                                <FileText size={32} className='text--success margin-bottom--md' />
                                <h4>AI Summarization</h4>
                                <p>Multi-document synthesis with key takeaways and executive briefings.</p>
                            </MagneticCard>
                            <MagneticCard>
                                <Shield size={32} className='text--warning margin-bottom--md' />
                                <h4>Enterprise Security</h4>
                                <p>AES-256 encryption, zero-trust architecture, and compliance-ready audit trails.</p>
                            </MagneticCard>
                        </MagneticGrid>
                    </div>
                </div>
            </div>
        </section>
    )
}

function DetailedStep2() {
    return (
        <section style={{ padding: '8rem 0', background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            background: 'rgba(118, 75, 162, 0.1)',
                            border: '1px solid rgba(118, 75, 162, 0.3)',
                            borderRadius: '50px',
                            marginBottom: '1.5rem'
                        }}
                    >
                        Step 2
                    </div>
                    <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Build Your Agents</h2>
                    <p className='lead' style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem', opacity: 0.9 }}>
                        Open-source power with visual simplicity
                    </p>
                </div>

                <div className='row' style={{ marginBottom: '4rem' }}>
                    <div className='col col--4'>
                        <TiltHero>
                            <div
                                style={{
                                    padding: '2rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    height: '100%'
                                }}
                            >
                                <Zap size={48} className='text--warning margin-bottom--md' />
                                <h4>Visual Builder</h4>
                                <p>Drag-and-drop components. 100+ pre-built nodes. No coding required.</p>
                            </div>
                        </TiltHero>
                    </div>
                    <div className='col col--4'>
                        <TiltHero>
                            <div
                                style={{
                                    padding: '2rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    height: '100%'
                                }}
                            >
                                <Code2 size={48} className='text--info margin-bottom--md' />
                                <h4>Code Editor</h4>
                                <p>Drop into TypeScript when you need custom logic. Full Git integration.</p>
                            </div>
                        </TiltHero>
                    </div>
                    <div className='col col--4'>
                        <TiltHero>
                            <div
                                style={{
                                    padding: '2rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    height: '100%'
                                }}
                            >
                                <GitBranch size={48} className='text--success margin-bottom--md' />
                                <h4>Deploy Anywhere</h4>
                                <p>Cloud, on-prem, or hybrid. Your infrastructure, your rules.</p>
                            </div>
                        </TiltHero>
                    </div>
                </div>

                <div className='row'>
                    <div className='col col--6'>
                        <div
                            style={{
                                padding: '3rem',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                borderRadius: '16px',
                                border: '2px solid rgba(102, 126, 234, 0.3)',
                                height: '100%'
                            }}
                        >
                            <ImageIcon size={48} className='text--primary margin-bottom--md' />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>AI Image Builder</h3>
                            <p style={{ marginBottom: '1.5rem' }}>
                                Generate production-ready images with DALL-E, Midjourney, Stable Diffusion. Brand consistency, batch
                                generation, auto-resize.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 0 }}>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} className='text--primary' />
                                    <span>Multi-model support</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} className='text--primary' />
                                    <span>Brand style guides</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} className='text--primary' />
                                    <span>Campaign batch generation</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className='col col--6'>
                        <div
                            style={{
                                padding: '3rem',
                                background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
                                borderRadius: '16px',
                                border: '2px solid rgba(118, 75, 162, 0.3)',
                                height: '100%'
                            }}
                        >
                            <Video size={48} className='text--info margin-bottom--md' />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>AI Video Generator</h3>
                            <p style={{ marginBottom: '1.5rem' }}>
                                Create professional videos from scripts or prompts. Text-to-video with AI avatars, screen recording +
                                narration, auto-captions.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 0 }}>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} className='text--info' />
                                    <span>AI avatar narration</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} className='text--info' />
                                    <span>Auto-generate captions</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} className='text--info' />
                                    <span>Multi-language dubbing</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <Link to='/agent-studio' className='button button--primary button--lg'>
                        Explore Agent Studio →
                    </Link>
                </div>
            </div>
        </section>
    )
}

function DetailedStep3() {
    return (
        <section style={{ padding: '8rem 0' }}>
            <div className='container'>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            background: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            borderRadius: '50px',
                            marginBottom: '1.5rem'
                        }}
                    >
                        Step 3
                    </div>
                    <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Get Instant Insights</h2>
                    <p className='lead' style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem', opacity: 0.9 }}>
                        Stop preparing. Start doing.
                    </p>
                </div>

                <div className='row' style={{ marginBottom: '4rem' }}>
                    <div className='col col--4'>
                        <div
                            style={{
                                padding: '3rem 2rem',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                borderRadius: '16px',
                                border: '2px solid rgba(102, 126, 234, 0.3)',
                                height: '100%',
                                textAlign: 'center'
                            }}
                        >
                            <BarChart3 size={56} className='text--primary margin-bottom--md' />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Real-Time Dashboards</h3>
                            <p>Live data from all your tools. Customizable views per role. Embeddable everywhere.</p>
                        </div>
                    </div>

                    <div className='col col--4'>
                        <div
                            style={{
                                padding: '3rem 2rem',
                                background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
                                borderRadius: '16px',
                                border: '2px solid rgba(118, 75, 162, 0.3)',
                                height: '100%',
                                textAlign: 'center'
                            }}
                        >
                            <FileText size={56} className='text--warning margin-bottom--md' />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>On-Demand Reports</h3>
                            <p>Generate polished reports in seconds. PDF/PPT export. AI-written summaries.</p>
                        </div>
                    </div>

                    <div className='col col--4'>
                        <div
                            style={{
                                padding: '3rem 2rem',
                                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)',
                                borderRadius: '16px',
                                border: '2px solid rgba(76, 175, 80, 0.3)',
                                height: '100%',
                                textAlign: 'center'
                            }}
                        >
                            <Chrome size={56} className='text--success margin-bottom--md' />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Chrome Extension</h3>
                            <p>AI assistant everywhere you browse. Summarize pages. Search company data.</p>
                        </div>
                    </div>
                </div>

                <div className='row'>
                    <div className='col col--10 col--offset-1'>
                        <div
                            style={{
                                padding: '4rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                textAlign: 'center'
                            }}
                        >
                            <h3 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Real-World Impact</h3>
                            <div className='row'>
                                <div className='col col--3'>
                                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--ifm-color-primary)' }}>12h</div>
                                    <div style={{ opacity: 0.8 }}>Saved per week</div>
                                </div>
                                <div className='col col--3'>
                                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--ifm-color-success)' }}>30%</div>
                                    <div style={{ opacity: 0.8 }}>Efficiency gain</div>
                                </div>
                                <div className='col col--3'>
                                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--ifm-color-warning)' }}>$24k</div>
                                    <div style={{ opacity: 0.8 }}>Annual savings</div>
                                </div>
                                <div className='col col--3'>
                                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--ifm-color-info)' }}>95%</div>
                                    <div style={{ opacity: 0.8 }}>Team adoption</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <Link to='/on-demand-apps' className='button button--primary button--lg'>
                        Explore Insights Platform →
                    </Link>
                </div>
            </div>
        </section>
    )
}

function FinalCTA() {
    return (
        <section style={{ padding: '8rem 0', background: 'var(--ifm-background-surface-color)' }}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Ready to Transform Your Workflow?</h2>
                            <p className='lead' style={{ fontSize: '1.3rem', marginBottom: '3rem', opacity: 0.9 }}>
                                Get a customized assessment for your business—free, no commitment required
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link to='/assessment' className='button button--primary button--lg' style={{ minWidth: '200px' }}>
                                    Get AI Assessment
                                </Link>
                                <Link
                                    to='https://calendly.com/answerai/enterprise-ai-fit-call'
                                    className='button button--secondary button--lg'
                                    style={{ minWidth: '200px' }}
                                >
                                    Schedule Demo
                                </Link>
                            </div>
                            <p style={{ marginTop: '2rem', opacity: 0.7, fontSize: '0.95rem' }}>
                                📧 Personalized proposal delivered within 24 hours • No sales pressure
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function HowItWorks(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='How It Works - AnswerAgent'
                description='Learn how AnswerAgent connects your data, builds your agents, and delivers instant insights in three simple steps.'
            >
                <HowItWorksHero />
                <main>
                    <ThreeStepsOverview />
                    <DetailedStep1 />
                    <DetailedStep2 />
                    <DetailedStep3 />
                    <FinalCTA />
                </main>
            </LayoutComponent>
        </div>
    )
}
