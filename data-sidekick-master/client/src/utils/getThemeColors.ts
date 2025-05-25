import generateThemeColors from './generateThemeColors'

const getThemeColors = (baseColor = 'rgb(107, 114, 128)', isDarkMode = false) => {
    return generateThemeColors(baseColor, isDarkMode)
}

export default getThemeColors
