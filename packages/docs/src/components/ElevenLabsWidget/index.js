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
var react_1 = require("react");
var clsx_1 = require("clsx");
var styles_module_css_1 = require("./styles.module.css");
var ElevenLabsWidget = function (_a) {
    var _b;
    var _c = _a.variant, variant = _c === void 0 ? 'primary' : _c, _d = _a.size, size = _d === void 0 ? 'large' : _d, _e = _a.text, text = _e === void 0 ? 'Talk to an AI Agent' : _e, _f = _a.disabled, disabled = _f === void 0 ? false : _f, _g = _a.agentId, agentId = _g === void 0 ? 'agent_01k03gnw7xe11btz2vprkf7ay5' : _g, // Default agent ID from the current implementation
    onConversationStart = _a.onConversationStart, onConversationEnd = _a.onConversationEnd;
    var _h = (0, react_1.useState)(false), isLoading = _h[0], setIsLoading = _h[1];
    var _j = (0, react_1.useState)(false), isActive = _j[0], setIsActive = _j[1];
    var _k = (0, react_1.useState)(null), error = _k[0], setError = _k[1];
    var _l = (0, react_1.useState)(false), scriptLoaded = _l[0], setScriptLoaded = _l[1];
    var widgetRef = (0, react_1.useRef)(null);
    // Load the ElevenLabs script
    (0, react_1.useEffect)(function () {
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
        script.async = true;
        script.type = 'text/javascript';
        script.onload = function () {
            setScriptLoaded(true);
        };
        script.onerror = function () {
            setError('Failed to load ElevenLabs widget script');
        };
        // Check if script is already loaded
        var existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
        if (existingScript) {
            setScriptLoaded(true);
        }
        else {
            document.head.appendChild(script);
        }
        return function () {
            // Don't remove the script on unmount as it might be used by other widgets
        };
    }, []);
    var createWidget = function () { return __awaiter(void 0, void 0, void 0, function () {
        var widgetElement;
        return __generator(this, function (_a) {
            if (!scriptLoaded) {
                setError('Widget is still loading. Please try again.');
                return [2 /*return*/];
            }
            setIsLoading(true);
            setError(null);
            try {
                widgetElement = document.createElement('elevenlabs-convai');
                widgetElement.setAttribute('agent-id', agentId);
                // Customize the widget appearance
                widgetElement.setAttribute('action-text', 'Need AI workshop help?');
                widgetElement.setAttribute('start-call-text', 'Start conversation');
                widgetElement.setAttribute('end-call-text', 'End conversation');
                widgetElement.setAttribute('listening-text', 'Listening...');
                widgetElement.setAttribute('speaking-text', 'AI assistant speaking');
                // Add event listeners
                widgetElement.addEventListener('elevenlabs-convai:call', (function (event) {
                    console.log('ElevenLabs call started with event:', event.detail);
                    setIsActive(true);
                    onConversationStart === null || onConversationStart === void 0 ? void 0 : onConversationStart();
                }));
                widgetElement.addEventListener('elevenlabs-convai:end', (function (event) {
                    console.log('ElevenLabs call ended with event:', event.detail);
                    setIsActive(false);
                    onConversationEnd === null || onConversationEnd === void 0 ? void 0 : onConversationEnd();
                }));
                // Clear any existing widget and add the new one
                if (widgetRef.current) {
                    widgetRef.current.innerHTML = '';
                    widgetRef.current.appendChild(widgetElement);
                }
                setIsLoading(false);
            }
            catch (err) {
                console.error('Widget creation error:', err);
                setError('Failed to start conversation. Please try again.');
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    var endConversation = function () {
        var _a;
        // Find and trigger end on the widget
        var widget = (_a = widgetRef.current) === null || _a === void 0 ? void 0 : _a.querySelector('elevenlabs-convai');
        if (widget) {
            // The widget should handle ending internally
            // This is mainly for UI state management
        }
        setIsActive(false);
        onConversationEnd === null || onConversationEnd === void 0 ? void 0 : onConversationEnd();
    };
    (0, react_1.useEffect)(function () {
        if (!isActive && widgetRef.current) {
            widgetRef.current.innerHTML = '';
        }
    }, [isActive]);
    if (error) {
        return (<div className={styles_module_css_1.default.widgetContainer}>
                <button className={(0, clsx_1.default)(styles_module_css_1.default.widgetButton, styles_module_css_1.default[variant], styles_module_css_1.default[size], styles_module_css_1.default.error)} onClick={createWidget} disabled={disabled}>
                    <span className={styles_module_css_1.default.buttonIcon}>📞</span>
                    Try Again
                </button>
                <div className={styles_module_css_1.default.errorMessage}>{error}</div>
            </div>);
    }
    if (isActive) {
        return (<div className={styles_module_css_1.default.widgetContainer}>
                <button className={(0, clsx_1.default)(styles_module_css_1.default.widgetButton, styles_module_css_1.default.danger, styles_module_css_1.default[size])} onClick={endConversation}>
                    <span className={styles_module_css_1.default.buttonIcon}>📞</span>
                    End Call
                </button>
                <div ref={widgetRef} className={styles_module_css_1.default.widgetElement}/>
            </div>);
    }
    return (<div className={styles_module_css_1.default.widgetContainer}>
            <button className={(0, clsx_1.default)(styles_module_css_1.default.widgetButton, styles_module_css_1.default[variant], styles_module_css_1.default[size], (_b = {},
            _b[styles_module_css_1.default.loading] = isLoading,
            _b[styles_module_css_1.default.disabled] = disabled || !scriptLoaded,
            _b))} onClick={createWidget} disabled={isLoading || !scriptLoaded || disabled}>
                <span className={styles_module_css_1.default.buttonIcon}>{isLoading ? '⏳' : '🤖'}</span>
                {isLoading ? 'Connecting...' : !scriptLoaded ? 'Loading Widget...' : text}
            </button>
            <div ref={widgetRef} className={styles_module_css_1.default.widgetElement}/>
        </div>);
};
exports.default = ElevenLabsWidget;
