"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AIWorkshopsScheduled;
var clsx_1 = require("clsx");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var Layout_1 = require("@theme/Layout");
var UsingAnswerAgentAISubmenu_1 = require("@site/src/components/UsingAnswerAgentAISubmenu");
var SphereScene_1 = require("@site/src/components/Annimations/SphereScene");
var index_module_css_1 = require("../index.module.css");
function ScheduledHero() {
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <SphereScene_1.default className={index_module_css_1.default.threeJsCanvas}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <div className={index_module_css_1.default.confirmationIcon}>✅</div>
                <h1 className={index_module_css_1.default.heroTitle}>Workshop Consultation Scheduled!</h1>
                <p className={index_module_css_1.default.heroSubtitle}>
                    Thank you for scheduling your AI workshop consultation. We&apos;re excited to help transform your team with cutting-edge
                    AI training.
                </p>
                <div className={index_module_css_1.default.confirmationDetails}>
                    <div className={index_module_css_1.default.confirmationCard}>
                        <h3>What Happens Next?</h3>
                        <div className={index_module_css_1.default.nextSteps}>
                            <div className={index_module_css_1.default.nextStep}>
                                <span className={index_module_css_1.default.stepNumber}>1</span>
                                <div>
                                    <strong>Confirmation Email</strong>
                                    <p>You&apos;ll receive a confirmation email with meeting details and a calendar invite.</p>
                                </div>
                            </div>
                            <div className={index_module_css_1.default.nextStep}>
                                <span className={index_module_css_1.default.stepNumber}>2</span>
                                <div>
                                    <strong>Pre-Meeting Preparation</strong>
                                    <p>We&apos;ll send you a brief questionnaire to understand your team&apos;s specific needs.</p>
                                </div>
                            </div>
                            <div className={index_module_css_1.default.nextStep}>
                                <span className={index_module_css_1.default.stepNumber}>3</span>
                                <div>
                                    <strong>Consultation Call</strong>
                                    <p>We&apos;ll discuss your requirements and create a customized workshop proposal.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={index_module_css_1.default.confirmationActions}>
                    <a href='/ai-workshops' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaSecondary)}>
                        Back to Workshop Details
                    </a>
                    <a href='/developers' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                        Talk to AI Agent Now
                    </a>
                </div>
            </div>
        </header>);
}
function AdditionalResourcesSection() {
    return (<section className={index_module_css_1.default.missionSection}>
            <div className='container'>
                <h2 className='text--center'>While You Wait, Explore Our Resources</h2>
                <div className='row'>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>📚</div>
                            <div>
                                <h3>Answer Academy</h3>
                                <p>Get a preview of our training content with free access to select courses and resources.</p>
                                <a href='/developers' className={index_module_css_1.default.resourceLink}>
                                    Explore Academy →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🎯</div>
                            <div>
                                <h3>Use Cases</h3>
                                <p>See how other teams are using AI to transform their workflows and boost productivity.</p>
                                <a href='/docs/use-cases' className={index_module_css_1.default.resourceLink}>
                                    View Use Cases →
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className='col col--4'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)}>
                            <div className={index_module_css_1.default.comingSoonIcon}>🤖</div>
                            <div>
                                <h3>AI Agents</h3>
                                <p>Try our AI agents to get a taste of what your team will learn to build and deploy.</p>
                                <a href='/developers' className={index_module_css_1.default.resourceLink}>
                                    Try AI Agents →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function AIWorkshopsScheduled() {
    var siteConfig = (0, useDocusaurusContext_1.default)().siteConfig;
    return (<div data-theme='dark'>
            <Layout_1.default title='Workshop Consultation Scheduled - AI Workshops' description='Your AI workshop consultation has been scheduled. Learn what happens next and explore our resources while you wait.'>
                <ScheduledHero />
                <UsingAnswerAgentAISubmenu_1.default />
                <main>
                    <AdditionalResourcesSection />
                </main>
            </Layout_1.default>
        </div>);
}
