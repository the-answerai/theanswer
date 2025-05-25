import { useEffect, useState } from 'react'
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material'
import LogoIcon from '@mui/icons-material/DataObject'
import axios from 'axios'
import PropTypes from 'prop-types'

function Login({ onLogin }) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('/api/me')
                if (response.data.isAuthenticated) {
                    // Set cookie that expires in 30 days
                    document.cookie = `authenticated=true;max-age=${60 * 60 * 24 * 30}`
                    onLogin()
                }
            } catch (err) {
                console.error('Error checking auth status:', err)
                setError('Failed to connect to authentication service')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [onLogin])

    const handleLogin = () => {
        window.location.href = '/api/auth/login'
    }

    if (isLoading) {
        return (
            <Box
                sx={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <CircularProgress size={40} />
                <Typography variant='h5' sx={{ ml: 2 }}>
                    Loading...
                </Typography>
            </Box>
        )
    }

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <LogoIcon color='primary' sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant='h5' component='h1' gutterBottom textAlign='center'>
                    Data Sidekick
                </Typography>
                <Typography variant='body1' textAlign='center' sx={{ mb: 4 }}>
                    Sign in to access your data insights
                </Typography>
                {error && (
                    <Typography color='error' textAlign='center' sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleLogin}>
                    Login with Auth0
                </Button>
            </Paper>
        </Box>
    )
}

Login.propTypes = {
    onLogin: PropTypes.func.isRequired
}

export default Login
