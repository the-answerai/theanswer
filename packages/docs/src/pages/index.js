"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
var clsx_1 = require("clsx");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var Layout_1 = require("@theme/Layout");
var JsonLd_1 = require("@site/src/components/JsonLd");
var SphereScene_1 = require("@site/src/components/Annimations/SphereScene");
var index_module_css_1 = require("./index.module.css");
function HomepageHeader() {
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <SphereScene_1.default className={index_module_css_1.default.threeJsCanvas}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <img src='img/answerai-logo-600-wide-white.png' alt='AnswerAgentAI Logo' className={index_module_css_1.default.heroLogo}/>
                <h1 className={index_module_css_1.default.heroTitle}>
                    AI for ALL, <em>not for the few.</em>{' '}
                </h1>
                <p className={index_module_css_1.default.heroSubtitle}>Building a decentralized, open, and creative future you can trust.</p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='https://studio.theanswer.ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Start Building
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='https://chromewebstore.google.com/detail/answeragent-sidekick/cpepciclppmfljkeiodifodfkpicfaim' target='_blank' rel='noreferrer' className={index_module_css_1.default.secondaryLink}>
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' className={index_module_css_1.default.chromeIcon}>
                                <path d='M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm6.865 2.29a5.454 5.454 0 0 1 6.865 2.29l5.346-9.26A11.944 11.944 0 0 0 12 0v6.545a5.454 5.454 0 0 1 5.454 5.455c0 3.012-2.443 5.455-5.454 5.455s-5.454-2.443-5.454-5.455c0-1.513.616-2.88 1.612-3.865z'/>
                            </svg>
                            Download Chrome Extension
                        </a>
                        <a href='/developers/' className={index_module_css_1.default.secondaryLink}>
                            👩‍💻 Call for Developers
                        </a>
                    </div>
                </div>
            </div>
        </header>);
}
var LayoutComponent = Layout_1.default;
function MissionSection() {
    return (<section className={index_module_css_1.default.missionSection}>
            <div className='container'>
                <div className='row'>
                    <div className='col col--6'>
                        <h2>The Problem We Face</h2>
                        <p>
                            We live in a world where power over AI is centralized—controlled by corporations, governments, and unelected
                            technocrats. These entities harvest our data, profit from our creativity, and shape our digital reality. The
                            most powerful technology ever created is being used not to uplift, but to manipulate. <br />
                            <br />
                            Our mission is to create a decentralized, open, and creative future where individuals can own their digital
                            identity, run autonomous agents, and share, monetize, or protect their data as they choose. We&apos;re just
                            getting started, will you join us?
                        </p>
                        <div style={{ marginTop: '2rem' }}>
                            <a href='/blog/what-is-the-answer-ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                Read Our Manifesto
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={index_module_css_1.default.videoContainer}>
                            <iframe width='100%' height='315' src='https://www.youtube.com/embed/2HVcHMaaMM0' title='AnswerAgentAI Vision' frameBorder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowFullScreen className={index_module_css_1.default.youtubeVideo}></iframe>
                        </div>
                    </div>
                </div>
                <div className={index_module_css_1.default.beliefsSection}>
                    <h2>Our Commitment to AI Independence</h2>

                    {/* Pyramid Container */}
                    <div className={index_module_css_1.default.pyramidContainer}>
                        <div className={index_module_css_1.default.commandmentsGrid}>
                            <div className={index_module_css_1.default.commandmentCard}>
                                <div className={index_module_css_1.default.commandmentNumber}>I</div>
                                <div className={index_module_css_1.default.commandmentTitle}>Human Autonomy Is Sacred</div>
                                <div className={index_module_css_1.default.commandmentDescription}>
                                    Every individual should maintain sovereignty over their digital identity, data, and AI interactions
                                    without coercion or manipulation by centralized authorities.
                                </div>
                            </div>

                            <div className={index_module_css_1.default.commandmentCard}>
                                <div className={index_module_css_1.default.commandmentNumber}>II</div>
                                <div className={index_module_css_1.default.commandmentTitle}>Technology Must Serve Individual</div>
                                <div className={index_module_css_1.default.commandmentDescription}>
                                    Technology should amplify human potential rather than extract value from users, offering tools that
                                    empower individual agency.
                                </div>
                            </div>

                            <div className={index_module_css_1.default.commandmentCard}>
                                <div className={index_module_css_1.default.commandmentNumber}>III</div>
                                <div className={index_module_css_1.default.commandmentTitle}>Creativity Is Sovereign</div>
                                <div className={index_module_css_1.default.commandmentDescription}>
                                    Human creativity and intellectual contribution should be recognized, protected, and fairly compensated
                                    in the age of AI.
                                </div>
                            </div>

                            <div className={index_module_css_1.default.commandmentCard}>
                                <div className={index_module_css_1.default.commandmentNumber}>IV</div>
                                <div className={index_module_css_1.default.commandmentTitle}>Privacy Is a Fundamental Right</div>
                                <div className={index_module_css_1.default.commandmentDescription}>
                                    Personal data and digital interactions should remain private by default, with users maintaining full
                                    control over their information.
                                </div>
                            </div>

                            <div className={index_module_css_1.default.commandmentCard}>
                                <div className={index_module_css_1.default.commandmentNumber}>V</div>
                                <div className={index_module_css_1.default.commandmentTitle}>Decentralization Prevents Monopolies</div>
                                <div className={index_module_css_1.default.commandmentDescription}>
                                    Power should be distributed across networks rather than concentrated in centralized authorities and
                                    platforms.
                                </div>
                            </div>

                            <div className={index_module_css_1.default.commandmentCard}>
                                <div className={index_module_css_1.default.commandmentNumber}>VI</div>
                                <div className={index_module_css_1.default.commandmentTitle}>Ethical AI Development</div>
                                <div className={index_module_css_1.default.commandmentDescription}>
                                    AI development should prioritize beneficial outcomes for humanity, transparency in decision-making, and
                                    alignment with human values.
                                </div>
                            </div>
                        </div>

                        <div className={"".concat(index_module_css_1.default.commandmentCard, " ").concat(index_module_css_1.default.commandmentCardFull)}>
                            <div className={index_module_css_1.default.commandmentNumber}>VII</div>
                            <div className={index_module_css_1.default.commandmentTitle}>Community Owns the Future</div>
                            <div className={index_module_css_1.default.commandmentDescription}>
                                A future worth living in depends on systems that are open, forkable, transparent, and global—not platforms
                                locked inside Silicon Valley monopolies.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function FeaturesSection() {
    return (<section className={index_module_css_1.default.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>The complete AI Agent solution</h2>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🚀</div>
                            <div>
                                <h3>Agent Apps</h3>
                                <p>
                                    Extend the power of AnswerAgent with a growing ecosystem of applications. Integrate AI seamlessly into
                                    your workflows and daily tasks.
                                </p>
                                <a href='/apps' className={index_module_css_1.default.featureCardCTA}>
                                    Explore Apps →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>💬</div>
                            <div>
                                <h3>Chat</h3>
                                <p>
                                    Engage with your AI agents naturally through a powerful chat interface. Get instant answers, automate
                                    tasks, and streamline communication.
                                </p>
                                <a href='/chat' className={index_module_css_1.default.featureCardCTA}>
                                    Learn About Chat →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🌐</div>
                            <div>
                                <h3>Browser Sidekick</h3>
                                <p>
                                    Bring AnswerAgent directly into your browser. Access AI capabilities, automate web tasks, and enhance
                                    your online experience with ease.
                                </p>
                                <a href='/browser-sidekick' className={index_module_css_1.default.featureCardCTA}>
                                    Learn About Sidekick →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🎯</div>
                            <div>
                                <h3>Sidekick Studio</h3>
                                <p>
                                    Design, deploy, and manage your AI agent workforce with an intuitive visual interface. Build powerful,
                                    customizable AI agents without coding skills.
                                </p>
                                <a href='/sidekick-studio' className={index_module_css_1.default.featureCardCTA}>
                                    Try Studio →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function PricingSection() {
    return (<section className={index_module_css_1.default.pricingSection}>
            <div className='container'>
                <div className='text--center' style={{ marginBottom: '3rem' }}>
                    <h2 className='text--center'>Simple, Transparent Pricing</h2>
                    <p className='text--center' style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '0' }}>
                        Start free, pay only for what you use, with full control over your costs
                    </p>
                </div>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.pricingCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.pricingIcon}>🆓</div>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Free to Try</h3>
                                <div className={index_module_css_1.default.pricingHighlight}>$0</div>
                                <p style={{ marginBottom: '1.5rem', flex: '1' }}>
                                    Get started immediately with our free tier. Explore all features, test workflows, and see the power of
                                    AI agents before you commit to anything.
                                </p>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Full feature access</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Limited usage credits</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Community support</div>
                                </div>
                                <div style={{ marginTop: 'auto' }}>
                                    <a href='https://studio.theanswer.ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                        Start Free
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.pricingCard, index_module_css_1.default.commandment, index_module_css_1.default.pricingCardHighlighted)}>
                            <div className={index_module_css_1.default.pricingIcon}>💳</div>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Usage-Based</h3>
                                <div className={index_module_css_1.default.pricingHighlight}>$20 to start</div>
                                <p style={{ marginBottom: '1.5rem', flex: '1' }}>
                                    Pay only for what you use with transparent, real-time cost tracking. No subscriptions, no hidden fees,
                                    just honest usage-based pricing.
                                </p>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Real-time cost calculators</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Transparent metrics dashboard</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Small nominal fees on API usage</div>
                                </div>
                                <div style={{ marginTop: 'auto' }}>
                                    <a href='https://studio.theanswer.ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                        Get Started for Free
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.pricingCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.pricingIcon}>🏢</div>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Business Account</h3>
                                <div className={index_module_css_1.default.pricingHighlight}>$500 + Usage</div>
                                <p style={{ marginBottom: '1.5rem', flex: '1' }}>
                                    Get a fully segregated cloud environment for your business. Share agents, chatflows, and collaborate
                                    with your team in a dedicated workspace with enhanced security and controls.
                                </p>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Dedicated cloud environment</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Team collaboration & sharing</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Enhanced security controls</div>
                                </div>
                                <div style={{ marginTop: 'auto' }}>
                                    <a href='https://calendly.com/lastrev/answeragent-demo' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                        Request Demo
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.pricingCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.pricingIcon}>🏢</div>
                            <div>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Enterprise</h3>
                                <div className={index_module_css_1.default.pricingHighlight}>Fully Local</div>
                                <p style={{ marginBottom: '1.5rem' }}>
                                    Complete enterprise solution with full self-hosted licensing and services. Deploy AnswerAgentAI entirely
                                    within your infrastructure for maximum security and control.
                                </p>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Full self-hosted deployment</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Enterprise licensing & support</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Custom integrations & training</div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <a href='https://calendly.com/lastrev/answeragent-demo' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                        Talk to Us
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.pricingCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.pricingIcon}>🤝</div>
                            <div>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>AI Services</h3>
                                <div className={index_module_css_1.default.pricingHighlight}>Professional Partners</div>
                                <p style={{ marginBottom: '1.5rem' }}>
                                    Connect with Last Rev for custom AI implementations, training, and ongoing support for your specific
                                    business needs.
                                </p>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Certified implementation partner</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Custom AI workflow development</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Training & ongoing support</div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <a href='https://lastrev.com' target='_blank' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)} rel='noreferrer'>
                                        Contact Last Rev
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '3rem' }}>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.pricingCallout, index_module_css_1.default.commandment)}>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>💡 Full Cost Transparency</h3>
                                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                                    We provide completely transparent metrics and cost calculators inside the app. See exactly what
                                    you&apos;re spending, when, and why. We take only a small nominal fee on commercial AI tools and
                                    licensed AnswerAgentAI versions to keep the platform running.
                                </p>
                                <div style={{ marginTop: '2rem' }}>
                                    <a href='https://studio.theanswer.ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                        Start Free Today
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.pricingCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.pricingIcon}>🔑</div>
                            <div>
                                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>Bring Your Own API Token</h3>
                                <div className={index_module_css_1.default.pricingHighlight}>Maximum Savings</div>
                                <p style={{ marginBottom: '1.5rem' }}>
                                    Use your own API keys from OpenAI, Anthropic, Google, and others to drastically reduce costs. You
                                    maintain direct control and billing relationships.
                                </p>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Direct API key integration</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Massive cost savings</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Zero markup on your usage</div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <a href='/getting-started' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                        Learn How
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function MacAppTeaser() {
    return (<section className={index_module_css_1.default.macAppTeaserSection}>
            <div className='container text--center'>
                <h2>Mac App Coming Soon!</h2>
                <img src='img/mac-app-icon.svg' alt='Mac App Icon' className={index_module_css_1.default.macAppIcon}/>
                <p>
                    Experience the full power of AnswerAgent natively on your Mac. A decentralized ecosystem where individuals can own their
                    digital identity, run autonomous agents, and share, monetize, or protect their data as they choose.
                </p>
            </div>
        </section>);
}
function Home() {
    var _siteConfig = (0, useDocusaurusContext_1.default)().siteConfig;
    return (<div data-theme='dark'>
            <LayoutComponent title={'Answer Agent AI: Build your AI-Agent Workforce'} description='Orchestrate secure AI agents across your business.'>
                <JsonLd_1.default data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'AnswerAgent',
            url: 'https://answeragent.ai',
            description: 'AnswerAgent: AI agents, chat, and workflows for teams.'
        }}/>
                <HomepageHeader />
                <main>
                    <FeaturesSection />
                    <MacAppTeaser />
                    {/* <MissionSection /> */}
                    <PricingSection />
                </main>
            </LayoutComponent>
        </div>);
}
