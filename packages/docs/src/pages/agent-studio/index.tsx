import Layout from '@theme/Layout'
import styles from '../new-brand.module.css'
import { AskAlphaButton } from '../../components/AskAlpha/AskAlphaButton'
import { TerminalHero, TiltHero, MagneticGrid, MagneticCard } from '../../components/Modern/CreativeSections'
import { Code2, Box, Cloud, Server, GitBranch, Puzzle } from 'lucide-react'
import Link from '@docusaurus/Link'
import InfiniteMarquee from '../../components/Modern/InfiniteMarquee'

export default function AgentStudio(): JSX.Element {
    return (
        <Layout title='Agent Studio' description='Build Agents You Own. Open-source power. Your infrastructure.'>
            <div className={styles.container}>
                {/* Hero Section - Split with Terminal */}
                <section
                    className={styles.section}
                    style={{ paddingTop: '4rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                    <div className={styles.heroSplit}>
                        <div style={{ paddingRight: '2rem' }}>
                            <div className='badge badge--success margin-bottom--md'>Pillar 2: Agent Studio</div>
                            <h1 className={styles.heroTitle} style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                                Open-Source Power.
                                <br /> Your Infrastructure.
                            </h1>
                            <p className={styles.heroSubtitle} style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
                                Built on trusted open-source: LangChain & Flowise. You own your orchestration layer. Deploy to cloud,
                                on-prem, or hybrid environments.
                            </p>
                            <div className={styles.buttonGrid} style={{ marginTop: '2rem' }}>
                                <Link to='https://studio.theanswer.ai' className='button button--primary button--lg'>
                                    Try Free Studio
                                </Link>
                                <AskAlphaButton variant='button' size='large' />
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <Link to='/docs/getting-started' className='button button--link'>
                                    Browse Templates &rarr;
                                </Link>
                            </div>
                        </div>
                        <div>
                            <TerminalHero />
                        </div>
                    </div>
                </section>

                {/* Builder Options - Tilt Cards */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        Build Agents Your Way
                    </h2>
                    <p className='lead text--center margin-bottom--xl'>From no-code visual flows to full typescript control.</p>

                    <div className='row'>
                        <div className='col col--4'>
                            <TiltHero>
                                <div
                                    className='card'
                                    style={{
                                        padding: '2rem',
                                        height: '100%',
                                        background: 'linear-gradient(145deg, #111 0%, #1a1a1a 100%)',
                                        border: '1px solid #333'
                                    }}
                                >
                                    <Box size={64} className='text--success margin-bottom--md' />
                                    <h3>Visual Builder</h3>
                                    <p>
                                        Drag-and-drop components to build complex flows. Connect LLMs, vector stores, and tools visually. No
                                        coding required.
                                    </p>
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.7 }}>
                                        <li>✓ Flowise compatible</li>
                                        <li>✓ 100+ Pre-built nodes</li>
                                        <li>✓ Instant testing</li>
                                    </ul>
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
                                        background: 'linear-gradient(145deg, #111 0%, #1a1a1a 100%)',
                                        border: '1px solid #333'
                                    }}
                                >
                                    <Code2 size={64} className='text--success margin-bottom--md' />
                                    <h3>Code Editor</h3>
                                    <p>
                                        Drop into code when you need custom logic. Write TypeScript functions, custom tools, and advanced
                                        chains.
                                    </p>
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.7 }}>
                                        <li>✓ TypeScript support</li>
                                        <li>✓ Custom Tool definitions</li>
                                        <li>✓ Git integration</li>
                                    </ul>
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
                                        background: 'linear-gradient(145deg, #111 0%, #1a1a1a 100%)',
                                        border: '1px solid #333'
                                    }}
                                >
                                    <Puzzle size={64} className='text--success margin-bottom--md' />
                                    <h3>Templates Gallery</h3>
                                    <p>Start fast with pre-built agents for common use cases. Clone, customize, and deploy in minutes.</p>
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.7 }}>
                                        <li>✓ RAG Chatbots</li>
                                        <li>✓ SQL Analysts</li>
                                        <li>✓ Email Assistants</li>
                                    </ul>
                                </div>
                            </TiltHero>
                        </div>
                    </div>
                </section>

                {/* Ecosystem Marquee */}
                <section
                    className={styles.section}
                    style={{ background: 'var(--ifm-background-surface-color)', padding: '4rem 0', margin: '4rem 0' }}
                >
                    <div className='container'>
                        <div className='row' style={{ alignItems: 'center' }}>
                            <div className='col col--4'>
                                <h2>Open-Source Ecosystem</h2>
                                <p className='lead'>Transparency = Security.</p>
                                <p>We build on the shoulders of giants. Your agent stack is portable, standard, and future-proof.</p>
                                <Link to='https://github.com/the-answerai' className='button button--outline button--success'>
                                    View on GitHub
                                </Link>
                            </div>
                            <div className='col col--8'>
                                <InfiniteMarquee speed={35}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '3rem',
                                            opacity: 0.7,
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            alignItems: 'center',
                                            color: '#fff'
                                        }}
                                    >
                                        <span>LangChain</span>
                                        <span>Flowise</span>
                                        <span>LlamaIndex</span>
                                        <span>OpenAI</span>
                                        <span>Anthropic</span>
                                        <span>HuggingFace</span>
                                        <span>Pinecone</span>
                                        <span>ChromaDB</span>
                                        <span>Supabase</span>
                                        <span>Postgres</span>
                                    </div>
                                </InfiniteMarquee>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Deploy Anywhere - Magnetic Grid */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        Deploy Anywhere
                    </h2>
                    <MagneticGrid>
                        <MagneticCard>
                            <Cloud size={48} className='margin-bottom--md text--info' />
                            <h3>Cloud Hosting</h3>
                            <p>Managed secure cloud. Easiest way to start. Auto-scaling, monitored, and maintained by us.</p>
                        </MagneticCard>
                        <MagneticCard>
                            <Server size={48} className='margin-bottom--md text--info' />
                            <h3>On-Premise</h3>
                            <p>
                                Run on your own servers (Docker/Kubernetes). Total control over your data and infrastructure. Air-gapped
                                ready.
                            </p>
                        </MagneticCard>
                        <MagneticCard>
                            <GitBranch size={48} className='margin-bottom--md text--info' />
                            <h3>Hybrid</h3>
                            <p>
                                Keep sensitive agents on-prem, deploy public-facing agents to cloud. Manage it all from one control plane.
                            </p>
                        </MagneticCard>
                    </MagneticGrid>
                </section>

                {/* CTA */}
                <section className={styles.section} style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem' }}>Start building today.</h2>
                    <p className='lead'>Join thousands of developers building the future of work.</p>
                    <div className={styles.buttonGrid} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                        <Link to='https://studio.theanswer.ai' className='button button--primary button--lg'>
                            Try Free Studio
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    )
}
