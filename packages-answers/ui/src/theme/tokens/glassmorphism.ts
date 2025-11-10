/**
 * Unified Glassmorphism Design Tokens
 * Provides consistent glass styling across the entire application
 */

export interface GlassStyle {
    background: string
    backdropFilter: string
    WebkitBackdropFilter: string
    border: string
    boxShadow: string
    color?: string
}

export interface GlassTokens {
    glassPrimary: GlassStyle
    glassSecondary: GlassStyle
    glassSubtle: GlassStyle
    glassHover: Partial<GlassStyle> & { transform?: string }
    transition: string
}

export const glassmorphismTokens: Record<'light' | 'dark', GlassTokens> = {
    light: {
        // Primary glass for headers, navigation (blue gradient with glossy shine)
        glassPrimary: {
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.9) 50%, rgba(30, 58, 138, 0.95) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(147, 197, 253, 0.5)',
            boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
            color: '#ffffff'
        },

        // Secondary glass for cards, panels
        glassSecondary: {
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)'
        },

        // Subtle glass for buttons, inputs
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(15, 23, 42, 0.15)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)'
        },

        // Hover states
        glassHover: {
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)'
        },

        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    dark: {
        // Primary glass for headers, navigation
        glassPrimary: {
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
        },

        // Secondary glass for cards, panels
        glassSecondary: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)'
        },

        // Subtle glass for buttons, inputs
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.2)'
        },

        // Hover states
        glassHover: {
            background: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-2px)'
        },

        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
}

/**
 * Helper function to get glass styles based on variant and mode
 */
export const getGlass = (variant: 'primary' | 'secondary' | 'subtle', mode: 'light' | 'dark'): GlassStyle => {
    const styles = glassmorphismTokens[mode]
    const variantMap = {
        primary: styles.glassPrimary,
        secondary: styles.glassSecondary,
        subtle: styles.glassSubtle
    }

    return {
        ...variantMap[variant],
        transition: styles.transition
    }
}

/**
 * Get hover styles for glass elements
 */
export const getGlassHover = (mode: 'light' | 'dark') => {
    return glassmorphismTokens[mode].glassHover
}
