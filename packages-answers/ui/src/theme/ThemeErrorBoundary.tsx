/**
 * Theme Error Boundary
 * Catches and handles theme initialization and runtime errors gracefully
 * Prevents full app crashes due to theme issues
 */

import React, { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
    errorInfo?: React.ErrorInfo
}

/**
 * Error Boundary for Theme System
 * Provides graceful degradation if theme system fails
 */
export class ThemeErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so next render shows fallback UI
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error details for debugging
        console.error('[Theme Error Boundary] Caught theme system error:', {
            error,
            errorInfo,
            componentStack: errorInfo.componentStack
        })

        // Store error info in state for display
        this.setState({
            errorInfo
        })

        // Optional: Send to error tracking service
        // Example with Sentry:
        // if (typeof window !== 'undefined' && window.Sentry) {
        //     window.Sentry.captureException(error, {
        //         extra: {
        //             componentStack: errorInfo.componentStack
        //         },
        //         tags: {
        //             errorBoundary: 'ThemeErrorBoundary'
        //         }
        //     })
        // }
    }

    handleRefresh = () => {
        // Clear error state and reload
        window.location.reload()
    }

    handleReset = () => {
        // Clear theme storage and reload
        try {
            localStorage.removeItem('mui-mode')
            localStorage.removeItem('mui-color-scheme')
            // Legacy storage keys
            localStorage.removeItem('customization')
            localStorage.removeItem('isDarkMode')
        } catch (storageError) {
            console.error('[Theme Error Boundary] Failed to clear storage:', storageError)
        }
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        color: '#ffffff',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}
                >
                    <div
                        style={{
                            maxWidth: '600px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            padding: '2rem',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        {/* Error Icon */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <svg
                                width='64'
                                height='64'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                style={{ display: 'inline-block' }}
                            >
                                <circle cx='12' cy='12' r='10' stroke='#ff6b6b' strokeWidth='2' />
                                <path d='M12 8v4m0 4h.01' stroke='#ff6b6b' strokeWidth='2' strokeLinecap='round' />
                            </svg>
                        </div>

                        {/* Error Title */}
                        <h2
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                marginBottom: '1rem',
                                textAlign: 'center',
                                color: '#ffffff'
                            }}
                        >
                            Theme System Error
                        </h2>

                        {/* Error Message */}
                        <p
                            style={{
                                fontSize: '1rem',
                                lineHeight: 1.6,
                                marginBottom: '1.5rem',
                                textAlign: 'center',
                                color: 'rgba(255, 255, 255, 0.8)'
                            }}
                        >
                            The theme system failed to initialize properly. This might be due to corrupted settings or a browser
                            compatibility issue.
                        </p>

                        {/* Error Details (Collapsible) */}
                        <details
                            style={{
                                marginBottom: '1.5rem',
                                background: 'rgba(0, 0, 0, 0.2)',
                                padding: '1rem',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <summary
                                style={{
                                    fontWeight: 600,
                                    marginBottom: '0.5rem',
                                    color: 'rgba(255, 255, 255, 0.9)'
                                }}
                            >
                                Technical Details
                            </summary>
                            <div
                                style={{
                                    marginTop: '0.75rem',
                                    fontSize: '0.875rem',
                                    color: 'rgba(255, 255, 255, 0.7)'
                                }}
                            >
                                <strong>Error:</strong>
                                <pre
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        padding: '0.75rem',
                                        borderRadius: '4px',
                                        overflow: 'auto',
                                        marginTop: '0.5rem',
                                        fontSize: '0.813rem',
                                        color: '#ff6b6b'
                                    }}
                                >
                                    {this.state.error?.message || 'Unknown error'}
                                </pre>
                                {this.state.errorInfo?.componentStack && (
                                    <>
                                        <strong style={{ marginTop: '0.75rem', display: 'block' }}>Component Stack:</strong>
                                        <pre
                                            style={{
                                                background: 'rgba(0, 0, 0, 0.3)',
                                                padding: '0.75rem',
                                                borderRadius: '4px',
                                                overflow: 'auto',
                                                marginTop: '0.5rem',
                                                fontSize: '0.75rem',
                                                maxHeight: '200px',
                                                color: 'rgba(255, 255, 255, 0.6)'
                                            }}
                                        >
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </>
                                )}
                            </div>
                        </details>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={this.handleRefresh}
                                style={{
                                    flex: '1 1 200px',
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                Refresh Page
                            </button>

                            <button
                                onClick={this.handleReset}
                                style={{
                                    flex: '1 1 200px',
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s, border-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                Reset Theme Settings
                            </button>
                        </div>

                        {/* Help Text */}
                        <p
                            style={{
                                marginTop: '1.5rem',
                                fontSize: '0.875rem',
                                textAlign: 'center',
                                color: 'rgba(255, 255, 255, 0.6)'
                            }}
                        >
                            If the problem persists, please contact support or clear your browser cache.
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
