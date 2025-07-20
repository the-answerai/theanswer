import clsx from 'clsx'
import Layout from '@theme/Layout'
import UsingAnswerAISubmenu from '@site/src/components/UsingAnswerAISubmenu'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import ElevenLabsInlineWidget from '@site/src/components/ElevenLabsInlineWidget'
import FAQCard from '@site/src/components/FAQCard'

import styles from './index.module.css'

// Import FAQ data
import gettingStartedData from '@site/src/data/faq/getting-started.json'
import chatData from '@site/src/data/faq/chat.json'
import sidekickStoreData from '@site/src/data/faq/sidekick-store.json'
import chatflowsData from '@site/src/data/faq/chatflows.json'
import documentStoresData from '@site/src/data/faq/document-stores.json'
import agentflowsData from '@site/src/data/faq/agentflows.json'
import toolsData from '@site/src/data/faq/tools.json'
import assistantsData from '@site/src/data/faq/assistants.json'
import executionsData from '@site/src/data/faq/executions.json'
import variablesData from '@site/src/data/faq/variables.json'
import apikeyData from '@site/src/data/faq/apikey.json'
import billingData from '@site/src/data/faq/billing.json'
import credentialsData from '@site/src/data/faq/creds-settings.json'
import appsData from '@site/src/data/faq/apps.json'
import browserExtensionData from '@site/src/data/faq/browser-extension.json'
import troubleshootingData from '@site/src/data/faq/troubleshooting.json'
import advancedFeaturesData from '@site/src/data/faq/advanced-features.json'

function FAQHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>AnswerAgent FAQ</h1>
                <p className={styles.heroSubtitle}>
                    Your complete guide to understanding and using all features of AnswerAgent. Get instant answers to your questions with
                    our AI-powered assistant.
                </p>
                <div className={styles.heroCTAs}>
                    <ElevenLabsInlineWidget
                        agentId='agent_01k03gnw7xe11btz2vprkf7ay5'
                        text='🤖 Ask Alpha Now'
                        variant='cta'
                        inline={true}
                        showStatus={false}
                        buttonClassName={clsx(styles.ctaButton, styles.ctaPrimary)}
                    />
                    <div className={styles.secondaryLinks}>
                        <a href='#getting-started' className={styles.secondaryLink}>
                            🚀 Getting Started
                        </a>
                        <a href='#features' className={styles.secondaryLink}>
                            ⚡ Core Features
                        </a>
                        <a href='#examples' className={styles.secondaryLink}>
                            💡 Examples
                        </a>
                    </div>
                </div>
            </div>
        </header>
    )
}

