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
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingService = exports.TrackingService = void 0;
var marketingConfig_1 = require("@site/src/config/marketingConfig");
var TrackingService = /** @class */ (function () {
    function TrackingService() {
        this.initialized = false;
        if (typeof window !== 'undefined') {
            this.initialize();
        }
    }
    // Initialize all tracking services
    TrackingService.prototype.initialize = function () {
        if (this.initialized)
            return;
        this.initializeGoogleAnalytics();
        this.initializeLinkedInPixel();
        this.initializeFacebookPixel();
        this.initialized = true;
    };
    // Google Analytics 4 setup
    TrackingService.prototype.initializeGoogleAnalytics = function () {
        var gaId = marketingConfig_1.marketingConfig.tracking.googleAnalyticsId;
        if (!gaId)
            return;
        try {
            // Load gtag script
            var gtagScript = document.createElement('script');
            gtagScript.async = true;
            gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=".concat(gaId);
            document.head.appendChild(gtagScript);
            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            var gtag_1 = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                window.dataLayer.push(args);
            };
            window.gtag = gtag_1;
            gtag_1('js', new Date());
            gtag_1('config', gaId, {
                send_page_view: true,
                custom_map: {
                    custom_parameter_1: 'lead_score',
                    custom_parameter_2: 'company_size'
                }
            });
        }
        catch (error) {
            console.error('Google Analytics initialization failed:', error);
        }
    };
    // LinkedIn Insight Tag setup
    TrackingService.prototype.initializeLinkedInPixel = function () {
        var linkedInPixel = marketingConfig_1.marketingConfig.tracking.linkedInPixel;
        if (!linkedInPixel)
            return;
        try {
            // Load LinkedIn Insight Tag
            var linkedInScript = document.createElement('script');
            linkedInScript.type = 'text/javascript';
            linkedInScript.innerHTML = "\n        _linkedin_partner_id = \"".concat(linkedInPixel, "\";\n        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];\n        window._linkedin_data_partner_ids.push(_linkedin_partner_id);\n      ");
            document.head.appendChild(linkedInScript);
            // Load LinkedIn tracking script
            var linkedInTrackingScript = document.createElement('script');
            linkedInTrackingScript.type = 'text/javascript';
            linkedInTrackingScript.async = true;
            linkedInTrackingScript.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
            document.head.appendChild(linkedInTrackingScript);
            // Initialize lintrk function
            window.lintrk =
                window.lintrk ||
                    function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        ;
                        (window.lintrk.q = window.lintrk.q || []).push(args);
                    };
        }
        catch (error) {
            console.error('LinkedIn Pixel initialization failed:', error);
        }
    };
    // Facebook Pixel setup
    TrackingService.prototype.initializeFacebookPixel = function () {
        var facebookPixel = marketingConfig_1.marketingConfig.tracking.facebookPixel;
        if (!facebookPixel)
            return;
        try {
            // Facebook Pixel Code
            window.fbq =
                window.fbq ||
                    function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        ;
                        (window.fbq.q = window.fbq.q || []).push(args);
                    };
            window._fbq = window.fbq;
            window.fbq.push = window.fbq;
            window.fbq.loaded = true;
            window.fbq.version = '2.0';
            window.fbq.queue = [];
            var facebookScript = document.createElement('script');
            facebookScript.async = true;
            facebookScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
            document.head.appendChild(facebookScript);
            window.fbq('init', facebookPixel);
            window.fbq('track', 'PageView');
        }
        catch (error) {
            console.error('Facebook Pixel initialization failed:', error);
        }
    };
    // Track custom events
    TrackingService.prototype.trackEvent = function (event) {
        var eventName = event.event, eventCategory = event.eventCategory, eventLabel = event.eventLabel, value = event.value, customParameters = event.customParameters;
        // Google Analytics 4 event tracking
        if (window.gtag) {
            window.gtag('event', eventName, __assign({ event_category: eventCategory, event_label: eventLabel, value: value }, customParameters));
        }
        // LinkedIn conversion tracking
        if (window.lintrk && eventName === 'conversion') {
            window.lintrk('track', {
                conversion_id: eventLabel || 'webinar_registration'
            });
        }
        // Facebook conversion tracking
        if (window.fbq && eventName === 'conversion') {
            window.fbq('track', 'Lead', {
                content_name: eventLabel,
                value: value,
                currency: 'USD'
            });
        }
    };
    // Track webinar registration conversion
    TrackingService.prototype.trackWebinarRegistration = function (data) {
        // Google Analytics 4 event tracking
        if (window.gtag) {
            window.gtag('event', 'webinar_registration', {
                event_category: 'engagement',
                event_label: 'enterprise-ai-webinar',
                value: 1,
                lead_score: data.leadScore,
                company: data.company,
                job_title: data.jobTitle
            });
        }
        // Meta/Facebook Pixel - CompleteRegistration standard event
        if (window.fbq) {
            try {
                window.fbq('track', 'CompleteRegistration', {
                    content_name: 'Enterprise AI Webinar',
                    value: data.value || 100,
                    currency: 'USD',
                    status: 'confirmed',
                    predicted_ltv: data.leadScore ? data.leadScore * 10 : 100
                });
            }
            catch (error) {
                console.error('Facebook Pixel tracking failed:', error);
            }
        }
        // LinkedIn conversion tracking
        if (window.lintrk) {
            try {
                window.lintrk('track', {
                    conversion_id: 'webinar_registration'
                });
            }
            catch (error) {
                console.error('LinkedIn tracking failed:', error);
            }
        }
    };
    // Track page views
    TrackingService.prototype.trackPageView = function (pagePath, pageTitle) {
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_location: window.location.href,
                page_path: pagePath,
                page_title: pageTitle || document.title
            });
        }
        if (window.fbq) {
            window.fbq('track', 'PageView');
            // Track ViewContent for webinar pages
            if (pagePath.includes('webinar')) {
                window.fbq('track', 'ViewContent', {
                    content_name: pageTitle || 'Enterprise AI Webinar',
                    content_category: 'webinar',
                    content_type: 'product'
                });
            }
        }
    };
    // Track form interactions
    TrackingService.prototype.trackFormInteraction = function (action, formName) {
        this.trackEvent({
            event: "form_".concat(action),
            eventCategory: 'form_interaction',
            eventLabel: formName,
            value: action === 'complete' ? 1 : 0
        });
        // Meta Pixel tracking for form interactions
        if (window.fbq) {
            try {
                if (action === 'start') {
                    window.fbq('track', 'Lead', {
                        content_name: formName,
                        content_category: 'webinar'
                    });
                }
                else if (action === 'abandon') {
                    window.fbq('trackCustom', 'FormAbandonment', {
                        content_name: formName
                    });
                }
            }
            catch (error) {
                console.error('Facebook Pixel form tracking failed:', error);
            }
        }
    };
    // Track content engagement
    TrackingService.prototype.trackContentEngagement = function (contentType, contentName, engagementTime) {
        this.trackEvent({
            event: 'content_engagement',
            eventCategory: 'engagement',
            eventLabel: "".concat(contentType, ":").concat(contentName),
            value: engagementTime,
            customParameters: {
                content_type: contentType,
                content_name: contentName
            }
        });
    };
    // Track video interactions
    TrackingService.prototype.trackVideoInteraction = function (action, videoName, progress) {
        this.trackEvent({
            event: "video_".concat(action),
            eventCategory: 'video',
            eventLabel: videoName,
            value: progress,
            customParameters: {
                video_name: videoName,
                video_progress: progress
            }
        });
    };
    // Track scroll depth
    TrackingService.prototype.trackScrollDepth = function (depth) {
        this.trackEvent({
            event: 'scroll_depth',
            eventCategory: 'engagement',
            eventLabel: "".concat(depth, "%"),
            value: depth
        });
    };
    // Get UTM parameters from URL
    TrackingService.prototype.getUtmParameters = function () {
        if (typeof window === 'undefined')
            return {};
        var urlParams = new URLSearchParams(window.location.search);
        return {
            utm_source: urlParams.get('utm_source') || '',
            utm_medium: urlParams.get('utm_medium') || '',
            utm_campaign: urlParams.get('utm_campaign') || '',
            utm_term: urlParams.get('utm_term') || '',
            utm_content: urlParams.get('utm_content') || ''
        };
    };
    // Store UTM parameters in session storage for attribution
    TrackingService.prototype.storeUtmParameters = function () {
        if (typeof window === 'undefined')
            return;
        var utmParams = this.getUtmParameters();
        var hasUtmParams = Object.values(utmParams).some(function (value) { return value !== ''; });
        if (hasUtmParams) {
            sessionStorage.setItem('webinar_utm_params', JSON.stringify(utmParams));
        }
    };
    // Get stored UTM parameters
    TrackingService.prototype.getStoredUtmParameters = function () {
        if (typeof window === 'undefined')
            return {};
        var storedParams = sessionStorage.getItem('webinar_utm_params');
        return storedParams ? JSON.parse(storedParams) : {};
    };
    // Track external link clicks
    TrackingService.prototype.trackExternalLinkClick = function (url) {
        this.trackEvent({
            event: 'click',
            eventCategory: 'external_link',
            eventLabel: url,
            customParameters: {
                outbound: true,
                link_url: url
            }
        });
    };
    // Track file downloads
    TrackingService.prototype.trackFileDownload = function (fileName, fileType) {
        this.trackEvent({
            event: 'file_download',
            eventCategory: 'download',
            eventLabel: fileName,
            customParameters: {
                file_name: fileName,
                file_type: fileType
            }
        });
    };
    // Initialize scroll tracking
    TrackingService.prototype.initializeScrollTracking = function () {
        var _this = this;
        if (typeof window === 'undefined')
            return;
        var scrollThresholds = [25, 50, 75, 100];
        var firedThresholds = [];
        var handleScroll = function () {
            var scrollTop = window.pageYOffset;
            var documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            var scrollPercent = Math.round((scrollTop / documentHeight) * 100);
            scrollThresholds.forEach(function (threshold) {
                if (scrollPercent >= threshold && !firedThresholds.includes(threshold)) {
                    _this.trackScrollDepth(threshold);
                    firedThresholds.push(threshold);
                }
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
    };
    return TrackingService;
}());
exports.TrackingService = TrackingService;
// Export singleton instance
exports.trackingService = new TrackingService();
// Initialize tracking when the service is imported
if (typeof window !== 'undefined') {
    exports.trackingService.storeUtmParameters();
    exports.trackingService.initializeScrollTracking();
}
