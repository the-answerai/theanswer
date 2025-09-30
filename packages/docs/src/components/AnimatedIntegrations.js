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
var THREE = require("three");
var clsx_1 = require("clsx");
var AnimatedIntegrations = function (_a) {
    var integrations = _a.integrations, className = _a.className;
    var mountRef = (0, react_1.useRef)(null);
    var sceneRef = (0, react_1.useRef)();
    var rendererRef = (0, react_1.useRef)();
    var cameraRef = (0, react_1.useRef)();
    var frameId = (0, react_1.useRef)();
    var logosRef = (0, react_1.useRef)([]);
    var linesRef = (0, react_1.useRef)([]);
    var triangleRef = (0, react_1.useRef)();
    var hoverTimeoutRef = (0, react_1.useRef)();
    var _b = (0, react_1.useState)(null), hoverInfo = _b[0], setHoverInfo = _b[1];
    var _c = (0, react_1.useState)(false), isHovered = _c[0], setIsHovered = _c[1];
    // Create logo texture from Clearbit API (fixed for color)
    var createLogoTexture = (0, react_1.useCallback)(function (domain) {
        return new Promise(function (resolve, reject) {
            var loader = new THREE.TextureLoader();
            // Remove greyscale parameter and add format for color logos
            var logoUrl = "https://logo.clearbit.com/".concat(domain, "?size=256&format=png");
            loader.load(logoUrl, function (texture) {
                texture.generateMipmaps = false;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.flipY = false;
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                resolve(texture);
            }, undefined, function (error) {
                // Fallback to a colorful default texture
                var canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                var ctx = canvas.getContext('2d');
                // Create a colorful gradient background
                var gradient = ctx.createLinearGradient(0, 0, 256, 256);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 256, 256);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                var companyName = domain.split('.')[0].toUpperCase();
                ctx.fillText(companyName, 128, 128);
                var texture = new THREE.CanvasTexture(canvas);
                resolve(texture);
            });
        });
    }, []);
    // Generate constellation positions
    var generateConstellationPositions = (0, react_1.useCallback)(function (count) {
        var positions = [];
        var width = 120; // Much larger to use full horizontal space
        var height = 80; // Much larger to use full vertical space
        for (var i = 0; i < count; i++) {
            // Completely random distribution across the entire area
            var x = (Math.random() - 0.5) * width; // Full width from -60 to +60
            var y = (Math.random() - 0.5) * height; // Full height from -40 to +40
            var z = (Math.random() - 0.5) * 10; // More depth variation
            positions.push({ x: x, y: y, z: z });
        }
        return positions;
    }, []);
    // Create central triangle
    var createCentralTriangle = (0, react_1.useCallback)(function () {
        var geometry = new THREE.ConeGeometry(5, 8, 3);
        var material = new THREE.MeshLambertMaterial({
            color: 0x667eea,
            transparent: true,
            opacity: 0.8,
            emissive: 0x221133
        });
        var triangle = new THREE.Mesh(geometry, material);
        triangle.rotation.z = Math.PI;
        triangle.position.set(0, 0, 0);
        return triangle;
    }, []);
    // Create connecting line
    var createConnectionLine = (0, react_1.useCallback)(function (start, end) {
        var points = [start, end];
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var material = new THREE.LineBasicMaterial({
            color: 0x667eea,
            transparent: true,
            opacity: 0.3
        });
        return new THREE.Line(geometry, material);
    }, []);
    // Get logo size based on prominence
    var getLogoSize = (0, react_1.useCallback)(function (prominence) {
        switch (prominence) {
            case 'large': return 6.0;
            case 'medium': return 4.5;
            case 'small': return 3.5;
            default: return 4.5;
        }
    }, []);
    // Initialize Three.js scene
    (0, react_1.useEffect)(function () {
        if (!mountRef.current)
            return;
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0f1a);
        sceneRef.current = scene;
        var camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 100; // Much further back to see the full spread
        cameraRef.current = camera;
        var renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        // Add lights for better logo visibility
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        // Add point lights for more dynamic lighting
        var pointLight1 = new THREE.PointLight(0x667eea, 0.5, 100);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);
        var pointLight2 = new THREE.PointLight(0x764ba2, 0.5, 100);
        pointLight2.position.set(-10, -10, 10);
        scene.add(pointLight2);
        // Create central triangle
        var triangle = createCentralTriangle();
        scene.add(triangle);
        triangleRef.current = triangle;
        // Create constellation
        var createConstellation = function () { return __awaiter(void 0, void 0, void 0, function () {
            var positions, logoGroups, lines, i, integration, position, texture, size, geometry, material, mesh, group, line, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        positions = generateConstellationPositions(integrations.length);
                        logoGroups = [];
                        lines = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < integrations.length)) return [3 /*break*/, 6];
                        integration = integrations[i];
                        position = positions[i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, createLogoTexture(integration.domain)];
                    case 3:
                        texture = _a.sent();
                        size = getLogoSize(integration.prominence || 'medium');
                        geometry = new THREE.PlaneGeometry(size, size);
                        material = new THREE.MeshLambertMaterial({
                            map: texture,
                            transparent: true,
                            side: THREE.DoubleSide,
                            alphaTest: 0.1
                        });
                        mesh = new THREE.Mesh(geometry, material);
                        group = new THREE.Group();
                        group.add(mesh);
                        // Position in constellation
                        group.position.set(position.x, position.y, position.z);
                        group.integrationData = integration;
                        group.originalPosition = group.position.clone();
                        group.prominence = integration.prominence || 'medium';
                        scene.add(group);
                        logoGroups.push(group);
                        line = createConnectionLine(new THREE.Vector3(position.x, position.y, position.z), new THREE.Vector3(0, 0, 0));
                        scene.add(line);
                        lines.push(line);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.warn("Failed to load logo for ".concat(integration.domain, ":"), error_1);
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        logosRef.current = logoGroups;
                        linesRef.current = lines;
                        return [2 /*return*/];
                }
            });
        }); };
        createConstellation();
        // Handle mouse events with drag support
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        var isDragging = false;
        var previousMousePosition = { x: 0, y: 0 };
        var onMouseMove = function (event) {
            var rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            // Handle dragging
            if (isDragging) {
                var deltaX = event.clientX - previousMousePosition.x;
                var deltaY = event.clientY - previousMousePosition.y;
                // Rotate camera around the scene
                var spherical = new THREE.Spherical();
                spherical.setFromVector3(camera.position);
                spherical.theta -= deltaX * 0.01;
                spherical.phi += deltaY * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                camera.position.setFromSpherical(spherical);
                camera.lookAt(0, 0, 0);
                previousMousePosition = { x: event.clientX, y: event.clientY };
                return;
            }
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(logosRef.current, true);
            if (intersects.length > 0) {
                var group = intersects[0].object.parent;
                if (group && group.integrationData) {
                    // Project 3D logo position to screen coordinates
                    var logoWorldPosition = group.position.clone();
                    var logoScreenPosition = logoWorldPosition.project(camera);
                    // Convert normalized coordinates to screen pixels
                    var canvasRect = renderer.domElement.getBoundingClientRect();
                    var logoScreenX = (logoScreenPosition.x + 1) * canvasRect.width / 2 + canvasRect.left;
                    var logoScreenY = (-logoScreenPosition.y + 1) * canvasRect.height / 2 + canvasRect.top;
                    // Position popup next to the logo
                    var popupWidth = 280;
                    var popupHeight = 150;
                    var offset = 20;
                    var x = logoScreenX + offset;
                    var y = logoScreenY - popupHeight / 2;
                    // Keep popup on screen
                    var viewportWidth = window.innerWidth;
                    var viewportHeight = window.innerHeight;
                    if (x + popupWidth > viewportWidth) {
                        x = logoScreenX - popupWidth - offset;
                    }
                    if (y < 0) {
                        y = 10;
                    }
                    if (y + popupHeight > viewportHeight) {
                        y = viewportHeight - popupHeight - 10;
                    }
                    setHoverInfo({
                        integration: group.integrationData,
                        x: x,
                        y: y
                    });
                    setIsHovered(true);
                    renderer.domElement.style.cursor = 'pointer';
                }
            }
            else {
                // Don't hide popup immediately - let popup handle its own hover
                renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
            }
        };
        var onMouseDown = function (event) {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
            renderer.domElement.style.cursor = 'grabbing';
        };
        var onMouseUp = function () {
            isDragging = false;
            renderer.domElement.style.cursor = 'grab';
        };
        var onMouseLeave = function () {
            isDragging = false;
            renderer.domElement.style.cursor = 'default';
        };
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('mouseleave', onMouseLeave);
        renderer.domElement.style.cursor = 'grab';
        // Animation loop
        var animate = function () {
            frameId.current = requestAnimationFrame(animate);
            var time = Date.now() * 0.001;
            // Animate triangle rotation
            if (triangleRef.current) {
                triangleRef.current.rotation.y = time * 0.5;
                triangleRef.current.rotation.z = Math.sin(time * 0.3) * 0.1 + Math.PI;
            }
            // Animate logos with subtle floating and breathing
            logosRef.current.forEach(function (group, index) {
                var originalPos = group.originalPosition;
                var prominence = group.prominence;
                // Subtle floating animation
                group.position.x = originalPos.x + Math.sin(time * 0.5 + index) * 0.1;
                group.position.y = originalPos.y + Math.cos(time * 0.3 + index) * 0.1;
                group.position.z = originalPos.z + Math.sin(time * 0.7 + index) * 0.2;
                // Breathing effect based on prominence
                var breathingScale = prominence === 'large' ? 1.05 : prominence === 'medium' ? 1.03 : 1.02;
                var scale = 1 + Math.sin(time * 2 + index) * (breathingScale - 1);
                group.scale.setScalar(scale);
                // Gentle rotation
                group.rotation.z = Math.sin(time + index) * 0.05;
            });
            // Animate connection lines opacity
            linesRef.current.forEach(function (line, index) {
                var material = line.material;
                material.opacity = 0.2 + Math.sin(time * 2 + index) * 0.1;
            });
            renderer.render(scene, camera);
        };
        animate();
        // Handle resize
        var handleResize = function () {
            if (!mountRef.current)
                return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);
        return function () {
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
            if (frameId.current) {
                cancelAnimationFrame(frameId.current);
            }
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            // Clean up Three.js resources
            logosRef.current.forEach(function (group) {
                group.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose();
                        if (Array.isArray(child.material)) {
                            child.material.forEach(function (material) { return material.dispose(); });
                        }
                        else {
                            child.material.dispose();
                        }
                    }
                });
            });
            linesRef.current.forEach(function (line) {
                line.geometry.dispose();
                line.material.dispose();
            });
            renderer.dispose();
        };
    }, [integrations, createLogoTexture, generateConstellationPositions, createCentralTriangle, createConnectionLine, getLogoSize]);
    return (<div className={(0, clsx_1.default)('integration-animation-container', className)} style={{ position: 'relative' }}>
            <div ref={mountRef} style={{
            width: '100%',
            height: '600px',
            borderRadius: '12px',
            overflow: 'hidden'
        }}/>

            {/* Hover flyout */}
            {hoverInfo && (<div style={{
                position: 'fixed',
                left: hoverInfo.x,
                top: hoverInfo.y,
                background: 'rgba(10, 15, 26, 0.95)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '12px',
                padding: '16px 20px',
                color: 'white',
                fontSize: '14px',
                zIndex: 1000,
                maxWidth: '280px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)'
            }} onMouseEnter={function () {
                // Clear any pending hide timeout
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                }
                setIsHovered(true);
            }} onMouseLeave={function () {
                // Delay hiding the popup
                hoverTimeoutRef.current = setTimeout(function () {
                    setHoverInfo(null);
                    setIsHovered(false);
                }, 200);
            }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#667eea', fontSize: '16px' }}>
                        {hoverInfo.integration.name}
                    </div>
                    <div style={{ marginBottom: '10px', opacity: 0.9, lineHeight: '1.4' }}>
                        {hoverInfo.integration.description}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px' }}>
                        Category: {hoverInfo.integration.category}
                    </div>
                    <button style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                padding: '8px 16px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease'
            }} onMouseEnter={function (e) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }} onMouseLeave={function (e) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }} onClick={function () { return window.open('https://studio.theanswer.ai', '_blank'); }}>
                        Sign Up Now →
                    </button>
                </div>)}
        </div>);
};
exports.default = AnimatedIntegrations;