function _CoreFeaturesSection() {
    return (
        <section className={styles.featuresSection} id='features'>
            <div className='container'>
                <h2 className='text--center'>Core Features Overview</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Explore the powerful capabilities that make AnswerAgent your complete AI platform
                </p>

                <div className='row' style={{ marginBottom: '3rem' }}>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>💬</div>
                            <h3>Chat Interface & Sidekicks</h3>
                            <p>
                                Interact with specialized AI assistants (Sidekicks) designed for specific tasks. Upload files, maintain
                                conversation context, and switch between different expertise areas seamlessly.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>🤖 Specialized AI Assistants</span>
                                <span>📁 Multi-format File Support</span>
                                <span>🧠 Conversation Memory</span>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>🏪</div>
                            <h3>Sidekick Store Marketplace</h3>
                            <p>
                                Browse and install pre-built AI sidekicks from the marketplace. Find solutions for business, content
                                creation, data analysis, development, and more. Clone and customize as needed.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>📚 Curated AI Templates</span>
                                <span>🔄 Clone & Customize</span>
                                <span>🎯 Category Organization</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row'>
                    <div className='col col--12'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🛠️</div>
                            <div>
                                <h3>Sidekick Studio - Visual Development Environment</h3>
                                <p style={{ marginBottom: '2rem' }}>
                                    Build custom AI solutions with our comprehensive visual development environment. No coding required -
                                    drag, drop, and connect nodes to create powerful workflows.
                                </p>
                                <div className='row'>
                                    <div className='col col--6'>
                                        <div className={styles.appFeatures}>
                                            <span>🔄 Chatflows - Visual AI Workflows</span>
                                            <span>🤖 Agentflows - Multi-Agent Systems</span>
                                            <span>🧠 Assistants - OpenAI Integration</span>
                                            <span>📚 Document Stores - Knowledge Management</span>
                                        </div>
                                    </div>
                                    <div className='col col--6'>
                                        <div className={styles.appFeatures}>
                                            <span>📊 Executions - Workflow Monitoring</span>
                                            <span>🔧 Tools - Custom Functions & MCP</span>
                                            <span>🌐 Global Variables - Configuration</span>
                                            <span>🔑 API Keys - Secure Authentication</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function _WorkflowTypesSection() {
    return (
        <section className={styles.missionSection}>
            <div className='container'>
                <h2 className='text--center'>Workflow Types & Capabilities</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Choose the right workflow type for your use case
                </p>

                <div className='row'>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🌊</div>
                            <div>
                                <h3>Chatflows</h3>
                                <p>
                                    Linear workflows perfect for conversational AI, embedded chatbots, and straightforward automation. Easy
                                    to build and deploy across multiple platforms.
                                </p>
                                <div className={styles.appFeatures}>
                                    <span>💬 Embedded Chatbots</span>
                                    <span>🎯 Process Guidance</span>
                                    <span>🔌 API Endpoints</span>
                                    <span>👥 Customer Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🤖</div>
                            <div>
                                <h3>Agentflows</h3>
                                <p>
                                    Advanced multi-agent systems with complex decision-making, parallel processing, and long-running tasks.
                                    Perfect for business processes and automation.
                                </p>
                                <div className={styles.appFeatures}>
                                    <span>🏢 Business Processes</span>
                                    <span>⏱️ Long-running Tasks</span>
                                    <span>👨‍💼 Human-in-the-Loop</span>
                                    <span>🔄 Dynamic Branching</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function _DocumentStoreSection() {
    return (
        <section className={styles.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>Document Processing & Knowledge Management</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Support for 40+ file formats with intelligent processing and semantic search
                </p>

                <div className='row'>
                    <div className='col col--4'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>📄</div>
                            <div>
                                <h3>File-Based Loaders</h3>
                                <div className={styles.appFeatures}>
                                    <span>📋 Documents: PDF, DOCX, TXT, MD</span>
                                    <span>📊 Data: JSON, CSV, XLS, XLSX</span>
                                    <span>💻 Code: JS, TS, PY, CPP, JAVA</span>
                                    <span>🌐 Web: HTML, CSS, XML</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>☁️</div>
                            <div>
                                <h3>Cloud & API Sources</h3>
                                <div className={styles.appFeatures}>
                                    <span>📱 Google Drive & Workspace</span>
                                    <span>🪣 AWS S3 Buckets</span>
                                    <span>🔗 REST API Endpoints</span>
                                    <span>📋 Airtable Bases</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🕷️</div>
                            <div>
                                <h3>Web & Search</h3>
                                <div className={styles.appFeatures}>
                                    <span>🕸️ Spider Web Scraping</span>
                                    <span>🔍 Search Engine Results</span>
                                    <span>📱 Social Media Content</span>
                                    <span>🐙 GitHub Repositories</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function _ToolsIntegrationsSection() {
    return (
        <section className={styles.missionSection}>
            <div className='container'>
                <h2 className='text--center'>Tools & Integrations</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Extend your AI capabilities with powerful tools and MCP integrations
                </p>

                <div className='row'>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🏢</div>
                            <div>
                                <h3>Business & Productivity</h3>
                                <div className={styles.appFeatures}>
                                    <span>💼 Salesforce CRM & OAuth</span>
                                    <span>🎯 Jira Project Management</span>
                                    <span>📚 Confluence Knowledge Base</span>
                                    <span>📝 Contentful CMS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🔧</div>
                            <div>
                                <h3>Development & Search</h3>
                                <div className={styles.appFeatures}>
                                    <span>🐙 GitHub Repository Management</span>
                                    <span>🔍 Brave Search API</span>
                                    <span>📺 YouTube Content Analysis</span>
                                    <span>🧠 Sequential Thinking MCP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--12'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>⚙️</div>
                            <div>
                                <h3>Custom Tools & MCP</h3>
                                <p style={{ marginBottom: '1rem' }}>
                                    Create custom JavaScript functions or configure any MCP-compatible server. Build tools that integrate
                                    with your specific business systems and workflows.
                                </p>
                                <div className={styles.appFeatures}>
                                    <span>💻 Custom JavaScript Functions</span>
                                    <span>🔌 MCP Server Configuration</span>
                                    <span>🛠️ Built-in Tools (Calculator, Web Browser, File Ops)</span>
                                    <span>🌐 API Request Tools (GET/POST)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function _PracticalExamplesSection() {
    return (
        <section className={styles.featuresSection} id='examples'>
            <div className='container'>
                <h2 className='text--center'>Practical Workflow Examples</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Real-world use cases to inspire your AI implementations
                </p>

                <div className='row' style={{ marginBottom: '2rem' }}>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>🎧</div>
                            <h3>Customer Support Chatbot</h3>
                            <p>
                                Create an intelligent support bot using Document Stores for FAQs, Google Drive for help docs, and deploy as
                                an embedded chatbot with conversation memory.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>📚 FAQ Knowledge Base</span>
                                <span>💬 Embedded Chat Widget</span>
                                <span>🧠 Context Memory</span>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.stepCard)}>
                            <div className={styles.stepNumber}>📈</div>
                            <h3>Sales Lead Analysis</h3>
                            <p>
                                Automated lead scoring using Salesforce MCP, Airtable data, and API enrichment. Multi-agent system with
                                human approval checkpoints for high-value leads.
                            </p>
                            <div className={styles.appFeatures}>
                                <span>💼 CRM Integration</span>
                                <span>🤖 Multi-Agent Processing</span>
                                <span>👨‍💼 Human-in-the-Loop</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row'>
                    <div className='col col--4'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>✍️</div>
                            <div>
                                <h3>Content Creation Pipeline</h3>
                                <p>Research with Brave Search, create with specialized agents, and publish via CMS integration.</p>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>💻</div>
                            <div>
                                <h3>Code Documentation</h3>
                                <p>Analyze codebases with GitHub MCP, generate docs with AI, and maintain with version control.</p>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>📊</div>
                            <div>
                                <h3>Business Intelligence</h3>
                                <p>Automated data analysis from multiple sources with visualization and stakeholder reporting.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function _TroubleshootingSection() {
    return (
        <section className={styles.missionSection} id='troubleshooting'>
            <div className='container'>
                <h2 className='text--center'>Troubleshooting & Support</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Common issues and solutions to keep your workflows running smoothly
                </p>

                <div className='row'>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🔐</div>
                            <div>
                                <h3>Authentication Issues</h3>
                                <p style={{ marginBottom: '1rem' }}>Can&apos;t access features or MCP tools not working?</p>
                                <div className={styles.appFeatures}>
                                    <span>✓ Verify organization permissions</span>
                                    <span>✓ Check API key validity</span>
                                    <span>✓ Ensure credentials are configured</span>
                                    <span>✓ Test individual actions first</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>⚡</div>
                            <div>
                                <h3>Performance Issues</h3>
                                <p style={{ marginBottom: '1rem' }}>Slow responses or timeouts?</p>
                                <div className={styles.appFeatures}>
                                    <span>✓ Review workflow complexity</span>
                                    <span>✓ Optimize text splitter settings</span>
                                    <span>✓ Use appropriate chunk sizes</span>
                                    <span>✓ Break large workflows apart</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--12'>
                        <div className={clsx(styles.featureCard, styles.commandment)}>
                            <div className={styles.comingSoonIcon}>🆘</div>
                            <div>
                                <h3>Get Help & Support</h3>
                                <p style={{ marginBottom: '1rem' }}>
                                    Multiple ways to get assistance and connect with the AnswerAgent community
                                </p>
                                <div className='row'>
                                    <div className='col col--6'>
                                        <div className={styles.appFeatures}>
                                            <span>📖 Official Documentation</span>
                                            <span>💬 Discord Community</span>
                                            <span>🔧 GitHub Repository</span>
                                        </div>
                                    </div>
                                    <div className='col col--6'>
                                        <div className={styles.appFeatures}>
                                            <span>📧 Email Support (Paid Plans)</span>
                                            <span>🎥 Video Tutorials</span>
                                            <span>📝 User Forums & Q&A</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function DetailedFAQSection() {
    const gettingStartedIcon = <span style={{ fontSize: '2rem' }}>🚀</span>
    const chatIcon = <span style={{ fontSize: '2rem' }}>💬</span>
    const storeIcon = <span style={{ fontSize: '2rem' }}>🏪</span>
    const chatflowsIcon = <span style={{ fontSize: '2rem' }}>🔀</span>
    const agentflowsIcon = <span style={{ fontSize: '2rem' }}>🤖</span>
    const assistantsIcon = <span style={{ fontSize: '2rem' }}>👥</span>
    const documentStoresIcon = <span style={{ fontSize: '2rem' }}>📚</span>
    const executionsIcon = <span style={{ fontSize: '2rem' }}>▶️</span>
    const toolsIcon = <span style={{ fontSize: '2rem' }}>🔧</span>
    const variablesIcon = <span style={{ fontSize: '2rem' }}>🔧</span>
    const apikeyIcon = <span style={{ fontSize: '2rem' }}>🔑</span>
    const billingIcon = <span style={{ fontSize: '2rem' }}>💳</span>
    const credentialsIcon = <span style={{ fontSize: '2rem' }}>🔐</span>
    const appsIcon = <span style={{ fontSize: '2rem' }}>📱</span>
    const browserExtensionIcon = <span style={{ fontSize: '2rem' }}>🌐</span>
    const troubleshootingIcon = <span style={{ fontSize: '2rem' }}>🔧</span>
    const advancedFeaturesIcon = <span style={{ fontSize: '2rem' }}>⚡</span>

    return (
        <section className={styles.section} id='detailed-faq'>
            <div className='container'>
                <div className='text--center' style={{ marginBottom: '3rem', marginTop: '3rem' }}>
                    <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
                        In-depth answers to common questions organized by AnswerAgent features
                    </p>
                </div>

                <div className='row'>
                    <div className='col col--12'>
                        <FAQCard
                            title={gettingStartedData.title}
                            description={gettingStartedData.description}
                            icon={gettingStartedIcon}
                            faqs={gettingStartedData.faqs}
                        />

                        <FAQCard title={chatData.title} description={chatData.description} icon={chatIcon} faqs={chatData.faqs} />

                        <FAQCard
                            title={sidekickStoreData.title}
                            description={sidekickStoreData.description}
                            icon={storeIcon}
                            faqs={sidekickStoreData.faqs}
                        />

                        <FAQCard title={appsData.title} description={appsData.description} icon={appsIcon} faqs={appsData.faqs} />

                        <FAQCard
                            title={chatflowsData.title}
                            description={chatflowsData.description}
                            icon={chatflowsIcon}
                            faqs={chatflowsData.faqs}
                        />

                        <FAQCard
                            title={agentflowsData.title}
                            description={agentflowsData.description}
                            icon={agentflowsIcon}
                            faqs={agentflowsData.faqs}
                        />

                        <FAQCard
                            title={assistantsData.title}
                            description={assistantsData.description}
                            icon={assistantsIcon}
                            faqs={assistantsData.faqs}
                        />

                        <FAQCard
                            title={documentStoresData.title}
                            description={documentStoresData.description}
                            icon={documentStoresIcon}
                            faqs={documentStoresData.faqs}
                        />

                        <FAQCard
                            title={executionsData.title}
                            description={executionsData.description}
                            icon={executionsIcon}
                            faqs={executionsData.faqs}
                        />

                        <FAQCard title={toolsData.title} description={toolsData.description} icon={toolsIcon} faqs={toolsData.faqs} />

                        <FAQCard
                            title={variablesData.title}
                            description={variablesData.description}
                            icon={variablesIcon}
                            faqs={variablesData.faqs}
                        />

                        <FAQCard title={apikeyData.title} description={apikeyData.description} icon={apikeyIcon} faqs={apikeyData.faqs} />

                        <FAQCard
                            title={billingData.title}
                            description={billingData.description}
                            icon={billingIcon}
                            faqs={billingData.faqs}
                        />

                        <FAQCard
                            title={credentialsData.title}
                            description={credentialsData.description}
                            icon={credentialsIcon}
                            faqs={credentialsData.faqs}
                        />

                        <FAQCard
                            title={browserExtensionData.title}
                            description={browserExtensionData.description}
                            icon={browserExtensionIcon}
                            faqs={browserExtensionData.faqs}
                        />

                        <FAQCard
                            title={advancedFeaturesData.title}
                            description={advancedFeaturesData.description}
                            icon={advancedFeaturesIcon}
                            faqs={advancedFeaturesData.faqs}
                        />

                        <FAQCard
                            title={troubleshootingData.title}
                            description={troubleshootingData.description}
                            icon={troubleshootingIcon}
                            faqs={troubleshootingData.faqs}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

function FinalCTASection() {
    return (
        <section className={styles.pricingSection}>
            <div className='container'>
                <div className='text--center' style={{ marginBottom: '3rem' }}>
                    <h2>Still Have Questions?</h2>
                    <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
                        Get instant answers from Alpha, our AI assistant, or explore our comprehensive documentation.
                    </p>
                </div>

                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div className={clsx(styles.pricingCard, styles.commandment, styles.pricingCardHighlighted)}>
                            <div className={styles.pricingIcon}>🤖</div>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', textAlign: 'center' }}>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Ask Alpha Anything</h3>
                                <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
                                    Alpha knows everything about AnswerAgent and can help you with specific questions, workflow design,
                                    troubleshooting, and best practices.
                                </p>

                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Instant answers to your questions</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Workflow design assistance</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Troubleshooting guidance</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Best practices and tips</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Feature explanations and demos</div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    <ElevenLabsInlineWidget
                                        agentId='agent_01k03gnw7xe11btz2vprkf7ay5'
                                        text='🎙️ Talk to Alpha Now'
                                        variant='cta'
                                        inline={true}
                                        showStatus={false}
                                        buttonClassName={clsx(styles.ctaButton, styles.ctaPrimary)}
                                    />

                                    <div
                                        style={{
                                            marginTop: '1rem',
                                            display: 'flex',
                                            gap: '1rem',
                                            justifyContent: 'center',
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <a
                                            href='https://docs.theanswer.ai'
                                            className={clsx(styles.ctaButton, styles.ctaSecondary)}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                        >
                                            📖 Read the Docs
                                        </a>
                                        <a
                                            href='https://discord.gg/X54ywt8pzj'
                                            className={clsx(styles.ctaButton, styles.ctaSecondary)}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                        >
                                            💬 Join Discord
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function FAQ(): JSX.Element {
    return (
        <div data-theme='dark'>
            <Layout
                title='AnswerAgent FAQ - Complete Feature Guide'
                description='Comprehensive FAQ for AnswerAgent covering all features including Chatflows, Agentflows, Document Stores, MCP Tools, and more. Get instant answers with Alpha AI assistant.'
            >
                <FAQHero />
                <UsingAnswerAISubmenu />
                <main>
                    <DetailedFAQSection />
                    <FinalCTASection />
                </main>
            </Layout>
        </div>
    )
}
