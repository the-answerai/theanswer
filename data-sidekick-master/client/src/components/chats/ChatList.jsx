import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Chip, Slider, Alert, IconButton, Menu } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import ChatPanel from './ChatPanel'
import { getApiUrl } from '../../config/api'
import PropTypes from 'prop-types'
import { SENTIMENT_EMOJIS, getSentimentGradient } from '../../utils/sentimentEmojis'
import PersonIcon from '@mui/icons-material/Person'

const defaultFilters = {
    chatbotName: 'all',
    aiModel: 'all',
    selectedTags: [],
    sentimentRange: [1, 10],
    resolutionStatus: 'all',
    assignedTo: 'all',
    chatStatus: 'all',
    chatType: 'ai'
}

// Update the resolution status chip colors
const resolutionStatusColors = {
    resolved: 'success',
    escalated: 'error',
    followup: 'warning',
    in_progress: 'info'
}

const chatStatusColors = {
    new: 'error',
    waiting_on_reply: 'warning',
    needs_response: 'info',
    resolved: 'success'
}

const ChatList = memo(function ChatList({
    isEmbedded = false,
    onSelectionChange,
    selectedChats = [],
    showSelection = true,
    onFilterChange,
    filters: externalFilters,
    hideFilters = false,
    isIncoming = false,
    hideHeader = false,
    chatType = 'ai'
}) {
    const [state, setState] = useState({
        chats: [],
        loading: true,
        selectedChat: null,
        tagCategories: {},
        totalRows: 0,
        selectionModel: selectedChats,
        localFilters: { ...defaultFilters, chatType },
        paginationModel: {
            page: 0,
            pageSize: 10
        },
        users: [],
        usersError: null,
        assignmentMenuAnchor: null,
        selectedChatForAssignment: null
    })

    // Use external filters if provided, otherwise use local filters
    const filters = useMemo(
        () => ({ ...(externalFilters || state.localFilters), chatType }),
        [externalFilters, state.localFilters, chatType]
    )

    // Fetch data
    useEffect(() => {
        let isMounted = true

        const fetchData = async () => {
            if (!isMounted) return

            setState((prev) => ({ ...prev, loading: true }))

            try {
                const queryParams = new URLSearchParams({
                    page: state.paginationModel.page,
                    pageSize: state.paginationModel.pageSize,
                    chatbotName: filters.chatbotName,
                    aiModel: filters.aiModel,
                    tags: JSON.stringify(filters.selectedTags),
                    sentimentMin: filters.sentimentRange[0],
                    sentimentMax: filters.sentimentRange[1],
                    resolutionStatus: filters.resolutionStatus,
                    assignedTo: filters.assignedTo,
                    chatStatus: filters.chatStatus,
                    isIncoming: isIncoming,
                    chat_type: chatType
                })

                console.log('Fetching chats with params:', Object.fromEntries(queryParams.entries()))

                const response = await fetch(getApiUrl(`/api/chats?${queryParams}`))
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                console.log('Received chats data:', data.chats) // Debug log

                if (!isMounted) return

                setState((prev) => ({
                    ...prev,
                    chats: data.chats,
                    totalRows: data.total,
                    loading: false
                }))
            } catch (error) {
                console.error('[ChatList] Error fetching chats:', error)
                if (isMounted) {
                    setState((prev) => ({ ...prev, loading: false }))
                }
            }
        }

        fetchData()
        return () => {
            isMounted = false
        }
    }, [filters, state.paginationModel.page, state.paginationModel.pageSize, isIncoming, chatType])

    // Fetch tag categories
    useEffect(() => {
        let isMounted = true

        const fetchTags = async () => {
            try {
                const response = await fetch(getApiUrl('/api/tags'))
                const data = await response.json()
                if (isMounted) {
                    setState((prev) => ({ ...prev, tagCategories: data }))
                }
            } catch (error) {
                console.error('[ChatList] Error fetching tags:', error)
            }
        }

        fetchTags()
        return () => {
            isMounted = false
        }
    }, [])

    // Fetch users
    useEffect(() => {
        let isMounted = true

        const fetchUsers = async () => {
            try {
                const response = await fetch(getApiUrl('/api/users'))
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                if (isMounted) {
                    setState((prev) => ({
                        ...prev,
                        users: data || [],
                        usersError: null
                    }))
                }
            } catch (error) {
                console.error('[ChatList] Error fetching users:', error)
                if (isMounted) {
                    setState((prev) => ({
                        ...prev,
                        users: [],
                        usersError: 'Failed to load users'
                    }))
                }
            }
        }

        fetchUsers()
        return () => {
            isMounted = false
        }
    }, [])

    // Handle filter updates
    const handleFilterUpdate = useCallback(
        (newFilters) => {
            if (onFilterChange) {
                onFilterChange(newFilters)
            } else {
                setState((prev) => ({
                    ...prev,
                    localFilters: newFilters,
                    paginationModel: { ...prev.paginationModel, page: 0 }
                }))
            }
        },
        [onFilterChange]
    )

    // Handle selection changes
    useEffect(() => {
        if (onSelectionChange && showSelection) {
            onSelectionChange(state.selectionModel)
        }
    }, [state.selectionModel, onSelectionChange, showSelection])

    // Handle row click
    const handleRowClick = useCallback((params) => {
        setState((prev) => ({ ...prev, selectedChat: params.row }))
    }, [])

    // Handle panel close
    const handlePanelClose = useCallback(() => {
        setState((prev) => ({ ...prev, selectedChat: null }))
    }, [])

    // Handle assignment change
    const handleAssignmentChange = async (chatId, userId) => {
        try {
            setState((prev) => ({ ...prev, loading: true }))

            const response = await fetch(getApiUrl(`/api/chats/${chatId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assigned_to: userId,
                    chat_status: userId ? 'assigned' : 'new'
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            // Refresh the chat list
            const queryParams = new URLSearchParams({
                page: state.paginationModel.page,
                pageSize: state.paginationModel.pageSize,
                chatbotName: filters.chatbotName,
                aiModel: filters.aiModel,
                tags: JSON.stringify(filters.selectedTags),
                sentimentMin: filters.sentimentRange[0],
                sentimentMax: filters.sentimentRange[1],
                resolutionStatus: filters.resolutionStatus,
                assignedTo: filters.assignedTo,
                chatStatus: filters.chatStatus,
                isIncoming: isIncoming,
                chat_type: chatType
            })

            const chatsResponse = await fetch(getApiUrl(`/api/chats?${queryParams}`))
            if (!chatsResponse.ok) {
                throw new Error(`HTTP error! status: ${chatsResponse.status}`)
            }

            const data = await chatsResponse.json()
            setState((prev) => ({
                ...prev,
                chats: data.chats,
                totalRows: data.total,
                loading: false,
                assignmentMenuAnchor: null,
                selectedChatForAssignment: null
            }))
        } catch (error) {
            console.error('Error updating assignment:', error)
            setState((prev) => ({ ...prev, loading: false }))
        }
    }

    // Assignment menu handlers
    const handleAssignmentMenuOpen = useCallback((event, chat) => {
        event.stopPropagation()
        setState((prev) => ({
            ...prev,
            assignmentMenuAnchor: event.currentTarget,
            selectedChatForAssignment: chat
        }))
    }, [])

    const handleAssignmentMenuClose = useCallback(() => {
        setState((prev) => ({
            ...prev,
            assignmentMenuAnchor: null,
            selectedChatForAssignment: null
        }))
    }, [])

    // Memoize columns to prevent re-renders
    const columns = useMemo(
        () => [
            {
                field: 'summary',
                headerName: 'Conversation Summary',
                width: 300,
                renderCell: (params) => {
                    console.log('Summary cell params:', params) // Debug log
                    const summary = params.value || 'No summary available'
                    const truncatedSummary = summary.length > 100 ? `${summary.substring(0, 97)}...` : summary

                    return (
                        <Typography
                            variant='body2'
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%'
                            }}
                            title={summary} // Show full summary on hover
                        >
                            {truncatedSummary}
                        </Typography>
                    )
                }
            },
            ...(chatType === 'live'
                ? [
                      {
                          field: 'chat_messages',
                          headerName: 'Last Message Content',
                          width: 300,
                          renderCell: (params) => {
                              const messages = params.value || []
                              let lastUserMessage = 'No user messages'

                              // Find the last user message
                              for (let i = messages.length - 1; i >= 0; i--) {
                                  if (messages[i].role === 'user') {
                                      lastUserMessage = messages[i].content
                                      break
                                  }
                              }

                              // Truncate message if too long
                              const truncatedMessage =
                                  lastUserMessage.length > 50 ? `${lastUserMessage.substring(0, 47)}...` : lastUserMessage

                              return (
                                  <Typography
                                      variant='body2'
                                      sx={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          width: '100%'
                                      }}
                                      title={lastUserMessage} // Show full message on hover
                                  >
                                      {truncatedMessage}
                                  </Typography>
                              )
                          }
                      },
                      {
                          field: 'assigned_to',
                          headerName: 'Assigned To',
                          width: 200,
                          renderCell: (params) => {
                              if (state.usersError) {
                                  return <Typography color='error'>Error loading users</Typography>
                              }

                              const assignedUser = params.value && state.users.find?.((user) => user.id === params.value)

                              return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography>{assignedUser ? assignedUser.name : 'Unassigned'}</Typography>
                                      <IconButton size='small' onClick={(e) => handleAssignmentMenuOpen(e, params.row)}>
                                          <PersonIcon fontSize='small' />
                                      </IconButton>
                                  </Box>
                              )
                          }
                      },
                      {
                          field: 'chat_status',
                          headerName: 'Status',
                          width: 130,
                          renderCell: (params) => (
                              <Chip
                                  label={params?.value || 'New'}
                                  size='small'
                                  color={chatStatusColors[params?.value] || 'default'}
                                  variant='outlined'
                              />
                          )
                      },
                      {
                          field: 'last_message_time',
                          headerName: 'Last Message',
                          width: 180,
                          renderCell: (params) => {
                              const timestamp = params.value
                              if (!timestamp) return '-'
                              const date = new Date(timestamp)
                              return (
                                  <Typography variant='body2' title={date.toLocaleString()}>
                                      {date.toLocaleString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                      })}
                                  </Typography>
                              )
                          }
                      }
                  ]
                : []),
            { field: 'chatbot_name', headerName: 'Chatbot', width: 180 },
            ...(chatType === 'ai' ? [{ field: 'ai_model', headerName: 'AI Model', width: 130 }] : []),
            {
                field: 'sentiment_score',
                headerName: 'Sentiment',
                width: 100,
                renderCell: (params) => {
                    const score = params?.value
                    return score ? SENTIMENT_EMOJIS[Math.round(score)] : '😐'
                }
            },
            {
                field: 'resolution_status',
                headerName: 'Resolution',
                width: 130,
                renderCell: (params) => (
                    <Chip
                        label={params?.value || 'Unknown'}
                        size='small'
                        color={resolutionStatusColors[params?.value] || 'default'}
                        variant='outlined'
                    />
                )
            },
            {
                field: 'tags_array',
                headerName: 'Tags',
                width: 400,
                flex: 1,
                renderCell: (params) => {
                    const tags = params?.value || []
                    return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {tags.map((tag) => {
                                let color = '#757575'
                                let label = tag

                                // Find the category and subcategory
                                for (const [categoryKey, category] of Object.entries(state.tagCategories)) {
                                    if (tag === categoryKey) {
                                        color = category.color
                                        label = category.label
                                        break
                                    }
                                    if (category?.subcategories?.[tag]) {
                                        color = category.subcategories[tag].color
                                        label = category.subcategories[tag].label
                                        break
                                    }
                                }

                                return (
                                    <Chip
                                        key={`${params.row.id}-${tag}`}
                                        label={label}
                                        size='small'
                                        sx={(theme) => ({
                                            backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : color,
                                            color:
                                                theme.palette.mode === 'dark'
                                                    ? color
                                                    : color.toLowerCase().includes('ff') ||
                                                      color.toLowerCase().includes('f0') ||
                                                      color.toLowerCase().includes('ee') ||
                                                      color.toLowerCase().includes('e0')
                                                    ? 'rgba(0, 0, 0, 0.87)'
                                                    : 'white',
                                            border: theme.palette.mode === 'dark' ? `1px solid ${color}` : 'none',
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' ? `${color}22` : color,
                                                opacity: 0.9
                                            }
                                        })}
                                    />
                                )
                            })}
                        </Box>
                    )
                }
            }
        ],
        [state.tagCategories, chatType, state.users, state.usersError, handleAssignmentMenuOpen]
    )

    return (
        <Box>
            {!isEmbedded && !hideHeader && (
                <>
                    <Typography variant='h4' component='h1' gutterBottom>
                        {chatType === 'live' ? 'Live Chats' : 'AI Chats'}
                    </Typography>
                    <Alert severity='info' sx={{ mb: 2 }}>
                        {chatType === 'live'
                            ? 'Monitor and respond to ongoing live chat sessions with customers in real-time.'
                            : 'Review and analyze completed AI-assisted chat interactions and their outcomes.'}
                    </Alert>
                </>
            )}

            {/* Filters */}
            {!hideFilters && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            flexWrap: 'wrap'
                        }}
                    >
                        {/* Show AI Model filter only for AI chats */}
                        {chatType === 'ai' && (
                            <FormControl size='small' sx={{ width: 150 }}>
                                <InputLabel>AI Model</InputLabel>
                                <Select
                                    value={filters.aiModel}
                                    label='AI Model'
                                    onChange={(e) =>
                                        handleFilterUpdate({
                                            ...filters,
                                            aiModel: e.target.value
                                        })
                                    }
                                >
                                    <MenuItem value='all'>All</MenuItem>
                                    <MenuItem value='GPT-4o'>GPT-4o</MenuItem>
                                    <MenuItem value='GPT-4o-mini'>GPT-4o-mini</MenuItem>
                                    <MenuItem value='Claude-3.5-sonnet'>Claude-3.5-sonnet</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {/* Show live chat specific filters */}
                        {chatType === 'live' && (
                            <>
                                <FormControl size='small' sx={{ width: 200 }}>
                                    <InputLabel>Assigned To</InputLabel>
                                    <Select
                                        value={filters.assignedTo}
                                        label='Assigned To'
                                        onChange={(e) =>
                                            handleFilterUpdate({
                                                ...filters,
                                                assignedTo: e.target.value
                                            })
                                        }
                                    >
                                        <MenuItem value='all'>All</MenuItem>
                                        <MenuItem value={null}>Unassigned</MenuItem>
                                        {state.users.map((user) => (
                                            <MenuItem key={user.id} value={user.id}>
                                                {user.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size='small' sx={{ width: 150 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={filters.chatStatus}
                                        label='Status'
                                        onChange={(e) =>
                                            handleFilterUpdate({
                                                ...filters,
                                                chatStatus: e.target.value
                                            })
                                        }
                                    >
                                        <MenuItem value='all'>All</MenuItem>
                                        <MenuItem value='new'>New</MenuItem>
                                        <MenuItem value='waiting_on_reply'>Waiting on Reply</MenuItem>
                                        <MenuItem value='needs_response'>Needs Response</MenuItem>
                                        <MenuItem value='resolved'>Resolved</MenuItem>
                                    </Select>
                                </FormControl>
                            </>
                        )}

                        {/* Common filters for both types */}
                        <FormControl size='small' sx={{ width: 200 }}>
                            <InputLabel>Chatbot</InputLabel>
                            <Select
                                value={filters.chatbotName}
                                label='Chatbot'
                                onChange={(e) =>
                                    handleFilterUpdate({
                                        ...filters,
                                        chatbotName: e.target.value
                                    })
                                }
                            >
                                <MenuItem value='all'>All</MenuItem>
                                <MenuItem value='CustomerService'>Customer Service</MenuItem>
                                <MenuItem value='SalesAssistant'>Sales Assistant</MenuItem>
                                <MenuItem value='TechnicalSupport'>Technical Support</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size='small' sx={{ width: 120 }}>
                            <InputLabel>Resolution</InputLabel>
                            <Select
                                value={filters.resolutionStatus}
                                label='Resolution'
                                onChange={(e) =>
                                    handleFilterUpdate({
                                        ...filters,
                                        resolutionStatus: e.target.value
                                    })
                                }
                            >
                                <MenuItem value='all'>All</MenuItem>
                                <MenuItem value='resolved'>Resolved</MenuItem>
                                <MenuItem value='escalated'>Escalated</MenuItem>
                                <MenuItem value='followup'>Follow-up</MenuItem>
                                {chatType === 'live' && <MenuItem value='in_progress'>In Progress</MenuItem>}
                            </Select>
                        </FormControl>

                        {/* Sentiment range */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flex: 1,
                                maxWidth: 400
                            }}
                        >
                            <Typography variant='body2' sx={{ color: 'text.secondary', minWidth: 65 }}>
                                Sentiment:
                            </Typography>
                            <Typography variant='body2'>{SENTIMENT_EMOJIS[filters.sentimentRange[0]]}</Typography>
                            <Slider
                                value={filters.sentimentRange}
                                onChange={(_, newValue) =>
                                    handleFilterUpdate({
                                        ...filters,
                                        sentimentRange: newValue
                                    })
                                }
                                min={1}
                                max={10}
                                step={1}
                                size='small'
                                valueLabelDisplay='auto'
                                valueLabelFormat={(value) => SENTIMENT_EMOJIS[value]}
                                sx={{
                                    '& .MuiSlider-rail': {
                                        background: getSentimentGradient(),
                                        opacity: 1
                                    }
                                }}
                            />
                            <Typography variant='body2'>{SENTIMENT_EMOJIS[filters.sentimentRange[1]]}</Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Data Grid */}
            <Box sx={{ height: isEmbedded ? 'calc(100vh - 280px)' : 600 }}>
                <DataGrid
                    rows={state.chats}
                    columns={columns}
                    paginationModel={state.paginationModel}
                    onPaginationModelChange={(model) => setState((prev) => ({ ...prev, paginationModel: model }))}
                    pageSizeOptions={[10, 25, 50]}
                    rowCount={state.totalRows}
                    paginationMode='server'
                    loading={state.loading}
                    checkboxSelection={showSelection}
                    rowSelectionModel={state.selectionModel}
                    onRowSelectionModelChange={(newModel) => {
                        if (showSelection) {
                            setState((prev) => ({ ...prev, selectionModel: newModel }))
                        }
                    }}
                    keepNonExistentRowsSelected
                    onRowClick={handleRowClick}
                    sx={{ cursor: 'pointer', height: '100%' }}
                />
            </Box>

            {/* Chat Panel */}
            {state.selectedChat && (
                <ChatPanel
                    key={state.selectedChat.id}
                    chat={state.selectedChat}
                    open={!!state.selectedChat}
                    onClose={handlePanelClose}
                    tagCategories={state.tagCategories}
                    isIncoming={isIncoming}
                    chatType={chatType}
                />
            )}

            {/* Assignment Menu */}
            <Menu anchorEl={state.assignmentMenuAnchor} open={Boolean(state.assignmentMenuAnchor)} onClose={handleAssignmentMenuClose}>
                <MenuItem
                    onClick={() => {
                        handleAssignmentChange(state.selectedChatForAssignment?.id, null)
                    }}
                >
                    <Typography>Unassign</Typography>
                </MenuItem>
                {state.users.map((user) => (
                    <MenuItem
                        key={user.id}
                        onClick={() => {
                            handleAssignmentChange(state.selectedChatForAssignment?.id, user.id)
                        }}
                    >
                        <Typography>{user.name}</Typography>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    )
})

ChatList.propTypes = {
    isEmbedded: PropTypes.bool,
    onSelectionChange: PropTypes.func,
    selectedChats: PropTypes.array,
    showSelection: PropTypes.bool,
    onFilterChange: PropTypes.func,
    filters: PropTypes.object,
    hideFilters: PropTypes.bool,
    isIncoming: PropTypes.bool,
    hideHeader: PropTypes.bool,
    chatType: PropTypes.oneOf(['live', 'ai'])
}

export default ChatList
