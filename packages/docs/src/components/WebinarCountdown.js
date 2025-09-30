"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WebinarCountdown;
var react_1 = require("react");
var clsx_1 = require("clsx");
var webinarContent_1 = require("@site/src/config/webinarContent");
var index_module_css_1 = require("../pages/index.module.css");
function WebinarCountdown(_a) {
    var className = _a.className, _b = _a.showSeconds, showSeconds = _b === void 0 ? true : _b, _c = _a.compact, compact = _c === void 0 ? false : _c;
    var _d = (0, react_1.useState)({ days: 0, hours: 0, minutes: 0, seconds: 0 }), timeLeft = _d[0], setTimeLeft = _d[1];
    var _e = (0, react_1.useState)(false), isExpired = _e[0], setIsExpired = _e[1];
    // Parse webinar date/time
    var getWebinarDate = function () {
        if (webinarContent_1.webinarConfig.webinarDateTimeISO) {
            var parsed = new Date(webinarContent_1.webinarConfig.webinarDateTimeISO);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        // Fallback for legacy config without ISO date
        var dateStr = "".concat(webinarContent_1.webinarConfig.webinarDate, " ").concat(webinarContent_1.webinarConfig.webinarTime);
        var fallback = new Date(dateStr);
        return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
    };
    var calculateTimeLeft = function () {
        var webinarDate = getWebinarDate();
        var now = new Date();
        var difference = webinarDate.getTime() - now.getTime();
        if (difference <= 0) {
            setIsExpired(true);
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        var days = Math.floor(difference / (1000 * 60 * 60 * 24));
        var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((difference % (1000 * 60)) / 1000);
        return { days: days, hours: hours, minutes: minutes, seconds: seconds };
    };
    (0, react_1.useEffect)(function () {
        var timer = setInterval(function () {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        // Initial calculation
        setTimeLeft(calculateTimeLeft());
        return function () { return clearInterval(timer); };
    }, []);
    if (isExpired) {
        return (<div className={(0, clsx_1.default)(className, index_module_css_1.default.countdownContainer)} style={{
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                border: '2px solid #ff4444',
                padding: compact ? '0.5rem' : '1rem',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: compact ? '1rem' : '1.2rem', fontWeight: 'bold', color: '#ff4444' }}>🔴 Webinar has started!</div>
                {!compact && <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>Join now or catch the replay</div>}
            </div>);
    }
    var formatNumber = function (num) { return num.toString().padStart(2, '0'); };
    return (<div className={(0, clsx_1.default)(className, index_module_css_1.default.countdownContainer)} style={{
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            border: '2px solid #00ffff',
            padding: compact ? '0.5rem' : '1rem',
            borderRadius: '8px',
            textAlign: 'center'
        }}>
            {!compact && <div style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>⏰ Webinar starts in:</div>}

            <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: compact ? '0.5rem' : '1rem',
            flexWrap: 'wrap'
        }}>
                {timeLeft.days > 0 && (<div className={index_module_css_1.default.countdownUnit}>
                        <div style={{
                fontSize: compact ? '1.5rem' : '2rem',
                fontWeight: 'bold',
                color: '#00ffff',
                lineHeight: 1
            }}>
                            {formatNumber(timeLeft.days)}
                        </div>
                        <div style={{ fontSize: compact ? '0.7rem' : '0.8rem', opacity: 0.8 }}>{timeLeft.days === 1 ? 'day' : 'days'}</div>
                    </div>)}

                <div className={index_module_css_1.default.countdownUnit}>
                    <div style={{
            fontSize: compact ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            color: '#00ffff',
            lineHeight: 1
        }}>
                        {formatNumber(timeLeft.hours)}
                    </div>
                    <div style={{ fontSize: compact ? '0.7rem' : '0.8rem', opacity: 0.8 }}>{timeLeft.hours === 1 ? 'hour' : 'hours'}</div>
                </div>

                <div className={index_module_css_1.default.countdownUnit}>
                    <div style={{
            fontSize: compact ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            color: '#00ffff',
            lineHeight: 1
        }}>
                        {formatNumber(timeLeft.minutes)}
                    </div>
                    <div style={{ fontSize: compact ? '0.7rem' : '0.8rem', opacity: 0.8 }}>{timeLeft.minutes === 1 ? 'min' : 'mins'}</div>
                </div>

                {showSeconds && (<div className={index_module_css_1.default.countdownUnit}>
                        <div style={{
                fontSize: compact ? '1.5rem' : '2rem',
                fontWeight: 'bold',
                color: '#00ffff',
                lineHeight: 1
            }}>
                            {formatNumber(timeLeft.seconds)}
                        </div>
                        <div style={{ fontSize: compact ? '0.7rem' : '0.8rem', opacity: 0.8 }}>
                            {timeLeft.seconds === 1 ? 'sec' : 'secs'}
                        </div>
                    </div>)}
            </div>

            {!compact && (<div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    {webinarContent_1.webinarConfig.webinarDate} at {webinarContent_1.webinarConfig.webinarTime}
                </div>)}
        </div>);
}
