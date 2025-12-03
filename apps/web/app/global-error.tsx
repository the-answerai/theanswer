'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('Global error boundary caught:', error)
    }, [error])

    return (
        <html>
            <body>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: '20px',
                        textAlign: 'center'
                    }}
                >
                    <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Application Error</h2>
                    <p style={{ marginBottom: '24px', color: '#666' }}>{error.message || 'A critical error occurred'}</p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
