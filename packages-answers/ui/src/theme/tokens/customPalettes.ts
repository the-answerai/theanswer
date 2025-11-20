/**
 * Custom Palette Tokens
 * Legacy palettes required for backward compatibility
 * TODO: Gradually migrate components to use standard MUI palettes
 */

export const customPalettes = {
    light: {
        // Canvas header action buttons
        canvasHeader: {
            deployLight: '#bfdbfe', // blue-200
            deployDark: '#1e3a8a', // blue-900
            saveLight: '#ff9e80', // orange-200
            saveDark: '#dd2c00', // orange-900
            settingsLight: '#d5d5d5', // grey-300
            settingsDark: '#424242' // grey-700
        },

        // Card backgrounds for nodes and flow components
        card: {
            main: '#ffffff',
            light: '#ffffff',
            hover: '#f8fafc' // subtle grey on hover
        },

        // Async select dropdown backgrounds
        asyncSelect: {
            main: '#f8fafc' // grey-50
        },

        // Rich text editor backgrounds
        textBackground: {
            main: '#f8fafc', // grey-50
            border: '#cbd5e1' // grey-400
        },

        // Node tooltip styling
        nodeToolTip: {
            background: '#ffffff',
            color: 'rgba(0, 0, 0, 0.87)'
        },

        // Legacy (not actively used - kept for safety)
        timeMessage: {
            main: '#e2e8f0' // grey-200
        },
        codeEditor: {
            main: '#eff6ff' // blue-50
        }
    },

    dark: {
        canvasHeader: {
            deployLight: '#93c5fd', // blue-300
            deployDark: '#1e3a8a', // blue-900
            saveLight: '#ff9e80', // orange-300
            saveDark: '#dd2c00', // orange-900
            settingsLight: '#d5d5d5', // grey-300
            settingsDark: '#424242' // grey-700
        },

        card: {
            main: 'rgba(255, 255, 255, 0.05)',
            light: 'rgba(255, 255, 255, 0.08)',
            hover: 'rgba(255, 255, 255, 0.12)'
        },

        asyncSelect: {
            main: 'rgba(255, 255, 255, 0.05)'
        },

        textBackground: {
            main: 'rgba(255, 255, 255, 0.05)',
            border: 'transparent'
        },

        nodeToolTip: {
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff'
        },

        timeMessage: {
            main: 'rgba(255, 255, 255, 0.08)'
        },
        codeEditor: {
            main: 'rgba(255, 255, 255, 0.05)'
        }
    }
}
