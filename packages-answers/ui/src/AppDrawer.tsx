'use client'
import type React from 'react'
import { useState } from 'react'
import NextLink from 'next/link'
import Image from 'next/image'
import { styled } from '@mui/material/styles'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import MuiDrawer from '@mui/material/Drawer'
import ListItemIcon from '@mui/material/ListItemIcon'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { usePathname } from 'next/navigation'
import { Menu, MenuItem, Tooltip } from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import PasswordIcon from '@mui/icons-material/Password'
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ImageIcon from '@mui/icons-material/Image'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ArticleIcon from '@mui/icons-material/Article'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AssessmentIcon from '@mui/icons-material/Assessment'
import PhoneIcon from '@mui/icons-material/Phone'
import DatasetIcon from '@mui/icons-material/DataUsage'
import RuleIcon from '@mui/icons-material/Rule'
import PeopleIcon from '@mui/icons-material/People'
import BadgeIcon from '@mui/icons-material/Badge'
import WorkspacesIcon from '@mui/icons-material/Workspaces'
import LockIcon from '@mui/icons-material/Lock'
import HistoryIcon from '@mui/icons-material/History'
import Business from '@mui/icons-material/Business'
import AddIcon from '@mui/icons-material/Add'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import SettingsIcon from '@mui/icons-material/Settings'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import TuneIcon from '@mui/icons-material/Tune'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useSubscriptionDialog } from './SubscriptionDialogContext'
import { useThemeMode } from './theme'

import ChatDrawer from './ChatDrawer'
import StarIcon from '@mui/icons-material/Star'
import CheckIcon from '@mui/icons-material/Check'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import { usePermissions } from './PermissionProvider'

// Note: SwapHorizIcon removed - no longer used in new menu design

interface AssignedWorkspace {
    id: string
    name: string
    role: string
    organizationId: string
}

const drawerWidth = 240
const collapsedWidth = 56

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    width: open ? drawerWidth : collapsedWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
    }),
    '& .MuiDrawer-paper': {
        width: open ? drawerWidth : collapsedWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        }),
        overflowX: 'hidden',
        overflowY: open ? 'auto' : 'hidden',
        boxSizing: 'border-box'
    }
}))

interface MenuConfig {
    id?: string
    text?: string
    link?: string
    icon?: React.ReactNode
    subMenu?: MenuConfig[]
    external?: boolean // Mark if link is external (opens in new tab)
}

interface AppDrawerProps {
    session: {
        user: {
            name?: string
            picture?: string
            email?: string
            org_name?: string
            org_id?: string
            roles?: string[]
            subscription?: unknown
            defaultChatflowId?: string
            // Workspace fields
            activeWorkspaceId?: string
            activeWorkspace?: string
            assignedWorkspaces?: AssignedWorkspace[]
        }
    }
}

