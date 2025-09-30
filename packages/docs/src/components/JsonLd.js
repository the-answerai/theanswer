"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = JsonLd;
var Head_1 = require("@docusaurus/Head");
function JsonLd(_a) {
    var data = _a.data;
    return (<Head_1.default>
            <script type='application/ld+json'>{JSON.stringify(data)}</script>
        </Head_1.default>);
}
