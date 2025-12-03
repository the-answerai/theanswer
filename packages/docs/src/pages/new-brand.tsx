import { useState } from 'react'
import Layout from '@theme/Layout'
import clsx from 'clsx'
import styles from './new-brand.module.css'
import InteractiveGrid from '../components/Annimations/InteractiveGrid'
import { GradientText } from '../components/Modern'
import { TerminalHero, OrchestrationFlow, TiltHero, MagneticGrid, MagneticCard, BeamSection } from '../components/Modern/CreativeSections'
import {
    Activity,
    Box,
    Check,
    Code2,
    Globe,
    LayoutDashboard,
    MessageSquare,
    Search,
    Settings,
    Shield,
    Sparkles,
    User,
    Zap,
    Cpu,
    Bell
} from 'lucide-react'

const LayoutComponent: any = Layout

export default function NewBrand(): JSX.Element {
    const [activeTab, setActiveTab] = useState('overview')

    return (
        <LayoutComponent title='New Brand Design System' description='Design system and component library for the new brand identity'>
            <div className={styles.container}>
                <header className={styles.section}>
                    <h1>Design System & UI Kit</h1>
                    <p className='lead'>A comprehensive guide to our new brand identity, components, and patterns.</p>
                </header>

                {/* Creative Hero Options */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Creative Hero Concepts</h2>

                    {/* Concept 1: Terminal / Developer Focused */}
                    <div className='margin-bottom--xl'>
                        <h3 className='margin-bottom--md'>1. The Developer Command Center</h3>
                        <div className={styles.heroVariant} style={{ background: '#0f1117' }}>
                            <div className={styles.heroSplit}>
                                <div>
                                    <div className='badge badge--success margin-bottom--md' style={{ fontFamily: 'monospace' }}>
                                        v2.0 RELEASED
                                    </div>
                                    <h2 className={styles.heroTitle} style={{ fontFamily: 'Fira Code, monospace', letterSpacing: '-1px' }}>
                                        $ init agent_swarm
                                    </h2>
                                    <p className={styles.heroSubtitle}>
                                        Programmable infrastructure for autonomous AI agents. Define behavior, set guardrails, and deploy to
                                        the edge with a single command.
                                    </p>
                                    <div className={styles.buttonGrid}>
                                        <button className='button button--primary button--lg' style={{ fontFamily: 'monospace' }}>
                                            Get API Keys
                                        </button>
                                        <button className='button button--secondary button--lg' style={{ fontFamily: 'monospace' }}>
                                            Read Docs
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <TerminalHero />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Concept 2: 3D Tilt Product Hero */}
                    <div className='margin-bottom--xl'>
                        <h3 className='margin-bottom--md'>2. 3D Interactive Product Hero</h3>
                        <div className={styles.heroVariant} style={{ overflow: 'visible' }}>
                            <div className={styles.heroCentered}>
                                <h2 className={styles.heroTitle}>A New Dimension of Control</h2>
                                <p className={styles.heroSubtitle}>
                                    Experience the most powerful agent orchestration dashboard ever built.
                                </p>
                                <TiltHero>
                                    <div
                                        style={{
                                            background: 'linear-gradient(135deg, #1a1b26 0%, #2f334d 100%)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '20px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div
                                                    style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        background: '#ff5f56'
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        background: '#ffbd2e'
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        background: '#27c93f'
                                                    }}
                                                ></div>
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>dashboard.theanswer.ai</div>
                                        </div>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '200px 1fr',
                                                gap: '20px',
                                                height: '300px'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '8px'
                                                }}
                                            ></div>
                                            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '20px' }}>
                                                <div
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '8px'
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 1fr',
                                                        gap: '20px'
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            background: 'rgba(255,255,255,0.05)',
                                                            borderRadius: '8px'
                                                        }}
                                                    ></div>
                                                    <div
                                                        style={{
                                                            background: 'rgba(255,255,255,0.05)',
                                                            borderRadius: '8px'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>
                        </div>
                    </div>

                    {/* Concept 3: Orchestration Flow */}
                    <div className='margin-bottom--xl'>
                        <h3 className='margin-bottom--md'>3. The Orchestration Flow</h3>
                        <div className={styles.heroVariant}>
                            <div className={styles.heroSplit}>
                                <div>
                                    <h2 className={styles.heroTitle}>Connect Everything</h2>
                                    <p className={styles.heroSubtitle}>
                                        Seamlessly link your databases, LLMs, and external APIs into a cohesive intelligence network.
                                    </p>
                                    <ul className='check-list'>
                                        <li style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <Check className='text--success' /> Universal API connectors
                                        </li>
                                        <li style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <Check className='text--success' /> Real-time data streaming
                                        </li>
                                        <li style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <Check className='text--success' /> Automated error recovery
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <OrchestrationFlow />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Concept 4: Magnetic Grid */}
                    <div className='margin-bottom--xl'>
                        <h3 className='margin-bottom--md'>4. Magnetic Feature Grid</h3>
                        <p className='margin-bottom--lg'>Hover over cards to see the spotlight effect.</p>
                        <MagneticGrid>
                            <MagneticCard>
                                <Cpu size={32} className='text--primary margin-bottom--md' />
                                <h3>Neural Core</h3>
                                <p>Advanced reasoning capabilities embedded directly into the orchestration layer.</p>
                            </MagneticCard>
                            <MagneticCard>
                                <Shield size={32} className='text--secondary margin-bottom--md' />
                                <h3>Ironclad Security</h3>
                                <p>Military-grade encryption for all data in transit and at rest.</p>
                            </MagneticCard>
                            <MagneticCard>
                                <Zap size={32} className='text--warning margin-bottom--md' />
                                <h3>Instant Deploy</h3>
                                <p>Go from prototype to production in milliseconds, not months.</p>
                            </MagneticCard>
                        </MagneticGrid>
                    </div>

                    {/* Concept 5: Integration Beam */}
                    <div className='margin-bottom--xl'>
                        <h3 className='margin-bottom--md'>5. The Integration Beam</h3>
                        <div className={styles.heroVariant} style={{ textAlign: 'center' }}>
                            <h2 className={styles.heroTitle}>Bridge the Gap</h2>
                            <p className={styles.heroSubtitle}>Connect your legacy systems with cutting-edge AI.</p>
                            <BeamSection />
                        </div>
                    </div>
                </section>

                {/* Immersive 3D Hero (Previous) */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Previous Hero Concepts</h2>
                    <div className={styles.heroImmersive}>
                        <div className={styles.heroBackground}>
                            <InteractiveGrid />
                        </div>
                        <div className={styles.heroImmersiveContent}>
                            <div
                                className='badge badge--secondary margin-bottom--md'
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff'
                                }}
                            >
                                Next Gen Platform
                            </div>
                            <h2 className={styles.heroTitle} style={{ color: '#fff', fontSize: '4rem', marginBottom: '1.5rem' }}>
                                Orchestrate the <GradientText>Future of AI</GradientText>
                            </h2>
                            <p className={styles.heroSubtitle} style={{ color: 'rgba(255,255,255,0.8)' }}>
                                Deploy autonomous agents that learn, adapt, and scale with your business. The only platform with verified
                                enterprise security.
                            </p>
                            <div className={styles.buttonGrid} style={{ justifyContent: 'center' }}>
                                <button
                                    className='button button--primary button--lg'
                                    style={{ background: 'white', color: 'black', border: 'none' }}
                                >
                                    Get Started Now
                                </button>
                                <button
                                    className='button button--outline button--secondary button--lg'
                                    style={{ color: 'white', borderColor: 'white' }}
                                >
                                    View Documentation
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className='margin-vert--xl' />

                {/* Existing Design System Sections */}
                {/* Typography */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Typography</h2>
                    <div className={styles.typographyGrid}>
                        <div>
                            <h1>Heading 1 - The quick brown fox</h1>
                            <p className='text--muted'>Font-size: 3rem / Weight: 700</p>
                        </div>
                        <div>
                            <h2>Heading 2 - Jumps over the lazy dog</h2>
                            <p className='text--muted'>Font-size: 2.5rem / Weight: 700</p>
                        </div>
                        <div>
                            <h3>Heading 3 - Sphinx of black quartz</h3>
                            <p className='text--muted'>Font-size: 2rem / Weight: 600</p>
                        </div>
                        <div>
                            <h4>Heading 4 - Judge my vow</h4>
                            <p className='text--muted'>Font-size: 1.5rem / Weight: 600</p>
                        </div>
                        <div>
                            <p className='lead'>Lead Text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                            <p>
                                Body Text - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                                nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                            <small>Small Text - Excepteur sint occaecat cupidatat non proident.</small>
                        </div>
                    </div>
                </section>

                {/* Colors */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Colors</h2>
                    <h3>Primary Colors</h3>
                    <div className={styles.colorGrid}>
                        <ColorCard color='var(--ifm-color-primary)' name='Primary' />
                        <ColorCard color='var(--ifm-color-primary-dark)' name='Primary Dark' />
                        <ColorCard color='var(--ifm-color-primary-light)' name='Primary Light' />
                    </div>

                    <h3 style={{ marginTop: '2rem' }}>Neutral Colors</h3>
                    <div className={styles.colorGrid}>
                        <ColorCard color='var(--ifm-background-color)' name='Background' border />
                        <ColorCard color='var(--ifm-background-surface-color)' name='Surface' border />
                        <ColorCard color='var(--ifm-color-emphasis-200)' name='Border' />
                        <ColorCard color='var(--ifm-font-color-base)' name='Text' />
                    </div>

                    <h3 style={{ marginTop: '2rem' }}>Accent Colors</h3>
                    <div className={styles.colorGrid}>
                        <ColorCard color='#ff00ff' name='Magenta' />
                        <ColorCard color='#00ffff' name='Cyan' />
                        <ColorCard color='#ffff00' name='Yellow' />
                    </div>
                </section>

                {/* Buttons */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Buttons</h2>
                    <div className={styles.buttonGrid}>
                        <button className='button button--primary button--lg'>Primary Large</button>
                        <button className='button button--primary'>Primary Default</button>
                        <button className='button button--primary button--sm'>Primary Small</button>

                        <button className='button button--secondary button--lg'>Secondary Large</button>
                        <button className='button button--secondary'>Secondary Default</button>
                        <button className='button button--secondary button--sm'>Secondary Small</button>

                        <button className='button button--outline button--primary'>Outline Primary</button>
                        <button className='button button--outline button--secondary'>Outline Secondary</button>

                        <button className='button button--link'>Link Button</button>

                        <button className='button button--primary' disabled>
                            Disabled
                        </button>
                    </div>
                </section>

                {/* Form Elements */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Form Elements</h2>
                    <div className={styles.formGrid}>
                        <div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor='text-input'>
                                    Text Input
                                </label>
                                <input id='text-input' type='text' className={styles.input} placeholder='Enter text...' />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor='email-input'>
                                    Email Input
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input id='email-input' type='email' className={styles.input} placeholder='john@example.com' />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor='password-input'>
                                    Password
                                </label>
                                <input id='password-input' type='password' className={styles.input} value='password123' readOnly />
                            </div>
                        </div>
                        <div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor='select-input'>
                                    Select Option
                                </label>
                                <select id='select-input' className={styles.input}>
                                    <option>Option 1</option>
                                    <option>Option 2</option>
                                    <option>Option 3</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor='textarea-input'>
                                    Textarea
                                </label>
                                <textarea id='textarea-input' className={styles.input} rows={4} placeholder='Enter long text...'></textarea>
                            </div>
                            <div className={styles.formGroup}>
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <input type='checkbox' />
                                    <span>I agree to the terms and conditions</span>
                                </label>
                            </div>
                            <div className={styles.formGroup}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <input type='radio' name='radio-group' />
                                        <span>Option A</span>
                                    </label>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <input type='radio' name='radio-group' />
                                        <span>Option B</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cards */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Cards & Containers</h2>
                    <div className={styles.cardGrid}>
                        {/* Basic Card */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Basic Card</h3>
                            <p>This is a standard card component used for grouping related content. It has a subtle hover effect.</p>
                            <button className='button button--secondary margin-top--md'>Action</button>
                        </div>

                        {/* Feature Card */}
                        <div className={styles.card}>
                            <div
                                style={{
                                    background: 'var(--ifm-color-primary-lightest)',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1rem',
                                    color: 'var(--ifm-color-primary-darkest)'
                                }}
                            >
                                <Sparkles size={24} />
                            </div>
                            <h3 className={styles.cardTitle}>Feature Highlight</h3>
                            <p>Highlight specific features with an icon and clear typography. Good for landing pages.</p>
                        </div>

                        {/* Pricing/Info Card */}
                        <div className={styles.card} style={{ border: '1px solid var(--ifm-color-primary)' }}>
                            <div className='badge badge--primary margin-bottom--md'>Recommended</div>
                            <h3 className={styles.cardTitle}>Pro Plan</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                $29<span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.7 }}>/mo</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Check size={18} className='text--success' /> Feature One
                                </li>
                                <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Check size={18} className='text--success' /> Feature Two
                                </li>
                                <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Check size={18} className='text--success' /> Feature Three
                                </li>
                            </ul>
                            <button className='button button--primary button--block margin-top--md' style={{ width: '100%' }}>
                                Get Started
                            </button>
                        </div>
                    </div>
                </section>

                {/* Icons */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Iconography</h2>
                    <p className='margin-bottom--lg'>We use Lucide React icons for consistency and clarity.</p>
                    <div className={styles.iconGrid}>
                        <IconItem icon={Activity} name='Activity' />
                        <IconItem icon={Box} name='Box' />
                        <IconItem icon={Code2} name='Code' />
                        <IconItem icon={Globe} name='Globe' />
                        <IconItem icon={LayoutDashboard} name='Dashboard' />
                        <IconItem icon={MessageSquare} name='Chat' />
                        <IconItem icon={Settings} name='Settings' />
                        <IconItem icon={Shield} name='Security' />
                        <IconItem icon={User} name='User' />
                        <IconItem icon={Zap} name='Zap' />
                        <IconItem icon={Search} name='Search' />
                        <IconItem icon={Bell} name='Notifications' />
                    </div>
                </section>

                {/* Interactive Elements */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Interactive States</h2>
                    <div className='alert alert--info margin-bottom--md' role='alert'>
                        <strong>Info:</strong> This is an informational alert message.
                    </div>
                    <div className='alert alert--success margin-bottom--md' role='alert'>
                        <strong>Success:</strong> Operation completed successfully.
                    </div>
                    <div className='alert alert--warning margin-bottom--md' role='alert'>
                        <strong>Warning:</strong> Please check your input.
                    </div>
                    <div className='alert alert--danger margin-bottom--md' role='alert'>
                        <strong>Error:</strong> Something went wrong.
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h3>Tabs</h3>
                        <ul className='tabs' role='tablist'>
                            <li
                                className={clsx('tabs__item', activeTab === 'overview' && 'tabs__item--active')}
                                onClick={() => setActiveTab('overview')}
                                role='tab'
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('overview')
                                }}
                            >
                                Overview
                            </li>
                            <li
                                className={clsx('tabs__item', activeTab === 'code' && 'tabs__item--active')}
                                onClick={() => setActiveTab('code')}
                                role='tab'
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('code')
                                }}
                            >
                                Code
                            </li>
                            <li
                                className={clsx('tabs__item', activeTab === 'preview' && 'tabs__item--active')}
                                onClick={() => setActiveTab('preview')}
                                role='tab'
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('preview')
                                }}
                            >
                                Preview
                            </li>
                        </ul>
                        <div
                            className='margin-top--md padding--md'
                            style={{
                                border: '1px solid var(--ifm-color-emphasis-200)',
                                borderRadius: '0 0 8px 8px'
                            }}
                        >
                            Tab Content for {activeTab}
                        </div>
                    </div>
                </section>
            </div>
        </LayoutComponent>
    )
}

function ColorCard({ color, name, border = false }: { color: string; name: string; border?: boolean }) {
    return (
        <div className={styles.colorCard}>
            <div
                className={styles.colorPreview}
                style={{
                    backgroundColor: color,
                    borderBottom: border ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}
            />
            <div className={styles.colorInfo}>
                <span className={styles.colorName}>{name}</span>
                <span className={styles.colorHex}>{color}</span>
            </div>
        </div>
    )
}

function IconItem({ icon: Icon, name }: { icon: any; name: string }) {
    return (
        <div className={styles.iconItem}>
            <Icon size={24} />
            <span className={styles.iconName}>{name}</span>
        </div>
    )
}
