"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WebinarLegalFooter;
var index_module_css_1 = require("../pages/index.module.css");
function WebinarLegalFooter() {
    var currentYear = new Date().getFullYear();
    return (<footer className={index_module_css_1.default.legalFooter}>
            <div className='container'>
                <div>© {currentYear} AnswerAI. All rights reserved.</div>
                <div className={index_module_css_1.default.legalLinks}>
                    <a href='/privacy-policy'>Privacy Policy</a>
                    <span aria-hidden='true'>•</span>
                    <a href='/terms-of-service'>Terms of Service</a>
                    <span aria-hidden='true'>•</span>
                    <a href='mailto:legal@theanswer.ai'>Contact Legal</a>
                </div>
            </div>
        </footer>);
}
