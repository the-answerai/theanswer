'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import { glassmorphismTokens } from '@ui/theme/tokens/glassmorphism'
import { colorTokens, statusColors } from '@ui/theme/tokens/colors'

type ReportState = 'idle' | 'loading' | 'success' | 'error'
type ThemeMode = 'light' | 'dark'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [reportState, setReportState] = useState<ReportState>('idle')
    const [reportMessage, setReportMessage] = useState('')
    const [reportUrl, setReportUrl] = useState('')
    const [mode, setMode] = useState<ThemeMode>('dark')

    useEffect(() => {
        console.error('Error boundary caught:', error)
        // Read theme from localStorage (source of truth for the app)
        const storedDarkMode = localStorage.getItem('isDarkMode')
        setMode(storedDarkMode === 'false' ? 'light' : 'dark')
    }, [error])

    const glass = glassmorphismTokens[mode]
    const colors = colorTokens[mode]

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
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 3,
                background: colors.background.default,
                zIndex: 9999
            }}
        >
            <Box
                sx={{
                    background: glass.glassSecondary.background,
                    backdropFilter: glass.glassSecondary.backdropFilter,
                    WebkitBackdropFilter: glass.glassSecondary.WebkitBackdropFilter,
                    border: glass.glassSecondary.border,
                    boxShadow: glass.glassSecondary.boxShadow,
                    transition: glass.transition,
                    padding: 4,
                    borderRadius: 3,
                    maxWidth: 480,
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <ErrorOutlineIcon
                    sx={{
                        fontSize: 72,
                        color: statusColors.error.main,
                        mb: 2
                    }}
                />

                <Typography
                    variant='h5'
                    component='h2'
                    sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: colors.text.primary
                    }}
                >
                    Something went wrong!
                </Typography>

                <Typography
                    sx={{
                        mb: 3,
                        color: colors.text.secondary,
                        wordBreak: 'break-word',
                        fontSize: '0.95rem',
                        lineHeight: 1.6
                    }}
                >
                    {error.message || 'An unexpected error occurred'}
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        justifyContent: 'center',
                        mb: reportState !== 'idle' ? 3 : 0
                    }}
                >
                    <Button
                        onClick={reset}
                        variant='contained'
                        startIcon={<RefreshIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            fontWeight: 500,
                            textTransform: 'none',
                            px: 3,
                            py: 1.25,
                            borderRadius: 2,
                            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)'
                            }
                        }}
                    >
                        Try again
                    </Button>

                    <Button
                        onClick={handleReportIssue}
                        variant='outlined'
                        disabled={reportState === 'loading' || reportState === 'success'}
                        startIcon={reportState === 'loading' ? <CircularProgress size={18} color='inherit' /> : <ReportProblemIcon />}
                        sx={{
                            ...glass.glassSubtle,
                            color: colors.text.secondary,
                            fontWeight: 500,
                            textTransform: 'none',
                            px: 3,
                            py: 1.25,
                            borderRadius: 2,
                            '&:hover': {
                                ...glass.glassHover,
                                borderColor: colors.divider
                            },
                            '&:disabled': {
                                opacity: 0.5,
                                color: colors.text.disabled
                            }
                        }}
                    >
                        {reportState === 'loading' ? 'Reporting...' : reportState === 'success' ? 'Reported' : 'Report Issue'}
                    </Button>
                </Box>

                {reportState === 'success' && (
                    <Alert
                        severity='success'
                        sx={{
                            mt: 2,
                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                            color: statusColors.success.main,
                            border: `1px solid ${statusColors.success.main}30`,
                            '& .MuiAlert-icon': { color: statusColors.success.main },
                            '& a': { color: 'inherit', fontWeight: 600 }
                        }}
                    >
                        Issue{' '}
                        <a href={reportUrl} target='_blank' rel='noopener noreferrer'>
                            {reportMessage}
                        </a>{' '}
                        created successfully
                    </Alert>
                )}

                {reportState === 'error' && (
                    <Alert
                        severity='error'
                        sx={{
                            mt: 2,
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            color: statusColors.error.main,
                            border: `1px solid ${statusColors.error.main}30`,
                            '& .MuiAlert-icon': { color: statusColors.error.main }
                        }}
                    >
                        {reportMessage}
                    </Alert>
                )}
            </Box>
        </Box>
    )
}
