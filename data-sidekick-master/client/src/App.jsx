import { useState, memo, useMemo, useCallback, useEffect } from 'react'
import {
    Box,
    Typography,
    AppBar,
    Toolbar,
    Grid,
    IconButton,
    CircularProgress,
    Button,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
    ListItemText,
    Link as MuiLink,
    Tooltip
} from '@mui/material'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import ChatIcon from '@mui/icons-material/Chat'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import CodeIcon from '@mui/icons-material/Code'
import DescriptionIcon from '@mui/icons-material/Description'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import SupportIcon from '@mui/icons-material/Support'
import CallIcon from '@mui/icons-material/Call'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import HelpIcon from '@mui/icons-material/Help'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AssessmentIcon from '@mui/icons-material/Assessment'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import PropTypes from 'prop-types'
import axios from 'axios'
import Tagging from './components/Tagging/Tagging'

// Import pages
import CallListPage from './pages/CallListPage'
import DashboardPage from './pages/DashboardPage'
import FAQPage from './pages/FAQPage'
import ReportsPage from './pages/ReportsPage'
import ReportDetail from './pages/ReportDetail'
import ChatFullPage from './components/ChatFullPage'
import ChatListPage from './pages/ChatListPage'
import TicketListPage from './pages/TicketListPage'
import AnalyzerHomePage from './pages/AnalyzerHomePage'
import ResearchViewPage from './pages/ResearchViewPage'
import Login from './components/Login'
import Callback from './components/Callback'

// Import configuration
import { getStudioUrl, getDocsUrl } from './config/externalUrls'
import { useTheme } from './context/ThemeContext'
import { ResearchViewProvider } from './context/ResearchViewContext.jsx'

