import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    // Get dynamic content from query params
    const title = searchParams.get('title') || 'Answer Agent'
    const description = searchParams.get('description') || 'AI-powered answers for your organization'
    const type = searchParams.get('type') || 'default' // default, chat, chatflow, document

    // Get the appropriate icon based on type
    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'chat':
                return { icon: '💬', label: 'Chat' }
            case 'chatflow':
                return { icon: '🔄', label: 'Chatflow' }
            case 'document':
                return { icon: '📄', label: 'Document' }
            case 'agent':
                return { icon: '🤖', label: 'Agent' }
            default:
                return { icon: null, label: null }
        }
    }

    const typeConfig = getTypeConfig(type)

    // Calculate font size based on title length for optimal readability
    const getTitleFontSize = (text: string) => {
        if (text.length <= 20) return '80px'
        if (text.length <= 35) return '68px'
        if (text.length <= 50) return '56px'
        return '48px'
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#0a0f1a',
                    padding: '50px 60px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background gradient effects - more subtle */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-200px',
                        right: '-200px',
                        width: '700px',
                        height: '700px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 60%)',
                        display: 'flex'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-300px',
                        left: '-200px',
                        width: '800px',
                        height: '800px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 60%)',
                        display: 'flex'
                    }}
                />

                {/* Accent line at top */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #14b8a6 0%, #f97316 50%, #6366f1 100%)',
                        display: 'flex'
                    }}
                />

                {/* Header with logo - more compact */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px'
                    }}
                >
                    {/* Logo icon - stylized A triangle */}
                    <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
                        <path
                            d="M50 10L90 85H10L50 10Z"
                            stroke="#14b8a6"
                            strokeWidth="5"
                            fill="transparent"
                        />
                        <ellipse cx="50" cy="60" rx="8" ry="20" fill="#f97316" />
                        <circle cx="50" cy="42" r="6" fill="#f97316" />
                    </svg>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span
                            style={{
                                fontSize: '28px',
                                fontWeight: 300,
                                color: '#e2e8f0',
                                letterSpacing: '6px'
                            }}
                        >
                            ANSWER
                        </span>
                        <span
                            style={{
                                fontSize: '28px',
                                fontWeight: 600,
                                color: '#14b8a6',
                                letterSpacing: '2px'
                            }}
                        >
                            AI
                        </span>
                    </div>
                </div>

                {/* Main content - takes most of the space */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'center',
                        paddingRight: '40px'
                    }}
                >
                    {/* Type badge */}
                    {typeConfig.label && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '24px'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    backgroundColor: 'rgba(20,184,166,0.15)',
                                    padding: '10px 20px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(20,184,166,0.4)'
                                }}
                            >
                                <span style={{ fontSize: '22px' }}>{typeConfig.icon}</span>
                                <span
                                    style={{
                                        fontSize: '18px',
                                        color: '#14b8a6',
                                        fontWeight: 600,
                                        letterSpacing: '1px'
                                    }}
                                >
                                    {typeConfig.label}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Title - LARGE and readable */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0'
                        }}
                    >
                        <h1
                            style={{
                                fontSize: getTitleFontSize(title),
                                fontWeight: 700,
                                color: '#ffffff',
                                margin: 0,
                                lineHeight: 1.1,
                                maxWidth: '1000px',
                                textShadow: '0 2px 20px rgba(0,0,0,0.3)'
                            }}
                        >
                            {title}
                        </h1>
                    </div>

                    {/* Description - clear and readable */}
                    {description && (
                        <p
                            style={{
                                fontSize: '28px',
                                fontWeight: 400,
                                color: '#cbd5e1',
                                margin: '28px 0 0 0',
                                lineHeight: 1.4,
                                maxWidth: '900px'
                            }}
                        >
                            {description}
                        </p>
                    )}
                </div>

                {/* Footer - clean and minimal */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(148,163,184,0.1)'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <div
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: '#14b8a6',
                                display: 'flex'
                            }}
                        />
                        <span
                            style={{
                                fontSize: '20px',
                                color: '#94a3b8',
                                fontWeight: 500
                            }}
                        >
                            theanswer.ai
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#14b8a6',
                                display: 'flex'
                            }}
                        />
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#f97316',
                                display: 'flex'
                            }}
                        />
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#6366f1',
                                display: 'flex'
                            }}
                        />
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630
        }
    )
}
