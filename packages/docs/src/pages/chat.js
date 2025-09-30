"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Chat;
var clsx_1 = require("clsx");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var Layout_1 = require("@theme/Layout");
var JsonLd_1 = require("@site/src/components/JsonLd");
var SphereScene_1 = require("@site/src/components/Annimations/SphereScene");
var UsingAnswerAgentAISubmenu_1 = require("@site/src/components/UsingAnswerAgentAISubmenu");
var index_module_css_1 = require("./index.module.css");
function ChatHero() {
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <SphereScene_1.default className={index_module_css_1.default.threeJsCanvas}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <h1 className={index_module_css_1.default.heroTitle}>Chat</h1>
                <p className={index_module_css_1.default.heroSubtitle}>
                    Your AI conversation hub with specialized assistants. Store chat histories, switch between different agents, and access
                    powerful sidekicks for every task.
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://studio.theanswer.ai/chat' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Start Chatting
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='/docs/chat' className={index_module_css_1.default.secondaryLink}>
                            📚 View Documentation
                        </a>
                        <a href='#features' className={index_module_css_1.default.secondaryLink}>
                            🤖 Meet the Sidekicks
                        </a>
                    </div>
                </div>
            </div>
        </header>);
}
function FeaturedSidekicks() {
    return (<section className={index_module_css_1.default.featuresSection} id='features'>
            <div className='container'>
                <h2 className='text--center'>Meet Your AI Sidekicks</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Specialized AI assistants designed for specific tasks and workflows
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>📊</div>
                            <h3>Data Analysts</h3>
                            <p>
                                Intelligent assistants that help you interpret and visualize complex datasets. Get insights, generate
                                reports, and discover patterns in your data with natural language queries.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📈 Data Visualization</span>
                                <span>🔍 Pattern Recognition</span>
                                <span>📋 Report Generation</span>
                                <span>💡 Smart Insights</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={index_module_css_1.default.featureCardCTA}>
                                Try Data Analyst →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>✍️</div>
                            <h3>Content Creators</h3>
                            <p>
                                Creative assistants that help generate articles, blog posts, marketing copy, and social media content.
                                Perfect for writers, marketers, and content teams.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📝 Article Writing</span>
                                <span>📱 Social Media</span>
                                <span>📧 Email Campaigns</span>
                                <span>🎯 Brand Voice</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={index_module_css_1.default.featureCardCTA}>
                                Try Content Creator →
                            </a>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>💻</div>
                            <h3>Code Assistants</h3>
                            <p>
                                Programming experts that provide code reviews, debugging help, architecture advice, and documentation
                                generation. Your pair programming partner that never sleeps.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🐛 Code Review</span>
                                <span>🔧 Debugging</span>
                                <span>📖 Documentation</span>
                                <span>🏗️ Architecture</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={index_module_css_1.default.featureCardCTA}>
                                Try Code Assistant →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🔬</div>
                            <h3>Research Aids</h3>
                            <p>
                                Academic and business research specialists that help with literature reviews, market analysis, competitive
                                intelligence, and comprehensive research reports.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📚 Literature Review</span>
                                <span>📊 Market Analysis</span>
                                <span>🎯 Competitive Intel</span>
                                <span>📄 Report Writing</span>
                            </div>
                            <a href='https://studio.theanswer.ai' className={index_module_css_1.default.featureCardCTA}>
                                Try Research Aid →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function ChatFeatures() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.comingSoonSection)}>
            <div className='container'>
                <h2 className='text--center'>Intelligent Conversation Features</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Advanced AI capabilities that make every conversation more productive
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🧠</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Context Awareness</strong>
                                <br />
                                Sidekicks remember your conversation history and maintain context throughout sessions for natural,
                                productive interactions.
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>📎</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>File Upload Support</strong>
                                <br />
                                Upload documents, images, and data files for analysis, processing, and intelligent insights from your AI
                                sidekicks.
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>⚙️</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Customizable Parameters</strong>
                                <br />
                                Fine-tune your sidekicks&apos; responses by adjusting creativity, specificity, and behavior to match your
                                preferences.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function SidekickStudio() {
    return (<section className={index_module_css_1.default.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>Expand Your Sidekick Collection</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Discover, create, and share AI sidekicks through Sidekick Studio
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>📂</div>
                            <h3>My Sidekicks</h3>
                            <p>View and manage your personal collection of AI sidekicks. Organize, customize, and deploy your chatflows.</p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>⭐</div>
                            <h3>AnswerAgentAI Suggested</h3>
                            <p>
                                Explore curated sidekicks recommended by AnswerAgentAI. Discover new capabilities and specialized
                                assistants.
                            </p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>🌐</div>
                            <h3>Community Shared</h3>
                            <p>Access sidekicks shared by your organization and the global community. Learn from others&apos; creations.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function CTASection() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.ctaSection)}>
            <div className='container text--center'>
                <h2>Ready to Meet Your AI Sidekicks?</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Start conversing with intelligent AI assistants that understand your workflow and adapt to your needs
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://studio.theanswer.ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Start Chatting Free
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='/docs/chat' className={index_module_css_1.default.secondaryLink}>
                            📖 Read Documentation
                        </a>
                        <a href='/docs/sidekick-studio' className={index_module_css_1.default.secondaryLink}>
                            🛠️ Sidekick Studio
                        </a>
                    </div>
                </div>
            </div>
        </section>);
}
function Chat() {
    var siteConfig = (0, useDocusaurusContext_1.default)().siteConfig;
    return (<div data-theme='dark'>
            <Layout_1.default title='Chat - AI Conversation Hub' description='Your central hub for AI conversations with specialized sidekicks. Manage chat histories, access different AI agents, and boost productivity.'>
                <JsonLd_1.default data={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Chat - AI Conversation Hub',
            description: 'Your central hub for AI conversations with specialized sidekicks. Manage chat histories, access different AI agents, and boost productivity.',
            url: 'https://answeragent.ai/chat'
        }}/>
                <ChatHero />
                <UsingAnswerAgentAISubmenu_1.default />
                <main>
                    <FeaturedSidekicks />
                    <ChatFeatures />
                    <SidekickStudio />
                    <CTASection />
                </main>
            </Layout_1.default>
        </div>);
}
