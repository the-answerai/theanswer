import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface NetworkBackgroundProps {
    className?: string
    color?: string
}

const NetworkBackground: React.FC<NetworkBackgroundProps> = ({ className, color = '#00ffff' }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000)
        camera.position.z = 50

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        containerRef.current.appendChild(renderer.domElement)

        // Nodes
        const particleCount = 100
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(particleCount * 3)
        const velocities: { x: number; y: number; z: number }[] = []

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60
            positions[i * 3 + 1] = (Math.random() - 0.5) * 60
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30

            velocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            })
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const material = new THREE.PointsMaterial({
            color: new THREE.Color(color),
            size: 0.5,
            transparent: true,
            opacity: 0.8
        })
        const particles = new THREE.Points(geometry, material)
        scene.add(particles)

        // Lines
        const lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.2
        })

        const linesGeometry = new THREE.BufferGeometry()
        const lines = new THREE.LineSegments(linesGeometry, lineMaterial)
        scene.add(lines)

        // Mouse interaction
        const mouse = new THREE.Vector2(9999, 9999)
        const onMouseMove = (event: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
            }
        }
        window.addEventListener('mousemove', onMouseMove)

        const animate = () => {
            requestAnimationFrame(animate)

            const posAttribute = geometry.attributes.position
            const currentPositions = posAttribute.array as Float32Array

            // Update positions
            for (let i = 0; i < particleCount; i++) {
                currentPositions[i * 3] += velocities[i].x
                currentPositions[i * 3 + 1] += velocities[i].y
                currentPositions[i * 3 + 2] += velocities[i].z

                // Bounce off boundaries
                if (Math.abs(currentPositions[i * 3]) > 30) velocities[i].x *= -1
                if (Math.abs(currentPositions[i * 3 + 1]) > 30) velocities[i].y *= -1
                if (Math.abs(currentPositions[i * 3 + 2]) > 15) velocities[i].z *= -1
            }
            posAttribute.needsUpdate = true

            // Connect lines
            const linePositions: number[] = []
            const connectionDistance = 10

            for (let i = 0; i < particleCount; i++) {
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = currentPositions[i * 3] - currentPositions[j * 3]
                    const dy = currentPositions[i * 3 + 1] - currentPositions[j * 3 + 1]
                    const dz = currentPositions[i * 3 + 2] - currentPositions[j * 3 + 2]
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

                    if (dist < connectionDistance) {
                        linePositions.push(
                            currentPositions[i * 3],
                            currentPositions[i * 3 + 1],
                            currentPositions[i * 3 + 2],
                            currentPositions[j * 3],
                            currentPositions[j * 3 + 1],
                            currentPositions[j * 3 + 2]
                        )
                    }
                }
            }

            linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))

            // Rotate scene slowly
            scene.rotation.y += 0.001

            // Mouse influence
            scene.rotation.x += (mouse.y * 0.1 - scene.rotation.x) * 0.05
            scene.rotation.y += (mouse.x * 0.1 - scene.rotation.y) * 0.05

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
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            linesGeometry.dispose()
            lineMaterial.dispose()
            renderer.dispose()
        }
    }, [color])

    return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
}

export default NetworkBackground
