"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UsingAnswerAgentAISubmenu;
var router_1 = require("@docusaurus/router");
var Link_1 = require("@docusaurus/Link");
var clsx_1 = require("clsx");
var styles_module_css_1 = require("./styles.module.css");
var submenuItems = [
    {
        to: '/agents',
        label: 'Agents',
        icon: '🤖',
        description: 'AI-powered sidekicks'
    },
    {
        to: '/chat',
        label: 'Chat',
        icon: '💬',
        description: 'Intelligent conversations'
    },
    {
        to: '/browser-sidekick',
        label: 'Browser Sidekick',
        icon: '🌐',
        description: 'AI everywhere you browse'
    },
    {
        to: '/sidekick-studio',
        label: 'Studio',
        icon: '🛠️',
        description: 'Build AI workflows'
    },
    {
        to: '/learn',
        label: 'Learn',
        icon: '🎓',
        description: 'Master AI fundamentals'
    },
    {
        to: '/ai-workshops',
        label: 'AI Workshops',
        icon: '🎯',
        description: 'Expert-led team training'
    }
];
function UsingAnswerAgentAISubmenu() {
    var location = (0, router_1.useLocation)();
    return (<div className={styles_module_css_1.default.submenuContainer}>
            <div className='container'>
                <nav className={styles_module_css_1.default.submenu}>
                    <div className={styles_module_css_1.default.submenuItems}>
                        {submenuItems.map(function (item) {
            var _a;
            var isActive = location.pathname === item.to;
            return (<Link_1.default key={item.to} to={item.to} className={(0, clsx_1.default)(styles_module_css_1.default.submenuItem, (_a = {},
                    _a[styles_module_css_1.default.submenuItemActive] = isActive,
                    _a))}>
                                    <div className={styles_module_css_1.default.submenuItemIcon}>{item.icon}</div>
                                    <div className={styles_module_css_1.default.submenuItemContent}>
                                        <div className={styles_module_css_1.default.submenuItemLabel}>{item.label}</div>
                                        <div className={styles_module_css_1.default.submenuItemDescription}>{item.description}</div>
                                    </div>
                                    <div className={styles_module_css_1.default.submenuItemGlow}></div>
                                </Link_1.default>);
        })}
                    </div>
                </nav>
            </div>
        </div>);
}
