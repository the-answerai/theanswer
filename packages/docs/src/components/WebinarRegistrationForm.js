"use strict";
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
exports.default = WebinarRegistrationForm;
var react_1 = require("react");
var clsx_1 = require("clsx");
var marketingConfig_1 = require("@site/src/config/marketingConfig");
var webinarContent_1 = require("@site/src/config/webinarContent");
var trackingService_1 = require("@site/src/services/trackingService");
var index_module_css_1 = require("../pages/index.module.css");
function WebinarRegistrationForm() {
    var _this = this;
    var _a = (0, react_1.useState)({ email: '' }), formData = _a[0], setFormData = _a[1];
    var _b = (0, react_1.useState)({}), errors = _b[0], setErrors = _b[1];
    var _c = (0, react_1.useState)(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var _d = (0, react_1.useState)(false), isSubmitted = _d[0], setIsSubmitted = _d[1];
    var formInteractionStarted = (0, react_1.useRef)(false);
    // Load saved email from localStorage
    (0, react_1.useEffect)(function () {
        if (typeof window !== 'undefined') {
            var savedEmail = localStorage.getItem('webinar_registration_email');
            if (savedEmail) {
                setFormData({ email: savedEmail });
            }
        }
    }, []);
    // Track form abandonment when user leaves page
    (0, react_1.useEffect)(function () {
        var handleBeforeUnload = function () {
            if (formInteractionStarted.current && !isSubmitted && formData.email) {
                trackingService_1.trackingService.trackFormInteraction('abandon', 'webinar-registration-unload');
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
            return function () { return window.removeEventListener('beforeunload', handleBeforeUnload); };
        }
    }, [formData.email, isSubmitted]);
    var validateEmail = function (email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrors({ email: 'Please enter a valid email address' });
            return false;
        }
        setErrors({});
        return true;
    };
    var handleInputChange = function (e) {
        var value = e.target.value;
        setFormData({ email: value });
        // Track form interaction on first input
        if (!formInteractionStarted.current && value.length > 0) {
            formInteractionStarted.current = true;
            trackingService_1.trackingService.trackFormInteraction('start', 'webinar-registration');
        }
        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('webinar_registration_email', value);
        }
        // Clear errors when user starts typing
        if (errors.email) {
            setErrors({});
        }
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var urlParams, response, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!validateEmail(formData.email)) {
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    setErrors({});
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    urlParams = new URLSearchParams(window.location.search);
                    return [4 /*yield*/, fetch('/api/mailerlite-subscribe', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: formData.email,
                                fields: {
                                    utm_source: urlParams.get('utm_source') || 'direct',
                                    utm_medium: urlParams.get('utm_medium') || 'website',
                                    utm_campaign: urlParams.get('utm_campaign') || 'webinar-enterprise-ai',
                                    lead_score: (0, marketingConfig_1.calculateLeadScore)(formData),
                                    webinar_date: webinarContent_1.webinarConfig.webinarDate,
                                    webinar_time: webinarContent_1.webinarConfig.webinarTime,
                                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                }
                            })
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (result.success) {
                        setIsSubmitted(true);
                        // Track successful registration with Meta Pixel and other tracking services
                        trackingService_1.trackingService.trackWebinarRegistration({
                            email: formData.email,
                            leadScore: (0, marketingConfig_1.calculateLeadScore)(formData),
                            value: 100 // Estimated lead value
                        });
                        // Track form completion
                        trackingService_1.trackingService.trackFormInteraction('complete', 'webinar-registration');
                        // Clear saved email
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('webinar_registration_email');
                            localStorage.setItem('webinar_registration_confirmed_email', formData.email);
                            // Track success event
                            window.dispatchEvent(new Event('webinar-registration-success'));
                        }
                        // Redirect to thank you page after delay
                        setTimeout(function () {
                            window.location.href = marketingConfig_1.marketingConfig.endpoints.thankYou;
                        }, 2000);
                    }
                    else {
                        setErrors({ submit: result.message || 'Registration failed. Please try again.' });
                        // Track form abandonment on error
                        trackingService_1.trackingService.trackFormInteraction('abandon', 'webinar-registration');
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Registration error:', error_1);
                    setErrors({ submit: 'Network error. Please check your connection and try again.' });
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    if (isSubmitted) {
        return (<div className={(0, clsx_1.default)(index_module_css_1.default.featureCard, index_module_css_1.default.commandment)} style={{ textAlign: 'center', backgroundColor: 'rgba(0, 255, 0, 0.1)', border: '2px solid #00ff00' }}>
                <div className={index_module_css_1.default.comingSoonIcon}>✅</div>
                <h3 style={{ color: '#00ff00' }}>Registration Confirmed!</h3>
                <p>Check your email for:</p>
                <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '1rem auto' }}>
                    <li>Webinar join link</li>
                    <li>Calendar invitation</li>
                    <li>Bonus &quot;Enterprise AI Readiness Checklist&quot;</li>
                </ul>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Redirecting to confirmation page...</p>
            </div>);
    }
    return (<form onSubmit={handleSubmit} style={{ maxWidth: '450px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <input type='email' name='email' placeholder='Enter your work email' value={formData.email} onChange={handleInputChange} required disabled={isSubmitting} aria-label='Email address' aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} style={{
            width: '100%',
            padding: '1.2rem 1.5rem',
            borderRadius: '12px',
            border: errors.email ? '2px solid #ff4444' : '2px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontSize: '1.1rem',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
        }} onFocus={function (e) {
            if (!errors.email) {
                e.target.style.border = '2px solid #00ffff';
                e.target.style.backgroundColor = 'rgba(0, 255, 255, 0.05)';
            }
        }} onBlur={function (e) {
            if (!errors.email) {
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
        }}/>
                {errors.email && (<div id='email-error' style={{ color: '#ff4444', fontSize: '0.9rem', marginTop: '0.5rem', textAlign: 'center' }}>
                        {errors.email}
                    </div>)}
            </div>

            {errors.submit && (<div style={{
                color: '#ff4444',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #ff4444',
                marginBottom: '1.5rem',
                textAlign: 'center'
            }}>
                    {errors.submit}
                </div>)}

            <button type='submit' disabled={isSubmitting} style={{
            width: '100%',
            padding: '1.2rem',
            fontSize: '1.3rem',
            fontWeight: '600',
            backgroundColor: isSubmitting ? '#666666' : '#00ffff',
            color: isSubmitting ? '#cccccc' : '#000000',
            border: 'none',
            borderRadius: '12px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box',
            textTransform: 'none',
            letterSpacing: '0.5px'
        }} onMouseEnter={function (e) {
            if (!isSubmitting) {
                ;
                e.target.style.backgroundColor = '#00cccc';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 255, 0.3)';
            }
        }} onMouseLeave={function (e) {
            if (!isSubmitting) {
                ;
                e.target.style.backgroundColor = '#00ffff';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = 'none';
            }
        }}>
                {isSubmitting ? 'Registering...' : 'Reserve My Free Spot 🚀'}
            </button>

            <div style={{ marginTop: '1rem', textAlign: 'center', opacity: 0.8, fontSize: '0.9rem' }}>
                <p>🔒 Your information is secure and will never be shared</p>
            </div>
        </form>);
}