const Navigation = memo(function Navigation({ user, onLogout }) {
    const location = useLocation()
    const [anchorEl, setAnchorEl] = useState(null)
    const [supportAnchorEl, setSupportAnchorEl] = useState(null)
    const [adminAnchorEl, setAdminAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const supportOpen = Boolean(supportAnchorEl)
    const adminOpen = Boolean(adminAnchorEl)
    const { mode, toggleColorMode } = useTheme()

    const handleProfileMouseEnter = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleProfileMouseLeave = () => {
        setAnchorEl(null)
    }

    const handleSupportMouseEnter = (event) => {
        setSupportAnchorEl(event.currentTarget)
    }

    const handleSupportMouseLeave = () => {
        setSupportAnchorEl(null)
    }

    const handleAdminMouseEnter = (event) => {
        setAdminAnchorEl(event.currentTarget)
    }

    const handleAdminMouseLeave = () => {
        setAdminAnchorEl(null)
    }

    const handleMenuMouseEnter = (event) => {
        // Keep menu open when hovering over menu items
        const menuType = event.currentTarget.dataset.menuType
        if (menuType === 'support') setSupportAnchorEl(supportAnchorEl || event.currentTarget)
        if (menuType === 'admin') setAdminAnchorEl(adminAnchorEl || event.currentTarget)
        if (menuType === 'profile') setAnchorEl(anchorEl || event.currentTarget)
    }

    const handleMenuMouseLeave = (menuType) => {
        if (menuType === 'support') setSupportAnchorEl(null)
        if (menuType === 'admin') setAdminAnchorEl(null)
        if (menuType === 'profile') setAnchorEl(null)
    }

    const handleLogout = () => {
        handleMenuMouseLeave('profile')
        onLogout()
    }

    // Get Studio and Docs URLs from environment variables
    const studioUrl = getStudioUrl()
    const docsUrl = getDocsUrl()

    const menuButtonStyle = {
        color: 'inherit',
        textTransform: 'none',
        borderRadius: 1,
        px: 2,
        '&:hover': {
            backgroundColor: 'rgba(36, 195, 161, 0.1)'
        },
        ...(mode === 'dark' && {
            '&:hover': {
                backgroundColor: 'rgba(36, 195, 161, 0.2)'
            }
        }),
        display: 'flex',
        alignItems: 'center',
        gap: 1
    }

    const menuStyle = {
        '& .MuiPaper-root': {
            backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
            border: mode === 'dark' ? '1px solid #24C3A1' : '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: mode === 'dark' ? '0 0 10px rgba(36, 195, 161, 0.2)' : 'none'
        }
    }

    const menuItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(36, 195, 161, 0.1)' : 'rgba(0, 0, 0, 0.04)'
        },
        '& .MuiListItemIcon-root': {
            minWidth: 'auto',
            color: mode === 'dark' ? '#24C3A1' : 'inherit'
        }
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
                <Box onMouseEnter={handleSupportMouseEnter} onMouseLeave={handleSupportMouseLeave}>
                    <Tooltip title='Access support-related features'>
                        <Button sx={menuButtonStyle} startIcon={<SupportIcon sx={{ color: mode === 'dark' ? '#24C3A1' : 'inherit' }} />}>
                            Support
                        </Button>
                    </Tooltip>
                    <Menu
                        anchorEl={supportAnchorEl}
                        open={supportOpen}
                        sx={menuStyle}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left'
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left'
                        }}
                        MenuListProps={{
                            'data-menu-type': 'support',
                            onMouseEnter: handleMenuMouseEnter,
                            onMouseLeave: () => handleMenuMouseLeave('support')
                        }}
                    >
                        <MenuItem component={Link} to='/calls' sx={menuItemStyle}>
                            <ListItemIcon>
                                <CallIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText primary='Calls' secondary='Manage and review call recordings' />
                        </MenuItem>
                        <MenuItem component={Link} to='/chats' sx={menuItemStyle}>
                            <ListItemIcon>
                                <QuestionAnswerIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText primary='Chat Conversations' secondary='View and manage chat interactions' />
                        </MenuItem>
                        <MenuItem component={Link} to='/tickets' sx={menuItemStyle}>
                            <ListItemIcon>
                                <ConfirmationNumberIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText primary='Support Tickets' secondary='Handle customer support tickets' />
                        </MenuItem>
                    </Menu>
                </Box>

                <Tooltip title='Access FAQ and help resources'>
                    <Button
                        component={Link}
                        to='/faq'
                        sx={menuButtonStyle}
                        startIcon={<HelpIcon sx={{ color: mode === 'dark' ? '#24C3A1' : 'inherit' }} />}
                    >
                        FAQ
                    </Button>
                </Tooltip>

                <Box onMouseEnter={handleAdminMouseEnter} onMouseLeave={handleAdminMouseLeave}>
                    <Tooltip title='Access administrative features'>
                        <Button
                            sx={menuButtonStyle}
                            startIcon={<AdminPanelSettingsIcon sx={{ color: mode === 'dark' ? '#24C3A1' : 'inherit' }} />}
                        >
                            Admin
                        </Button>
                    </Tooltip>
                    <Menu
                        anchorEl={adminAnchorEl}
                        open={adminOpen}
                        sx={menuStyle}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left'
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left'
                        }}
                        MenuListProps={{
                            'data-menu-type': 'admin',
                            onMouseEnter: handleMenuMouseEnter,
                            onMouseLeave: () => handleMenuMouseLeave('admin')
                        }}
                    >
                        <MenuItem component={Link} to='/dashboard' sx={menuItemStyle}>
                            <ListItemIcon>
                                <DashboardIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText primary='Dashboard' secondary='View system analytics and metrics' />
                        </MenuItem>
                        <MenuItem component={Link} to='/reports' sx={menuItemStyle}>
                            <ListItemIcon>
                                <AssessmentIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText primary='Reports' secondary='Generate and view detailed reports' />
                        </MenuItem>
                        <MenuItem component={Link} to='/tagging' sx={menuItemStyle}>
                            <ListItemIcon>
                                <LocalOfferIcon fontSize='small' />
                            </ListItemIcon>
                            <ListItemText primary='Tags' secondary='Manage content categorization' />
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            <Box
                sx={{ display: 'flex', alignItems: 'center' }}
                onMouseEnter={handleProfileMouseEnter}
                onMouseLeave={handleProfileMouseLeave}
            >
                <Button
                    sx={menuButtonStyle}
                    startIcon={
                        user?.picture ? (
                            <Avatar src={user.picture} alt={user.name || 'User'} sx={{ width: 24, height: 24 }} />
                        ) : (
                            <AccountCircleIcon sx={{ color: mode === 'dark' ? '#24C3A1' : 'inherit' }} />
                        )
                    }
                >
                    {user?.name || 'User'}
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    sx={menuStyle}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}
                    MenuListProps={{
                        'data-menu-type': 'profile',
                        onMouseEnter: handleMenuMouseEnter,
                        onMouseLeave: () => handleMenuMouseLeave('profile')
                    }}
                >
                    <MenuItem disabled sx={menuItemStyle}>
                        <Typography variant='body2' color='textSecondary'>
                            {user?.email || ''}
                        </Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={toggleColorMode} sx={menuItemStyle}>
                        <ListItemIcon>{mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}</ListItemIcon>
                        {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </MenuItem>
                    <MenuItem component='a' href={studioUrl} target='_self' sx={menuItemStyle}>
                        <ListItemIcon>
                            <CodeIcon fontSize='small' />
                        </ListItemIcon>
                        Studio
                    </MenuItem>
                    <MenuItem component='a' href={docsUrl} target='_self' sx={menuItemStyle}>
                        <ListItemIcon>
                            <DescriptionIcon fontSize='small' />
                        </ListItemIcon>
                        Documentation
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={menuItemStyle}>
                        <ListItemIcon>
                            <LogoutIcon fontSize='small' />
                        </ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    )
})

