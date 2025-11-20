import '@mui/material/styles'

declare module '@mui/material/styles' {
    // Extend PaletteColor interface for runtime
    interface PaletteColor {
        alpha10?: string
        alpha20?: string
        alpha30?: string
        alpha40?: string
        alpha50?: string
    }

    // Extend SimplePaletteColorOptions for theme creation
    interface SimplePaletteColorOptions {
        alpha10?: string
        alpha20?: string
        alpha30?: string
        alpha40?: string
        alpha50?: string
    }
}

export {}
