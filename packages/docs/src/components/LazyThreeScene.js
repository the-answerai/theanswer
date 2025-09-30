"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LazyThreeScene;
var react_1 = require("react");
function LazyThreeScene(_a) {
    var className = _a.className, fallbackClassName = _a.fallbackClassName;
    var _b = (0, react_1.useState)(null), ThreeScene = _b[0], setThreeScene = _b[1];
    (0, react_1.useEffect)(function () {
        var mounted = true;
        Promise.resolve().then(function () { return require('@site/src/components/Annimations/SphereScene'); }).then(function (module) {
            if (mounted) {
                setThreeScene(function () { return module.default; });
            }
        })
            .catch(function (error) {
            console.warn('Unable to load ThreeJS scene', error);
        });
        return function () {
            mounted = false;
        };
    }, []);
    if (!ThreeScene) {
        return <div className={fallbackClassName || className} aria-hidden='true'/>;
    }
    return <ThreeScene className={className}/>;
}
