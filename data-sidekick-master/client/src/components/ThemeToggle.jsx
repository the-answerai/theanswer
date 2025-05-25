import { IconButton, Tooltip, useTheme as useMuiTheme } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useTheme } from '../context/ThemeContext'

const ThemeToggle = () => {
    const { mode, toggleColorMode } = useTheme()
    const theme = useMuiTheme()

    return (
        <Tooltip title={`${mode === 'dark' ? 'Light' : 'Dark'} mode`}>
            <IconButton
                onClick={toggleColorMode}
                color='inherit'
                aria-label='toggle theme'
                sx={{
                    ml: 1,
                    ...(mode === 'dark' && {
                        border: '1px solid #24C3A1',
                        '&:hover': {
                            boxShadow: '0 0 5px #24C3A1'
                        }
                    })
                }}
            >
                {mode === 'dark' ? <Brightness7Icon sx={{ color: theme.palette.primary.main }} /> : <Brightness4Icon />}
            </IconButton>
        </Tooltip>
    )
}

export default ThemeToggle
