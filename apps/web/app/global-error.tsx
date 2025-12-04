'use client'

import { useEffect, useState } from 'react'

type ReportState = 'idle' | 'loading' | 'success' | 'error'

// Inline glassmorphism tokens (can't import since global-error renders outside app)
const glassTokens = {
    light: {
        background: '#ffffff',
        glass: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)'
        },
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(15, 23, 42, 0.15)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)'
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b'
        }
    },
    dark: {
        background: '#0b0b0b',
        glass: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)'
        },
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.2)'
        },
        text: {
            primary: '#ffffff',
            secondary: '#9e9e9e'
        }
    }
}

const statusColors = {
    error: '#f44336',
    success: '#4caf50'
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [reportState, setReportState] = useState<ReportState>('idle')
    const [reportMessage, setReportMessage] = useState('')
    const [reportUrl, setReportUrl] = useState('')
    const [isDarkMode, setIsDarkMode] = useState(true)

    useEffect(() => {
        console.error('Global error boundary caught:', error)
        // Read dark mode from localStorage (source of truth for the app)
        const storedDarkMode = localStorage.getItem('isDarkMode')
        setIsDarkMode(storedDarkMode !== 'false') // Default to dark if not set
    }, [error])

    const theme = isDarkMode ? glassTokens.dark : glassTokens.light
    const reportingEnabled = !!process.env.NEXT_PUBLIC_ERROR_REPORTING_ENABLED

    const handleReportIssue = async () => {
        setReportState('loading')
        setReportMessage('')

        try {
            const response = await fetch('/api/report-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    errorMessage: error.message || 'Unknown error',
                    errorDigest: error.digest,
                    errorStack: error.stack?.substring(0, 5000),
                    url: typeof window !== 'undefined' ? window.location.href : undefined,
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                    timestamp: new Date().toISOString()
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setReportState('success')
                setReportMessage(data.issueId)
                setReportUrl(data.issueUrl)
            } else {
                setReportState('error')
                setReportMessage(data.error || 'Failed to report issue')
            }
        } catch {
            setReportState('error')
            setReportMessage('Failed to report issue. Please try again.')
        }
    }

    return (
        <html>
            <body
                style={{
                    margin: 0,
                    padding: 0,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    background: theme.background,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                }}
            >
                <div
                    style={{
                        background: theme.glass.background,
                        backdropFilter: theme.glass.backdropFilter,
                        WebkitBackdropFilter: theme.glass.backdropFilter,
                        border: theme.glass.border,
                        boxShadow: theme.glass.boxShadow,
                        padding: '32px',
                        borderRadius: '16px',
                        maxWidth: '480px',
                        width: 'calc(100% - 48px)',
                        margin: '24px',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Error Icon */}
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='72'
                        height='72'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke={statusColors.error}
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        style={{ marginBottom: '16px' }}
                    >
                        <circle cx='12' cy='12' r='10'></circle>
                        <line x1='12' y1='8' x2='12' y2='12'></line>
                        <line x1='12' y1='16' x2='12.01' y2='16'></line>
                    </svg>

                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: theme.text.primary,
                            margin: '0 0 16px 0'
                        }}
                    >
                        Application Error
                    </h2>

                    <p
                        style={{
                            color: theme.text.secondary,
                            wordBreak: 'break-word',
                            margin: '0 0 24px 0',
                            lineHeight: 1.6,
                            fontSize: '0.95rem'
                        }}
                    >
                        {error.message || 'A critical error occurred'}
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            justifyContent: 'center',
                            marginBottom: reportState !== 'idle' ? '24px' : '0'
                        }}
                    >
                        <button
                            onClick={reset}
                            style={{
                                padding: '10px 24px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            >
                                <path d='M21 2v6h-6'></path>
                                <path d='M3 12a9 9 0 0 1 15-6.7L21 8'></path>
                                <path d='M3 22v-6h6'></path>
                                <path d='M21 12a9 9 0 0 1-15 6.7L3 16'></path>
                            </svg>
                            Try again
                        </button>

                        {reportingEnabled && (
                            <button
                                onClick={handleReportIssue}
                                disabled={reportState === 'loading' || reportState === 'success'}
                                style={{
                                    padding: '10px 24px',
                                    background: theme.glassSubtle.background,
                                    backdropFilter: theme.glassSubtle.backdropFilter,
                                    color: theme.text.secondary,
                                    border: theme.glassSubtle.border,
                                    borderRadius: '8px',
                                    cursor: reportState === 'loading' || reportState === 'success' ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    opacity: reportState === 'loading' || reportState === 'success' ? 0.5 : 1
                                }}
                            >
                                {reportState === 'loading' ? (
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='18'
                                        height='18'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    >
                                        <path d='M21 12a9 9 0 1 1-6.219-8.56'></path>
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='18'
                                        height='18'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    >
                                        <path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z'></path>
                                        <line x1='12' y1='9' x2='12' y2='13'></line>
                                        <line x1='12' y1='17' x2='12.01' y2='17'></line>
                                    </svg>
                                )}
                                {reportState === 'loading' ? 'Reporting...' : reportState === 'success' ? 'Reported' : 'Report Issue'}
                            </button>
                        )}
                    </div>

                    {reportState === 'success' && (
                        <div
                            style={{
                                padding: '12px 16px',
                                background: 'rgba(76, 175, 80, 0.1)',
                                color: statusColors.success,
                                border: '1px solid rgba(76, 175, 80, 0.3)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                marginTop: '16px'
                            }}
                        >
                            Issue{' '}
                            <a href={reportUrl} target='_blank' rel='noopener noreferrer' style={{ color: 'inherit', fontWeight: 600 }}>
                                {reportMessage}
                            </a>{' '}
                            created successfully
                        </div>
                    )}

                    {reportState === 'error' && (
                        <div
                            style={{
                                padding: '12px 16px',
                                background: 'rgba(244, 67, 54, 0.1)',
                                color: statusColors.error,
                                border: '1px solid rgba(244, 67, 54, 0.3)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                marginTop: '16px'
                            }}
                        >
                            {reportMessage}
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </body>
        </html>
    )
}
