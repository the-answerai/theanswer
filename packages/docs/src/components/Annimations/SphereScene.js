"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var THREE = require("three");
var OrbitControls_1 = require("three/examples/jsm/controls/OrbitControls");
var troika_three_text_1 = require("troika-three-text");
var prop_types_1 = require("prop-types");
var ThreeJsScene = function (_a) {
    var className = _a.className;
    var canvasRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (!canvasRef.current)
            return;
        // Set up Three.js scene
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        var renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        // Create a particle system
        var particleGeometry = new THREE.BufferGeometry();
        var particleCount = 5000;
        var posArray = new Float32Array(particleCount * 3);
        for (var i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 5;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        var particleMaterial = new THREE.PointsMaterial({
            size: 0.005,
            color: 0x00ffff
        });
        var particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);
        // Create smoke effect
        var smokeParticles = new THREE.BufferGeometry();
        var smokeCount = 10000; // Increased particle count for more particles
        var smokePosArray = new Float32Array(smokeCount * 3);
        var smokeOpacityArray = new Float32Array(smokeCount);
        for (var i = 0; i < smokeCount * 3; i += 3) {
            smokePosArray[i] = (Math.random() - 0.5) * 4;
            smokePosArray[i + 1] = (Math.random() - 0.5) * 4;
            smokePosArray[i + 2] = (Math.random() - 0.5) * 4;
            smokeOpacityArray[i / 3] = Math.random() * 0.3 + 0.2; // Reduced base opacity
        }
        smokeParticles.setAttribute('position', new THREE.BufferAttribute(smokePosArray, 3));
        smokeParticles.setAttribute('opacity', new THREE.BufferAttribute(smokeOpacityArray, 1));
        // Create a neon pink color
        // Define an array of neon colors
        var neonColors = [
            new THREE.Color(0xff6ec7), // Neon Pink
            new THREE.Color(0x00ffff), // Neon Cyan
            new THREE.Color(0xff00ff), // Neon Magenta
            new THREE.Color(0x39ff14), // Neon Green
            new THREE.Color(0xff3131) // Neon Red
        ];
        var colorIndex = 0;
        // Function to get the next color
        var getNextColor = function () {
            colorIndex = (colorIndex + 1) % neonColors.length;
            return neonColors[colorIndex];
        };
        var smokeMaterial = new THREE.PointsMaterial({
            size: 0.005, // Significantly reduced size for very small particles
            color: neonColors[0], // Start with the first color
            transparent: true,
            opacity: 0.4, // Reduced base opacity
            blending: THREE.AdditiveBlending
        });
        var smokeSystem = new THREE.Points(smokeParticles, smokeMaterial);
        scene.add(smokeSystem);
        // Update 3D text
        var text = new troika_three_text_1.Text();
        text.text = '';
        text.fontSize = 0.6;
        text.position.set(-1.5, 0, 0);
        text.color = 0x00ffff;
        text.fillOpacity = 0; // Start with fully transparent text
        scene.add(text);
        // Add lighting to make the text more visible
        var light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 0, 10);
        scene.add(light);
        // Set up camera and controls
        camera.position.z = 5;
        var controls = new OrbitControls_1.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true; // Enable zooming
        controls.minDistance = 1; // Set minimum zoom distance
        controls.maxDistance = 10; // Set maximum zoom distance
        // Add raycaster for particle interaction
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        // Function to handle mouse movement
        function onMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObject(particleSystem);
            if (intersects.length > 0) {
                var intersect = intersects[0];
                var idx = intersect.index;
                // Move the intersected particle towards the camera
                var positions = particleSystem.geometry.attributes.position.array;
                positions[idx * 3] += (camera.position.x - positions[idx * 3]) * 0.1;
                positions[idx * 3 + 1] += (camera.position.y - positions[idx * 3 + 1]) * 0.1;
                positions[idx * 3 + 2] += (camera.position.z - positions[idx * 3 + 2]) * 0.1;
                particleSystem.geometry.attributes.position.needsUpdate = true;
            }
        }
        window.addEventListener('mousemove', onMouseMove);
        // Animation loop
        var time = 0;
        var lastColorChange = 0;
        function animate() {
            requestAnimationFrame(animate);
            time += 0.01;
            // Change color every second
            if (time - lastColorChange >= 1) {
                smokeMaterial.color = getNextColor();
                lastColorChange = time;
            }
            // Animate existing particle system
            particleSystem.rotation.x += 0.001;
            particleSystem.rotation.y += 0.001;
            // Animate smoke
            var smokePositions = smokeParticles.attributes.position.array;
            var smokeOpacities = smokeParticles.attributes.opacity.array;
            for (var i = 0; i < smokeCount * 3; i += 3) {
                smokePositions[i] += Math.sin(time + i) * 0.0005;
                smokePositions[i + 1] += Math.cos(time + i) * 0.0005;
                smokePositions[i + 2] += Math.sin(time + i) * 0.0005;
                smokeOpacities[i / 3] = (Math.sin(time + i / 3) * 0.15 + 0.35) * 0.4; // Reduced opacity variation
            }
            smokeParticles.attributes.position.needsUpdate = true;
            smokeParticles.attributes.opacity.needsUpdate = true;
            // Gradually reveal text
            if (text.fillOpacity < 1) {
                text.fillOpacity += 0.005;
                text.sync();
            }
            text.rotation.y = Math.sin(time * 0.5) * 0.1;
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
        // Handle window resize
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener('resize', onWindowResize);
        // Cleanup
        return function () {
            window.removeEventListener('resize', onWindowResize);
            window.removeEventListener('mousemove', onMouseMove);
            // Dispose of Three.js objects
            scene.remove(particleSystem);
            scene.remove(smokeSystem);
            particleGeometry.dispose();
            particleMaterial.dispose();
            smokeParticles.dispose();
            smokeMaterial.dispose();
            renderer.dispose();
        };
    }, []);
    return <canvas ref={canvasRef} className={className}/>;
};
ThreeJsScene.propTypes = {
    className: prop_types_1.default.string
};
exports.default = ThreeJsScene;
