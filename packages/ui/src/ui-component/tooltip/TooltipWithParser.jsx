import { Info } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'
import parser from 'html-react-parser'
import PropTypes from 'prop-types'
import { useThemeMode } from '@ui/theme'

export const TooltipWithParser = ({ title, sx }) => {
    const { mode } = useThemeMode()

    return (
        <Tooltip title={parser(title)} placement='right'>
            <IconButton sx={{ height: 15, width: 15, ml: 2, mt: -0.5 }}>
                <Info
                    sx={{
                        ...sx,
                        background: 'transparent',
                        color: mode === 'dark' ? 'white' : 'inherit',
                        height: 15,
                        width: 15
                    }}
                />
            </IconButton>
        </Tooltip>
    )
}

TooltipWithParser.propTypes = {
    title: PropTypes.node,
    sx: PropTypes.any
}
