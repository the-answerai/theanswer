import { useEffect, useState } from 'react'
import { CircularProgress, Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Callback = () => {
    const [isProcessing, setIsProcessing] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Wait a moment for the server to process the authentication
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Check if we're authenticated now
                const response = await axios.get('/api/me')

                if (response.data.isAuthenticated) {
                    // Set cookie that expires in 30 days
                    document.cookie = `authenticated=true;max-age=${60 * 60 * 24 * 30}`
                    // Redirect to analyzer page
                    navigate('/analyzer')
                } else {
                    // If not authenticated after callback, something went wrong
                    console.error('Authentication failed')
                    setIsProcessing(false)
                }
            } catch (error) {
                console.error('Error in callback:', error)
                setIsProcessing(false)
            }
        }

        checkAuth()
    }, [navigate])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh'
            }}
        >
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant='h5'>
                {isProcessing ? 'Processing your authentication...' : 'Authentication error. Please try again.'}
            </Typography>
            {!isProcessing && (
                <Typography
                    variant='body1'
                    color='primary'
                    sx={{
                        mt: 2,
                        cursor: 'pointer'
                    }}
                    onClick={() => navigate('/')}
                >
                    Return to login
                </Typography>
            )}
        </Box>
    )
}

export default Callback
