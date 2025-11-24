import React, { useRef, useState } from 'react'
import styles from './Modern.module.css'

interface MagneticCardProps {
    children: React.ReactNode
    className?: string
}

const MagneticCard: React.FC<MagneticCardProps> = ({ children, className }) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [opacity, setOpacity] = useState(0)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return

        const rect = cardRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setPosition({ x, y })
        setOpacity(1)
    }

    const handleMouseLeave = () => {
        setOpacity(0)
    }

    return (
        <div
            ref={cardRef}
            className={`${styles.magneticCard} ${className || ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className={styles.magneticGlow}
                style={{
                    opacity,
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: 'translate(-50%, -50%)'
                }}
            />
            <div className={styles.magneticContent}>{children}</div>
        </div>
    )
}

export default MagneticCard
