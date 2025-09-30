"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WebinarCalendarButtons;
var index_module_css_1 = require("../pages/index.module.css");
var webinarContent_1 = require("@site/src/config/webinarContent");
var getCalendarStartEnd = function () {
    var start = new Date(webinarContent_1.webinarConfig.webinarDateTimeISO);
    if (Number.isNaN(start.getTime())) {
        return { startISO: '', endISO: '' };
    }
    var end = new Date(start.getTime() + 60 * 60 * 1000);
    var format = function (date) { return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; };
    return {
        startISO: format(start),
        endISO: format(end)
    };
};
function WebinarCalendarButtons() {
    var _a = getCalendarStartEnd(), startISO = _a.startISO, endISO = _a.endISO;
    if (!startISO || !endISO) {
        return null;
    }
    var title = encodeURIComponent('Enterprise AI Webinar: Deploy AI Agents in 4 Weeks');
    var details = encodeURIComponent("Live 60-minute working session with Bradley Taylor & Adam Harris. You'll get the 4-week deployment playbook, ROI calculator, and security checklist.");
    var location = encodeURIComponent('Live Online Webinar');
    var googleLink = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=".concat(title, "&dates=").concat(startISO, "/").concat(endISO, "&details=").concat(details, "&location=").concat(location);
    var outlookLink = "https://outlook.live.com/calendar/0/deeplink/compose?subject=".concat(title, "&body=").concat(details, "&startdt=").concat(startISO, "&enddt=").concat(endISO, "&location=").concat(location);
    var icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AnswerAI//Enterprise AI Webinar//EN\nBEGIN:VEVENT\nUID:".concat(startISO, "@theanswer.ai\nDTSTAMP:").concat(startISO, "\nDTSTART:").concat(startISO, "\nDTEND:").concat(endISO, "\nSUMMARY:Enterprise AI Webinar: Deploy AI Agents in 4 Weeks\nDESCRIPTION:Live 60-minute working session with Bradley Taylor & Adam Harris.\nLOCATION:Live Online Webinar\nEND:VEVENT\nEND:VCALENDAR");
    var icsLink = "data:text/calendar;charset=utf8,".concat(encodeURIComponent(icsContent));
    return (<div className={index_module_css_1.default.calendarButtons}>
            <a href={googleLink} target='_blank' rel='noreferrer' className={index_module_css_1.default.calendarButton}>
                Add to Google
            </a>
            <a href={outlookLink} target='_blank' rel='noreferrer' className={index_module_css_1.default.calendarButton}>
                Add to Outlook
            </a>
            <a href={icsLink} download='enterprise-ai-webinar.ics' className={index_module_css_1.default.calendarButton}>
                Download ICS
            </a>
            <a href='mailto:hello@theanswer.ai?subject=Send%20me%20the%20webinar%20recording&body=Hi%20AnswerAI%20team%2C%0A%0APlease%20email%20me%20the%20Enterprise%20AI%20webinar%20replay%20and%20updates.%0A%0AThank%20you!' className={index_module_css_1.default.calendarButton}>
                Just send me reminders
            </a>
        </div>);
}
