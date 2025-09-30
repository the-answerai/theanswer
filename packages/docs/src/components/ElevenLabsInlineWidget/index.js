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
var react_dom_1 = require("react-dom");
var react_2 = require("@elevenlabs/react");
var clsx_1 = require("clsx");
var styles_module_css_1 = require("./styles.module.css");
var ElevenLabsInlineWidget = function (_a) {
    var agentId = _a.agentId, _b = _a.text, text = _b === void 0 ? 'Start Voice Call' : _b, _c = _a.variant, variant = _c === void 0 ? 'cta' : _c, emoji = _a.emoji, buttonClassName = _a.buttonClassName, wrapperClassName = _a.wrapperClassName, _d = _a.inline, inline = _d === void 0 ? false : _d, _e = _a.showStatus, showStatus = _e === void 0 ? true : _e, onConversationStart = _a.onConversationStart, onConversationEnd = _a.onConversationEnd;
    var _f = (0, react_1.useState)(null), error = _f[0], setError = _f[1];
    var _g = (0, react_1.useState)(false), hasStarted = _g[0], setHasStarted = _g[1];
    var _h = (0, react_1.useState)(false), hasEnded = _h[0], setHasEnded = _h[1];
    var _j = (0, react_1.useState)(0), elapsedSeconds = _j[0], setElapsedSeconds = _j[1];
    var callStartRef = (0, react_1.useRef)(null);
    var timerRef = (0, react_1.useRef)(null);
    var conversation = (0, react_2.useConversation)({
        onConnect: function () {
            setHasStarted(true);
            setHasEnded(false);
            callStartRef.current = Date.now();
            setElapsedSeconds(0);
            onConversationStart === null || onConversationStart === void 0 ? void 0 : onConversationStart();
        },
        onDisconnect: function () {
            if (hasStarted)
                setHasEnded(true);
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
            onConversationEnd === null || onConversationEnd === void 0 ? void 0 : onConversationEnd();
        },
        onError: function (err) { return setError((err === null || err === void 0 ? void 0 : err.message) || String(err) || 'Unknown error'); }
    });
    var startCall = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError(null);
                    setHasEnded(false);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, conversation.startSession({
                            agentId: agentId,
                            connectionType: 'webrtc'
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    setError((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || String(err_1) || 'Failed to start call');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var endCall = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, conversation.endSession()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    setError((err_2 === null || err_2 === void 0 ? void 0 : err_2.message) || String(err_2) || 'Failed to end call');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        if (conversation.status === 'connecting' || conversation.status === 'connected') {
            setHasEnded(false);
        }
    }, [conversation.status]);
    (0, react_1.useEffect)(function () {
        if (conversation.status === 'connected') {
            if (!timerRef.current) {
                timerRef.current = window.setInterval(function () {
                    if (callStartRef.current) {
                        setElapsedSeconds(Math.floor((Date.now() - callStartRef.current) / 1000));
                    }
                }, 1000);
            }
        }
        else {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return function () {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [conversation.status]);
    var _k = (0, react_1.useState)(null), floatingContainer = _k[0], setFloatingContainer = _k[1];
    (0, react_1.useEffect)(function () {
        if (inline) {
            return;
        }
        if (typeof document === 'undefined') {
            return;
        }
        var node = document.createElement('div');
        node.className = styles_module_css_1.default.floatingRoot;
        document.body.appendChild(node);
        setFloatingContainer(node);
        return function () {
            document.body.removeChild(node);
            setFloatingContainer(null);
        };
    }, [inline]);
    var formatDuration = function (seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return "".concat(mins.toString().padStart(2, '0'), ":").concat(secs.toString().padStart(2, '0'));
    };
    // Button style selection
    var buttonClass = variant === 'cta' && buttonClassName
        ? buttonClassName
        : (0, clsx_1.default)(styles_module_css_1.default.widgetButton, variant === 'cta' && styles_module_css_1.default.cta, variant === 'outline' && styles_module_css_1.default.outline, variant === 'chip' && styles_module_css_1.default.chip, conversation.status === 'connecting' && styles_module_css_1.default.loading);
    var isConnected = conversation.status === 'connected';
    var isConnecting = conversation.status === 'connecting';
    var renderCallPanel = function (inlineMode) {
        if (inlineMode === void 0) { inlineMode = false; }
        return (<div className={(0, clsx_1.default)(styles_module_css_1.default.callPanel, inlineMode && styles_module_css_1.default.callPanelInline, variant === 'chip' && styles_module_css_1.default.callPanelChip)} role='status' aria-live='polite'>
            <div className={styles_module_css_1.default.callHeader}>
                <span className={styles_module_css_1.default.callDot} aria-hidden='true'/>
                <span className={styles_module_css_1.default.callLabel}>Live with AnswerAgent</span>
                <span className={styles_module_css_1.default.callTimer}>{formatDuration(elapsedSeconds)}</span>
            </div>
            <div className={styles_module_css_1.default.callWave} aria-hidden='true'>
                <span />
                <span />
                <span />
            </div>
            <button onClick={endCall} className={(0, clsx_1.default)(styles_module_css_1.default.widgetButton, styles_module_css_1.default.danger, styles_module_css_1.default.callAction)}>
                End Call
            </button>
        </div>);
    };
    var renderStatus = function () {
        if (!showStatus) {
            return null;
        }
        if (isConnected) {
            return null;
        }
        return (<div className={styles_module_css_1.default.statusArea} role='status' aria-live='polite'>
                {isConnecting && (<div className={styles_module_css_1.default.connectingNotice}>
                        <span className={styles_module_css_1.default.connectingSpinner} aria-hidden='true'/>
                        <span>Connecting to AnswerAgent…</span>
                    </div>)}
                {error && <div className={styles_module_css_1.default.errorText}>{error}</div>}
                {hasStarted && hasEnded && !error && <div className={styles_module_css_1.default.endedText}>Call ended. Restart anytime.</div>}
            </div>);
    };
    if (inline) {
        return isConnected ? (renderCallPanel(true)) : (<div className={styles_module_css_1.default.inlineContainer}>
                <button onClick={startCall} disabled={isConnecting} className={buttonClass}>
                    {variant === 'chip' && emoji && <span className={styles_module_css_1.default.chipEmoji}>{emoji}</span>}
                    {isConnecting ? 'Connecting…' : text}
                </button>
                {renderStatus()}
            </div>);
    }
    var floatingPanel = isConnected && floatingContainer ? (0, react_dom_1.createPortal)(renderCallPanel(), floatingContainer) : null;
    return (<div className={(0, clsx_1.default)(styles_module_css_1.default.widgetWrapper, wrapperClassName)}>
            {floatingPanel}
            {isConnected ? (<div className={styles_module_css_1.default.floatingPlaceholder}>
                    <span role='status' aria-live='polite'>
                        Live call active — controls are docked bottom right.
                    </span>
                </div>) : (<>
                    <button onClick={startCall} disabled={isConnecting} className={buttonClass}>
                        {variant === 'chip' && emoji && <span className={styles_module_css_1.default.chipEmoji}>{emoji}</span>}
                        {isConnecting ? 'Connecting…' : text}
                    </button>
                    {renderStatus()}
                </>)}
        </div>);
};
exports.default = ElevenLabsInlineWidget;
