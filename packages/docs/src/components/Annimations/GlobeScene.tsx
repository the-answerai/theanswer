import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface GlobeSceneProps {
    className?: string
    primaryColor?: string
    secondaryColor?: string
}

const GlobeScene: React.FC<GlobeSceneProps> = ({ className, primaryColor = '#00ffff', secondaryColor = '#ff00ff' }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000)
        camera.position.z = 4

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        containerRef.current.appendChild(renderer.domElement)

        const globeGroup = new THREE.Group()
        scene.add(globeGroup)

        // Sphere Points
        const geometry = new THREE.IcosahedronGeometry(1.5, 10) // High detail
        const material = new THREE.PointsMaterial({
            color: new THREE.Color(primaryColor),
            size: 0.02,
            transparent: true,
            opacity: 0.6
        })
        const globePoints = new THREE.Points(geometry, material)
        globeGroup.add(globePoints)

        // Inner Sphere (Glow)
        const innerGeometry = new THREE.IcosahedronGeometry(1.45, 2)
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(secondaryColor),
            wireframe: true,
            transparent: true,
            opacity: 0.1
        })
        const innerGlobe = new THREE.Mesh(innerGeometry, innerMaterial)
        globeGroup.add(innerGlobe)

        // Active Nodes (Random points on surface)
        const nodesGeometry = new THREE.BufferGeometry()
        const nodeCount = 20
        const nodePositions = new Float32Array(nodeCount * 3)

        for (let i = 0; i < nodeCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / nodeCount)
            const theta = Math.sqrt(nodeCount * Math.PI) * phi

            const r = 1.55
            nodePositions[i * 3] = r * Math.cos(theta) * Math.sin(phi)
            nodePositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
            nodePositions[i * 3 + 2] = r * Math.cos(phi)
        }

        nodesGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
        const nodesMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(secondaryColor),
            size: 0.08,
            transparent: true,
            opacity: 0.9
        })
        const nodes = new THREE.Points(nodesGeometry, nodesMaterial)
        globeGroup.add(nodes)

        // Animation
        const animate = () => {
            requestAnimationFrame(animate)

            globeGroup.rotation.y += 0.002
            globeGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1

            // Pulse effect for nodes
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.2
            nodesMaterial.size = 0.08 * scale

            renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
            if (!containerRef.current) return
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        }
        window.addEventListener('resize', onResize)

        return () => {
            window.removeEventListener('resize', onResize)
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            innerGeometry.dispose()
            innerMaterial.dispose()
            nodesGeometry.dispose()
            nodesMaterial.dispose()
            renderer.dispose()
        }
    }, [primaryColor, secondaryColor])

    return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
}

export default GlobeScene
