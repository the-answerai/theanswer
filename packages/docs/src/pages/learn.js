"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Learn;
var clsx_1 = require("clsx");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var Layout_1 = require("@theme/Layout");
var UsingAnswerAgentAISubmenu_1 = require("@site/src/components/UsingAnswerAgentAISubmenu");
var SphereScene_1 = require("@site/src/components/Annimations/SphereScene");
var index_module_css_1 = require("./index.module.css");
function LearnHero() {
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <SphereScene_1.default className={index_module_css_1.default.threeJsCanvas}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <h1 className={index_module_css_1.default.heroTitle}>Learn AI & Accelerate Your Journey</h1>
                <p className={index_module_css_1.default.heroSubtitle}>
                    Master AI fundamentals, discover practical applications, and unlock the full potential of AnswerAgentAI with our
                    comprehensive learning resources.
                </p>
                <div className={index_module_css_1.default.heroCTAs}>
                    <a href='#alpha-extension' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Try Alpha Extension
                    </a>
                    <div className={index_module_css_1.default.secondaryLinks}>
                        <a href='#modules' className={index_module_css_1.default.secondaryLink}>
                            📚 AI Modules
                        </a>
                        <a href='#courses' className={index_module_css_1.default.secondaryLink}>
                            🎓 Video Courses
                        </a>
                    </div>
                </div>
            </div>
        </header>);
}
function AlphaExtensionPromo() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.featuresSection, index_module_css_1.default.comingSoonSection)} id='alpha-extension'>
            <div className='container'>
                <h2 className='text--center'>🚀 Alpha Browser Sidekick - Your AI Sidekick Everywhere</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Experience the future of AI assistance right in your browser. Ask questions, get help, and boost productivity on any
                    website.
                </p>
                <div className='row'>
                    <div className='col col--12'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard, index_module_css_1.default.subscriptionBanner)}>
                            <div className={index_module_css_1.default.subscriptionBannerContent}>
                                <div className={(0, clsx_1.default)(index_module_css_1.default.comingSoonIcon, index_module_css_1.default.subscriptionBannerIcon)}>🤖</div>
                                <div className={(0, clsx_1.default)(index_module_css_1.default.commandmentText, index_module_css_1.default.subscriptionBannerText)}>
                                    <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>What Alpha Can Do For You</h3>
                                    <div className='row'>
                                        <div className='col col--6'>
                                            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                                                <strong style={{ color: '#ff00ff' }}>🧠 Smart Platform Assistant</strong>
                                                <br />
                                                Ask questions about any feature, get instant explanations, and discover hidden capabilities
                                                while using AnswerAgentAI.
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <strong style={{ color: '#ff00ff' }}>🎯 Agent Creation Helper</strong>
                                                <br />
                                                Get guided assistance creating new agents, optimizing workflows, and troubleshooting
                                                configurations.
                                            </div>
                                        </div>
                                        <div className='col col--6'>
                                            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                                                <strong style={{ color: '#ff00ff' }}>🎫 Support Ticket Assistant</strong>
                                                <br />
                                                Submit detailed support tickets with context, screenshots, and relevant information
                                                automatically captured.
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <strong style={{ color: '#ff00ff' }}>💬 Universal Q&A</strong>
                                                <br />
                                                Ask anything about AI, productivity, or how to get the most out of your AnswerAgentAI
                                                experience.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={index_module_css_1.default.subscriptionBannerButton}>
                                <a href='/browser-sidekick' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                    Get Alpha Sidekick
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function AIModules() {
    return (<section className={index_module_css_1.default.featuresSection} id='modules'>
            <div className='container'>
                <h2 className='text--center'>AI Fundamentals - Interactive Learning Modules</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Build your AI knowledge from the ground up with our comprehensive, beginner-friendly modules
                </p>
                <div className='row'>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>1</div>
                            <h3>Welcome to the World of AI!</h3>
                            <p>
                                The bare essentials of AI, Chatbots, and what AnswerAgentAI is all about. Perfect starting point for AI
                                newcomers.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🧠 AI Basics</span>
                                <span>🤖 Chatbot Fundamentals</span>
                                <span>🎯 AnswerAgentAI Overview</span>
                            </div>
                            <a href='/docs/use-cases/module-1-welcome-to-ai' className={index_module_css_1.default.featureCardCTA}>
                                Start Module 1 →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>2</div>
                            <h3>The Art of the Perfect Prompt</h3>
                            <p>
                                Learn how to craft effective prompts to get the best results from AI. Master the communication with AI
                                systems.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>✍️ Prompt Engineering</span>
                                <span>🎨 Effective Communication</span>
                                <span>⚡ Best Practices</span>
                            </div>
                            <a href='/docs/use-cases/module-2-art-of-the-prompt' className={index_module_css_1.default.featureCardCTA}>
                                Start Module 2 →
                            </a>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>3</div>
                            <h3>AnswerAgentAI in Action</h3>
                            <p>Discover practical ways you can use AnswerAgentAI for daily tasks and unlock everyday superpowers.</p>
                            <a href='/docs/use-cases/module-3-answeragent-in-action' className={index_module_css_1.default.featureCardCTA}>
                                Start Module 3 →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>4</div>
                            <h3>AnswerAgentAI vs. Others</h3>
                            <p>Understand how AnswerAgentAI compares to ChatGPT, Claude, NotebookLM and other popular AI tools.</p>
                            <a href='/docs/use-cases/module-4-answeragent-vs-others' className={index_module_css_1.default.featureCardCTA}>
                                Start Module 4 →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>5</div>
                            <h3>Supercharge Your Experience</h3>
                            <p>Tips and advanced features to get the most out of AnswerAgentAI, including Sidekicks and Extensions.</p>
                            <a href='/docs/use-cases/module-5-supercharging-answeragent' className={index_module_css_1.default.featureCardCTA}>
                                Start Module 5 →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function YouTubeCourses() {
    return (<section className={index_module_css_1.default.missionSection} id='courses'>
            <div className='container'>
                <h2 className='text--center'>Learn AI Development with Digital at Scale</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Get up to speed with AI concepts and development practices from our founder&apos;s comprehensive video courses
                </p>

                <div className='row' style={{ marginBottom: '3rem' }}>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.videoCard)}>
                            <h3 style={{ marginBottom: '1.5rem', color: '#00ffff' }}>🎓 AI 101 - Foundation Course</h3>
                            <div className={index_module_css_1.default.videoContainer}>
                                <iframe className={index_module_css_1.default.youtubeVideo} src='https://www.youtube.com/embed/-VbXVX4rzDk' title='AI 101 - Foundation Course' frameBorder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' allowFullScreen/>
                            </div>
                            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                                Master the fundamentals of AI and machine learning. Perfect starting point for developers and enthusiasts
                                joining the mission.
                            </p>
                            <a href='https://www.youtube.com/watch?v=-VbXVX4rzDk' target='_blank' rel='noopener noreferrer' className={index_module_css_1.default.featureCardCTA}>
                                Watch on YouTube →
                            </a>
                        </div>
                    </div>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.videoCard)}>
                            <h3 style={{ marginBottom: '1.5rem', color: '#00ffff' }}>🚀 Advanced AI Development</h3>
                            <div className={index_module_css_1.default.videoContainer}>
                                <iframe className={index_module_css_1.default.youtubeVideo} src='https://www.youtube.com/embed/jleXZV8HXtI' title='Advanced AI Development' frameBorder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' allowFullScreen/>
                            </div>
                            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                                Deep dive into advanced AI concepts and practical implementation strategies for real-world applications.
                            </p>
                            <a href='https://www.youtube.com/watch?v=jleXZV8HXtI&list=PLfkQz1-GoNNLucltsGTw2f_0VmEsnxsrj' target='_blank' rel='noopener noreferrer' className={index_module_css_1.default.featureCardCTA}>
                                Watch Playlist →
                            </a>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div className={(0, clsx_1.default)(index_module_css_1.default.commandment, index_module_css_1.default.comingSoonCard, index_module_css_1.default.subscriptionBanner)}>
                        <div className={index_module_css_1.default.subscriptionBannerContent}>
                            <div className={(0, clsx_1.default)(index_module_css_1.default.comingSoonIcon, index_module_css_1.default.subscriptionBannerIcon)}>📺</div>
                            <div className={(0, clsx_1.default)(index_module_css_1.default.commandmentText, index_module_css_1.default.subscriptionBannerText)}>
                                <strong>Digital at Scale YouTube Channel</strong>
                                <br />
                                Subscribe for weekly deep dives into AI development, privacy-first architecture, and the future of ethical
                                computing. New videos every Tuesday.
                            </div>
                        </div>
                        <div className={index_module_css_1.default.subscriptionBannerButton}>
                            <a href='https://www.youtube.com/@digitalatscale' target='_blank' rel='noopener noreferrer' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                Subscribe to Channel
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function LearningResources() {
    return (<section className={index_module_css_1.default.featuresSection}>
            <div className='container'>
                <h2 className='text--center'>Additional Learning Resources</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    Explore comprehensive documentation, community support, and developer resources
                </p>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>📖</div>
                            <h3>Complete Documentation</h3>
                            <p>Comprehensive guides, API references, and step-by-step tutorials for every aspect of AnswerAgentAI.</p>
                            <a href='/docs' className={index_module_css_1.default.featureCardCTA}>
                                Browse Documentation →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>👥</div>
                            <h3>Community Support</h3>
                            <p>Join our vibrant community for help, sharing experiences, and collaborating on innovative AI solutions.</p>
                            <a href='https://discord.gg/X54ywt8pzj' target='_blank' rel='noopener noreferrer' className={index_module_css_1.default.featureCardCTA}>
                                Join Discord →
                            </a>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={index_module_css_1.default.featureCard}>
                            <div className={index_module_css_1.default.appIcon}>💻</div>
                            <h3>Developer Resources</h3>
                            <p>Contribute to the platform, access source code, and help build the future of ethical AI.</p>
                            <a href='/developers' className={index_module_css_1.default.featureCardCTA}>
                                Explore Development →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function Learn() {
    var siteConfig = (0, useDocusaurusContext_1.default)().siteConfig;
    return (<div data-theme='dark'>
            <Layout_1.default title='Learn AI & Master AnswerAgentAI' description='Master AI fundamentals with interactive modules, video courses, and comprehensive learning resources. Start with our Alpha browser extension for instant AI assistance.'>
                <LearnHero />
                <UsingAnswerAgentAISubmenu_1.default />
                <main>
                    <AlphaExtensionPromo />
                    <AIModules />
                    <YouTubeCourses />
                    <LearningResources />
                </main>
            </Layout_1.default>
        </div>);
}
