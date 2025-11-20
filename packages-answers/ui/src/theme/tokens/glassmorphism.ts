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
    glassSuccess: GlassStyle
    glassWarning: GlassStyle
    glassError: GlassStyle
    transition: string
}

export const glassmorphismTokens: Record<'light' | 'dark', GlassTokens> = {
    light: {
        // Primary glass for headers, navigation (blue gradient with glossy shine)
        // REFINED: Custom sidebar gradient from #213773 (top) to #4072CC (bottom)
        glassPrimary: {
            background: 'linear-gradient(180deg, #213773 0%, #4072CC 100%)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            border: '1px solid rgba(147, 197, 253, 0.35)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(59, 130, 246, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
            color: '#ffffff'
        },

        // Secondary glass for cards, panels
        // REFINED: Increased opacity for WCAG readability (85% → 92%), stronger border (10% → 18%), deeper shadow (8% → 12%)
        glassSecondary: {
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(15, 23, 42, 0.18)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.12)'
        },

        // Subtle glass for buttons, inputs
        // REFINED: Increased opacity for consistency (70% → 75%), stronger border (15% → 20%), enhanced shadow (5% → 8%)
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(15, 23, 42, 0.2)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)'
        },

        // Hover states - Increased opacity for better visibility
        glassHover: {
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)'
        },

        // Status glass variants for alerts and notifications
        glassSuccess: {
            background: 'rgba(76, 175, 80, 0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            boxShadow: '0 4px 16px 0 rgba(76, 175, 80, 0.2)'
        },

        glassWarning: {
            background: 'rgba(255, 152, 0, 0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            boxShadow: '0 4px 16px 0 rgba(255, 152, 0, 0.2)'
        },

        glassError: {
            background: 'rgba(244, 67, 54, 0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            boxShadow: '0 4px 16px 0 rgba(244, 67, 54, 0.2)'
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
        // ACCESSIBILITY: 10% white on #0b0b0b → ~#1a1a1a effective color
        // White text (#ffffff) contrast ratio: 11.8:1 (WCAG AAA compliant)
        glassSecondary: {
            background: 'rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)'
        },

        // Subtle glass for buttons, inputs
        // ACCESSIBILITY: 12% white on #0b0b0b → ~#1f1f1f effective color
        // White text (#ffffff) contrast ratio: 10.8:1 (WCAG AAA compliant)
        glassSubtle: {
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.2)'
        },

        // Hover states
        glassHover: {
            background: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-2px)'
        },

        // Status glass variants for alerts and notifications (dark mode optimized)
        glassSuccess: {
            background: 'rgba(76, 175, 80, 0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(76, 175, 80, 0.4)',
            boxShadow: '0 4px 16px 0 rgba(76, 175, 80, 0.3)'
        },

        glassWarning: {
            background: 'rgba(255, 152, 0, 0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 152, 0, 0.4)',
            boxShadow: '0 4px 16px 0 rgba(255, 152, 0, 0.3)'
        },

        glassError: {
            background: 'rgba(244, 67, 54, 0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(244, 67, 54, 0.4)',
            boxShadow: '0 4px 16px 0 rgba(244, 67, 54, 0.3)'
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