export const AppDrawer = ({ session }: AppDrawerProps) => {
    const user = session?.user
    const [drawerOpen, setDrawerOpen] = useState(true) // Changed to true for open by default
    const [submenuOpen, setSubmenuOpen] = useState('')
    const { openDialog: openSubscriptionDialog, closeDialog: closeSubscriptionDialog } = useSubscriptionDialog()
    const { mode, toggleMode } = useThemeMode()
    const pathname = usePathname()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [switchingWorkspace, setSwitchingWorkspace] = useState(false)
    const { hasFeature, hasRole } = usePermissions()
    const canUseChatflows = hasFeature('chatflow:use')
    const canManageChatflows = hasFeature('chatflow:manage')
    const canManageOrg = hasFeature('org:manage')
    const isEnterpriseAdminEnabled = hasFeature('enterprise_admin')

    // Helper function to determine if this is a public organization
    // TODO: This should be refined to compare against actual PUBLIC_ORG_ID from backend
    const isPublicOrg = () => {
        // For now, we'll implement the new logic for all orgs and refine this later
        // You can add specific org_id checks here once PUBLIC_ORG_ID is accessible
        return false // Assume all orgs are private for now to implement the new logic
    }

    // Helper function to determine user role in private organizations
    const getUserRole = () => {
        if (isPublicOrg()) {
            return 'public' // Public org users - different logic would apply
        }

        const userRoles = user?.roles || []

        // Check if user is admin (has org:manage permission or Admin role)
        if (canManageOrg || userRoles.includes('Admin') || hasRole('Admin')) {
            return 'admin'
        }

        // Check if user is builder (has chatflow:manage permission)
        if (canManageChatflows) {
            return 'builder'
        }

        // Default to member (has chatflow:use permission)
        return 'member'
    }

    const userRole = getUserRole()
    const isPrivateOrg = !isPublicOrg()

    // Get Answer Engine domain from environment
    const answerEngineDomain = process.env.NEXT_PUBLIC_ANSWER_ENGINE_DOMAIN || ''

    // Menu configuration
    let menuConfig: MenuConfig[] = []

    // Answer Apps - expandable menu with chat, image, video, bulk analysis
    menuConfig.push(
        {
            id: 'chat',
            text: 'Chat',
            link: '/chat',
            icon: <ChatBubbleOutlineIcon />
        },
        {
            id: 'image-generation',
            text: 'Image Generation',
            link: '/sidekick-studio/media-creator',
            icon: <ImageIcon />
        },
        {
            id: 'video-generation',
            text: 'Video Generation',
            link: '/sidekick-studio/video-creator',
            icon: <VideoLibraryIcon />
        }
    )

    // Answer Engine section - shown if domain is configured
    if (answerEngineDomain) {
        menuConfig.push({
            id: 'answer-engine',
            text: 'Data Engine',
            icon: <AssessmentIcon />,
            subMenu: [
                {
                    id: 'content',
                    text: 'Content',
                    link: `${answerEngineDomain}/calls`,
                    icon: <ArticleIcon />,
                    external: true
                },
                {
                    id: 'dashboards',
                    text: 'Dashboards',
                    link: `${answerEngineDomain}/dashboard`,
                    icon: <DashboardIcon />,
                    external: true
                },
                {
                    id: 'reports',
                    text: 'Reports',
                    link: `${answerEngineDomain}/reports`,
                    icon: <AssessmentOutlinedIcon />,
                    external: true
                },
                {
                    id: 'calls',
                    text: 'Calls',
                    link: `${answerEngineDomain}/calls`,
                    icon: <PhoneIcon />,
                    external: true
                },
                {
                    id: 'bulk-analysis',
                    text: 'Bulk Analysis',
                    link: '/sidekick-studio/csv-transformer',
                    icon: <AnalyticsIcon />
                }
            ]
        })
    }

    if (isPrivateOrg) {
        // New logic for private organizations

        // Builders and Admins see Answer Studio
        if (userRole === 'builder' || userRole === 'admin') {
            menuConfig.push({
                id: 'studio',
                text: 'Agent Studio',
                icon: <BuildOutlinedIcon color='primary' />,
                subMenu: [
                    {
                        id: 'chatflows',
                        text: 'Chatflows',
                        link: '/sidekick-studio/chatflows',
                        icon: <AccountTreeIcon color='primary' />
                    },
                    {
                        id: 'agentflows',
                        text: 'Agentflows',
                        link: '/sidekick-studio/agentflows',
                        icon: <GroupsOutlinedIcon color='primary' />
                    },
                    {
                        id: 'marketplaces',
                        text: 'Agent Templates',
                        link: '/sidekick-studio/marketplaces',
                        icon: <SmartToyIcon />
                    },
                    {
                        id: 'assistants',
                        text: 'Assistants',
                        link: '/sidekick-studio/assistants',
                        icon: <GroupsOutlinedIcon color='primary' />
                    },
                    {
                        id: 'documentstores',
                        text: 'Document Stores',
                        link: '/sidekick-studio/document-stores',
                        icon: <MenuBookOutlinedIcon color='primary' />
                    },
                    {
                        id: 'executions',
                        text: 'Executions',
                        link: '/sidekick-studio/executions',
                        icon: <PlayCircleOutlineIcon color='primary' />
                    },
                    {
                        id: 'tools',
                        text: 'Tools',
                        link: '/sidekick-studio/tools',
                        icon: <BuildOutlinedIcon color='primary' />
                    },
                    {
                        id: 'variables',
                        text: 'Global Variables',
                        link: '/sidekick-studio/variables',
                        icon: <IntegrationInstructionsOutlinedIcon color='primary' />
                    },
                    {
                        id: 'apikey',
                        text: 'API Keys',
                        link: '/sidekick-studio/apikey',
                        icon: <VpnKeyOutlinedIcon color='primary' />
                    },
                    {
                        id: 'credentials',
                        text: 'Credentials',
                        link: '/sidekick-studio/credentials',
                        icon: <PasswordIcon color='primary' />
                    },
                    {
                        id: 'datasets',
                        text: 'Datasets',
                        link: '/sidekick-studio/datasets',
                        icon: <DatasetIcon color='primary' />
                    },
                    {
                        id: 'evaluations',
                        text: 'Evaluations',
                        link: '/sidekick-studio/evaluations',
                        icon: <AssessmentIcon color='primary' />
                    },
                    {
                        id: 'evaluators',
                        text: 'Evaluators',
                        link: '/sidekick-studio/evaluators',
                        icon: <RuleIcon color='primary' />
                    }
                ]
            })
        }

        // Enterprise Admin - top-level (feature-flagged)
        if (isEnterpriseAdminEnabled && userRole === 'admin') {
            menuConfig.push({
                id: 'enterprise_admin',
                text: 'Enterprise Admin',
                icon: <AssessmentOutlinedIcon color='primary' />,
                subMenu: [
                    {
                        id: 'admin-dashboard',
                        text: 'Dashboard',
                        link: '/sidekick-studio/admin',
                        icon: <DashboardIcon color='primary' />
                    },
                    {
                        id: 'users',
                        text: 'Users',
                        link: '/sidekick-studio/users',
                        icon: <PeopleIcon color='primary' />
                    },
                    {
                        id: 'roles',
                        text: 'Roles',
                        link: '/sidekick-studio/roles',
                        icon: <BadgeIcon color='primary' />
                    },
                    {
                        id: 'workspaces',
                        text: 'Workspaces',
                        link: '/sidekick-studio/workspaces',
                        icon: <WorkspacesIcon color='primary' />
                    },
                    {
                        id: 'sso-config',
                        text: 'SSO Config',
                        link: '/sidekick-studio/sso-config',
                        icon: <LockIcon color='primary' />
                    },
                    {
                        id: 'login-activity',
                        text: 'Login Activity',
                        link: '/sidekick-studio/login-activity',
                        icon: <HistoryIcon color='primary' />
                    }
                ]
            })
        }

        // Top-level Profile (everyone)
        menuConfig.push({
            id: 'profile',
            text: 'Profile',
            link: '/settings/user',
            icon: <AccountCircleIcon color='primary' />
        })

        // Top-level Billing (admins only)
        if (userRole === 'admin') {
            menuConfig.push({
                id: 'billing',
                text: 'Billing',
                link: '/billing',
                icon: <AssessmentOutlinedIcon color='primary' />
            })
        }
    } else {
        // Original logic for public organizations - everyone sees everything
        const filterMenuItems = (items: MenuConfig[]) => {
            return items.map((item) => {
                if (!item.subMenu) return item
                const filteredSubMenu = item.subMenu.filter((subItem) => {
                    return canUseChatflows || canManageChatflows
                })
                return { ...item, subMenu: filteredSubMenu }
            })
        }

        menuConfig = filterMenuItems([
            // Enterprise Admin - top-level (feature-flagged)
            ...(isEnterpriseAdminEnabled && userRole === 'admin'
                ? [
                      {
                          id: 'enterprise_admin',
                          text: 'Enterprise Admin',
                          icon: <AssessmentOutlinedIcon color='primary' />,
                          subMenu: [
                              {
                                  id: 'admin-dashboard',
                                  text: 'Dashboard',
                                  link: '/sidekick-studio/admin',
                                  icon: <DashboardIcon color='primary' />
                              },
                              {
                                  id: 'users',
                                  text: 'Users',
                                  link: '/sidekick-studio/admin/users',
                                  icon: <PeopleIcon color='primary' />
                              },
                              {
                                  id: 'roles',
                                  text: 'Roles',
                                  link: '/sidekick-studio/admin/roles',
                                  icon: <BadgeIcon color='primary' />
                              },
                              {
                                  id: 'workspaces',
                                  text: 'Workspaces',
                                  link: '/sidekick-studio/admin/workspaces',
                                  icon: <WorkspacesIcon color='primary' />
                              },
                              {
                                  id: 'sso-config',
                                  text: 'SSO Config',
                                  link: '/sidekick-studio/admin/sso-config',
                                  icon: <LockIcon color='primary' />
                              },
                              {
                                  id: 'login-activity',
                                  text: 'Login Activity',
                                  link: '/sidekick-studio/admin/login-activity',
                                  icon: <HistoryIcon color='primary' />
                              }
                          ]
                      }
                  ]
                : []),
            // Studio section (collapsible) with Assistants and Document Stores moved in
            ...(canUseChatflows
                ? [
                      {
                          id: 'studio',
                          text: 'Answer Studio',
                          icon: <BuildOutlinedIcon color='primary' />,
                          subMenu: [
                              {
                                  id: 'chatflows',
                                  text: 'Chatflows',
                                  link: '/sidekick-studio/chatflows',
                                  icon: <AccountTreeIcon color='primary' />
                              },
                              {
                                  id: 'agentflows',
                                  text: 'Agentflows',
                                  link: '/sidekick-studio/agentflows',
                                  icon: <GroupsOutlinedIcon color='primary' />
                              },
                              {
                                  id: 'assistants',
                                  text: 'Assistants',
                                  link: '/sidekick-studio/assistants',
                                  icon: <GroupsOutlinedIcon color='primary' />
                              },
                              {
                                  id: 'documentstores',
                                  text: 'Document Stores',
                                  link: '/sidekick-studio/document-stores',
                                  icon: <MenuBookOutlinedIcon color='primary' />
                              },
                              {
                                  id: 'executions',
                                  text: 'Executions',
                                  link: '/sidekick-studio/executions',
                                  icon: <PlayCircleOutlineIcon color='primary' />
                              },
                              {
                                  id: 'tools',
                                  text: 'Tools',
                                  link: '/sidekick-studio/tools',
                                  icon: <BuildOutlinedIcon color='primary' />
                              },
                              {
                                  id: 'variables',
                                  text: 'Global Variables',
                                  link: '/sidekick-studio/variables',
                                  icon: <IntegrationInstructionsOutlinedIcon color='primary' />
                              },
                              {
                                  id: 'apikey',
                                  text: 'API Keys',
                                  link: '/sidekick-studio/apikey',
                                  icon: <VpnKeyOutlinedIcon color='primary' />
                              },
                              {
                                  id: 'credentials',
                                  text: 'Credentials',
                                  link: '/sidekick-studio/credentials',
                                  icon: <PasswordIcon color='primary' />
                              },
                              {
                                  id: 'datasets',
                                  text: 'Datasets',
                                  link: '/sidekick-studio/datasets',
                                  icon: <DatasetIcon color='primary' />
                              },
                              {
                                  id: 'evaluations',
                                  text: 'Evaluations',
                                  link: '/sidekick-studio/evaluations',
                                  icon: <AssessmentIcon color='primary' />
                              },
                              {
                                  id: 'evaluators',
                                  text: 'Evaluators',
                                  link: '/sidekick-studio/evaluators',
                                  icon: <RuleIcon color='primary' />
                              },
                              ...(userRole === 'admin'
                                  ? [
                                        // Show nested Admin only when enterprise admin flag is disabled
                                        ...(isEnterpriseAdminEnabled
                                            ? []
                                            : [
                                                  {
                                                      id: 'admin',
                                                      text: 'Admin',
                                                      link: '/sidekick-studio/admin',
                                                      icon: <AssessmentOutlinedIcon color='primary' />
                                                  }
                                              ]),
                                        {
                                            id: 'apps',
                                            text: 'Apps',
                                            link: '/sidekick-studio/apps',
                                            icon: <AppsOutlinedIcon color='primary' />
                                        }
                                    ]
                                  : [])
                          ]
                      }
                  ]
                : []),
            // Top-level Profile and Billing for public orgs
            ...(canUseChatflows
                ? [
                      {
                          id: 'profile',
                          text: 'Profile',
                          link: '/settings/user',
                          icon: <AccountCircleIcon color='primary' />
                      },
                      ...(userRole === 'admin'
                          ? [
                                {
                                    id: 'billing',
                                    text: 'Billing',
                                    link: '/billing',
                                    icon: <AssessmentOutlinedIcon color='primary' />
                                }
                            ]
                          : [])
                  ]
                : [])
        ])
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen)
    }

    const handleNewChat = () => {
        setDrawerOpen(false)
    }

    const handleSubscriptionOpen = () => {
        openSubscriptionDialog()
        handleClose()
    }

    const handleSwitchWorkspace = async (workspaceId: string) => {
        if (workspaceId === user?.activeWorkspaceId) {
            handleClose()
            return
        }

        setSwitchingWorkspace(true)
        handleClose()

        try {
            const response = await fetch('/api/workspaces/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId })
            })

            if (response.ok) {
                // Redirect to refresh session context - stays on current page or goes to chat
                const redirectPath = pathname.startsWith('/sidekick-studio') ? pathname : '/chat'
                window.location.href = redirectPath
            } else {
                console.error('Failed to switch workspace')
                setSwitchingWorkspace(false)
            }
        } catch (error) {
            console.error('Error switching workspace:', error)
            setSwitchingWorkspace(false)
        }
    }

    return (
        <>
            <Drawer
                open={drawerOpen}
                variant='permanent'
                className={drawerOpen ? 'MuiDrawer-open' : 'MuiDrawer-closed'}
                sx={{ zIndex: 2000 }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: drawerOpen ? 'space-between' : 'center',
                        flexDirection: 'column',
                        p: 1
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: drawerOpen ? 'space-between' : 'center',
                            px: drawerOpen ? 1 : 0,
                            py: 1
                        }}
                    >
                        {/* AnswerAI Logo */}
                        {drawerOpen && (
                            <Box
                                component={NextLink}
                                href='/'
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flex: 1,
                                    ml: 1
                                }}
                            >
                                <Image
                                    src='/static/images/logos/answerai-logo-600-wide-white.png'
                                    alt='AnswerAI Logo'
                                    width={150}
                                    height={40}
                                    style={{ objectFit: 'contain' }}
                                />
                            </Box>
                        )}

                        {/* Drawer Toggle */}
                        <IconButton onClick={toggleDrawer}>
                            <ViewSidebarOutlinedIcon
                                sx={{
                                    transform: drawerOpen ? 'scaleX(-1)' : 'none',
                                    color: '#ffffff'
                                }}
                            />
                        </IconButton>
                    </Box>
                </Box>
                {/* Chat History */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: drawerOpen ? 'auto' : 'hidden',
                        overflowX: 'hidden',
                        display: drawerOpen ? 'block' : 'none'
                    }}
                >
                    <ChatDrawer />
                </Box>

                <List sx={{ display: 'flex', flexDirection: 'column', px: 1 }} disablePadding>
                    {menuConfig.map((item, index) => {
                        // Define tooltips for main menu items
                        const getMainMenuTooltip = (itemId: string) => {
                            switch (itemId) {
                                case 'marketplaces':
                                    return 'Browse and install AI agents from the marketplace'
                                case 'answer-apps':
                                    return 'Access your Answer Apps suite'
                                case 'chat':
                                    return 'Start a conversation with AI'
                                case 'image-generation':
                                    return 'Create images with AI'
                                case 'video-generation':
                                    return 'Generate videos with AI'
                                case 'bulk-analysis':
                                    return 'Analyze data in bulk'
                                case 'answer-engine':
                                    return 'Navigate to Answer Engine platform'
                                case 'studio':
                                    return 'Build and customize your own AI solutions'
                                case 'enterprise_admin':
                                    return 'Organization admin and enterprise settings'
                                case 'profile':
                                    return 'View and manage your personal profile information'
                                case 'billing':
                                    return 'View and manage your subscription and payments'
                                case 'account':
                                    return 'Manage your account settings and preferences'
                                default:
                                    return ''
                            }
                        }

                        return (
                            <Box key={item.text || index} sx={{ mb: item.id === 'documentstores' ? 2 : 0 }}>
                                <ListItem disablePadding>
                                    {item.text && (
                                        <Tooltip title={getMainMenuTooltip(item.id || '')} placement='right'>
                                            <ListItemButton
                                                selected={!!item.link && pathname.startsWith(item.link)}
                                                href={item.link}
                                                component={item.link ? NextLink : 'button'}
                                                sx={{
                                                    minHeight: 48,
                                                    justifyContent: drawerOpen ? 'initial' : 'center',
                                                    px: drawerOpen ? 2 : 2.5
                                                }}
                                                onClick={() => {
                                                    if (item.subMenu) {
                                                        setSubmenuOpen(item.text === submenuOpen ? '' : item.text ?? '')
                                                    }
                                                }}
                                            >
                                                <ListItemIcon
                                                    sx={{
                                                        minWidth: 0,
                                                        mr: drawerOpen ? 2 : 'auto',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {item.icon}
                                                </ListItemIcon>
                                                <Typography
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        textTransform: 'capitalize',
                                                        display: drawerOpen ? '-webkit-box' : 'none',
                                                        WebkitBoxOrient: 'vertical',
                                                        WebkitLineClamp: '1',
                                                        flex: '1',
                                                        opacity: drawerOpen ? 1 : 0,
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                >
                                                    {item.text}
                                                </Typography>
                                            </ListItemButton>
                                        </Tooltip>
                                    )}
                                </ListItem>

                                {/* Render submenu items if they exist */}
                                {item.subMenu && drawerOpen && (
                                    <Collapse key={`${item.text}-collapse`} in={submenuOpen === item.text} timeout='auto'>
                                        {item.subMenu.map((subItem) => {
                                            // Define tooltips for submenu items
                                            const getSubmenuTooltip = (subItemId: string) => {
                                                switch (subItemId) {
                                                    case 'chat':
                                                        return 'Start a conversation with AI'
                                                    case 'image-generation':
                                                        return 'Generate images with AI'
                                                    case 'video-generation':
                                                        return 'Generate videos with AI'
                                                    case 'bulk-analysis':
                                                        return 'Analyze data in bulk'
                                                    case 'content':
                                                        return 'Manage and organize content'
                                                    case 'dashboards':
                                                        return 'View analytics dashboards'
                                                    case 'reports':
                                                        return 'Generate and view reports'
                                                    case 'calls':
                                                        return 'View and manage calls'
                                                    case 'chatflows':
                                                        return 'Create conversation flows and logic'
                                                    case 'agentflows':
                                                        return 'Design multi-agent workflows'
                                                    case 'assistants':
                                                        return 'Manage your AI assistants'
                                                    case 'documentstores':
                                                        return 'Organize and manage your knowledge base'
                                                    case 'executions':
                                                        return 'Monitor and review execution history'
                                                    case 'tools':
                                                        return 'Configure tools and integrations'
                                                    case 'variables':
                                                        return 'Set up variables for reuse across your projects'
                                                    case 'apikey':
                                                        return 'Manage authentication keys for external services'
                                                    case 'admin':
                                                        return 'Access admin dashboard and organization management'
                                                    case 'billing':
                                                        return 'View and manage your subscription and payments'
                                                    case 'credentials':
                                                        return 'Store and manage API credentials securely'
                                                    case 'profile':
                                                        return 'View and manage your personal profile information'
                                                    case 'datasets':
                                                        return 'Manage datasets for evaluations'
                                                    case 'evaluations':
                                                        return 'Run and review AI evaluations'
                                                    case 'evaluators':
                                                        return 'Configure evaluation criteria and metrics'
                                                    case 'admin-dashboard':
                                                        return 'Access admin dashboard'
                                                    case 'users':
                                                        return 'Manage organization users'
                                                    case 'roles':
                                                        return 'Configure roles and permissions'
                                                    case 'workspaces':
                                                        return 'Manage workspaces'
                                                    case 'sso-config':
                                                        return 'Configure single sign-on settings'
                                                    case 'login-activity':
                                                        return 'View user login history'
                                                    default:
                                                        return subItem.text || ''
                                                }
                                            }

                                            return (
                                                <ListItem key={subItem.text} disablePadding sx={{ pl: 2 }}>
                                                    <Tooltip title={getSubmenuTooltip(subItem.id || '')} placement='right'>
                                                        <ListItemButton
                                                            component={subItem.link ? (subItem.external ? 'a' : NextLink) : 'button'}
                                                            href={subItem.link || '#'}
                                                            selected={pathname === subItem.link}
                                                            sx={{ width: '100%' }}
                                                            {...(subItem.external && {
                                                                target: '_blank',
                                                                rel: 'noopener noreferrer'
                                                            })}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 40 }}>{subItem.icon}</ListItemIcon>
                                                            <Typography>{subItem.text}</Typography>
                                                        </ListItemButton>
                                                    </Tooltip>
                                                </ListItem>
                                            )
                                        })}
                                    </Collapse>
                                )}
                            </Box>
                        )
                    })}

                    {/* Upgrade plan button visibility */}
                    {((isPrivateOrg && userRole === 'admin') || !isPrivateOrg) && !user?.subscription && (
                        <ListItem disablePadding>
                            <Tooltip title='Unlock premium features with a subscription' placement='right'>
                                <ListItemButton
                                    onClick={handleSubscriptionOpen}
                                    sx={{
                                        bgcolor: 'primary.main',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        borderRadius: 1,
                                        mb: 1,
                                        minHeight: 48,
                                        justifyContent: drawerOpen ? 'initial' : 'center',
                                        px: drawerOpen ? 2 : 2.5
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: drawerOpen ? 2 : 'auto',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <StarIcon sx={{ color: '#fff' }} />
                                    </ListItemIcon>
                                    <Typography
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            textTransform: 'capitalize',
                                            display: drawerOpen ? '-webkit-box' : 'none',
                                            WebkitBoxOrient: 'vertical',
                                            WebkitLineClamp: '1',
                                            flex: '1',
                                            color: '#fff',
                                            opacity: drawerOpen ? 1 : 0,
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        Upgrade Plan
                                    </Typography>
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    )}

                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: drawerOpen ? 'space-between' : 'center',
                                width: '100%',
                                gap: drawerOpen ? 1 : 0,
                                pl: drawerOpen ? 0.5 : 0,
                                py: 1
                            }}
                        >
                            <Avatar
                                src={user?.picture}
                                sx={{
                                    bgcolor: 'secondary.main',
                                    height: '32px',
                                    width: '32px',
                                    cursor: 'pointer'
                                }}
                                onClick={handleClick}
                            />
                            {drawerOpen && (
                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                    <Typography
                                        variant='body2'
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontWeight: 500
                                        }}
                                    >
                                        {user?.name || user?.email?.split('@')[0] || 'User'}
                                    </Typography>
                                    <Typography
                                        variant='caption'
                                        sx={{
                                            width: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            opacity: 0.7,
                                            fontSize: '0.65rem'
                                        }}
                                    >
                                        {user?.activeWorkspace || 'Default Workspace'}
                                    </Typography>
                                </Box>
                            )}
                            <IconButton
                                aria-label='more options'
                                sx={{ minHeight: 48, width: 48, justifyContent: 'center' }}
                                aria-controls='simple-menu'
                                aria-haspopup='true'
                                onClick={handleClick}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                id='simple-menu'
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                slotProps={{
                                    root: {
                                        sx: {
                                            zIndex: 3000
                                        }
                                    },
                                    paper: {
                                        sx: {
                                            zIndex: 3000,
                                            minWidth: 220,
                                            maxHeight: 'calc(100vh - 100px)'
                                        }
                                    }
                                }}
                            >
                                {/* Email Header with Add Account */}
                                <MenuItem
                                    sx={{ py: 1.5 }}
                                    onClick={() => {
                                        handleClose()
                                        window.location.href = '/api/auth/login'
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <AccountCircleIcon fontSize='small' />
                                    </ListItemIcon>
                                    <Typography
                                        variant='body2'
                                        sx={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {user?.email}
                                    </Typography>
                                    <AddIcon fontSize='small' sx={{ opacity: 0.5 }} />
                                </MenuItem>

                                {/* Organization with checkmark */}
                                <MenuItem disabled sx={{ opacity: '1 !important', py: 1 }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Business fontSize='small' color='primary' />
                                    </ListItemIcon>
                                    <Typography variant='body2' sx={{ flex: 1, fontWeight: 500 }}>
                                        {user?.org_name || 'Organization'}
                                    </Typography>
                                    <CheckIcon fontSize='small' color='primary' />
                                </MenuItem>

                                {/* Workspaces List */}
                                {user?.assignedWorkspaces && user.assignedWorkspaces.length > 0 &&
                                    user.assignedWorkspaces.map((workspace) => (
                                        <MenuItem
                                            key={workspace.id}
                                            onClick={() => handleSwitchWorkspace(workspace.id)}
                                            disabled={switchingWorkspace}
                                            sx={{ py: 1 }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <WorkspacesIcon
                                                    fontSize='small'
                                                    color={workspace.id === user?.activeWorkspaceId ? 'primary' : 'inherit'}
                                                />
                                            </ListItemIcon>
                                            <Typography variant='body2' sx={{ flex: 1 }}>
                                                {workspace.name}
                                            </Typography>
                                            {workspace.id === user?.activeWorkspaceId && (
                                                <CheckIcon fontSize='small' color='primary' />
                                            )}
                                        </MenuItem>
                                    ))}

                                <Divider sx={{ my: 1 }} />

                                {/* Admin Actions - Add teammates */}
                                {(userRole === 'admin' || userRole === 'builder') && (
                                    <MenuItem
                                        component={NextLink}
                                        href='/sidekick-studio/users'
                                        onClick={handleClose}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <PersonAddAltIcon fontSize='small' />
                                        </ListItemIcon>
                                        <Typography variant='body2'>Add teammates</Typography>
                                    </MenuItem>
                                )}

                                {/* Workspace settings */}
                                {(userRole === 'admin' || userRole === 'builder') && (
                                    <MenuItem
                                        component={NextLink}
                                        href='/sidekick-studio/workspaces'
                                        onClick={handleClose}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <WorkspacesIcon fontSize='small' />
                                        </ListItemIcon>
                                        <Typography variant='body2'>Workspace settings</Typography>
                                    </MenuItem>
                                )}

                                {/* Personalization (Theme) */}
                                <MenuItem
                                    onClick={() => {
                                        toggleMode()
                                        handleClose()
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <TuneIcon fontSize='small' />
                                    </ListItemIcon>
                                    <Typography variant='body2'>
                                        {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                    </Typography>
                                </MenuItem>

                                {/* Settings */}
                                <MenuItem component={NextLink} href='/settings/user' onClick={handleClose}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <SettingsIcon fontSize='small' />
                                    </ListItemIcon>
                                    <Typography variant='body2'>Settings</Typography>
                                </MenuItem>

                                <Divider sx={{ my: 1 }} />

                                {/* Help */}
                                <MenuItem
                                    component='a'
                                    href='https://docs.theanswer.ai'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    onClick={handleClose}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <HelpOutlineIcon fontSize='small' />
                                    </ListItemIcon>
                                    <Typography variant='body2' sx={{ flex: 1 }}>
                                        Help
                                    </Typography>
                                    <ChevronRightIcon fontSize='small' sx={{ opacity: 0.5 }} />
                                </MenuItem>

                                {/* Log out */}
                                <MenuItem
                                    onClick={() => {
                                        handleClose()
                                        window.location.href = '/api/auth/logout'
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <LogoutIcon fontSize='small' />
                                    </ListItemIcon>
                                    <Typography variant='body2'>Log out</Typography>
                                </MenuItem>

                                <Divider sx={{ my: 1 }} />

                                {/* User Profile Card at bottom */}
                                <Box sx={{ px: 2, py: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                        <Avatar src={user?.picture} sx={{ width: 32, height: 32, fontSize: 14 }}>
                                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ overflow: 'hidden' }}>
                                            <Typography
                                                variant='body2'
                                                sx={{
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {user?.name || 'User'}
                                            </Typography>
                                            <Typography
                                                variant='caption'
                                                color='text.secondary'
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block'
                                                }}
                                            >
                                                {user?.org_name || 'Organization'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Invite team members button */}
                                    {(userRole === 'admin' || userRole === 'builder') && (
                                        <Button
                                            variant='outlined'
                                            size='small'
                                            fullWidth
                                            startIcon={<PersonAddAltIcon />}
                                            component={NextLink}
                                            href='/sidekick-studio/users'
                                            onClick={handleClose}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Invite team members
                                        </Button>
                                    )}

                                    {/* Upgrade plan for non-admins or all users without subscription */}
                                    {!user?.subscription && (
                                        <Button
                                            variant='contained'
                                            size='small'
                                            fullWidth
                                            startIcon={<StarIcon />}
                                            onClick={() => {
                                                handleSubscriptionOpen()
                                                handleClose()
                                            }}
                                            sx={{ textTransform: 'none', mt: 1 }}
                                        >
                                            Upgrade Plan
                                        </Button>
                                    )}
                                </Box>
                            </Menu>
                        </Box>
                    </ListItem>
                </List>
            </Drawer>
        </>
    )
}

export default AppDrawer
