"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveVariant = exports.calculateLeadScore = exports.getUtmParams = exports.leadScoringConfig = exports.utmConfig = exports.marketingConfig = void 0;
// MailerLite configuration - hardcoded values with env var fallbacks
var MAILERLITE_CONFIG = {
    webformId: '6zbHKe', // This is the data-form ID from the Universal embed code
    accountId: '1802410', // Your MailerLite account ID
    enabled: true,
    apiBaseUrl: 'https://assets.mailerlite.com/api',
    defaultGroups: undefined,
    doubleOptIn: false,
    customRedirectUrl: undefined
};
// Use hardcoded values with fallback to env vars (for when we fix env loading)
var mailerLiteWebformId = ((_a = process.env.DOCUSAURUS_MAILERLITE_WEBFORM_ID) === null || _a === void 0 ? void 0 : _a.trim()) || MAILERLITE_CONFIG.webformId;
var mailerLiteEnabled = process.env.DOCUSAURUS_MAILERLITE_ENABLED
    ? !['0', 'false', 'off'].includes(process.env.DOCUSAURUS_MAILERLITE_ENABLED.toLowerCase())
    : MAILERLITE_CONFIG.enabled;
var mailerLiteApiBaseUrl = ((_b = process.env.DOCUSAURUS_MAILERLITE_API_BASE_URL) === null || _b === void 0 ? void 0 : _b.trim()) || MAILERLITE_CONFIG.apiBaseUrl;
var mailerLiteDefaultGroups = process.env.DOCUSAURUS_MAILERLITE_GROUP_IDS
    ? process.env.DOCUSAURUS_MAILERLITE_GROUP_IDS.split(',')
        .map(function (groupId) { return groupId.trim(); })
        .filter(Boolean)
    : MAILERLITE_CONFIG.defaultGroups;
var mailerLiteDoubleOptIn = process.env.DOCUSAURUS_MAILERLITE_DOUBLE_OPT_IN
    ? !['0', 'false', 'off'].includes(process.env.DOCUSAURUS_MAILERLITE_DOUBLE_OPT_IN.toLowerCase())
    : MAILERLITE_CONFIG.doubleOptIn;
