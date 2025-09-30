"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SidekickStudio;
var clsx_1 = require("clsx");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var Layout_1 = require("@theme/Layout");
var JsonLd_1 = require("@site/src/components/JsonLd");
var SphereScene_1 = require("@site/src/components/Annimations/SphereScene");
var UsingAnswerAgentAISubmenu_1 = require("@site/src/components/UsingAnswerAgentAISubmenu");
var index_module_css_1 = require("./index.module.css");
function SidekickStudioHero() {
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <SphereScene_1.default className={index_module_css_1.default.threeJsCanvas}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <h1 className={index_module_css_1.default.heroTitle}>Sidekick Studio</h1>
                <p className={index_module_css_1.default.heroSubtitle}>
                    Build sophisticated AI workflows with our visual no-code editor. Connect tools, create custom agents, and import Flowise
                    flows to automate your processes.
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://studio.theanswer.ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Launch Studio
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='/docs/sidekick-studio' className={index_module_css_1.default.secondaryLink}>
                            📚 View Documentation
                        </a>
                        <a href='#features' className={index_module_css_1.default.secondaryLink}>
                            🛠️ Explore Features
                        </a>
                    </div>
                </div>
            </div>
        </header>);
}
function FlowiseFoundation() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.comingSoonSection)}>
            <div className='container'>
                <h2 className='text--center'>Built on Flowise Excellence</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Leverage the proven power of Flowise with AnswerAgentAI enhancements
                </p>

                {/* Image at the top */}
                <div className='row' style={{ marginBottom: '3rem' }}>
                    <div className='col col--12'>
                        <div style={{ textAlign: 'center' }}>
                            <img src='/.gitbook/assets/agentflowsv2/agentflowsv2-1-flow-types.png' alt='AnswerAgentAI Flow Types' style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.15)',
            border: '1px solid rgba(0, 255, 255, 0.2)'
        }}/>
                        </div>
                    </div>
                </div>

                {/* 4 cards in one row */}
                <div className='row'>
                    <div className='col col--3'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🔗</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Flowise Foundation</strong>
                                <br />
                                Built as a powerful fork of Flowise, inheriting years of community development and battle-tested stability
                                for enterprise workflows.
                            </div>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>⚡</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Instant Migration</strong>
                                <br />
                                Import your existing Flowise chatflows and agent flows instantly. No rebuilding required—just seamless
                                migration to enhanced capabilities.
                            </div>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🌐</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Thriving Community</strong>
                                <br />
                                Join the rapidly growing Flowise community with thousands of developers sharing workflows, templates, and
                                innovations.
                            </div>
                        </div>
                    </div>
                    <div className='col col--3'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🔧</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Enhanced Features</strong>
                                <br />
                                All the power of Flowise plus AnswerAgentAI-specific enhancements, integrations, and enterprise-grade
                                security features.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function PlatformSupport() {
    return (<section className={index_module_css_1.default.featuresSection} id='features'>
            <div className='container'>
                <h2 className='text--center'>Enterprise-Grade AI Framework Support</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Native integration with leading AI frameworks and libraries
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🦜</div>
                            <h3>LangChain Integration</h3>
                            <p>
                                Full native support for LangChain nodes and components. Build sophisticated AI chains, agents, and tools
                                using the most popular AI framework.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🔗 Chain Building</span>
                                <span>🤖 Agent Creation</span>
                                <span>🛠️ Tool Integration</span>
                                <span>📚 Memory Management</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={index_module_css_1.default.featureCardCTA}>
                                Try LangChain Nodes →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🦙</div>
                            <h3>LlamaIndex Support</h3>
                            <p>
                                Native LlamaIndex nodes for advanced document processing, RAG applications, and knowledge base construction
                                with enterprise data.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📄 Document Processing</span>
                                <span>🔍 RAG Applications</span>
                                <span>📚 Knowledge Bases</span>
                                <span>🔗 Vector Integration</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={index_module_css_1.default.featureCardCTA}>
                                Try LlamaIndex Nodes →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function StudioFeatures() {
    return (<section className={index_module_css_1.default.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>Visual AI Workflow Builder</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Drag, drop, and connect your way to powerful AI applications
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>🎨</div>
                            <h3>Visual Canvas</h3>
                            <p>
                                Intuitive drag-and-drop interface for building complex AI workflows. No coding required—just visual design
                                and logical connections.
                            </p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>🧩</div>
                            <h3>Extensive Node Library</h3>
                            <p>
                                Hundreds of pre-built nodes for chat models, embeddings, vector stores, document loaders, tools, and
                                integrations.
                            </p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>⚡</div>
                            <h3>Real-time Testing</h3>
                            <p>
                                Built-in debugging and testing tools let you validate your workflows as you build them. Instant feedback and
                                iteration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function MCPToolsImage() {
    return (<section style={{ padding: '2rem 0', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div className='container'>
                <div style={{ textAlign: 'center' }}>
                    <img src='/.gitbook/assets/agentflowsv2/agentflowsv2-5-mcp-tools.png' alt='MCP Tools Integration' style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.15)',
            border: '1px solid rgba(0, 255, 255, 0.2)'
        }}/>
                </div>
            </div>
        </section>);
}
function NodeCategories() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.comingSoonSection)}>
            <div className='container'>
                <h2 className='text--center'>Comprehensive Node Ecosystem</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Everything you need to build sophisticated AI applications
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🤖</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>AI Agents & Models</strong>
                                <br />
                                Chat models, agents, embeddings, and memory systems for intelligent conversational applications.
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>📚</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Document Processing</strong>
                                <br />
                                Document loaders, text splitters, and retrievers for comprehensive knowledge management systems.
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🔗</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Tools & Integrations</strong>
                                <br />
                                Vector stores, chains, tools, and external integrations for enterprise-grade AI workflows.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function NodeReferenceImage() {
    return (<section style={{ padding: '2rem 0', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div className='container'>
                <div style={{ textAlign: 'center' }}>
                    <img src='/.gitbook/assets/agentflowsv2/agentflowsv2-6-node-ref.png' alt='Node Reference Guide' style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.15)',
            border: '1px solid rgba(0, 255, 255, 0.2)'
        }}/>
                </div>
            </div>
        </section>);
}
function CTASection() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.ctaSection)}>
            <div className='container text--center'>
                <h2>Ready to Build Your AI Workforce?</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Import your existing flows or start fresh with the most powerful visual AI builder available
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://studio.theanswer.ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Launch Studio Free
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='/docs/sidekick-studio' className={index_module_css_1.default.secondaryLink}>
                            📖 Read Documentation
                        </a>
                        <a href='https://discord.gg/X54ywt8pzj' className={index_module_css_1.default.secondaryLink}>
                            🌐 Join Community
                        </a>
                    </div>
                </div>
                <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'rgba(0, 255, 255, 0.05)',
            borderRadius: '15px',
            border: '1px solid rgba(0, 255, 255, 0.2)'
        }}>
                    <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Migration Made Easy</h3>
                    <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                        Already using Flowise? Import your existing chatflows and agent flows in seconds. No rebuilding, no data loss—just
                        enhanced capabilities.
                    </p>
                    <a href='/docs/sidekick-studio' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.secondaryLink)}>
                        Learn About Migration →
                    </a>
                </div>
            </div>
        </section>);
}
function SidekickStudio() {
    var siteConfig = (0, useDocusaurusContext_1.default)().siteConfig;
    return (<div data-theme='dark'>
            <Layout_1.default title='Sidekick Studio - Visual AI Workflow Builder' description='Build complex AI workflows with our visual no-code editor. Connect tools, create agents, and automate processes without coding.'>
                <JsonLd_1.default data={{
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: 'Sidekick Studio - Visual AI Workflow Builder',
            description: 'Build complex AI workflows with our visual no-code editor. Connect tools, create agents, and automate processes.',
            author: { '@type': 'Organization', name: 'AnswerAgent' },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': 'https://answeragent.ai/sidekick-studio'
            }
        }}/>
                <SidekickStudioHero />
                <UsingAnswerAgentAISubmenu_1.default />
                <main>
                    <FlowiseFoundation />
                    <PlatformSupport />
                    <StudioFeatures />
                    <MCPToolsImage />
                    <NodeCategories />
                    <NodeReferenceImage />
                    <CTASection />
                </main>
            </Layout_1.default>
        </div>);
}
