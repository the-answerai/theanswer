import tinycolor from 'tinycolor2'

function generateThemeColors(baseColor: string, isDarkMode = false) {
    const base = tinycolor(baseColor)
    const accentColor = '#24C3A1' // Green futuristic color for dark mode

    const getContrastingColor = (color: tinycolor.Instance) => {
        return color.isLight() ? tinycolor('black').toHexString() : tinycolor('white').toHexString()
    }

    if (isDarkMode) {
        // Dark mode theme with green futuristic accent
        return {
            buttonBackgroundColor: accentColor,
            buttonIconColor: '#000000',
            chatWindowBackgroundColor: '#121212',
            chatWindowPoweredByTextColor: '#ffffff',
            botMessageBackgroundColor: '#1e1e1e',
            botMessageTextColor: '#ffffff',
            userMessageBackgroundColor: accentColor,
            userMessageTextColor: '#000000',
            textInputSendButtonColor: accentColor,
            feedbackColor: accentColor,
            textInputBackgroundColor: '#1e1e1e',
            textInputTextColor: '#ffffff',
            footerTextColor: '#ffffff'
        }
    }

    // Light mode (original implementation)
    return {
        buttonBackgroundColor: base.setAlpha(1).toRgbString(),
        buttonIconColor: getContrastingColor(base),
        chatWindowBackgroundColor: base.lighten(20).toHexString(),
        chatWindowPoweredByTextColor: getContrastingColor(base.lighten(20)),
        botMessageBackgroundColor: base.lighten(10).toHexString(),
        botMessageTextColor: getContrastingColor(base.lighten(10)),
        userMessageBackgroundColor: base.toHexString(),
        userMessageTextColor: getContrastingColor(base),
        textInputSendButtonColor: base.toHexString(),
        feedbackColor: base.toHexString(),
        textInputBackgroundColor: '#ffffff',
        textInputTextColor: getContrastingColor(tinycolor('#ffffff')),
        footerTextColor: getContrastingColor(base)
    }
}

export default generateThemeColors
