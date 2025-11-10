/**
 * Canvas and Node Glassmorphism Styles
 * Provides modern glass styling for Flowise canvas and nodes
 */

export const canvasNodeStyles = (mode: 'light' | 'dark') => ({
    // Canvas container - Always stays dark
    canvas: {
        position: 'relative',
        height: '100%',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.03)', // Keep dark in both modes
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)', // Keep dark
            pointerEvents: 'none'
        }
    },

    // Node styling - Always dark background with glass effect
    node: {
        background: 'rgba(255, 255, 255, 0.05)', // Keep dark
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', // Keep dark border
        borderRadius: '12px',
        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)', // Keep dark shadow
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.5)'
        },

        '&.selected': {
            border: '2px solid #4db6ac',
            boxShadow: '0 0 0 4px rgba(77, 182, 172, 0.1)'
        }
    },

    // Node header - Always dark
    nodeHeader: {
        background: 'rgba(0, 0, 0, 0.4)', // Keep dark
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#ffffff',
        padding: '12px 16px',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontWeight: 600
    },

    // Node body - Always dark text
    nodeBody: {
        padding: '16px',
        color: '#ffffff', // Keep white text
        backgroundColor: 'transparent'
    },

    // Node handle (connection points) - Always dark theme
    nodeHandle: {
        background: 'rgba(255, 255, 255, 0.2)',
        border: '2px solid #4db6ac',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease',
        '&:hover': {
            transform: 'scale(1.2)',
            boxShadow: '0 0 8px rgba(77, 182, 172, 0.4)'
        }
    },

    // Edge (connection line) styling - Always dark theme
    edge: {
        strokeWidth: 2,
        stroke: '#4db6ac',
        strokeDasharray: '0',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
    },

    // Edge label - Always dark
    edgeLabel: {
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '0.75rem',
        color: '#ffffff'
    }
})
