/**
 * Canvas and Node Design Tokens
 * Provides consistent styling for Flowise canvas and React Flow nodes
 * Supports light and dark modes with proper contrast
 */

export interface CanvasTokens {
    // Canvas container
    canvas: {
        background: string
        backdropFilter: string
        WebkitBackdropFilter: string
        gradientOverlay: string
    }

    // Node container
    node: {
        background: string
        backdropFilter: string
        WebkitBackdropFilter: string
        border: string
        borderRadius: string
        boxShadow: string
        boxShadowHover: string
        borderSelected: string
        boxShadowSelected: string
    }

    // Node header
    header: {
        background: string
        backdropFilter: string
        WebkitBackdropFilter: string
        color: string
        borderBottom: string
    }

    // Node body
    body: {
        color: string
    }

    // Connection handles
    handle: {
        background: string
        border: string
        backdropFilter: string
        WebkitBackdropFilter: string
        boxShadowHover: string
    }

    // Connection edges (lines)
    edge: {
        stroke: string
        strokeWidth: number
        filter: string
    }

    // Edge labels
    edgeLabel: {
        background: string
        backdropFilter: string
        WebkitBackdropFilter: string
        border: string
        color: string
    }

    // Transitions
    transition: string
}

export const canvasTokens: Record<'light' | 'dark', CanvasTokens> = {
    light: {
        // Canvas - Light background with subtle blue gradient overlay
        canvas: {
            background: 'rgba(248, 250, 252, 0.95)', // Soft blue-gray
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            gradientOverlay: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)'
        },

        // Node - White glass with strong definition
        node: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(15, 23, 42, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1)',
            boxShadowHover: '0 8px 24px 0 rgba(0, 0, 0, 0.15)',
            borderSelected: '2px solid #3b82f6', // Blue primary
            boxShadowSelected: '0 0 0 4px rgba(59, 130, 246, 0.1)'
        },

        // Node header - Light gray background
        header: {
            background: 'rgba(241, 245, 249, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#1e293b', // Dark gray text
            borderBottom: '1px solid rgba(15, 23, 42, 0.1)'
        },

        // Node body - Dark gray text
        body: {
            color: '#334155'
        },

        // Connection handles - Blue with transparency
        handle: {
            background: 'rgba(59, 130, 246, 0.2)',
            border: '2px solid #3b82f6',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadowHover: '0 0 8px rgba(59, 130, 246, 0.4)'
        },

        // Connection edges - Blue lines
        edge: {
            stroke: '#3b82f6',
            strokeWidth: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
        },

        // Edge labels - White background
        edgeLabel: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(15, 23, 42, 0.15)',
            color: '#1e293b'
        },

        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    dark: {
        // Canvas - Dark background with subtle white gradient overlay
        canvas: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            gradientOverlay: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)'
        },

        // Node - Dark glass with subtle white overlay
        node: {
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)',
            boxShadowHover: '0 8px 24px 0 rgba(0, 0, 0, 0.5)',
            borderSelected: '2px solid #4db6ac', // Teal primary
            boxShadowSelected: '0 0 0 4px rgba(77, 182, 172, 0.1)'
        },

        // Node header - Black glass
        header: {
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#ffffff',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        },

        // Node body - White text
        body: {
            color: '#ffffff'
        },

        // Connection handles - Teal with transparency
        handle: {
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid #4db6ac',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            boxShadowHover: '0 0 8px rgba(77, 182, 172, 0.4)'
        },

        // Connection edges - Teal lines
        edge: {
            stroke: '#4db6ac',
            strokeWidth: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        },

        // Edge labels - Dark background
        edgeLabel: {
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff'
        },

        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
}
