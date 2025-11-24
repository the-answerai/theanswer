import React, { useState } from 'react'
import styles from './IntegrationLogo.module.css'

const LOGOKIT_TOKEN = 'pk_fr8710fea017bdf10b13fe'

interface IntegrationLogoProps {
    domain: string
    alt: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export const IntegrationLogo: React.FC<IntegrationLogoProps> = ({ domain, alt, size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false)

    const sizes = { sm: 24, md: 60, lg: 120 }
    const logoUrl = `https://img.logokit.com/${domain}?token=${LOGOKIT_TOKEN}`
    const _fallbackSrc = `/img/integrations/${domain.replace('.com', '').replace('.', '-')}.svg`

    return (
        <div className={`${styles.logoContainer} ${styles[size]} ${className}`}>
            {!imageError ? (
                <img
                    src={logoUrl}
                    alt={alt}
                    height={sizes[size]}
                    width={sizes[size]}
                    loading='lazy'
                    onError={() => setImageError(true)}
                    className={styles.logoImage}
                />
            ) : (
                <div className={styles.logoFallback}>
                    <span>{alt.charAt(0)}</span>
                </div>
            )}
        </div>
    )
}

export default IntegrationLogo
