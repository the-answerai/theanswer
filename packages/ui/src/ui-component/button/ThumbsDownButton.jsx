import PropTypes from 'prop-types'
import { IconButton } from '@mui/material'
import { IconThumbDown } from '@tabler/icons-react'
import { useThemeMode } from '@ui/theme'

const ThumbsDownButton = (props) => {
    const { mode } = useThemeMode()
    return (
        <IconButton
            disabled={props.isDisabled || props.isLoading}
            onClick={props.onClick}
            size='small'
            sx={{ background: 'transparent', border: 'none' }}
            title='Thumbs Down'
        >
            <IconThumbDown
                style={{ width: '20px', height: '20px' }}
                color={
                    props.rating === 'THUMBS_DOWN'
                        ? '#9e9e9e' // Intentionally hardcoded: disabled state (matches monochrome.disabled)
                        : mode === 'dark'
                        ? 'white' // Intentionally hardcoded: white in dark mode for contrast
                        : '#1e88e5' // Intentionally hardcoded: blue matches MUI info.main
                }
            />
        </IconButton>
    )
}

ThumbsDownButton.propTypes = {
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
    rating: PropTypes.string
}

export default ThumbsDownButton
