import React, { useState } from 'react'
import styles from './Modern.module.css'
import CodeTypewriter from './CodeTypewriter'
import NetworkBackground from '../Annimations/NetworkBackground'
import GlobeScene from '../Annimations/GlobeScene'
import MagneticCardComponent from './MagneticCard'
import InfiniteMarquee from './InfiniteMarquee'

// Re-export MagneticCard
export const MagneticCard = MagneticCardComponent

export const TerminalHero: React.FC = () => {
    return (
        <div className={styles.terminalHero}>
            <CodeTypewriter />
        </div>
    )
}

export const OrchestrationFlow: React.FC = () => {
    return (
        <div style={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
            <NetworkBackground color='#00ffcc' />
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none'
                }}
            >
                <div
                    style={{
                        background: 'rgba(0,0,0,0.7)',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 255, 204, 0.3)'
                    }}
                >
                    <h3 style={{ color: '#00ffcc', margin: 0 }}>AI Core Online</h3>
                    <p style={{ color: '#fff', opacity: 0.8, margin: '0.5rem 0 0 0' }}>Processing 1.2M tokens/sec</p>
                </div>
            </div>
        </div>
    )
}

export const TiltHero: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [transform, setTransform] = useState('')

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const rotateX = ((y - centerY) / centerY) * -10 // Max 10 deg rotation
        const rotateY = ((x - centerX) / centerX) * 10

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
    }

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)')
    }

    return (
        <div
            style={{ transition: 'transform 0.1s ease', transform, transformStyle: 'preserve-3d' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    )
}

export const MagneticGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>{children}</div>
}

export const BeamSection: React.FC = () => {
    return (
        <div
            style={{
                position: 'relative',
                padding: '4rem 0',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, transparent 0%, rgba(var(--ifm-color-primary-rgb), 0.05) 50%, transparent 100%)'
            }}
        >
            <div style={{ height: '400px', width: '100%', position: 'relative', marginBottom: '2rem' }}>
                <GlobeScene primaryColor='#ffffff' secondaryColor='var(--ifm-color-primary)' />
            </div>
            <InfiniteMarquee speed={40}>
                <div
                    style={{
                        display: 'flex',
                        gap: '4rem',
                        opacity: 0.5,
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--ifm-color-emphasis-600)'
                    }}
                >
                    <span>OPENAI</span>
                    <span>ANTHROPIC</span>
                    <span>COHERE</span>
                    <span>MISTRAL</span>
                    <span>HUGGINGFACE</span>
                    <span>AZURE</span>
                    <span>AWS BEDROCK</span>
                    <span>GOOGLE GEMINI</span>
                </div>
            </InfiniteMarquee>
        </div>
    )
}
