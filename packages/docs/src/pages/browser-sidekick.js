"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BrowserExtension;
var clsx_1 = require("clsx");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var Layout_1 = require("@theme/Layout");
var SphereScene_1 = require("@site/src/components/Annimations/SphereScene");
var UsingAnswerAgentAISubmenu_1 = require("@site/src/components/UsingAnswerAgentAISubmenu");
var index_module_css_1 = require("./index.module.css");
function BrowserExtensionHero() {
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <SphereScene_1.default className={index_module_css_1.default.threeJsCanvas}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <h1 className={index_module_css_1.default.heroTitle}>Browser Sidekick</h1>
                <p className={index_module_css_1.default.heroSubtitle}>
                    Bring Alpha along as you browse the web as well as access specialized sidekicks, connect to your tools, and supercharge
                    your workflow without leaving your tab.
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Install Extension
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='/docs/browser' className={index_module_css_1.default.secondaryLink}>
                            📚 View Documentation
                        </a>
                        <a href='#features' className={index_module_css_1.default.secondaryLink}>
                            🚀 Explore Features
                        </a>
                    </div>
                </div>
            </div>
        </header>);
}
function CoreFeatures() {
    return (<section className={index_module_css_1.default.featuresSection} id='features'>
            <div className='container'>
                <h2 className='text--center'>AI-Powered Browser Capabilities</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Everything you need to work smarter, directly in your browser
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>📄</div>
                            <h3>Instant Page Summaries</h3>
                            <p>
                                Get the essence of any article, research paper, or webpage in seconds. Extract key insights and main points
                                without reading through lengthy content.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>⚡ Instant Analysis</span>
                                <span>🎯 Key Points</span>
                                <span>📊 Data Extraction</span>
                                <span>🔍 Smart Filtering</span>
                            </div>
                            <a href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim' className={index_module_css_1.default.featureCardCTA}>
                                Try Summaries →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🔍</div>
                            <h3>AI-Enhanced Search</h3>
                            <p>
                                Go beyond basic web searches with AI-powered query enhancement, result analysis, and intelligent filtering
                                to find exactly what you need.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🧠 Smart Queries</span>
                                <span>📈 Result Analysis</span>
                                <span>🎯 Precision Results</span>
                                <span>💡 Context Aware</span>
                            </div>
                            <a href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim' className={index_module_css_1.default.featureCardCTA}>
                                Try Enhanced Search →
                            </a>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🎨</div>
                            <h3>DALL-E Image Generation</h3>
                            <p>
                                Create stunning images from text descriptions directly in your browser. Perfect for presentations, social
                                media, and creative projects.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🖼️ Text-to-Image</span>
                                <span>✨ High Quality</span>
                                <span>⚡ Instant Generation</span>
                                <span>🎭 Multiple Styles</span>
                            </div>
                            <a href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim' className={index_module_css_1.default.featureCardCTA}>
                                Generate Images →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🔗</div>
                            <h3>Tool Integrations</h3>
                            <p>
                                Connect to your essential tools like Salesforce, Jira, Slack, GitHub, and more. Query and interact with your
                                systems using natural language.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>💼 CRM Integration</span>
                                <span>📋 Project Tools</span>
                                <span>💬 Communication</span>
                                <span>🔧 Developer Tools</span>
                            </div>
                            <a href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim' className={index_module_css_1.default.featureCardCTA}>
                                Connect Tools →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function AIModels() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.comingSoonSection)}>
            <div className='container'>
                <h2 className='text--center'>Choose Your AI Brain</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Access leading AI models through a single interface
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🤖</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>OpenAI Models</strong>
                                <br />
                                Access GPT-4, GPT-3.5, and specialized models for advanced reasoning, writing, and problem-solving tasks.
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🧠</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Google Gemini</strong>
                                <br />
                                Leverage Google&apos;s advanced AI capabilities for complex analysis, multimodal understanding, and
                                sophisticated reasoning.
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🎭</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Anthropic Claude</strong>
                                <br />
                                Utilize Claude models for nuanced conversations, ethical reasoning, and sophisticated text analysis with
                                safety built-in.
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🦙</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>Llama & Deepseek</strong>
                                <br />
                                Access open-source models for specialized tasks, custom fine-tuning, and privacy-focused AI processing.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function UseCases() {
    return (<section className={index_module_css_1.default.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>Transform Your Workflow</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Real-world use cases that boost productivity
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>📊</div>
                            <h3>Research & Analysis</h3>
                            <p>
                                Quickly gather information, summarize research papers, compile competitive intelligence, and generate
                                comprehensive reports.
                            </p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>💼</div>
                            <h3>Business Operations</h3>
                            <p>
                                Streamline CRM updates, analyze project tickets, draft communications, and maintain business intelligence
                                workflows.
                            </p>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>🎨</div>
                            <h3>Creative Projects</h3>
                            <p>
                                Generate marketing visuals, create social media content, draft copy, and develop creative concepts without
                                switching tools.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function CTASection() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.ctaSection)}>
            <div className='container text--center'>
                <h2>Ready to Supercharge Your Browser?</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Join thousands of users who have transformed their browsing experience with AnswerAgent Sidekick
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Install Now - It&apos;s Free
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='/docs/browser' className={index_module_css_1.default.secondaryLink}>
                            📖 Read Documentation
                        </a>
                        <a href='https://discord.gg/X54ywt8pzj' className={index_module_css_1.default.secondaryLink}>
                            💬 Get Support
                        </a>
                    </div>
                </div>
            </div>
        </section>);
}
function BrowserExtension() {
    var siteConfig = (0, useDocusaurusContext_1.default)().siteConfig;
    return (<div data-theme='dark'>
            <Layout_1.default title='Browser Extension - AI Everywhere You Browse' description='Bring AI assistance to every website. Get page summaries, enhanced search, and access to your AI sidekicks without leaving your browser tab.'>
                <BrowserExtensionHero />
                <UsingAnswerAgentAISubmenu_1.default />
                <main>
                    <CoreFeatures />
                    <AIModels />
                    <UseCases />
                    <CTASection />
                </main>
            </Layout_1.default>
        </div>);
}
