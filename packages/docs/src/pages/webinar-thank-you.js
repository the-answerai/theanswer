"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WebinarThankYou;
var react_1 = require("react");
var clsx_1 = require("clsx");
var Layout_1 = require("@theme/Layout");
var LazyThreeScene_1 = require("@site/src/components/LazyThreeScene");
var WebinarCountdown_1 = require("@site/src/components/WebinarCountdown");
var WebinarCalendarButtons_1 = require("@site/src/components/WebinarCalendarButtons");
var WebinarLegalFooter_1 = require("@site/src/components/WebinarLegalFooter");
var ElevenLabsInlineWidget_1 = require("@site/src/components/ElevenLabsInlineWidget");
var marketingConfig_1 = require("@site/src/config/marketingConfig");
var webinarContent_1 = require("@site/src/config/webinarContent");
var mailerLiteService_1 = require("@site/src/services/mailerLiteService");
var trackingService_1 = require("@site/src/services/trackingService");
var index_module_css_1 = require("./index.module.css");
var ELEVEN_LABS_AGENT_ID = 'agent_01k03gnw7xe11btz2vprkf7ay5';
var trackVoiceStart = function (context) { return function () {
    return trackingService_1.trackingService.trackEvent({
        event: 'voice_assessment_started',
        eventCategory: 'voice_assessment',
        eventLabel: context
    });
}; };
var trackVoiceEnd = function (context) { return function () {
    return trackingService_1.trackingService.trackEvent({
        event: 'voice_assessment_completed',
        eventCategory: 'voice_assessment',
        eventLabel: context,
        value: 1
    });
}; };
function ThankYouHero() {
    var _a = (0, react_1.useState)(function () { return (0, webinarContent_1.getLocalWebinarDateTime)(); }), localEventTime = _a[0], setLocalEventTime = _a[1];
    (0, react_1.useEffect)(function () {
        setLocalEventTime((0, webinarContent_1.getLocalWebinarDateTime)());
    }, []);
    return (<header className={(0, clsx_1.default)('hero hero--primary', index_module_css_1.default.heroSection)}>
            <div className={index_module_css_1.default.heroBackground}>
                <LazyThreeScene_1.default className={index_module_css_1.default.threeJsCanvas} fallbackClassName={index_module_css_1.default.heroFallback}/>
            </div>
            <div className={index_module_css_1.default.heroContent}>
                <span className={index_module_css_1.default.heroCelebration} aria-hidden='true'>
                    🎉
                </span>
                <p className={index_module_css_1.default.heroEyebrow}>Registration confirmed</p>
                <h1 className={index_module_css_1.default.heroHeadline}>You&apos;re locked in for Thursday&apos;s Enterprise AI playbook</h1>
                <p className={index_module_css_1.default.heroSubhead}>
                    We go live <strong>{localEventTime}</strong>. Take a minute now so the workshop zeroes in on the workflow your leaders
                    care about most.
                </p>

                <ul className={index_module_css_1.default.heroChecklist}>
                    <li className={index_module_css_1.default.heroChecklistItem}>
                        <span className={index_module_css_1.default.heroChecklistIcon}>📅</span>
                        Add the calendar invite and forward the join link to your decision-makers.
                    </li>
                    <li className={index_module_css_1.default.heroChecklistItem}>
                        <span className={index_module_css_1.default.heroChecklistIcon}>🧭</span>
                        Tell us the metric or workflow you want solved in the form below—Bradley will prioritize it live.
                    </li>
                    <li className={index_module_css_1.default.heroChecklistItem}>
                        <span className={index_module_css_1.default.heroChecklistIcon}>🤖</span>
                        Prefer a conversation? Jump into our AI voice coach to pressure-test the agenda in 2 minutes.
                    </li>
                </ul>

                <div className={index_module_css_1.default.heroActionRow}>
                    <div className={index_module_css_1.default.heroActionPrimary}>
                        <WebinarCountdown_1.default className={index_module_css_1.default.countdownSection}/>
                        <WebinarCalendarButtons_1.default />
                        <div className={index_module_css_1.default.heroActionFooter}>
                            <a href='mailto:?subject=Enterprise AI Webinar - Deploy AI in 4 Weeks&body=I just registered for this free webinar on enterprise AI deployment. Thought you might be interested: https://theanswer.ai/webinar-enterprise-ai' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaPrimary)}>
                                Share with your team
                            </a>
                        </div>
                    </div>

                    <div className={index_module_css_1.default.heroVoiceCard}>
                        <div className={index_module_css_1.default.heroVoiceHeader}>
                            <span className={index_module_css_1.default.bonusBadge}>Instant option</span>
                            <h3 className={index_module_css_1.default.heroVoiceTitle}>Talk through your use case now</h3>
                        </div>
                        <p className={index_module_css_1.default.heroVoiceCopy}>
                            Spin up our ElevenLabs-powered AnswerAgent for a quick readiness call. It’ll confirm fit, capture context for
                            the team, and send a recap before we go live.
                        </p>
                        <ElevenLabsInlineWidget_1.default agentId={ELEVEN_LABS_AGENT_ID} text='Start the readiness call' buttonClassName={index_module_css_1.default.heroVoiceButton} onConversationStart={trackVoiceStart('hero_voice_widget')} onConversationEnd={trackVoiceEnd('hero_voice_widget')}/>
                        <p className={index_module_css_1.default.heroVoiceAssurance}>No scheduling. Instant answers. Replay emailed automatically.</p>
                    </div>
                </div>

                <div className={index_module_css_1.default.heroSecondaryLinks}>
                    <a href='#what-to-expect' className={index_module_css_1.default.secondaryLink}>
                        📋 See the agenda
                    </a>
                    <a href='#prep' className={index_module_css_1.default.secondaryLink}>
                        🎁 Prep materials
                    </a>
                </div>
            </div>
        </header>);
}
function ConfirmationDetails() {
    return (<section className={(0, clsx_1.default)(index_module_css_1.default.missionSection, index_module_css_1.default.confirmationSection)} id='confirmation'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--10 col--offset-1'>
                        <div className={index_module_css_1.default.confirmationCard}>
                            <p className={index_module_css_1.default.sectionEyebrow}>Step 1 · check your inbox</p>
                            <h2 className={index_module_css_1.default.sectionHeading}>Pick how you want to get ready before we go live</h2>
                            <p className={index_module_css_1.default.sectionLead}>
                                Your confirmation email is waiting with the join link, calendar invite, and prep checklist. Forward it to
                                the people who need to be in the room—then choose the path that fits your style.
                            </p>

                            <div className={index_module_css_1.default.confirmationGrid}>
                                <div className={index_module_css_1.default.confirmationItem}>
                                    <span className={index_module_css_1.default.confirmationIcon}>📧</span>
                                    <h3>Email package</h3>
                                    <p className={index_module_css_1.default.confirmationCopy}>
                                        Subject line: <em>“Enterprise AI Webinar – You’re confirmed.”</em> It includes the live link, replay
                                        access, and the readiness toolkit.
                                    </p>
                                </div>
                                <div className={index_module_css_1.default.confirmationItem}>
                                    <span className={index_module_css_1.default.confirmationIcon}>📅</span>
                                    <h3>Calendar invite</h3>
                                    <p className={index_module_css_1.default.confirmationCopy}>
                                        {(0, webinarContent_1.getWebinarDateTime)()} — add it now so you get the automatic reminders and can loop in stakeholders
                                        with one click.
                                    </p>
                                </div>
                                <div className={index_module_css_1.default.confirmationItem}>
                                    <span className={index_module_css_1.default.confirmationIcon}>🎯</span>
                                    <h3>4-week deployment roadmap</h3>
                                    <p className={index_module_css_1.default.confirmationCopy}>
                                        The note links to our live demo outline and the KPI worksheet you’ll use during the session.
                                    </p>
                                </div>
                            </div>

                            <div className={index_module_css_1.default.confirmationProTip}>
                                <span className={index_module_css_1.default.confirmationProTipIcon}>💡</span>
                                <div>
                                    <strong>Pro tip:</strong> Add the calendar invite now, then jump to “Tailor the workshop” so we know
                                    which workflow or metric to prioritize for your team.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function PrepResources() {
    var video = webinarContent_1.webinarConfig.introVideo;
    var videoReady = Boolean((video === null || video === void 0 ? void 0 : video.url) && !video.url.includes('TODO_REPLACE'));
    return (<section className={index_module_css_1.default.videoSection} id='prep'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--10 col--offset-1'>
                        <div className={index_module_css_1.default.videoCard}>
                            <div className={index_module_css_1.default.videoHeader}>
                                <span className={index_module_css_1.default.bonusBadge}>Prep in 5 minutes</span>
                                <h2>Preview the workshop & grab your starter kit</h2>
                                <p>
                                    Bradley recorded a quick walkthrough of what to bring, which metrics to benchmark, and how to brief
                                    stakeholders so you ship outcomes the Monday after.
                                </p>
                                <ul className={index_module_css_1.default.videoTakeaways}>
                                    <li>👥 Who to invite so approvals happen fast</li>
                                    <li>📊 The 3 metrics he’ll ask you to benchmark during the live build</li>
                                    <li>⚙️ How to prep your data sources for the 4-week deployment sprint</li>
                                </ul>
                            </div>
                            {videoReady ? (<div className={index_module_css_1.default.videoEmbed}>
                                    <iframe src={video === null || video === void 0 ? void 0 : video.url} title='Webinar orientation video' loading='lazy' frameBorder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowFullScreen/>
                                </div>) : (<div className={index_module_css_1.default.videoPlaceholder}>
                                    <strong>Orientation video coming soon.</strong> We’ll email you as soon as the recording is live.
                                </div>)}
                            {(video === null || video === void 0 ? void 0 : video.caption) && <p className={index_module_css_1.default.videoCaption}>{video.caption}</p>}
                            <div className={index_module_css_1.default.videoResources}>
                                <div className={index_module_css_1.default.bonusGrid}>
                                    <div className={index_module_css_1.default.bonusCard}>
                                        <span className={index_module_css_1.default.bonusIcon}>🧭</span>
                                        <h3>Readiness Checklist</h3>
                                        <p>Hand it to IT, data, and compliance so provisioning happens before Thursday.</p>
                                        <div className={index_module_css_1.default.bonusMeta}>Includes SOC 2 & privacy prompts</div>
                                    </div>
                                    <div className={index_module_css_1.default.bonusCard}>
                                        <span className={index_module_css_1.default.bonusIcon}>📈</span>
                                        <h3>Executive Briefing Deck</h3>
                                        <p>Forward-ready slides with ROI benchmarks and the exact 4-week rollout sequence.</p>
                                        <div className={index_module_css_1.default.bonusMeta}>Perfect for leadership updates</div>
                                    </div>
                                    <div className={index_module_css_1.default.bonusCard}>
                                        <span className={index_module_css_1.default.bonusIcon}>🎥</span>
                                        <h3>Replay & Highlight Reel</h3>
                                        <p>Full session plus a 7-minute recap delivered Sunday morning for anyone who can’t join live.</p>
                                        <div className={index_module_css_1.default.bonusMeta}>Share with busy stakeholders</div>
                                    </div>
                                </div>
                                <p className={index_module_css_1.default.videoFootnote}>Submit the form below and we’ll email the bundle automatically.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function ProgressiveProfileForm() {
    var _this = this;
    var _a = (0, react_1.useState)({
        email: '',
        firstName: '',
        company: '',
        jobTitle: '',
        biggestChallenge: '',
        wantsCall: false,
        timezone: ''
    }), formState = _a[0], setFormState = _a[1];
    var _b = (0, react_1.useState)('idle'), status = _b[0], setStatus = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    (0, react_1.useEffect)(function () {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            var storedEmail_1 = window.localStorage.getItem('webinar_registration_confirmed_email') ||
                window.localStorage.getItem('webinar_registration_email');
            if (storedEmail_1) {
                setFormState(function (prev) { return (__assign(__assign({}, prev), { email: storedEmail_1 })); });
            }
            var storedProfile = window.localStorage.getItem('webinar_registration_profile');
            if (storedProfile) {
                var parsed_1 = JSON.parse(storedProfile);
                setFormState(function (prev) { return (__assign(__assign({}, prev), { firstName: parsed_1.firstName || prev.firstName, company: parsed_1.company || prev.company, jobTitle: parsed_1.jobTitle || prev.jobTitle, biggestChallenge: parsed_1.biggestChallenge || prev.biggestChallenge, wantsCall: Boolean(parsed_1.wantsCall || false), timezone: parsed_1.timezone || prev.timezone })); });
            }
            var tz_1 = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz_1) {
                setFormState(function (prev) { return (__assign(__assign({}, prev), { timezone: tz_1 })); });
            }
        }
        catch (storageError) {
            console.warn('Unable to hydrate saved profile data', storageError);
        }
    }, []);
    var handleChange = function (event) {
        var _a = event.target, name = _a.name, value = _a.value, type = _a.type, checked = _a.checked;
        if (status === 'error') {
            setStatus('idle');
            setError(null);
        }
        setFormState(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = type === 'checkbox' ? checked : value, _a)));
        });
    };
    var handleSubmit = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var result, submissionError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    if (!formState.email) {
                        setStatus('error');
                        setError('Please confirm your email so we can attach these details to your registration.');
                        return [2 /*return*/];
                    }
                    setStatus('saving');
                    setError(null);
                    trackingService_1.trackingService.trackFormInteraction('start', 'webinar-follow-up-form');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (!marketingConfig_1.marketingConfig.mailerLite.enabled || !marketingConfig_1.marketingConfig.mailerLite.webformId) {
                        console.warn('MailerLite configuration missing. Ensure NEXT_PUBLIC_MAILERLITE_WEBFORM_ID is set.');
                        setStatus('error');
                        setError('Registration system is being updated. Please try again later or email hello@theanswer.ai.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, mailerLiteService_1.mailerLiteService.subscribe({
                            email: formState.email,
                            name: formState.firstName,
                            fields: {
                                company: formState.company,
                                job_title: formState.jobTitle,
                                primary_use_case: formState.biggestChallenge,
                                wants_call: formState.wantsCall,
                                timezone: formState.timezone,
                                utm_source: 'webinar-thank-you',
                                utm_medium: 'progressive-profile',
                                utm_campaign: 'webinar-enterprise-ai',
                                registration_stage: 'thank-you-follow-up'
                            }
                        })];
                case 2:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error(result.message || 'Follow-up submission failed');
                    }
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem('webinar_registration_profile', JSON.stringify({
                            firstName: formState.firstName,
                            company: formState.company,
                            jobTitle: formState.jobTitle,
                            biggestChallenge: formState.biggestChallenge,
                            wantsCall: formState.wantsCall,
                            timezone: formState.timezone
                        }));
                    }
                    setStatus('success');
                    trackingService_1.trackingService.trackFormInteraction('complete', 'webinar-follow-up-form');
                    return [3 /*break*/, 4];
                case 3:
                    submissionError_1 = _a.sent();
                    console.error('Follow-up submission failed', submissionError_1);
                    setStatus('error');
                    setError('Something went wrong saving your details. Please try again or email hello@theanswer.ai.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<section className={index_module_css_1.default.progressiveSection} id='attendee-prep'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div className={index_module_css_1.default.progressiveCard}>
                            <span className={index_module_css_1.default.bonusBadge}>Optional prep</span>
                            <h2>Shape Thursday around your KPIs</h2>
                            <p>
                                Choose your path: spend two minutes with the AI coach or drop the details below so Bradley can tailor the
                                live walkthrough to your stack.
                            </p>

                            <div className={index_module_css_1.default.progressiveChoice}>
                                <div className={index_module_css_1.default.progressiveChoiceColumn}>
                                    <h3>Prefer typing?</h3>
                                    <p className={index_module_css_1.default.progressiveChoiceCopy}>
                                        Tell us the workflow, metric, or stakeholder you want solved. We’ll queue it for the live demo and
                                        send the follow-up deck tuned to your answers.
                                    </p>
                                </div>
                                <div className={(0, clsx_1.default)(index_module_css_1.default.progressiveChoiceColumn, index_module_css_1.default.progressiveVoiceColumn)}>
                                    <h3>Prefer chatting?</h3>
                                    <p className={index_module_css_1.default.progressiveChoiceCopy}>
                                        Launch the AnswerAgent voice assessment to share the same context conversationally. We’ll log the
                                        highlights and email you a recap for easy forwarding.
                                    </p>
                                    <ElevenLabsInlineWidget_1.default agentId={ELEVEN_LABS_AGENT_ID} text='Voice my priorities instead' variant='outline' showStatus={false} buttonClassName={index_module_css_1.default.progressiveVoiceButton} wrapperClassName={index_module_css_1.default.progressiveVoiceButtonWrap} onConversationStart={trackVoiceStart('progressive_voice_widget')} onConversationEnd={trackVoiceEnd('progressive_voice_widget')}/>
                                </div>
                            </div>

                            <form className={index_module_css_1.default.progressiveForm} onSubmit={handleSubmit}>
                                <div className={index_module_css_1.default.formGrid}>
                                    <label className={index_module_css_1.default.formField}>
                                        <span>Email (so we can match your registration)</span>
                                        <input type='email' name='email' value={formState.email} onChange={handleChange} placeholder='you@company.com' required/>
                                    </label>
                                    <label className={index_module_css_1.default.formField}>
                                        <span>First name</span>
                                        <input type='text' name='firstName' value={formState.firstName} onChange={handleChange} placeholder='Optional'/>
                                    </label>
                                    <label className={index_module_css_1.default.formField}>
                                        <span>Company</span>
                                        <input type='text' name='company' value={formState.company} onChange={handleChange} placeholder='Optional'/>
                                    </label>
                                    <label className={index_module_css_1.default.formField}>
                                        <span>Role / title</span>
                                        <input type='text' name='jobTitle' value={formState.jobTitle} onChange={handleChange} placeholder='Optional'/>
                                    </label>
                                </div>

                                <label className={(0, clsx_1.default)(index_module_css_1.default.formField, index_module_css_1.default.formFieldFull)}>
                                    <span>What’s the #1 workflow or metric you want solved?</span>
                                    <textarea name='biggestChallenge' value={formState.biggestChallenge} onChange={handleChange} rows={3} placeholder='Optional, but it helps us bring the right playbook.'/>
                                </label>

                                <label className={(0, clsx_1.default)(index_module_css_1.default.formField, index_module_css_1.default.formCheckbox)}>
                                    <input type='checkbox' name='wantsCall' checked={formState.wantsCall} onChange={handleChange}/>
                                    <span>I’m up for a quick human follow-up after the webinar (we’ll send scheduling options).</span>
                                </label>

                                {error && <div className={index_module_css_1.default.formError}>{error}</div>}
                                {status === 'success' && (<div className={index_module_css_1.default.formSuccess}>✅ Got it! We’ll tailor the workshop follow-ups to your goals.</div>)}

                                <button type='submit' className={index_module_css_1.default.formSubmit} disabled={status === 'saving'}>
                                    {status === 'saving' ? 'Saving...' : 'Save my details'}
                                </button>
                            </form>

                            <div className={index_module_css_1.default.progressiveProof}>
                                <span>⭐️</span>
                                <p>
                                    Last month’s attendees who used the form or voice coach were 3× more likely to book a pilot follow-up
                                    because the team had their roadmap ready.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function WhatToExpect() {
    return (<section className={index_module_css_1.default.featuresSection} id='what-to-expect'>
            <div className='container'>
                <h2 className='text--center'>What to Expect on Thursday</h2>
                <p className='text--center' style={{ marginBottom: '3rem', fontSize: '1.2rem', opacity: 0.9 }}>
                    A 60-minute working session that shows you exactly how teams like IAS, Palatine Capital, and Moonstruck Medical shipped
                    governed AI agents in four weeks.
                </p>

                <div className='row'>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>1</div>
                            <h3>Live Platform Demo</h3>
                            <p>
                                Watch Bradley Taylor rebuild actual AnswerAgent workflows using attendee submissions. See how six
                                disconnected tools collapse into one governed assistant in under 15 minutes.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🔴 Live, not pre-recorded</span>
                                <span>💼 Metrics surfaced from your submissions</span>
                                <span>⚡ Interactive Q&A</span>
                            </div>
                        </div>
                    </div>

                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>2</div>
                            <h3>Proven Case Studies</h3>
                            <p>
                                Deep dive into how Palatine Capital saved 120 hours a month, how IAS launched in four weeks, and how
                                Moonstruck unified nine reps—complete with dashboards, compliance notes, and stakeholder scripts.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📊 Real ROI numbers</span>
                                <span>⏱️ Deployment timelines</span>
                                <span>✅ Measurable outcomes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row' style={{ marginTop: '2rem' }}>
                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>3</div>
                            <h3>Framework Walkthrough</h3>
                            <p>
                                Get the exact four-week methodology used by IAS and other enterprise clients with week-by-week deliverables,
                                sample Jira boards, and governance checkpoints.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>📋 Weekly deliverables</span>
                                <span>🎯 Success criteria</span>
                                <span>⚡ Implementation tips</span>
                            </div>
                        </div>
                    </div>

                    <div className='col col--6'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.stepCard)}>
                            <div className={index_module_css_1.default.stepNumber}>4</div>
                            <h3>90-Day Pilot Program</h3>
                            <p>
                                Decide if the risk-free pilot program is a match. We’ll cover pricing guardrails, data residency, and how we
                                handle exec reviews for Fortune 500 clients.
                            </p>
                            <div className={index_module_css_1.default.appFeatures}>
                                <span>🔒 No vendor lock-in</span>
                                <span>📈 Measurable ROI</span>
                                <span>🎯 90-day timeline</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={index_module_css_1.default.expectationVoiceNote}>
                    <span>🤖</span>
                    <p>
                        Want your scenario featured? Share it via the form or the voice coach before Friday and we’ll weave it into the live
                        demo.
                    </p>
                </div>
            </div>
        </section>);
}
function FitCallCTA() {
    var schedulingUrl = 'https://cal.com/answerai/enterprise-ai-fit-call?duration=15';
    return (<section className={index_module_css_1.default.fitCallSection} id='fit-call'>
            <div className='container'>
                <div className={index_module_css_1.default.fitCallGrid}>
                    <div className={index_module_css_1.default.fitCallContent}>
                        <span className={index_module_css_1.default.bonusBadge}>High-intent next step</span>
                        <h2>Reserve your pilot review slot</h2>
                        <p>
                            We open just ten 15-minute fit calls the week after the webinar. Bring your stack, procurement realities, and
                            desired ROI—they’re designed to confirm if the 90-day pilot is a match.
                        </p>
                        <ul className={index_module_css_1.default.fitCallList}>
                            <li>✅ We map your fastest measurable win</li>
                            <li>✅ Security & compliance checklist walkthrough</li>
                            <li>✅ Pilot timeline aligned to your stakeholders</li>
                        </ul>
                        <a className={index_module_css_1.default.fitCallButton} href={schedulingUrl} target='_blank' rel='noreferrer' onClick={function () {
            return trackingService_1.trackingService.trackEvent({
                event: 'fit_call_clicked',
                eventCategory: 'conversion',
                eventLabel: 'thank-you-fit-call'
            });
        }}>
                            Book my 15-minute fit call
                        </a>
                        <p className={index_module_css_1.default.fitCallScarcity}>
                            These calls historically fill within 36 hours—profile submissions from this page get first review.
                        </p>
                    </div>

                    <div className={index_module_css_1.default.fitCallVoicePanel}>
                        <div className={index_module_css_1.default.fitCallVoiceCard}>
                            <h3>Already shared your goals?</h3>
                            <p>
                                Once your form or voice notes are in, the team reviews them during the workshop and follows up if the pilot
                                looks like a fit. Keep an eye on your inbox the week after.
                            </p>
                            <p className={index_module_css_1.default.fitCallVoiceHint}>Need to add more detail? Hop back to the prep section above.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function SocialSharing() {
    var _this = this;
    var _a = (0, react_1.useState)('idle'), copyState = _a[0], setCopyState = _a[1];
    var _b = (0, react_1.useState)(''), copiedLabel = _b[0], setCopiedLabel = _b[1];
    var webinarUrl = typeof window !== 'undefined' ? "".concat(window.location.origin, "/webinar-enterprise-ai") : 'https://theanswer.ai/webinar-enterprise-ai';
    var shareText = 'Just booked AnswerAI’s “Deploy AI Agents in 4 Weeks” workshop. Live build, governance checklist, and playbooks from IAS & Palatine. Join me:';
    var opsMessage = "Hey team \u2014 I locked in our seat for AnswerAI's Enterprise AI workshop (".concat((0, webinarContent_1.getLocalWebinarDateTime)(), "). It shows the exact 4-week rollout we want. Grab a spot here: ").concat(webinarUrl, "\n\nPS: Add your workflow so they cover it live: ").concat(webinarUrl, "#attendee-prep");
    var execMessage = "Flagging an Enterprise AI session (".concat((0, webinarContent_1.getLocalWebinarDateTime)(), ") that walks through the 4-week deployment model we\u2019ve been evaluating. Includes ROI benchmarks + compliance templates. Register: ").concat(webinarUrl);
    var shareLinks = {
        linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=".concat(encodeURIComponent(webinarUrl), "&title=").concat(encodeURIComponent(shareText)),
        twitter: "https://twitter.com/intent/tweet?text=".concat(encodeURIComponent(shareText), "&url=").concat(encodeURIComponent(webinarUrl)),
        email: "mailto:?subject=".concat(encodeURIComponent('Enterprise AI Webinar - You Should Join!'), "&body=").concat(encodeURIComponent("".concat(shareText, "\n\nRegister here: ").concat(webinarUrl)))
    };
    var handleCopyMessage = function (text, label) { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeof navigator === 'undefined' || !navigator.clipboard) {
                        setCopyState('error');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(text)];
                case 2:
                    _a.sent();
                    setCopyState('copied');
                    setCopiedLabel(label);
                    trackingService_1.trackingService.trackEvent({
                        event: 'share_snippet_copied',
                        eventCategory: 'sharing',
                        eventLabel: label
                    });
                    setTimeout(function () { return setCopyState('idle'); }, 3000);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.warn('Unable to copy share snippet', err_1);
                    setCopyState('error');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var copyLabel = copyState === 'copied' ? "Copied ".concat(copiedLabel, "!") : copyState === 'error' ? 'Copy failed' : 'Copy snippet';
    var personaSnippets = [
        {
            label: 'Ops / Enablement Slack note',
            text: opsMessage
        },
        {
            label: 'Executive forward email',
            text: execMessage
        }
    ];
    return (<section className={index_module_css_1.default.featuresSection} id='share'>
            <div className='container'>
                <div className='row'>
                    <div className='col col--8 col--offset-2'>
                        <div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)} style={{ textAlign: 'center' }}>
                            <div className={index_module_css_1.default.comingSoonIcon}>📢</div>
                            <h2>Invite Your Team</h2>
                            <p style={{ marginBottom: '2rem' }}>
                                Perfect for CTOs, operations, and enablement leaders. Copy the snippet below for Slack/Teams or share via
                                your favorite channel.
                            </p>

                            <div className={index_module_css_1.default.shareActions}>
                                <a href={shareLinks.linkedin} target='_blank' rel='noopener noreferrer' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaSecondary)} onClick={function () { return trackingService_1.trackingService.trackExternalLinkClick(shareLinks.linkedin); }}>
                                    Share on LinkedIn
                                </a>

                                <a href={shareLinks.twitter} target='_blank' rel='noopener noreferrer' className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaSecondary)} onClick={function () { return trackingService_1.trackingService.trackExternalLinkClick(shareLinks.twitter); }}>
                                    Post on X
                                </a>

                                <a href={shareLinks.email} className={(0, clsx_1.default)(index_module_css_1.default.ctaButton, index_module_css_1.default.ctaSecondary)} onClick={function () {
            return trackingService_1.trackingService.trackEvent({
                event: 'email_share',
                eventCategory: 'sharing',
                eventLabel: 'webinar-email-colleagues'
            });
        }}>
                                    Email colleagues
                                </a>
                            </div>

                            <div className={index_module_css_1.default.shareSnippetsGrid}>
                                {personaSnippets.map(function (snippet) { return (<div key={snippet.label} className={index_module_css_1.default.shareSnippet}>
                                        <label className={index_module_css_1.default.shareSnippetLabel}>{snippet.label}</label>
                                        <textarea value={snippet.text} readOnly aria-label={snippet.label}/>
                                        <button type='button' onClick={function () { return handleCopyMessage(snippet.text, snippet.label); }} className={index_module_css_1.default.copyButton}>
                                            {copyLabel}
                                        </button>
                                    </div>); })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function FinalAssurance() {
    return (<section className={index_module_css_1.default.finalAssuranceSection}>
            <div className='container'>
                <div className={index_module_css_1.default.finalAssuranceCard}>
                    <div className={index_module_css_1.default.finalAssuranceCopy}>
                        <h2>Share as much (or as little) as you like—your data stays with us</h2>
                        <p>
                            Everything you submit—whether typed or voiced—is used only to personalize Thursday and the optional pilot
                            review. No cold calls, no surprise sequences.
                        </p>
                        <ul className={index_module_css_1.default.finalAssuranceList}>
                            <li>🔒 Secure ElevenLabs session with end-to-end encryption</li>
                            <li>🧾 Transcript and highlights emailed only to you (or teammates you specify)</li>
                            <li>📬 Opt out anytime—every follow-up email includes a one-click preference link</li>
                        </ul>
                        <div className={index_module_css_1.default.finalAssuranceFaqs}>
                            <div>
                                <h3>Is the voice call required?</h3>
                                <p>Nope. The form and the call capture the same details—use whichever gets you answers faster.</p>
                            </div>
                            <div>
                                <h3>Can I do both?</h3>
                                <p>
                                    Absolutely. Many teams voice their goals first, then jot quick notes in the form so leadership sees
                                    everything in writing.
                                </p>
                            </div>
                            <div>
                                <h3>What if I need a human?</h3>
                                <p>Check the “human follow-up” box in the form and we’ll reach out once the workshop wraps.</p>
                            </div>
                        </div>
                    </div>

                    <div className={index_module_css_1.default.finalAssuranceAction}>
                        <div className={index_module_css_1.default.finalAssuranceWidget}>
                            <span className={index_module_css_1.default.bonusBadge}>Your roadmap</span>
                            <h3>Need to add more context?</h3>
                            <p>
                                Head back to the prep section any time to update your notes or launch the voice coach. That keeps the team
                                aligned to your goals.
                            </p>
                            <a href='#attendee-prep' className={index_module_css_1.default.finalAssuranceButton}>
                                Update my workshop goals
                            </a>
                            <p className={index_module_css_1.default.finalAssuranceCaption}>
                                Questions before then? Reply to the confirmation email—we read every note.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
}
function WebinarThankYou() {
    // Initialize page tracking
    (0, react_1.useEffect)(function () {
        trackingService_1.trackingService.trackPageView('/webinar-thank-you', 'Webinar Registration Confirmed');
        // Track successful conversion landing
        trackingService_1.trackingService.trackEvent({
            event: 'thank_you_page_view',
            eventCategory: 'conversion',
            eventLabel: 'webinar-registration-confirmed',
            value: 1
        });
    }, []);
    return (<div data-theme='dark'>
            <Layout_1.default title='Registration Confirmed - Enterprise AI Webinar' description="You're registered for Thursday's enterprise AI webinar. Check your email for the webinar link, calendar invitation, and bonus Enterprise AI Readiness Checklist.">
                <ThankYouHero />
                <main>
                    <ConfirmationDetails />
                    <PrepResources />
                    <ProgressiveProfileForm />
                    <WhatToExpect />
                    <FitCallCTA />
                    <SocialSharing />
                    <FinalAssurance />
                </main>
                <WebinarLegalFooter_1.default />
            </Layout_1.default>
        </div>);
}
