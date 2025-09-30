"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Developers;
var clsx_1 = require("clsx");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var Layout_1 = require("@theme/Layout");
var SphereScene_1 = require("@site/src/components/Annimations/SphereScene");
var index_module_css_1 = require("./index.module.css");
function DevelopersHero() {
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <SphereScene_1.default className={index_module_css_1.default.threeJsCanvas}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <h1 className={index_module_css_1.default.heroTitle}>Help Us Build the Future of AI—Together</h1>
                <p className={index_module_css_1.default.heroSubtitle}>
                    A Call to Builders for the AnswerAgentAI Alpha Sprint. Not your data, not your soul—just your code and your conviction.
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://github.com/orgs/the-answerai/repositories' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Start Building Now
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='#mission' className={index_module_css_1.default.secondaryLink}>
                            🎯 The Mission
                        </a>
                        <a href='#rewards' className={index_module_css_1.default.secondaryLink}>
                            💰 Earn Credits
                        </a>
                    </div>
                </div>
            </div>
        </header>);
}
var LayoutComponent = Layout_1.default;
function OpeningHook() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.comingSoonSection)}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--12'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)} style={{ textAlign: 'center' }}>
                            <div className={index_module_css_1.default.comingSoonIcon}>👨‍💻</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <h2 style={{ color: '#00ffff', marginBottom: '1.5rem' }}>Hey Builders. We Need You.</h2>
                                <p style={{ fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                    We&apos;re sprinting to create something that shouldn&apos;t exist according to Big Tech: a fully local
                                    AI platform that respects your privacy and amplifies your creativity.
                                </p>
                                <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                                    <strong style={{ color: '#00ffff' }}>No surveillance. No lock-in.</strong> Just pure, ethical computing
                                    power in your hands.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function MissionBrief() {
    return (<section className={index_module_css_1.default.featuresSection} id='mission'>
            <div className='container'>
                <h2 className='text--center'>The Mission Brief</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Three critical pieces for launch—developers, creators, rebels building the tools we actually want to use
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>1</div>
                            <h3>Chrome Extension</h3>
                            <p>
                                Your AI sidekick in the browser. Instant assistance on any webpage, intelligent interactions, and seamless
                                workflow integration.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🌐 Browser Integration</span>
                                <span>🤖 AI Assistance</span>
                                <span>⚡ Real-time Processing</span>
                            </div>
                            <a href='https://github.com/the-answerai/aai-browser-sidekick' className={index_module_css_1.default.featureCardCTA}>
                                View Issues →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>2</div>
                            <h3>Web Application</h3>
                            <p>
                                The command center for your agents. Visual workflow builder, agent management, and the hub for all AI
                                interactions.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🎨 Visual Builder</span>
                                <span>📊 Agent Dashboard</span>
                                <span>🔗 API Integration</span>
                            </div>
                            <a href='https://github.com/the-answerai/theanswer' className={index_module_css_1.default.featureCardCTA}>
                                Contribute →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>3</div>
                            <h3>Desktop Apps</h3>
                            <p>
                                Coming soon, but foundation work starts now. Native applications for true local AI processing and maximum
                                privacy.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🖥️ Native Performance</span>
                                <span>🔒 Local Processing</span>
                                <span>🏗️ Foundation Work</span>
                            </div>
                            <a href='https://github.com/the-answerai' className={index_module_css_1.default.featureCardCTA}>
                                Coming Soon
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function PracticalPath() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.comingSoonSection)}>
            <div className='container'>
                <h2 className='text--center'>The Practical Path</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Getting started is dead simple—from clone to contribution in minutes
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🚀</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>1. Clone the Repo</strong>
                                <br />
                                Detailed local setup instructions ready. Get your development environment running in minutes with our
                                comprehensive setup guide.
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <a href='https://github.com/orgs/the-answerai/repositories' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.secondaryLink)} style={{ textTransform: 'none' }}>
                                    Browse Repositories →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🎯</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>2. Pick an Issue</strong>
                                <br />
                                Search for the &apos;beginner&apos; tag to find your first contribution. We&apos;ve curated issues perfect
                                for getting familiar with the codebase.
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <a href='https://github.com/the-answerai/theanswer/issues' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.secondaryLink)} style={{ textTransform: 'none' }}>
                                    Browse Issues →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🛠️</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>3. Build Something</strong>
                                <br />
                                Fix a bug, add a feature, improve the docs. Every contribution moves us closer to launch. Own your version.
                                Fork it. Make it yours.
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <a href='/docs/developers' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.secondaryLink)} style={{ textTransform: 'none' }}>
                                    Dev Guide →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>📹</div>
                            <div className={index_module_css_1.default.commandmentText}>
                                <strong>4. Share Your Story</strong>
                                <br />
                                Record a 1-3 minute video explaining what you built and why it matters. Show the world what happens when
                                developers build for developers.
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <a href='/docs/developers/video-guide' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.secondaryLink)} style={{ textTransform: 'none' }}>
                                    Video Guide →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function RewardStructure() {
    return (<section className={index_module_css_1.default.featuresSection} id='rewards'>
            <div className='container'>
                <h2 className='text--center'>This Isn&apos;t Charity Work</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Every contribution earns credits—we&apos;re tracking everything transparently
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>💎</div>
                            <h3>Earn Credits For</h3>
                            <p>
                                Your work has value, and we&apos;ll make sure you&apos;re compensated. From commits to code reviews, every
                                meaningful contribution counts.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📝 Commits that land</span>
                                <span>🔍 Thoughtful code reviews</span>
                                <span>📚 Documentation that helps</span>
                                <span>🐛 Great bug reports</span>
                            </div>
                            <a href='/docs/developers/earn-credits' className={index_module_css_1.default.featureCardCTA}>
                                Learn More →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>⚡</div>
                            <h3>Review Process</h3>
                            <p>
                                No gatekeeping. Just quality code and aligned values. Our automated system helps you succeed with
                                AI-suggested next steps.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🤖 Automated testing</span>
                                <span>💡 AI-suggested improvements</span>
                                <span>📹 Video explanations</span>
                                <span>⚡ Fast feedback loops</span>
                            </div>
                            <a href='/docs/developers/contributing' className={index_module_css_1.default.featureCardCTA}>
                                PR Guidelines →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function ClosingRally() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.ctaSection)}>
            <div className='container text--center'>
                <h2>We Have 17 Days to Prove Something Important</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>
                    That a small group of committed developers can build better tools than billion-dollar corporations
                </p>
                <div className='row' style={{ marginBottom: '3rem' }}>
                    <div className='col col--12'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard)} style={{ textAlign: 'center', border: '2px solid #ff00ff' }}>
                            <div className={index_module_css_1.default.commandmentText}>
                                <h3 style={{ color: '#ff00ff', marginBottom: '1rem' }}>Not because we have more resources.</h3>
                                <h3 style={{ color: '#00ffff', marginBottom: '1.5rem' }}>
                                    But because we give a damn about the right things.
                                </h3>
                                <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
                                    <strong>Privacy. Creativity. Human autonomy.</strong>
                                    <br />
                                    This is our shot to build AI that serves people, not platforms.
                                    <br />
                                    To create tools that empower, not exploit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://github.com/orgs/the-answerai/repositories' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Let&apos;s Show Them What We Can Build
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='https://github.com/the-answerai/issues?q=is%3Aissue+is%3Aopen+label%3Abeginner' className={index_module_css_1.default.secondaryLink}>
                            🎯 Find Beginner Issues
                        </a>
                        <a href='https://discord.gg/X54ywt8pzj' className={index_module_css_1.default.secondaryLink}>
                            💬 Join Discord
                        </a>
                    </div>
                </div>
            </div>
        </section>);
}
// YouTubeSection moved to Learn page
function QuickReference() {
    return (<section className={index_module_css_1.default.featuresSection} id='video-guide'>
            <div className='container'>
                <h2 className='text--center'>Quick Reference Card for Contributors</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Everything you need to get started and earn credits
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🚀</div>
                            <h3>Start Here</h3>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📂 GitHub Repository</span>
                                <span>📋 Setup Documentation</span>
                                <span>🏷️ Beginner Issues Filter</span>
                            </div>
                            <a href='https://github.com/orgs/the-answerai/repositories' className={index_module_css_1.default.featureCardCTA}>
                                Browse Repositories →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>📹</div>
                            <h3>Video Requirements</h3>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>⏱️ 1-3 minutes long</span>
                                <span>🛠️ What you built/fixed</span>
                                <span>🎯 Problem it solves</span>
                                <span>🌟 How it serves the mission</span>
                            </div>
                            <a href='/docs/developers/video-guide' className={index_module_css_1.default.featureCardCTA}>
                                Video Guide →
                            </a>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>📅</div>
                            <h3>Help Build the Community</h3>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🎯 Focus: Chrome Extension & Web App</span>
                                <span>🏗️ Foundation: Desktop Architecture</span>
                            </div>
                            <a href='#mission' className={index_module_css_1.default.featureCardCTA}>
                                View Mission →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>🤝</div>
                            <h3>The Deal</h3>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>👨‍💻 You build with us</span>
                                <span>💰 We reward your work</span>
                                <span>🚀 Together we own the future</span>
                            </div>
                            <a href='#rewards' className={index_module_css_1.default.featureCardCTA}>
                                Learn Rewards →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function Developers() {
    var _siteConfig = (0, useDocusaurusContext_1.default)().siteConfig;
    return (<div data-theme='dark'>
            <LayoutComponent title='Developers - Help Us Build the Future of AI' description='Join the AnswerAgentAI Alpha Sprint. Build privacy-first AI tools that empower, not exploit. Earn credits for contributions. Let us show Big Tech what committed developers can build.'>
                <DevelopersHero />
                <main>
                    <OpeningHook />
                    <MissionBrief />
                    <PracticalPath />
                    <RewardStructure />
                    <ClosingRally />
                    <QuickReference />
                </main>
            </LayoutComponent>
        </div>);
}
