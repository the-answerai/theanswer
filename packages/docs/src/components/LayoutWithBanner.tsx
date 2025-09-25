import React from 'react'
import Layout from '@theme/Layout'
import { useLocation } from '@docusaurus/router'
import styles from './LayoutWithBanner.module.css'

interface LayoutWithBannerProps {
    children: React.ReactNode
    title?: string
    description?: string
}

export default function LayoutWithBanner({ children, title, description }: LayoutWithBannerProps) {
    const location = useLocation()

    // Don't show banner on webinar pages
    const isWebinarPage = location.pathname.includes('webinar')

    return (
        <Layout title={title} description={description}>
            {!isWebinarPage && (
                <div className={styles.webinarBanner}>
                    <span className={styles.webinarBadge}>🚀 New Webinar</span>
                    <span className={styles.webinarText}>Deploy Enterprise AI in 4 Weeks - Live Workshop Oct 2nd at 11am PT</span>
                    <a href='/webinar-enterprise-ai' className={styles.webinarCta}>
                        Register Free →
                    </a>
                </div>
            )}
            {children}
        </Layout>
    )
}
