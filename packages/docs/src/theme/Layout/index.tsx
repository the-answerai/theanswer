import React from 'react'
import OriginalLayout from '@theme-original/Layout'
import { useLocation } from '@docusaurus/router'
import styles from './styles.module.css'

export default function Layout(props) {
    const location = useLocation()

    // Don't show banner on webinar pages
    const isWebinarPage = location.pathname.includes('webinar')

    return (
        <>
            {!isWebinarPage && (
                <div className={styles.webinarBanner}>
                    <div className={styles.webinarContent}>
                        <span className={styles.webinarBadge}>🚀 New Webinar</span>
                        <span className={styles.webinarText}>Deploy Enterprise AI in 4 Weeks - Live Workshop Oct 2nd at 11am PT</span>
                        <a href='/webinar-enterprise-ai' className={styles.webinarCta}>
                            Register Free →
                        </a>
                    </div>
                </div>
            )}
            <OriginalLayout {...props} />
        </>
    )
}
