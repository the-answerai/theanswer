import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import UsingAnswerAgentAISubmenu from '@site/src/components/UsingAnswerAgentAISubmenu'

import styles from './index.module.css'

// Work around React type mismatch by using any-typed Layout component, as used elsewhere
const LayoutComponent: any = Layout

function AgentsHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>AI Agents</h1>
                <p className={styles.heroSubtitle}>
                    Intelligent AI agents that understand your needs, connect to your tools, and execute complex workflows autonomously to
                    supercharge your productivity.
                </p>
                <div className={styles.heroCTAs}>
                    <a href='https://calendly.com/brad-theanswer/answeragent-intro' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                        Schedule a Demo
                    </a>
                    <div className={styles.secondaryLinks}>
                        <a href='/docs/agents' className={styles.secondaryLink}>
                            📚 View Documentation
                        </a>
                        <a href='#what-is-agent' className={styles.secondaryLink}>
                            🤖 What is an Agent?
                        </a>
                    </div>
                </div>
            </div>
        </header>
    )
}

function WhatIsAnAgent() {
    return (
        <section className={styles.featuresSection} id='what-is-agent'>
            <div className='container'>
                <h2 className='text--center'>What is an AI Agent?</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    An AI agent is an autonomous system that can perceive, reason, and act to achieve specific goals
                </p>
                <div className='row'>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>🧠</div>
                            <h3>Intelligent Reasoning</h3>
                            <p>
                                Agents use advanced AI models to understand context, analyze information, and make intelligent decisions
                                based on your specific requirements and goals.
                            </p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>🔗</div>
                            <h3>Tool Integration</h3>
                            <p>
                                Connect to APIs, databases, and services. Agents can interact with your existing tools and platforms to
                                gather information and execute actions.
                            </p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>⚡</div>
                            <h3>Autonomous Execution</h3>
                            <p>
                                Once configured, agents work independently to complete complex workflows, making decisions and taking
                                actions without constant human intervention.
                            </p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>🔄</div>
                            <h3>Continuous Learning</h3>
                            <p>
                                Agents improve over time by learning from interactions, feedback, and new data to become more effective at
                                achieving your objectives.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function AgentToolIntegrations() {
    const integrations = [
        // AI Models - Top Priority
        {
            name: 'OpenAI GPT',
            icon: '🤖',
            description: 'Advanced language models for reasoning, analysis, and content generation',
            category: 'AI Models'
        },
        {
            name: 'Anthropic Claude',
            icon: '🧠',
            description: 'Sophisticated AI assistant for complex reasoning and analysis tasks',
            category: 'AI Models'
        },
        {
            name: 'Google Gemini',
            icon: '💎',
            description: 'Multimodal AI for text, vision, and advanced reasoning capabilities',
            category: 'AI Models'
        },

        // Data & Research
        {
            name: 'Exa Search',
            icon: '🔍',
            description: 'AI-powered semantic search for finding relevant web content',
            category: 'Research'
        },
        {
            name: 'Firecrawl',
            icon: '🔥',
            description: 'Web scraping and data extraction for clean, structured content',
            category: 'Data'
        },
        {
            name: 'Brave Search',
            icon: '🦁',
            description: 'Privacy-focused search API for real-time web information',
            category: 'Research'
        },

        // Business Platforms
        {
            name: 'Salesforce',
            icon: '☁️',
            description: 'CRM integration for customer data and sales automation',
            category: 'Business'
        },
        {
            name: 'Slack',
            icon: '💬',
            description: 'Team communication and workflow automation',
            category: 'Communication'
        },
        {
            name: 'Gmail',
            icon: '📧',
            description: 'Email automation and intelligent message processing',
            category: 'Communication'
        },

        // Development Tools
        {
            name: 'GitHub',
            icon: '🐙',
            description: 'Code repository management and development workflow automation',
            category: 'Development'
        },
        {
            name: 'Jira',
            icon: '📋',
            description: 'Project management and issue tracking integration',
            category: 'Project Management'
        },
        {
            name: 'Notion',
            icon: '📝',
            description: 'Knowledge management and document automation',
            category: 'Productivity'
        },

        // Design & Media
        {
            name: 'Figma',
            icon: '🎨',
            description: 'Design file processing and creative workflow automation',
            category: 'Design'
        },
        {
            name: 'YouTube',
            icon: '📺',
            description: 'Video content analysis and media workflow integration',
            category: 'Media'
        },

        // Infrastructure
        {
            name: 'Amazon S3',
            icon: '📦',
            description: 'Cloud storage and file management automation',
            category: 'Infrastructure'
        },
        {
            name: 'PostgreSQL',
            icon: '🗄️',
            description: 'Database operations and data management workflows',
            category: 'Database'
        }
    ]

    return (
        <section className={styles.missionSection}>
            <div className='container'>
                <h2 className='text--center'>Agent Tool Integrations</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Connect your agents to the tools and platforms you already use
                </p>

                <div className='row'>
                    {integrations.map((integration, index) => (
                        <div key={index} className='col col--4' style={{ marginBottom: '2rem' }}>
                            <div className={styles.featureCard} style={{ height: '100%' }}>
                                <div className={styles.appIcon} style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                                    {integration.icon}
                                </div>
                                <h3 style={{ marginBottom: '0.5rem' }}>{integration.name}</h3>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        color: '#667eea',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        display: 'inline-block',
                                        marginBottom: '1rem'
                                    }}
                                >
                                    {integration.category}
                                </div>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{integration.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem' }}>
                        Need a custom integration? Our team can build it for you.
                    </p>
                    <a href='https://discord.gg/X54ywt8pzj' className={clsx(styles.ctaButton, styles.ctaSecondary)}>
                        Request Integration
                    </a>
                </div>
            </div>
        </section>
    )
}

function FeaturedApps() {
    return (
        <section className={styles.featuresSection} id='featured-apps'>
            <div className='container'>
                <h2 className='text--center'>Agent Apps</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Pre-built AI agents designed to solve specific problems and enhance productivity
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>📊</div>
                            <h3>CSV Transformer</h3>
                            <p>
                                Effortlessly clean, reformat, and analyze your CSV data using intelligent AI algorithms. Perfect for data
                                preparation, reporting, and ensuring data quality.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>✨ Smart Data Cleaning</span>
                                <span>🔄 Format Conversion</span>
                                <span>📈 Analysis Tools</span>
                                <span>🛡️ Secure Processing</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={styles.featureCardCTA}>
                                Launch App →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>🎨</div>
                            <h3>Image Creator</h3>
                            <p>
                                Generate stunning, unique images from text descriptions or transform existing images with AI-powered
                                enhancements. Perfect for marketing and creative projects.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🖼️ Text-to-Image</span>
                                <span>✨ Image Enhancement</span>
                                <span>🎭 Style Transfer</span>
                                <span>📱 High Quality</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={styles.featureCardCTA}>
                                Launch App →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>🔍</div>
                            <h3>Deep Research</h3>
                            <p>
                                Harness the power of AI to analyze both external web data and internal company information. Generate
                                comprehensive research reports and insights instantly.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🌐 External Data Mining</span>
                                <span>📂 Internal Data Analysis</span>
                                <span>📋 Research Reports</span>
                                <span>🧠 Smart Insights</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>💻</div>
                            <h3>Code IDE</h3>
                            <p>
                                AI-powered integrated development environment with intelligent code completion, debugging assistance, and
                                automated code generation for faster development.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🤖 AI Code Completion</span>
                                <span>🐛 Smart Debugging</span>
                                <span>⚡ Code Generation</span>
                                <span>🔧 Multi-Language</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>📈</div>
                            <h3>SEO & Website Analyzer</h3>
                            <p>
                                Comprehensive SEO analysis and website optimization recommendations powered by AI. Identify opportunities
                                and track performance improvements.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🔍 SEO Audits</span>
                                <span>📊 Performance Metrics</span>
                                <span>💡 Optimization Tips</span>
                                <span>📱 Mobile Analysis</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>📝</div>
                            <h3>CMS Publisher</h3>
                            <p>
                                Seamlessly create and publish content across multiple platforms with native Sanity and Contentful
                                integrations. AI-powered content optimization included.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>📚 Sanity Integration</span>
                                <span>🎯 Contentful Support</span>
                                <span>✨ AI Optimization</span>
                                <span>🚀 Multi-Platform</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>📞</div>
                            <h3>Call Analysis</h3>
                            <p>
                                Automated insights from your voice communications. Extract key points, sentiment, and action items from
                                meetings and calls with advanced AI processing.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🎙️ Voice Recognition</span>
                                <span>📝 Meeting Summaries</span>
                                <span>📊 Sentiment Analysis</span>
                                <span>✅ Action Items</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>🎫</div>
                            <h3>Ticket Analysis</h3>
                            <p>
                                Streamline customer support with AI-driven ticket insights. Categorize, prioritize, and route support
                                requests intelligently with automated workflows.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🏷️ Auto-Categorization</span>
                                <span>⚡ Priority Scoring</span>
                                <span>🔄 Smart Routing</span>
                                <span>📈 Performance Analytics</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>🎬</div>
                            <h3>Video Creation</h3>
                            <p>
                                Generate compelling videos from text or simple inputs. Create engaging content for social media,
                                presentations, and marketing with AI-powered video generation.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🎥 Text-to-Video</span>
                                <span>✨ AI Enhancement</span>
                                <span>📱 Multiple Formats</span>
                                <span>🎨 Custom Branding</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>🤖</div>
                            <h3>Agent Builder</h3>
                            <p>
                                Visually design and deploy custom AI agents for any task. No coding required - just drag, drop, and
                                configure your intelligent workforce with intuitive visual tools.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🎨 Visual Builder</span>
                                <span>🔧 No-Code Design</span>
                                <span>⚡ Instant Deployment</span>
                                <span>🔄 Workflow Automation</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>📊</div>
                            <h3>Company Dashboards</h3>
                            <p>
                                Unified AI-powered insights across your business operations. Real-time analytics, predictive insights, and
                                automated reporting to drive data-driven decisions.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>📈 Real-time Analytics</span>
                                <span>🔮 Predictive Insights</span>
                                <span>📋 Automated Reports</span>
                                <span>🎯 Custom Metrics</span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function HowItWorks() {
    return (
        <section className={styles.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>How AI Agents Work</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Intelligent, autonomous, and seamlessly integrated into your workflow
                </p>
                <div className='row'>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>1</div>
                            <h3>Define Your Goal</h3>
                            <p>Tell the agent what you want to accomplish. Agents understand natural language and complex objectives.</p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>2</div>
                            <h3>Connect Your Tools</h3>
                            <p>Agents automatically connect to your existing tools, APIs, and data sources to gather information.</p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>3</div>
                            <h3>Autonomous Execution</h3>
                            <p>The agent creates and executes a plan, making decisions and taking actions to achieve your goal.</p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>4</div>
                            <h3>Deliver Results</h3>
                            <p>Get comprehensive results, insights, and deliverables exactly when and how you need them.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function CTASection() {
    return (
        <section className={clsx(styles.missionSection, styles.ctaSection)}>
            <div className='container text--center'>
                <h2>Ready to Build Your AI Agent Workforce?</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Join thousands of users who are already automating their workflows with intelligent AI agents
                </p>
                <div className={styles.heroCTAs}>
                    <a href='https://studio.theanswer.ai' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                        Start Building Agents
                    </a>
                    <div className={styles.secondaryLinks}>
                        <a href='/docs/agents' className={styles.secondaryLink}>
                            📖 Read Documentation
                        </a>
                        <a href='https://discord.gg/X54ywt8pzj' className={styles.secondaryLink}>
                            💬 Join Community
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function Agents(): JSX.Element {
    const { siteConfig: _siteConfig } = useDocusaurusContext()

    return (
        <div data-theme='dark'>
            <LayoutComponent
                title='AI Agents - Intelligent Autonomous Assistants'
                description='Build intelligent AI agents that understand your needs, connect to your tools, and execute complex workflows autonomously.'
            >
                <AgentsHero />
                <UsingAnswerAgentAISubmenu />
                <main>
                    <WhatIsAnAgent />
                    <AgentToolIntegrations />
                    <FeaturedApps />
                    <HowItWorks />
                    <CTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
