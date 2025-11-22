import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'

function AskAlphaNavbarButton() {
    const handleClick = () => {
        const event = new CustomEvent('ask-alpha-open', {
            detail: {
                context: {
                    page: 'navbar',
                    section: 'top-nav'
                }
            },
            bubbles: true
        })
        window.dispatchEvent(event)
    }

    return (
        <button
            onClick={handleClick}
            aria-label='Ask Alpha AI Assistant'
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--ifm-color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                marginLeft: '0.5rem',
                marginRight: '0.5rem'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--ifm-color-primary-dark)'
                e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--ifm-color-primary)'
                e.currentTarget.style.transform = 'translateY(0)'
            }}
        >
            <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <circle cx='11' cy='11' r='8'></circle>
                <path d='m21 21-4.35-4.35'></path>
            </svg>
            <span>Ask Alpha</span>
        </button>
    )
}

export default function NavbarAskAlpha() {
    useEffect(() => {
        const container = document.getElementById('navbar-ask-alpha')
        if (container && !container.hasChildNodes()) {
            const root = createRoot(container)
            root.render(<AskAlphaNavbarButton />)
        }
    }, [])

    return null
}