Navigation.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        picture: PropTypes.string
    }),
    onLogout: PropTypes.func.isRequired
}

const App = memo(function App() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState(null)
    const location = useLocation()

    // Only show chat drawer on FAQ page
    const shouldShowChatDrawer = location.pathname === '/faq'

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check for cookie-based authentication (legacy)
                const cookie = document.cookie.split('; ').find((row) => row.startsWith('authenticated='))

                if (cookie) {
                    // Get user info if we have a cookie
                    try {
                        const userResponse = await axios.get('/api/me')
                        if (userResponse.data.user) {
                            setUser(userResponse.data.user)
                        }
                    } catch (userErr) {
                        console.error('Error fetching user data:', userErr)
                    }

                    setIsAuthenticated(true)
                    setIsLoading(false)
                    return
                }

                // Check Auth0 authentication
                const response = await axios.get('/api/me')
                if (response.data.isAuthenticated) {
                    setUser(response.data.user)
                    setIsAuthenticated(true)
                }
            } catch (err) {
                console.error('Error checking authentication:', err)
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [])

    const handleLogout = async () => {
        try {
            // Clear the authentication cookie
            document.cookie = 'authenticated=; max-age=0; path=/;'

            // Redirect to Auth0 logout
            window.location.href = '/api/auth/logout'
        } catch (error) {
            console.error('Error during logout:', error)
        }
    }

    const toggleDrawer = useCallback(
        (open) => (event) => {
            if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
                return
            }
            setDrawerOpen(open)
        },
        []
    )

    const gridSizes = useMemo(
        () => ({
            main: {
                xs: 11,
                md: drawerOpen ? 9 : 11,
                lg: drawerOpen ? 8 : 11
            },
            drawer: {
                xs: 11,
                md: drawerOpen ? 3 : 1,
                lg: drawerOpen ? 4 : 1
            }
        }),
        [drawerOpen]
    )

    // Show loading state while checking authentication
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

    // Show login if not authenticated
    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />
    }

    return (
        <>
            <AppBar position='static' sx={{ mb: 3 }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <img src='/answerai-logo-600-wide-white.png' alt='Company Logo' style={{ height: 40 }} />
                    <Navigation user={user} onLogout={handleLogout} />
                    <IconButton color='inherit' edge='end' onClick={toggleDrawer(true)} sx={{ display: { md: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <ResearchViewProvider>
                <Grid container spacing={2}>
                    <Grid item {...gridSizes.main}>
                        <Routes>
                            <Route path='/' element={<Navigate to='/calls' replace />} />
                            <Route path='/calls' element={<CallListPage />} />
                            <Route path='/chats' element={<ChatListPage />} />
                            <Route path='/tickets' element={<TicketListPage />} />
                            <Route path='/dashboard' element={<DashboardPage />} />
                            <Route path='/reports' element={<ReportsPage />} />
                            <Route path='/reports/:id' element={<ReportDetail />} />
                            <Route path='/tagging' element={<Tagging />} />
                            <Route path='/faq' element={<FAQPage />} />
                            <Route path='/callback' element={<Callback />} />
                        </Routes>
                    </Grid>

                    {shouldShowChatDrawer && (
                        <Grid item {...gridSizes.drawer}>
                            <Box
                                sx={{
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <IconButton
                                    disableRipple
                                    onClick={() => setDrawerOpen(!drawerOpen)}
                                    sx={{
                                        margin: '0 0 0 auto',
                                        display: 'block'
                                    }}
                                >
                                    {drawerOpen ? <CloseIcon /> : <ChatIcon />}
                                </IconButton>
                                <Box sx={{ display: drawerOpen ? 'block' : 'none' }}>
                                    <ChatFullPage />
                                </Box>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </ResearchViewProvider>
        </>
    )
})

export default App
