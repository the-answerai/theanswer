import clsx from 'clsx'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import UsingAnswerAgentAISubmenu from '@site/src/components/UsingAnswerAgentAISubmenu'
import {
    BookOpen,
    Bot,
    Brain,
    Link2,
    Zap,
    RefreshCw,
    Search,
    Flame,
    Bug,
    Wrench,
    MessageSquare,
    Mail,
    Github,
    ClipboardList,
    FileText,
    Palette,
    Youtube,
    Package,
    Database,
    Cloud,
    Gem,
    Sparkles,
    RotateCw,
    TrendingUp,
    ShieldCheck,
    BarChart3,
    Image,
    Theater,
    Globe,
    Lightbulb,
    Folder,
    Phone,
    Ticket,
    Video,
    Target,
    Rocket,
    Mic,
    CheckCircle,
    Tag,
    Route,
    Monitor,
    PenTool
} from 'lucide-react'

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
                    <a href='https://calendly.com/lastrev/answeragent-demo' className={clsx(styles.ctaButton, styles.ctaPrimary)}>
                        Schedule a Demo
                    </a>
                    <div className={styles.secondaryLinks}>
                        <a href='/docs/agents' className={styles.secondaryLink}>
                            <BookOpen size={18} className={styles.linkIcon} />
                            View Documentation
                        </a>
                        <a href='#what-is-agent' className={styles.secondaryLink}>
                            <Bot size={18} className={styles.linkIcon} />
                            What is an Agent?
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
                            <div className={styles.stepNumber}>
                                <Brain size={32} strokeWidth={1.5} />
                            </div>
                            <h3>Intelligent Reasoning</h3>
                            <p>
                                Agents use advanced AI models to understand context, analyze information, and make intelligent decisions
                                based on your specific requirements and goals.
                            </p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>
                                <Link2 size={32} strokeWidth={1.5} />
                            </div>
                            <h3>Tool Integration</h3>
                            <p>
                                Connect to APIs, databases, and services. Agents can interact with your existing tools and platforms to
                                gather information and execute actions.
                            </p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>
                                <Zap size={32} strokeWidth={1.5} />
                            </div>
                            <h3>Autonomous Execution</h3>
                            <p>
                                Once configured, agents work independently to complete complex workflows, making decisions and taking
                                actions without constant human intervention.
                            </p>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>
                                <RefreshCw size={32} strokeWidth={1.5} />
                            </div>
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
            icon: <Bot size={40} strokeWidth={1.5} />,
            description: 'Advanced language models for reasoning, analysis, and content generation',
            category: 'AI Models'
        },
        {
            name: 'Anthropic Claude',
            icon: <Theater size={40} strokeWidth={1.5} />,
            description: 'Sophisticated AI assistant for complex reasoning and analysis tasks',
            category: 'AI Models'
        },
        {
            name: 'Google Gemini',
            icon: <Gem size={40} strokeWidth={1.5} />,
            description: 'Multimodal AI for text, vision, and advanced reasoning capabilities',
            category: 'AI Models'
        },

        // Data & Research
        {
            name: 'Exa Search',
            icon: <Search size={40} strokeWidth={1.5} />,
            description: 'AI-powered semantic search for finding relevant web content',
            category: 'Research'
        },
        {
            name: 'Firecrawl',
            icon: <Flame size={40} strokeWidth={1.5} />,
            description: 'Web scraping and data extraction for clean, structured content',
            category: 'Data'
        },
        {
            name: 'Brave Search',
            icon: <ShieldCheck size={40} strokeWidth={1.5} />,
            description: 'Privacy-focused search API for real-time web information',
            category: 'Research'
        },

        // Business Platforms
        {
            name: 'Salesforce',
            icon: <Cloud size={40} strokeWidth={1.5} />,
            description: 'CRM integration for customer data and sales automation',
            category: 'Business'
        },
        {
            name: 'Slack',
            icon: <MessageSquare size={40} strokeWidth={1.5} />,
            description: 'Team communication and workflow automation',
            category: 'Communication'
        },
        {
            name: 'Gmail',
            icon: <Mail size={40} strokeWidth={1.5} />,
            description: 'Email automation and intelligent message processing',
            category: 'Communication'
        },

        // Development Tools
        {
            name: 'GitHub',
            icon: <Github size={40} strokeWidth={1.5} />,
            description: 'Code repository management and development workflow automation',
            category: 'Development'
        },
        {
            name: 'Jira',
            icon: <ClipboardList size={40} strokeWidth={1.5} />,
            description: 'Project management and issue tracking integration',
            category: 'Project Management'
        },
        {
            name: 'Notion',
            icon: <FileText size={40} strokeWidth={1.5} />,
            description: 'Knowledge management and document automation',
            category: 'Productivity'
        },

        // Design & Media
        {
            name: 'Figma',
            icon: <Palette size={40} strokeWidth={1.5} />,
            description: 'Design file processing and creative workflow automation',
            category: 'Design'
        },
        {
            name: 'YouTube',
            icon: <Youtube size={40} strokeWidth={1.5} />,
            description: 'Video content analysis and media workflow integration',
            category: 'Media'
        },

        // Infrastructure
        {
            name: 'Amazon S3',
            icon: <Package size={40} strokeWidth={1.5} />,
            description: 'Cloud storage and file management automation',
            category: 'Infrastructure'
        },
        {
            name: 'PostgreSQL',
            icon: <Database size={40} strokeWidth={1.5} />,
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
                                <div className={styles.appIcon} style={{ marginBottom: '1rem' }}>
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
                            <div className={styles.appIcon}>
                                <BarChart3 size={48} strokeWidth={1.5} />
                            </div>
                            <h3>CSV Transformer</h3>
                            <p>
                                Effortlessly clean, reformat, and analyze your CSV data using intelligent AI algorithms. Perfect for data
                                preparation, reporting, and ensuring data quality.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Sparkles size={16} /> Smart Data Cleaning
                                </span>
                                <span>
                                    <RotateCw size={16} /> Format Conversion
                                </span>
                                <span>
                                    <TrendingUp size={16} /> Analysis Tools
                                </span>
                                <span>
                                    <ShieldCheck size={16} /> Secure Processing
                                </span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={styles.featureCardCTA}>
                                Launch App →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>
                                <Palette size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Image Creator</h3>
                            <p>
                                Generate stunning, unique images from text descriptions or transform existing images with AI-powered
                                enhancements. Perfect for marketing and creative projects.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Image size={16} /> Text-to-Image
                                </span>
                                <span>
                                    <Sparkles size={16} /> Image Enhancement
                                </span>
                                <span>
                                    <Theater size={16} /> Style Transfer
                                </span>
                                <span>
                                    <Monitor size={16} /> High Quality
                                </span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={styles.featureCardCTA}>
                                Launch App →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>
                                <Search size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Deep Research</h3>
                            <p>
                                Harness the power of AI to analyze both external web data and internal company information. Generate
                                comprehensive research reports and insights instantly.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Globe size={16} /> External Data Mining
                                </span>
                                <span>
                                    <Folder size={16} /> Internal Data Analysis
                                </span>
                                <span>
                                    <ClipboardList size={16} /> Research Reports
                                </span>
                                <span>
                                    <Brain size={16} /> Smart Insights
                                </span>
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
                            <div className={styles.appIcon}>
                                <Monitor size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Code IDE</h3>
                            <p>
                                AI-powered integrated development environment with intelligent code completion, debugging assistance, and
                                automated code generation for faster development.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Bot size={16} /> AI Code Completion
                                </span>
                                <span>
                                    <Bug size={16} /> Smart Debugging
                                </span>
                                <span>
                                    <Zap size={16} /> Code Generation
                                </span>
                                <span>
                                    <Wrench size={16} /> Multi-Language
                                </span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>
                                <TrendingUp size={48} strokeWidth={1.5} />
                            </div>
                            <h3>SEO & Website Analyzer</h3>
                            <p>
                                Comprehensive SEO analysis and website optimization recommendations powered by AI. Identify opportunities
                                and track performance improvements.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Search size={16} /> SEO Audits
                                </span>
                                <span>
                                    <BarChart3 size={16} /> Performance Metrics
                                </span>
                                <span>
                                    <Lightbulb size={16} /> Optimization Tips
                                </span>
                                <span>
                                    <Monitor size={16} /> Mobile Analysis
                                </span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>
                                <PenTool size={48} strokeWidth={1.5} />
                            </div>
                            <h3>CMS Publisher</h3>
                            <p>
                                Seamlessly create and publish content across multiple platforms with native Sanity and Contentful
                                integrations. AI-powered content optimization included.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <FileText size={16} /> Sanity Integration
                                </span>
                                <span>
                                    <Target size={16} /> Contentful Support
                                </span>
                                <span>
                                    <Sparkles size={16} /> AI Optimization
                                </span>
                                <span>
                                    <Rocket size={16} /> Multi-Platform
                                </span>
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
                            <div className={styles.appIcon}>
                                <Phone size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Call Analysis</h3>
                            <p>
                                Automated insights from your voice communications. Extract key points, sentiment, and action items from
                                meetings and calls with advanced AI processing.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Mic size={16} /> Voice Recognition
                                </span>
                                <span>
                                    <FileText size={16} /> Meeting Summaries
                                </span>
                                <span>
                                    <BarChart3 size={16} /> Sentiment Analysis
                                </span>
                                <span>
                                    <CheckCircle size={16} /> Action Items
                                </span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>
                                <Ticket size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Ticket Analysis</h3>
                            <p>
                                Streamline customer support with AI-driven ticket insights. Categorize, prioritize, and route support
                                requests intelligently with automated workflows.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Tag size={16} /> Auto-Categorization
                                </span>
                                <span>
                                    <Zap size={16} /> Priority Scoring
                                </span>
                                <span>
                                    <Route size={16} /> Smart Routing
                                </span>
                                <span>
                                    <TrendingUp size={16} /> Performance Analytics
                                </span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>
                                <Video size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Video Creation</h3>
                            <p>
                                Generate compelling videos from text or simple inputs. Create engaging content for social media,
                                presentations, and marketing with AI-powered video generation.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Video size={16} /> Text-to-Video
                                </span>
                                <span>
                                    <Sparkles size={16} /> AI Enhancement
                                </span>
                                <span>
                                    <Monitor size={16} /> Multiple Formats
                                </span>
                                <span>
                                    <Palette size={16} /> Custom Branding
                                </span>
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
                            <div className={styles.appIcon}>
                                <Bot size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Agent Builder</h3>
                            <p>
                                Visually design and deploy custom AI agents for any task. No coding required - just drag, drop, and
                                configure your intelligent workforce with intuitive visual tools.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <Palette size={16} /> Visual Builder
                                </span>
                                <span>
                                    <Wrench size={16} /> No-Code Design
                                </span>
                                <span>
                                    <Zap size={16} /> Instant Deployment
                                </span>
                                <span>
                                    <RefreshCw size={16} /> Workflow Automation
                                </span>
                            </div>
                            <div className={styles.featureCardCTA} style={{ opacity: 0.7, cursor: 'default' }}>
                                Coming Soon
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={styles.featureCard}>
                            <div className={styles.appIcon}>
                                <BarChart3 size={48} strokeWidth={1.5} />
                            </div>
                            <h3>Company Dashboards</h3>
                            <p>
                                Unified AI-powered insights across your business operations. Real-time analytics, predictive insights, and
                                automated reporting to drive data-driven decisions.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>
                                    <TrendingUp size={16} /> Real-time Analytics
                                </span>
                                <span>
                                    <Sparkles size={16} /> Predictive Insights
                                </span>
                                <span>
                                    <ClipboardList size={16} /> Automated Reports
                                </span>
                                <span>
                                    <Target size={16} /> Custom Metrics
                                </span>
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
                            <BookOpen size={18} className={styles.linkIcon} />
                            Read Documentation
                        </a>
                        <a href='https://discord.gg/X54ywt8pzj' className={styles.secondaryLink}>
                            <MessageSquare size={18} className={styles.linkIcon} />
                            Join Community
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
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'AI Agents - Intelligent Autonomous Assistants',
                        description:
                            'Build intelligent AI agents that understand your needs, connect to your tools, and execute complex workflows autonomously.',
                        url: 'https://answeragent.ai/agents'
                    }}
                />
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
