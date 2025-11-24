import React from 'react'
import styles from './Modern.module.css'

interface GradientTextProps {
    children: React.ReactNode
    className?: string
    animate?: boolean
}

export const GradientText: React.FC<GradientTextProps> = ({ children, className, animate = true }) => {
    return <span className={`${styles.gradientText} ${animate ? styles.animate : ''} ${className || ''}`}>{children}</span>
}

interface BentoGridProps {
    children: React.ReactNode
    className?: string
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
    return <div className={`${styles.bentoGrid} ${className || ''}`}>{children}</div>
}

interface BentoItemProps {
    children: React.ReactNode
    className?: string
    span?: 1 | 2 | 3
    rowSpan?: 1 | 2
}

export const BentoItem: React.FC<BentoItemProps> = ({ children, className, span = 1, rowSpan = 1 }) => {
    return (
        <div
            className={`${styles.bentoItem} ${className || ''}`}
            style={{
                gridColumn: `span ${span}`,
                gridRow: `span ${rowSpan}`
            }}
        >
            {children}
        </div>
    )
}
