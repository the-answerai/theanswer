import { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { styled, alpha } from '@mui/material/styles'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import FileDownloadIcon from '@mui/icons-material/Downloading'
import FileDeleteIcon from '@mui/icons-material/Delete'
import SettingsIcon from '@mui/icons-material/Settings'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Button from '@mui/material/Button'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { IconX } from '@tabler/icons-react'

import chatflowsApi from '@/api/chatflows'
import journeysApi from '@/api/journeys'

import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'
import { uiBaseURL } from '@/store/constant'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import ChatflowConfigurationDialog from '../dialog/ChatflowConfigurationDialog'
import { generateExportFlowData } from '@/utils/genericHelper'
import JourneySetupDialog from '../dialog/JourneySetupDialog'

const StyledMenu = styled((props) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 180,
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0'
        },
        '& .MuiMenuItem-root': {
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5)
            },
            '&:active': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)
            }
        }
    }
}))

export default function FlowListMenu({ item, type, setError, updateFlowsApi }) {
    const { confirm } = useConfirm()
    const dispatch = useDispatch()
    const updateChatflowApi = useApi(chatflowsApi.updateChatflow)
    const updateJourneyApi = useApi(journeysApi.updateJourney)

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const [configurationDialogOpen, setConfigurationDialogOpen] = useState(false)
    const [configurationDialogProps, setConfigurationDialogProps] = useState({})

    const title = type === 'agentflows' ? 'Agents' : type === 'journeys' ? 'Journey' : 'Chatflow'

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleConfiguration = () => {
        setAnchorEl(null)
        setConfigurationDialogProps({
            title: `${title} Configuration`,
            chatflow: item
        })
        setConfigurationDialogOpen(true)
    }

    const handleDelete = async () => {
        setAnchorEl(null)
        const confirmPayload = {
            title: `Delete`,
            description: `Delete ${title} ${item.name || item.title}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                if (type === 'journeys') {
                    await journeysApi.deleteJourney(item.id)
                } else {
                    await chatflowsApi.deleteChatflow(item.id)
                }
                await updateFlowsApi.request()
            } catch (error) {
                setError(error)
                enqueueSnackbar({
                    message: error.message,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        }
    }

    const handleDuplicate = () => {
        setAnchorEl(null)
        try {
            localStorage.setItem('duplicatedFlowData', item.flowData || JSON.stringify(item))
            window.open(`${uiBaseURL}/${type === 'agentflows' ? 'agentcanvas' : type === 'journeys' ? 'journeys/new' : 'canvas'}`, '_blank')
        } catch (e) {
            console.error(e)
        }
    }

    const handleExport = () => {
        setAnchorEl(null)
        try {
            const flowData = type === 'journeys' ? item : JSON.parse(item.flowData)
            let dataStr = JSON.stringify(flowData, null, 2)
            let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

            let exportFileDefaultName = `${item.name || item.title} ${title}.json`

            let linkElement = document.createElement('a')
            linkElement.setAttribute('href', dataUri)
            linkElement.setAttribute('download', exportFileDefaultName)
            linkElement.click()
        } catch (e) {
            console.error(e)
        }
    }

    const handleJourneyCompleteToggle = async () => {
        setAnchorEl(null)
        try {
            const updatedJourney = { ...item }
            if (updatedJourney.completedAt) {
                // Reopen the journey
                updatedJourney.completedAt = null
            } else {
                // Complete the journey
                updatedJourney.completedAt = new Date().toISOString()
            }
            await updateJourneyApi.request(item.id, updatedJourney)
            await updateFlowsApi.request()
        } catch (error) {
            setError(error)
        }
    }

    const menuItems = [
        { label: 'Configuration', onClick: handleConfiguration, icon: <SettingsIcon /> },
        { label: 'Duplicate', onClick: handleDuplicate, icon: <FileCopyIcon /> },
        { label: 'Export', onClick: handleExport, icon: <FileDownloadIcon /> },
        { label: 'Delete', onClick: handleDelete, icon: <FileDeleteIcon /> }
    ]

    if (type === 'journeys') {
        menuItems.push({
            label: item.completedAt ? 'Reopen Journey' : 'Complete',
            onClick: handleJourneyCompleteToggle,
            icon: <CheckCircleIcon />
        })
    }

    return (
        <div>
            <Button
                id='flow-list-menu-button'
                aria-controls={open ? 'flow-list-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                disableElevation
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}
            >
                Options
            </Button>
            <StyledMenu
                id='flow-list-menu'
                MenuListProps={{
                    'aria-labelledby': 'flow-list-menu-button'
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {menuItems.map((menuItem, index) => (
                    <MenuItem key={index} onClick={menuItem.onClick} disableRipple>
                        {menuItem.icon}
                        {menuItem.label}
                    </MenuItem>
                ))}
            </StyledMenu>
            {type === 'journeys' ? (
                <JourneySetupDialog
                    open={configurationDialogOpen}
                    onClose={() => setConfigurationDialogOpen(false)}
                    onComplete={() => {
                        setConfigurationDialogOpen(false)
                        updateFlowsApi.request()
                    }}
                    journeyData={item}
                />
            ) : (
                <ChatflowConfigurationDialog
                    show={configurationDialogOpen}
                    dialogProps={configurationDialogProps}
                    onCancel={() => setConfigurationDialogOpen(false)}
                />
            )}
        </div>
    )
}

FlowListMenu.propTypes = {
    item: PropTypes.object,
    type: PropTypes.oneOf(['chatflows', 'agentflows', 'journeys']),
    setError: PropTypes.func,
    updateFlowsApi: PropTypes.object
}
