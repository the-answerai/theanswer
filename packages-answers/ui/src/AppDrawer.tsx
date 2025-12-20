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
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
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
import { ExportImportMenuItems } from './components/ExportImportComponent'
import { useSubscriptionDialog } from './SubscriptionDialogContext'
import { useThemeMode } from './theme'

import ChatDrawer from './ChatDrawer'
import StarIcon from '@mui/icons-material/Star'
import { usePermissions } from './PermissionProvider'

const drawerWidth = 240

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    width: drawerWidth,
    maxWidth: open ? drawerWidth : theme.spacing(7),
    flexShrink: 0,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    transition: '.3s',
    ' .MuiDrawer-paper': {
        transition: '.3s',
        overflowY: 'hidden',
        overflowX: 'hidden',
        padding: 0, // Remove padding here
        width: drawerWidth
    },
    p: {
        transition: '.2s'
    },
    ...(open && {
        '& .MuiDrawer-paper': {
            transition: '.3s',
            maxWidth: drawerWidth
        }
    }),
    ...(!open && {
        '& .MuiDrawer-paper': {
            transition: '.3s',
            maxWidth: theme.spacing(7),
            p: {
                opacity: 0
            }
        }
    })
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
            picture?: string
            email?: string
            org_name?: string
            org_id?: string
            roles?: string[]
            subscription?: unknown
            defaultChatflowId?: string
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
            link: '/profile',
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
                          link: '/profile',
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

    return (
        <>
            <Drawer open={drawerOpen} variant='permanent' className={drawerOpen ? 'MuiDrawer-open' : 'MuiDrawer-closed'} sx={{zIndex: 9999999}}>
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
                            justifyContent: 'space-between',
                            p: 1
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
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        '&::-webkit-scrollbar': {
                            transition: 'opacity 0.5s ease',
                            opacity: drawerOpen ? 1 : 0
                        },
                        '&::-webkit-scrollbar ': {
                            transition: '.2s',
                            ...(!drawerOpen && {
                                width: '0px'
                            })
                        }
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
                                                sx={{ flex: 1, display: 'flex', width: '100%' }}
                                                onClick={() => {
                                                    if (item.subMenu) {
                                                        setSubmenuOpen(item.text === submenuOpen ? '' : item.text ?? '')
                                                    }
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                                <Typography
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        textTransform: 'capitalize',
                                                        display: '-webkit-box',
                                                        WebkitBoxOrient: 'vertical',
                                                        WebkitLineClamp: '1',
                                                        flex: '1'
                                                    }}
                                                >
                                                    {item.text}
                                                </Typography>
                                            </ListItemButton>
                                        </Tooltip>
                                    )}
                                </ListItem>

                                {/* Render submenu items if they exist */}
                                {item.subMenu && (
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
                                        width: '100%'
                                    }}
                                >
                                    <ListItemIcon>
                                        <StarIcon sx={{ color: '#fff' }} />
                                    </ListItemIcon>
                                    <Typography
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            textTransform: 'capitalize',
                                            display: '-webkit-box',
                                            WebkitBoxOrient: 'vertical',
                                            WebkitLineClamp: '1',
                                            flex: '1',
                                            color: '#fff'
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
                                justifyContent: 'space-between',
                                width: '100%',
                                gap: 1,
                                pl: 0.5
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
                            <Box
                                sx={{
                                    display: 'flex',
                                    overflow: 'hidden',
                                    alignItems: 'center',
                                    width: '100%',
                                    maxWidth: 124
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography
                                        variant='caption'
                                        sx={{
                                            width: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {user?.email}
                                    </Typography>
                                    <Typography
                                        variant='caption'
                                        sx={{
                                            width: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {user?.org_name}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton
                                aria-label='more options'
                                sx={{ minHeight: 48, width: 48, justifyContent: 'center' }}
                                aria-controls='simple-menu'
                                aria-haspopup='true'
                                onClick={handleClick}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu id='simple-menu' anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                                <MenuItem disabled>
                                    <Typography
                                        variant='caption'
                                        sx={{
                                            opacity: 0.9,
                                            width: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {user?.org_name}
                                    </Typography>
                                </MenuItem>

                                {/* Theme Toggle */}
                                <MenuItem
                                    onClick={() => {
                                        toggleMode()
                                        handleClose()
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {mode === 'dark' ? <Brightness7Icon fontSize='small' /> : <Brightness4Icon fontSize='small' />}
                                    </ListItemIcon>
                                    <Typography>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Typography>
                                </MenuItem>

                                {/* Upgrade plan menu item visibility */}
                                {((isPrivateOrg && userRole === 'admin') || !isPrivateOrg) && (
                                    <MenuItem onClick={handleSubscriptionOpen}>Upgrade Plan</MenuItem>
                                )}

                                {/* Export/Import menu items visibility
                                {((isPrivateOrg && userRole === 'admin') || !isPrivateOrg) && (
                                    <ExportImportMenuItems onClose={handleClose} />
                                )} */}

                                <MenuItem
                                    onClick={() => {
                                        handleClose()
                                        window.location.href = '/api/auth/login'
                                    }}
                                >
                                    Switch Organization
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        handleClose()
                                        window.location.href = '/api/auth/logout'
                                    }}
                                >
                                    Sign Out
                                </MenuItem>
                            </Menu>
                        </Box>
                    </ListItem>
                </List>
            </Drawer>
        </>
    )
}

interface AppBarProps extends MuiAppBarProps {
    open?: boolean
}

export default AppDrawer
