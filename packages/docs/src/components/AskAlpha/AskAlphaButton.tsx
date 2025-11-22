import React from 'react'
import styles from './AskAlpha.module.css'

interface AskAlphaButtonProps {
    context?: {
        page?: string
        section?: string
        url?: string
        content?: string
        [key: string]: any
    }
    variant?: 'icon' | 'chip' | 'button'
    size?: 'small' | 'medium' | 'large'
    onClick?: () => void
    className?: string
}

export const AskAlphaButton: React.FC<AskAlphaButtonProps> = ({
    context = {},
    variant = 'chip',
    size = 'medium',
    onClick,
    className = ''
}) => {
    const handleClick = () => {
        // Dispatch custom event with context
        const event = new CustomEvent('ask-alpha-open', {
            detail: { context },
            bubbles: true
        })
        window.dispatchEvent(event)

        if (onClick) {
            onClick()
        }
    }

    const renderIcon = () => (
        <svg width='16' height='16' viewBox='0 0 1600 1600' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='800' cy='800' r='800' fill='#16213E' />
            <path d='M800 400L950 700H650L800 400Z M600 800H1000L900 1000H700L600 800Z' fill='#EEEEFF' />
        </svg>
    )

    if (variant === 'icon') {
        return (
            <button
                className={`${styles.iconButton} ${styles[size]} ${className}`}
                onClick={handleClick}
                title='Ask Alpha'
                aria-label='Ask Alpha AI Assistant'
            >
                {renderIcon()}
            </button>
        )
    }

    if (variant === 'chip') {
        return (
            <button
                className={`${styles.chipButton} ${styles[size]} ${className}`}
                onClick={handleClick}
                aria-label='Ask Alpha AI Assistant'
            >
                {renderIcon()}
                <span>Ask Alpha</span>
            </button>
        )
    }

    return (
        <button className={`${styles.fullButton} ${styles[size]} ${className}`} onClick={handleClick} aria-label='Ask Alpha AI Assistant'>
            {renderIcon()}
            <span>Ask Alpha</span>
        </button>
    )
}
