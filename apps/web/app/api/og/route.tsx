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

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#0f172a',
                    padding: '60px 80px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background gradient effects */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
                        display: 'flex'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-150px',
                        left: '-150px',
                        width: '600px',
                        height: '600px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
                        display: 'flex'
                    }}
                />

                {/* Header with logo */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '40px'
                    }}
                >
                    {/* Logo icon - stylized A triangle */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
                            <path
                                d="M50 10L90 85H10L50 10Z"
                                stroke="#14b8a6"
                                strokeWidth="4"
                                fill="transparent"
                            />
                            <ellipse cx="50" cy="60" rx="8" ry="20" fill="#f97316" />
                            <circle cx="50" cy="42" r="6" fill="#f97316" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                            style={{
                                fontSize: '32px',
                                fontWeight: 300,
                                color: '#ffffff',
                                letterSpacing: '8px'
                            }}
                        >
                            ANSWER
                        </span>
                        <span
                            style={{
                                fontSize: '14px',
                                fontWeight: 400,
                                color: '#14b8a6',
                                letterSpacing: '2px',
                                marginTop: '-4px'
                            }}
                        >
                            AI
                        </span>
                    </div>
                </div>

                {/* Main content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        justifyContent: 'center'
                    }}
                >
                    {/* Type badge */}
                    {typeConfig.label && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '20px'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: 'rgba(20,184,166,0.2)',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(20,184,166,0.3)'
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>{typeConfig.icon}</span>
                                <span
                                    style={{
                                        fontSize: '14px',
                                        color: '#14b8a6',
                                        fontWeight: 500
                                    }}
                                >
                                    {typeConfig.label}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <h1
                        style={{
                            fontSize: title.length > 40 ? '48px' : '56px',
                            fontWeight: 700,
                            color: '#ffffff',
                            margin: 0,
                            lineHeight: 1.2,
                            maxWidth: '900px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {title}
                    </h1>

                    {/* Description */}
                    {description && (
                        <p
                            style={{
                                fontSize: '24px',
                                fontWeight: 400,
                                color: '#94a3b8',
                                margin: '20px 0 0 0',
                                lineHeight: 1.5,
                                maxWidth: '800px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {description}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '40px'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
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
                        <span
                            style={{
                                fontSize: '16px',
                                color: '#64748b',
                                fontWeight: 400
                            }}
                        >
                            theanswer.ai
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <span
                            style={{
                                fontSize: '14px',
                                color: '#475569',
                                fontWeight: 400
                            }}
                        >
                            Powered by AI
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                gap: '4px'
                            }}
                        >
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#14b8a6',
                                    display: 'flex'
                                }}
                            />
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f97316',
                                    display: 'flex'
                                }}
                            />
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#6366f1',
                                    display: 'flex'
                                }}
                            />
                        </div>
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
