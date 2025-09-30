"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Layout;
var react_1 = require("react");
var Layout_1 = require("@theme-original/Layout");
var router_1 = require("@docusaurus/router");
var styles_module_css_1 = require("./styles.module.css");
function Layout(props) {
    var location = (0, router_1.useLocation)();
    // Don't show banner on webinar pages
    var isWebinarPage = location.pathname.includes('webinar');
    return (<>
            {!isWebinarPage && (<div className={styles_module_css_1.default.webinarBanner}>
                    <div className={styles_module_css_1.default.webinarContent}>
                        <span className={styles_module_css_1.default.webinarBadge}>🚀 New Webinar</span>
                        <span className={styles_module_css_1.default.webinarText}>Deploy Enterprise AI in 4 Weeks - Live Workshop Oct 2nd at 11am PT</span>
                        <a href='/webinar-enterprise-ai' className={styles_module_css_1.default.webinarCta}>
                            Register Free →
                        </a>
                    </div>
                </div>)}
            <Layout_1.default {...props}/>
        </>);
}
