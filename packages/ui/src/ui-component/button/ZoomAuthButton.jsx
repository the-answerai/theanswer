import { Box } from '@mui/material'
import { StyledButton } from './StyledButton'
import PropTypes from 'prop-types'

export const ZoomAuthButton = ({ componentCredential, handleZoomOAuth, baseURL }) => {
    if (!componentCredential || componentCredential.name !== 'zoomOAuth') return null

    return (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <StyledButton
                variant='contained'
                onClick={handleZoomOAuth}
                startIcon={
                    <img
                        alt={componentCredential.name}
                        src={`${baseURL}/api/v1/components-credentials-icon/${componentCredential.name}`}
                        style={{ width: 20, height: 20 }}
                    />
                }
                sx={{
                    backgroundColor: '#2D8CFF',
                    color: 'white',
                    '&:hover': {
                        backgroundColor: '#1E5FB8'
                    },
                    '&:disabled': {
                        backgroundColor: 'lightgray',
                        color: 'gray'
                    }
                }}
            >
                Authorize with Zoom
            </StyledButton>
        </Box>
    )
}

ZoomAuthButton.propTypes = {
    componentCredential: PropTypes.object,
    handleZoomOAuth: PropTypes.func,
    baseURL: PropTypes.string
}
