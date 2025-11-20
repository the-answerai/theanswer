import InitColorSchemeScript from '@mui/system/InitColorSchemeScript'

const migrateLegacyThemeScript = `
(function() {
  try {
    const OLD_KEY = 'isDarkMode'
    const NEW_MODE_KEY = 'mui-mode'
    const NEW_SCHEME_KEY = 'mui-color-scheme'

    const legacyMode = localStorage.getItem(OLD_KEY)
    if (legacyMode !== null) {
      const newModeExists = localStorage.getItem(NEW_MODE_KEY)
      const newSchemeExists = localStorage.getItem(NEW_SCHEME_KEY)

      if (!newModeExists || !newSchemeExists) {
        const newMode = legacyMode === 'true' ? 'dark' : 'light'
        localStorage.setItem(NEW_MODE_KEY, newMode)
        localStorage.setItem(NEW_SCHEME_KEY, newMode)
      }

      localStorage.removeItem(OLD_KEY)
    }
  } catch (error) {
    console.error('[Theme Migration] Failed to migrate legacy theme preference', error)
  }
})();
`

export function ThemeScript() {
    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: migrateLegacyThemeScript }} />
            <InitColorSchemeScript
                defaultMode='dark'
                defaultLightColorScheme='light'
                defaultDarkColorScheme='dark'
                modeStorageKey='mui-mode'
                colorSchemeStorageKey='mui-color-scheme'
            />
        </>
    )
}
