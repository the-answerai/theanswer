import React from 'react'
import clsx from 'clsx'
import { AskAlphaButton } from '../AskAlpha/AskAlphaButton'
import ElevenLabsInlineWidget from '../ElevenLabsInlineWidget'
import styles from './HeroCTA.module.css'

const ELEVEN_LABS_AGENT_ID = 'agent_01k03gnw7xe11btz2vprkf7ay5' as const
const CALENDLY_DEMO_URL = 'https://calendly.com/lastrev/answeragent-demo'

interface HeroCTAProps {
    variant?: 'primary' | 'secondary'
    showScheduleDemo?: boolean
    showAskAlpha?: boolean
    showAssessment?: boolean
    scheduleDemoText?: string
    assessmentText?: string
    className?: string
    context?: {
        page?: string
        section?: string
        [key: string]: any
    }
}

export const HeroCTA: React.FC<HeroCTAProps> = ({
    variant = 'primary',
    showScheduleDemo = true,
    showAskAlpha = true,
    showAssessment = true,
    scheduleDemoText = 'Schedule Demo',
    assessmentText = 'Start AI Assessment',
    className = '',
    context = {}
}) => {
    return (
        <div className={clsx(styles.heroCTA, className)}>
            {showScheduleDemo && (
                <a
                    href={CALENDLY_DEMO_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={clsx(styles.ctaButton, styles.ctaPrimary, variant === 'primary' && styles.primary)}
                >
                    {scheduleDemoText}
                </a>
            )}
            {showAskAlpha && (
                <AskAlphaButton
                    variant='chip'
                    size='medium'
                    context={{
                        ...context,
                        page: context.page || 'hero',
                        section: 'cta'
                    }}
                    className={styles.askAlphaButton}
                />
            )}
            {showAssessment && (
                <ElevenLabsInlineWidget
                    agentId={ELEVEN_LABS_AGENT_ID}
                    text={assessmentText}
                    variant='chip'
                    inline={true}
                    showStatus={false}
                    wrapperClassName={styles.assessmentWidget}
                />
            )}
        </div>
    )
}

export default HeroCTA
