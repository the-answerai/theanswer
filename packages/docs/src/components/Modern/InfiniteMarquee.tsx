import React from 'react'
import styles from './Modern.module.css'

interface InfiniteMarqueeProps {
    children: React.ReactNode
    direction?: 'left' | 'right'
    speed?: number
}

const InfiniteMarquee: React.FC<InfiniteMarqueeProps> = ({ children, direction = 'left', speed = 20 }) => {
    return (
        <div className={styles.marqueeContainer}>
            <div
                className={styles.marqueeTrack}
                style={{
                    animationDirection: direction === 'right' ? 'reverse' : 'normal',
                    animationDuration: `${speed}s`
                }}
            >
                <div className={styles.marqueeContent}>{children}</div>
                <div className={styles.marqueeContent}>{children}</div>
            </div>
        </div>
    )
}

export default InfiniteMarquee
