import Layout from '@theme/Layout'
import styles from '../new-brand.module.css'
import { TerminalHero, TiltHero, MagneticGrid, MagneticCard } from '../../components/Modern/CreativeSections'
import { Code2, Box, Cloud, Server, GitBranch, Puzzle, Image, Video, Sparkles } from 'lucide-react'
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
                                <Link to='/assessment' className='button button--primary button--lg'>
                                    Get AI Assessment
                                </Link>
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

                {/* Creative AI Capabilities */}
                <section className={styles.section} style={{ padding: '6rem 0', background: 'var(--ifm-background-surface-color)' }}>
                    <div className='container'>
                        <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            Beyond Chat: Creative AI Capabilities
                        </h2>
                        <p className='lead text--center margin-bottom--xl' style={{ maxWidth: '800px', margin: '0 auto 4rem' }}>
                            Build agents that don&apos;t just answer questions—they create images, generate videos, and produce content on
                            demand.
                        </p>

                        <div className='row'>
                            <div className='col col--6'>
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
                                            <Image size={120} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    marginBottom: '1.5rem'
                                                }}
                                            >
                                                <Image size={48} className='text--primary' />
                                                <h3 style={{ margin: 0, fontSize: '1.75rem' }}>AI Image Builder</h3>
                                            </div>
                                            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                                                Generate production-ready images from text prompts using DALL-E, Midjourney, Stable
                                                Diffusion, and more. Perfect for marketing teams, designers, and content creators.
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--primary' />
                                                    <span>Multi-model support (DALL-E, Midjourney, Stable Diffusion)</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--primary' />
                                                    <span>Brand consistency with style guides</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--primary' />
                                                    <span>Batch generation for campaigns</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--primary' />
                                                    <span>Auto-resize for social media</span>
                                                </li>
                                            </ul>
                                            <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>
                                                    <strong>Use Case:</strong> &quot;Generate 5 variations of a product hero image for our
                                                    homepage, optimized for desktop and mobile&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>

                            <div className='col col--6'>
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
                                            <Video size={120} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    marginBottom: '1.5rem'
                                                }}
                                            >
                                                <Video size={48} className='text--info' />
                                                <h3 style={{ margin: 0, fontSize: '1.75rem' }}>AI Video Generator</h3>
                                            </div>
                                            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                                                Create professional video content from scripts, blogs, or prompts. Turn documentation into
                                                tutorials, text into talking-head videos, or automate your video marketing.
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--info' />
                                                    <span>Text-to-video with AI avatars</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--info' />
                                                    <span>Screen recording + AI narration</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--info' />
                                                    <span>Auto-generate captions and subtitles</span>
                                                </li>
                                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Sparkles size={16} className='text--info' />
                                                    <span>Multi-language dubbing</span>
                                                </li>
                                            </ul>
                                            <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>
                                                    <strong>Use Case:</strong> &quot;Convert our product documentation into a 3-minute
                                                    explainer video with voiceover&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TiltHero>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <Link to='/assessment' className='button button--primary button--lg'>
                                Get AI Assessment
                            </Link>
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
                        <Link to='/assessment' className='button button--primary button--lg'>
                            Get AI Assessment
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    )
}
