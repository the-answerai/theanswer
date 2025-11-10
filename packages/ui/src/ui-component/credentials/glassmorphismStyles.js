/**
 * Shared glassmorphism styles for credentials UI
 * Now unified with the global theme system
 * @deprecated - Consider using theme.palette.glass directly from the unified theme
 */

// Legacy export for backward compatibility
// Values are kept in sync with the unified theme system tokens
export const glassmorphismStyles = {
    // Base glass container (light mode)
    glassContainer: {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(15, 23, 42, 0.1)',
        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    // Glass container for dark mode
    glassContainerDark: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    // Circular logo container (for tool icons) - light mode
    circularGlass: {
        background: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(15, 23, 42, 0.15)',
        boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    // Circular glass for dark mode
    circularGlassDark: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.2)',
        borderRadius: '50%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },

    // Hover state for glass containers - light mode
    glassHover: {
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(15, 23, 42, 0.2)',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.12)',
        transform: 'translateY(-2px)'
    },

    // Hover state for dark mode
    glassHoverDark: {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
        transform: 'translateY(-2px)'
    },

    // Compact credential card (for 4-column grid) - light mode
    credentialCard: {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(15, 23, 42, 0.1)',
        borderRadius: '12px',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(15, 23, 42, 0.2)',
            boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)'
        }
    },

    // Compact credential card for dark mode
    credentialCardDark: {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-2px)'
        }
    },

    // Status badge glass
    statusBadge: {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        padding: '2px'
    }
}

/**
 * Get appropriate glass style based on theme
 * @param {string} styleKey - The style key to retrieve
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Style object
 */
export const getGlassStyle = (styleKey, isDarkMode = false) => {
    if (isDarkMode && glassmorphismStyles[`${styleKey}Dark`]) {
        return glassmorphismStyles[`${styleKey}Dark`]
    }
    return glassmorphismStyles[styleKey] || {}
}

/**
 * Status colors for credential states
 */
export const statusColors = {
    connected: {
        bg: '#4caf50', // Solid green background
        border: '#ffffff', // White border for contrast
        text: '#4caf50',
        icon: '#ffffff' // White checkmark icon
    },
    required: {
        bg: 'rgba(244, 67, 54, 0.2)',
        border: '#f44336',
        text: '#f44336',
        icon: '#f44336'
    },
    optional: {
        bg: 'rgba(158, 158, 158, 0.2)',
        border: '#9e9e9e',
        text: '#9e9e9e',
        icon: '#9e9e9e'
    }
}