var mailerLiteCustomRedirectUrl = ((_c = process.env.DOCUSAURUS_MAILERLITE_REDIRECT_URL) === null || _c === void 0 ? void 0 : _c.trim()) || MAILERLITE_CONFIG.customRedirectUrl;
exports.marketingConfig = {
    // Easy to update tracking codes
    tracking: {
        googleAnalyticsId: process.env.DOCUSAURUS_GA_ID || 'G-VD1X9LNG3N',
        linkedInPixel: process.env.DOCUSAURUS_LINKEDIN_PIXEL,
        facebookPixel: process.env.DOCUSAURUS_FACEBOOK_PIXEL || '25220750360842472',
        gtmId: process.env.DOCUSAURUS_GTM_ID
    },
    // MailerLite configuration
    mailerLite: {
        enabled: mailerLiteEnabled,
        webformId: mailerLiteWebformId,
        apiBaseUrl: mailerLiteApiBaseUrl,
        defaultGroups: mailerLiteDefaultGroups,
        doubleOptIn: mailerLiteDoubleOptIn,
        customRedirectUrl: mailerLiteCustomRedirectUrl
    },
    // A/B test variants - EASY TO ENABLE/DISABLE
    abTests: {
        headline: {
            enabled: false, // Set to true to enable A/B testing
            variants: ['primary', 'alternate1', 'alternate2'],
            defaultVariant: 'primary'
        },
        cta: {
            enabled: false,
            variants: ['Register Now', 'Save My Seat', 'Reserve Spot Free'],
            defaultVariant: 'Reserve Spot Free'
        },
        formPosition: {
            enabled: false,
            variants: ['hero', 'midPage', 'both'],
            defaultVariant: 'hero'
        }
    },
    // Email automation endpoints - UPDATE THESE
    endpoints: {
        registration: '/api/webinar/register',
        leadMagnet: '/api/webinar/download-checklist',
        thankYou: '/webinar-thank-you'
    },
    // Urgency messaging - EASY TO TOGGLE
    urgency: {
        seatsRemaining: true,
        countdownTimer: true,
        lastChanceHours: 24, // Show "last chance" messaging 24 hours before
        bonusTimeLimit: 72 // Bonus offer expires 72 hours after registration
    },
    // Email automation settings
    emailAutomation: {
        confirmationEmail: true, // Send immediate confirmation
        reminderEmails: true, // Send reminder sequence
        followupSequence: true, // Post-webinar nurture
        leadMagnetDelivery: true // Auto-deliver bonus materials
    },
    // Social proof elements
    socialProof: {
        customerLogos: [
            'ias-logo.png',
            'palatine-capital.png',
            'moonstruck-medical.png',
            'wow-internet.png',
            'contentful-logo.png',
            'dropbox-logo.png',
            'marqeta-logo.png'
        ],
        testimonials: true,
        registrationCount: true,
        liveAttendeeCount: false // Could show real-time registration numbers
    },
    // Conversion optimization features
    optimization: {
        exitIntent: true, // Show exit-intent popup
        stickyHeader: false, // Sticky registration CTA
        mobileOptimized: true, // Mobile-first responsive design
        formValidation: true // Real-time form validation
    }
};
// UTM parameter configuration for tracking
exports.utmConfig = {
    source: 'website',
    medium: 'webinar-landing',
    campaign: 'enterprise-ai-webinar-jan-2025',
    content: 'primary-landing-page'
};
// Lead scoring configuration
exports.leadScoringConfig = {
    jobTitleScores: {
        CTO: 10,
        CDO: 10,
        VP: 8,
        Director: 7,
        Manager: 5,
        Engineer: 3,
        Other: 1
    },
    companySizeScores: {
        '500-1000': 10,
        '1000-5000': 9,
        '200-500': 8,
        '50-200': 5,
        '10-50': 2,
        '1-10': 1
    },
    industryScores: {
        Technology: 10,
        'Financial Services': 9,
        Healthcare: 9,
        Manufacturing: 8,
        Retail: 6,
        Other: 5
    }
};
// Helper functions for marketing automation
var getUtmParams = function (source, medium, campaign) {
    return new URLSearchParams({
        utm_source: source || exports.utmConfig.source,
        utm_medium: medium || exports.utmConfig.medium,
        utm_campaign: campaign || exports.utmConfig.campaign,
        utm_content: exports.utmConfig.content
    }).toString();
};
exports.getUtmParams = getUtmParams;
var calculateLeadScore = function (formData) {
    var _a;
    var score = 50; // Base score for webinar registration
    // Email domain scoring (work email bonus)
    if (formData.email) {
        var domain = (_a = formData.email.split('@')[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        var personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
        if (!personalDomains.includes(domain)) {
            score += 25; // Work email bonus
        }
        else {
            score += 10; // Personal email still gets some points for interest
        }
    }
    // UTM source scoring for lead quality
    if (formData.utm_source) {
        var source = formData.utm_source.toLowerCase();
        if (source.includes('linkedin'))
            score += 15;
        else if (source.includes('google') || source.includes('search'))
            score += 10;
        else if (source === 'direct')
            score += 5;
    }
    return Math.min(score, 100); // Cap at 100
};
exports.calculateLeadScore = calculateLeadScore;
// A/B testing helper
var getActiveVariant = function (testName) {
    var test = exports.marketingConfig.abTests[testName];
    if (!test || !test.enabled) {
        return (test === null || test === void 0 ? void 0 : test.defaultVariant) || (test === null || test === void 0 ? void 0 : test.variants[0]) || 'default';
    }
    // Simple random selection for now
    // In production, this would use a proper A/B testing service
    var randomIndex = Math.floor(Math.random() * test.variants.length);
    return test.variants[randomIndex];
};
exports.getActiveVariant = getActiveVariant;
