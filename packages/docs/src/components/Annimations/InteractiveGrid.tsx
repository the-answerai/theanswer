import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface InteractiveGridProps {
    className?: string
    color?: string
}

const InteractiveGrid: React.FC<InteractiveGridProps> = ({ className, color = '#00ffff' }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const scene = new THREE.Scene()
        // scene.background = new THREE.Color(0x000000) // Transparent background

        const camera = new THREE.PerspectiveCamera(70, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100)
        camera.position.set(0, 10, 10)
        camera.lookAt(0, 0, 0)

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        containerRef.current.appendChild(renderer.domElement)

        // Create Grid
        const geometry = new THREE.PlaneGeometry(40, 40, 40, 40)
        const material = new THREE.PointsMaterial({
            color: new THREE.Color(color),
            size: 0.15,
            transparent: true,
            opacity: 0.8
        })

        // Store original positions
        const originalPositions = geometry.attributes.position.array.slice()
        const count = geometry.attributes.position.count

        const particles = new THREE.Points(geometry, material)
        particles.rotation.x = -Math.PI / 2
        scene.add(particles)

        // Mouse interaction
        const mouse = new THREE.Vector2(9999, 9999)
        const targetMouse = new THREE.Vector2(9999, 9999)

        const onMouseMove = (event: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                targetMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
                targetMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
            }
        }

        window.addEventListener('mousemove', onMouseMove)

        // Animation
        let time = 0
        const clock = new THREE.Clock()

        const animate = () => {
            requestAnimationFrame(animate)
            time = clock.getElapsedTime()

            // Smooth mouse movement
            mouse.x += (targetMouse.x - mouse.x) * 0.1
            mouse.y += (targetMouse.y - mouse.y) * 0.1

            // Raycaster for interaction
            const raycaster = new THREE.Raycaster()
            raycaster.setFromCamera(mouse, camera)

            // Create a virtual plane for intersection
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
            const target = new THREE.Vector3()
            raycaster.ray.intersectPlane(plane, target)

            const positions = geometry.attributes.position.array as Float32Array

            for (let i = 0; i < count; i++) {
                const x = originalPositions[i * 3]
                const y = originalPositions[i * 3 + 1]
                const z = originalPositions[i * 3 + 2] // This is actually Y in world space due to rotation

                // Wave effect based on time
                const waveZ = Math.sin(x * 0.5 + time) * 0.5 + Math.cos(y * 0.3 + time) * 0.5

                // Mouse interaction
                let dist = 100
                if (target) {
                    const dx = x - target.x
                    const dy = y + target.z // Z is Y in plane geometry due to rotation
                    dist = Math.sqrt(dx * dx + dy * dy)
                }

                const mouseEffect = Math.max(0, 5 - dist) * 0.5

                positions[i * 3 + 2] = z + waveZ + mouseEffect
            }

            geometry.attributes.position.needsUpdate = true

            // Slowly rotate the grid
            particles.rotation.z = time * 0.05

            renderer.render(scene, camera)
        }

        animate()

        // Resize handler
        const onResize = () => {
            if (!containerRef.current) return
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        }

        window.addEventListener('resize', onResize)

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            renderer.dispose()
        }
    }, [color])

    return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
}

export default InteractiveGrid
