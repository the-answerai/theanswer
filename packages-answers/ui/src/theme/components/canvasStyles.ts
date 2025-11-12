/**
 * Canvas and Node Glassmorphism Styles
 * Provides modern glass styling for Flowise canvas and nodes
 * Now supports both light and dark modes with proper contrast
 */

export const canvasNodeStyles = (mode: 'light' | 'dark') => ({
    // Canvas container - Adapts to theme mode
    canvas: {
        position: 'relative',
        height: '100%',
        width: '100%',
        background: mode === 'light' ? 'rgba(248, 250, 252, 0.95)' : 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
                mode === 'light'
                    ? 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)'
                    : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
            pointerEvents: 'none'
        }
    },

    // Node styling - Adapts to theme mode with proper contrast
    node: {
        background: mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        boxShadow: mode === 'light' ? '0 4px 16px 0 rgba(0, 0, 0, 0.1)' : '0 4px 16px 0 rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light' ? '0 8px 24px 0 rgba(0, 0, 0, 0.15)' : '0 8px 24px 0 rgba(0, 0, 0, 0.5)'
        },

        '&.selected': {
            border: mode === 'light' ? '2px solid #3b82f6' : '2px solid #4db6ac',
            boxShadow: mode === 'light' ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : '0 0 0 4px rgba(77, 182, 172, 0.1)'
        }
    },

    // Node header - Adapts to theme mode
    nodeHeader: {
        background: mode === 'light' ? 'rgba(241, 245, 249, 0.9)' : 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: mode === 'light' ? '#1e293b' : '#ffffff',
        padding: '12px 16px',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        borderBottom: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255, 255, 255, 0.08)',
        fontWeight: 600
    },

    // Node body - Adapts text color to theme
    nodeBody: {
        padding: '16px',
        color: mode === 'light' ? '#334155' : '#ffffff',
        backgroundColor: 'transparent'
    },

    // Node handle (connection points) - Adapts to theme
    nodeHandle: {
        background: mode === 'light' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.2)',
        border: mode === 'light' ? '2px solid #3b82f6' : '2px solid #4db6ac',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease',
        '&:hover': {
            transform: 'scale(1.2)',
            boxShadow: mode === 'light' ? '0 0 8px rgba(59, 130, 246, 0.4)' : '0 0 8px rgba(77, 182, 172, 0.4)'
        }
    },

    // Edge (connection line) styling - Adapts to theme
    edge: {
        strokeWidth: 2,
        stroke: mode === 'light' ? '#3b82f6' : '#4db6ac',
        strokeDasharray: '0',
        filter: mode === 'light' ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
    },

    // Edge label - Adapts to theme
    edgeLabel: {
        background: mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '0.75rem',
        color: mode === 'light' ? '#1e293b' : '#ffffff'
    }
})
