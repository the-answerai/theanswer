import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    ClickAwayListener,
    Divider,
    InputAdornment,
    List,
    ListItemButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    OutlinedInput,
    Paper,
    Popper,
    Stack,
    Typography,
    Chip,
    Tab,
    Tabs
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import Transitions from '@/ui-component/extended/Transitions'
import { StyledFab } from '@/ui-component/button/StyledFab'

// icons
import { IconPlus, IconSearch, IconMinus, IconX } from '@tabler/icons-react'
import LlamaindexPNG from '@/assets/images/llamaindex.png'
import LangChainPNG from '@/assets/images/langchain.png'
import utilNodesPNG from '@/assets/images/utilNodes.png'
import AAIPNG from '@/assets/images/aai.png'

// const
import { baseURL } from '@/store/constant'
import { SET_COMPONENT_NODES } from '@/store/actions'
import Image from 'next/image'

// ==============================|| ADD NODES||============================== //
function a11yProps(index) {
    return {
        id: `attachment-tab-${index}`,
        'aria-controls': `attachment-tabpanel-${index}`
    }
}

const blacklistCategoriesForAgentCanvas = ['Agents', 'Memory', 'Record Manager', 'Utilities']

const agentMemoryNodes = ['agentMemory', 'sqliteAgentMemory', 'postgresAgentMemory', 'mySQLAgentMemory', 'answerAiAgentMemory']

// Show blacklisted nodes (exceptions) for agent canvas
const exceptionsForAgentCanvas = {
    Memory: agentMemoryNodes,
    Utilities: ['getVariable', 'setVariable', 'stickyNote']
}

// Hide some nodes from the chatflow canvas
const blacklistForChatflowCanvas = {
    Memory: agentMemoryNodes
}

const AddNodes = ({ nodesData, node, isAgentCanvas }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()

    const [searchValue, setSearchValue] = useState('')
    const [nodes, setNodes] = useState({})
    const [open, setOpen] = useState(false)
    const [categoryExpanded, setCategoryExpanded] = useState({})
    const [tabValue, setTabValue] = useState(0)

    const anchorRef = useRef(null)
    const prevOpen = useRef(open)
    const ps = useRef()

    const scrollTop = () => {
        const curr = ps.current
        if (curr) {
            curr.scrollTop = 0
        }
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
        filterSearch(searchValue, newValue)
    }

    const addException = (category) => {
        let nodes = []
        if (category) {
            const nodeNames = exceptionsForAgentCanvas[category] || []
            nodes = nodesData.filter((nd) => nd.category === category && nodeNames.includes(nd.name))
        } else {
            for (const category in exceptionsForAgentCanvas) {
                const nodeNames = exceptionsForAgentCanvas[category]
                nodes.push(...nodesData.filter((nd) => nd.category === category && nodeNames.includes(nd.name)))
            }
        }
        return nodes
    }

    const getSearchedNodes = (value) => {
        if (isAgentCanvas) {
            const nodes = nodesData.filter((nd) => !blacklistCategoriesForAgentCanvas.includes(nd.category))
            nodes.push(...addException())
            const passed = nodes.filter((nd) => {
                const passesName = nd.name.toLowerCase().includes(value.toLowerCase())
                const passesLabel = nd.label.toLowerCase().includes(value.toLowerCase())
                const passesCategory = nd.category.toLowerCase().includes(value.toLowerCase())
                return passesName || passesCategory || passesLabel
            })
            return passed
        }
        let nodes = nodesData.filter((nd) => nd.category !== 'Multi Agents' && nd.category !== 'Sequential Agents')

        for (const category in blacklistForChatflowCanvas) {
            const nodeNames = blacklistForChatflowCanvas[category]
            nodes = nodes.filter((nd) => !nodeNames.includes(nd.name))
        }

        const passed = nodes.filter((nd) => {
            const passesName = nd.name.toLowerCase().includes(value.toLowerCase())
            const passesLabel = nd.label.toLowerCase().includes(value.toLowerCase())
            const passesCategory = nd.category.toLowerCase().includes(value.toLowerCase())
            return passesName || passesCategory || passesLabel
        })
        return passed
    }

    const filterSearch = (value, newTabValue) => {
        setSearchValue(value)
        setTimeout(() => {
            if (value) {
                const returnData = getSearchedNodes(value)
                groupByCategory(returnData, newTabValue ?? tabValue, true)
                scrollTop()
            } else if (value === '') {
                groupByCategory(nodesData, newTabValue ?? tabValue)
                scrollTop()
            }
        }, 500)
    }

    const groupByTags = (nodes, newTabValue = 0) => {
        const aaiNodes = nodes.filter((nd) => nd.tags && nd.tags.includes('AAI'))
        const langchainNodes = nodes.filter((nd) => !nd.tags || !nd.tags.includes('AAI'))
        const llmaindexNodes = nodes.filter((nd) => nd.tags && nd.tags.includes('LlamaIndex'))
        const utilitiesNodes = nodes.filter((nd) => nd.tags && nd.tags.includes('Utilities'))
        if (newTabValue === 0) {
            return aaiNodes
        } else if (newTabValue === 1) {
            return langchainNodes
        } else if (newTabValue === 2) {
            return llmaindexNodes
        } else {
            return utilitiesNodes
        }
    }

    const groupByCategory = (nodes, newTabValue, isFilter) => {
        if (isAgentCanvas) {
            const accordianCategories = {}
            const result = nodes.reduce(function (r, a) {
                r[a.category] = r[a.category] || []
                r[a.category].push(a)
                accordianCategories[a.category] = isFilter ? true : false
                return r
            }, Object.create(null))

            const filteredResult = {}
            for (const category in result) {
                // Filter out blacklisted categories
                if (!blacklistCategoriesForAgentCanvas.includes(category)) {
                    // Filter out LlamaIndex nodes
                    const nodes = result[category].filter((nd) => !nd.tags || !nd.tags.includes('LlamaIndex'))
                    if (!nodes.length) continue

                    filteredResult[category] = nodes
                }

                // Allow exceptionsForAgentCanvas
                if (Object.keys(exceptionsForAgentCanvas).includes(category)) {
                    filteredResult[category] = addException(category)
                }
            }
            setNodes(filteredResult)
            accordianCategories['Multi Agents'] = true
            accordianCategories['Sequential Agents'] = true
            accordianCategories['Memory'] = true
            setCategoryExpanded(accordianCategories)
        } else {
            const taggedNodes = groupByTags(nodes, newTabValue)
            const accordianCategories = {}
            const result = taggedNodes.reduce(function (r, a) {
                r[a.category] = r[a.category] || []
                r[a.category].push(a)
                accordianCategories[a.category] = isFilter ? true : false
                return r
            }, Object.create(null))

            const filteredResult = {}
            for (const category in result) {
                if (category === 'Multi Agents' || category === 'Sequential Agents') {
                    continue
                }
                if (Object.keys(blacklistForChatflowCanvas).includes(category)) {
                    const nodes = blacklistForChatflowCanvas[category]
                    result[category] = result[category].filter((nd) => !nodes.includes(nd.name))
                }
                filteredResult[category] = result[category]
            }

            setNodes(filteredResult)
            setCategoryExpanded(accordianCategories)
        }
    }

    const handleAccordionChange = (category) => (event, isExpanded) => {
        const accordianCategories = { ...categoryExpanded }
        accordianCategories[category] = isExpanded
        setCategoryExpanded(accordianCategories)
    }

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return
        }
        setOpen(false)
    }

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen)
    }

    const onDragStart = (event, node) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(node))
        event.dataTransfer.effectAllowed = 'move'
    }

    const getImage = (tabValue) => {
        if (tabValue === 0) {
            return AAIPNG
        } else if (tabValue === 1) {
            return LangChainPNG
        } else if (tabValue === 2) {
            return LlamaindexPNG
        } else {
            return utilNodesPNG
        }
    }

    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus()
        }

        prevOpen.current = open
    }, [open])

    useEffect(() => {
        if (node) setOpen(false)
    }, [node])

    useEffect(() => {
        if (nodesData) {
            groupByCategory(nodesData)
            dispatch({ type: SET_COMPONENT_NODES, componentNodes: nodesData })
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodesData, dispatch])

    return (
        <>
            <StyledFab
                sx={{ left: 20, top: 20 }}
                ref={anchorRef}
                size='small'
                color='primary'
                aria-label='add'
                title='Add Node'
                onClick={handleToggle}
            >
                {open ? <IconMinus /> : <IconPlus />}
            </StyledFab>
            <Popper
                placement='bottom-end'
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                popperOptions={{
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [-40, 14]
                            }
                        }
                    ]
                }}
                sx={{ zIndex: 1000 }}
            >
                {({ TransitionProps }) => (
                    <Transitions in={open} {...TransitionProps}>
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                                    <Box sx={{ p: 2 }}>
                                        <Stack>
                                            <Typography variant='h4'>Add Nodes</Typography>
                                        </Stack>
                                        <OutlinedInput
                                            // eslint-disable-next-line
                                            autoFocus
                                            sx={{ width: '100%', pr: 2, pl: 2, my: 2 }}
                                            id='input-search-node'
                                            value={searchValue}
                                            onChange={(e) => filterSearch(e.target.value)}
                                            placeholder='Search nodes'
                                            startAdornment={
                                                <InputAdornment position='start'>
                                                    <IconSearch stroke={1.5} size='1rem' color={theme.palette.grey[500]} />
                                                </InputAdornment>
                                            }
                                            endAdornment={
                                                <InputAdornment
                                                    position='end'
                                                    sx={{
                                                        cursor: 'pointer',
                                                        color: theme.palette.grey[500],
                                                        '&:hover': {
                                                            color: theme.palette.grey[900]
                                                        }
                                                    }}
                                                    title='Clear Search'
                                                >
                                                    <IconX
                                                        stroke={1.5}
                                                        size='1rem'
                                                        onClick={() => filterSearch('')}
                                                        style={{
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                </InputAdornment>
                                            }
                                            aria-describedby='search-helper-text'
                                            inputProps={{
                                                'aria-label': 'weight'
                                            }}
                                        />
                                        {!isAgentCanvas && (
                                            <Tabs
                                                sx={{ position: 'relative', minHeight: '50px', height: '50px' }}
                                                variant='fullWidth'
                                                value={tabValue}
                                                onChange={handleTabChange}
                                                aria-label='tabs'
                                            >
                                                {['AAI', 'All', 'LlamaIndex', 'Utilities'].map((item, index) => (
                                                    <Tab
                                                        icon={
                                                            <div
                                                                style={{
                                                                    borderRadius: '50%'
                                                                }}
                                                            >
                                                                <Image
                                                                    style={{
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        borderRadius: '50%',
                                                                        objectFit: 'contain'
                                                                    }}
                                                                    src={getImage(index)}
                                                                    alt={item}
                                                                />
                                                            </div>
                                                        }
                                                        iconPosition='start'
                                                        sx={{ minHeight: '50px', height: '50px' }}
                                                        key={index}
                                                        label={item}
                                                        {...a11yProps(index)}
                                                    ></Tab>
                                                ))}
                                            </Tabs>
                                        )}

                                        <Divider />
                                    </Box>
                                    <PerfectScrollbar
                                        containerRef={(el) => {
                                            ps.current = el
                                        }}
                                        style={{
                                            height: '100%',
                                            maxHeight: `calc(100vh - ${isAgentCanvas ? '300' : '380'}px)`,
                                            overflowX: 'hidden'
                                        }}
                                    >
                                        <Box sx={{ p: 2, pt: 0 }}>
                                            <List
                                                sx={{
                                                    width: '100%',
                                                    maxWidth: 455,
                                                    py: 0,
                                                    borderRadius: '10px',
                                                    [theme.breakpoints.down('md')]: {
                                                        maxWidth: 370
                                                    },
                                                    '& .MuiListItemSecondaryAction-root': {
                                                        top: 22
                                                    },
                                                    '& .MuiDivider-root': {
                                                        my: 0
                                                    },
                                                    '& .list-container': {
                                                        pl: 7
                                                    }
                                                }}
                                            >
                                                {Object.keys(nodes)
                                                    .sort()
                                                    .map((category) => (
                                                        <Accordion
                                                            expanded={categoryExpanded[category] || tabValue === 0 || false}
                                                            onChange={handleAccordionChange(category)}
                                                            key={category}
                                                            disableGutters
                                                        >
                                                            <AccordionSummary
                                                                expandIcon={<ExpandMoreIcon />}
                                                                aria-controls={`nodes-accordian-${category}`}
                                                                id={`nodes-accordian-header-${category}`}
                                                            >
                                                                {category.split(';').length > 1 ? (
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'row',
                                                                            alignItems: 'center'
                                                                        }}
                                                                    >
                                                                        <Typography variant='h5'>{category.split(';')[0]}</Typography>
                                                                        &nbsp;
                                                                        <Chip
                                                                            sx={{
                                                                                width: 'max-content',
                                                                                fontWeight: 700,
                                                                                fontSize: '0.65rem',
                                                                                background:
                                                                                    category.split(';')[1] === 'DEPRECATING'
                                                                                        ? theme.palette.warning.main
                                                                                        : theme.palette.teal.main,
                                                                                color:
                                                                                    category.split(';')[1] !== 'DEPRECATING'
                                                                                        ? 'white'
                                                                                        : 'inherit'
                                                                            }}
                                                                            size='small'
                                                                            label={category.split(';')[1]}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <Typography variant='h5'>{category}</Typography>
                                                                )}
                                                            </AccordionSummary>
                                                            <AccordionDetails>
                                                                {nodes[category].map((node, index) => (
                                                                    <div
                                                                        key={node.name}
                                                                        onDragStart={(event) => onDragStart(event, node)}
                                                                        draggable
                                                                    >
                                                                        <ListItemButton
                                                                            sx={{
                                                                                p: 0,
                                                                                borderRadius: `${customization.borderRadius}px`,
                                                                                cursor: 'move'
                                                                            }}
                                                                        >
                                                                            <ListItem alignItems='center'>
                                                                                <ListItemAvatar>
                                                                                    <div
                                                                                        style={{
                                                                                            width: 50,
                                                                                            height: 50,
                                                                                            borderRadius: '50%',
                                                                                            backgroundColor: 'white'
                                                                                        }}
                                                                                    >
                                                                                        <img
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                height: '100%',
                                                                                                padding: 10,
                                                                                                objectFit: 'contain'
                                                                                            }}
                                                                                            alt={node.name}
                                                                                            src={`${baseURL}/api/v1/node-icon/${node.name}`}
                                                                                        />
                                                                                    </div>
                                                                                </ListItemAvatar>
                                                                                <ListItemText
                                                                                    sx={{ ml: 1 }}
                                                                                    primary={
                                                                                        <>
                                                                                            <div
                                                                                                style={{
                                                                                                    display: 'flex',
                                                                                                    flexDirection: 'row',
                                                                                                    alignItems: 'center'
                                                                                                }}
                                                                                            >
                                                                                                <span>{node.label}</span>
                                                                                                &nbsp;
                                                                                                {node.badge && (
                                                                                                    <Chip
                                                                                                        sx={{
                                                                                                            width: 'max-content',
                                                                                                            fontWeight: 700,
                                                                                                            fontSize: '0.65rem',
                                                                                                            background:
                                                                                                                node.badge === 'DEPRECATING'
                                                                                                                    ? theme.palette.warning
                                                                                                                          .main
                                                                                                                    : theme.palette.teal
                                                                                                                          .main,
                                                                                                            color:
                                                                                                                node.badge !== 'DEPRECATING'
                                                                                                                    ? 'white'
                                                                                                                    : 'inherit'
                                                                                                        }}
                                                                                                        size='small'
                                                                                                        label={node.badge}
                                                                                                    />
                                                                                                )}
                                                                                            </div>
                                                                                            {node.author && (
                                                                                                <span
                                                                                                    style={{
                                                                                                        fontSize: '0.65rem',
                                                                                                        fontWeight: 700
                                                                                                    }}
                                                                                                >
                                                                                                    By {node.author}
                                                                                                </span>
                                                                                            )}
                                                                                        </>
                                                                                    }
                                                                                    secondary={node.description}
                                                                                />
                                                                            </ListItem>
                                                                        </ListItemButton>
                                                                        {index === nodes[category].length - 1 ? null : <Divider />}
                                                                    </div>
                                                                ))}
                                                            </AccordionDetails>
                                                        </Accordion>
                                                    ))}
                                            </List>
                                        </Box>
                                    </PerfectScrollbar>
                                </MainCard>
                            </ClickAwayListener>
                        </Paper>
                    </Transitions>
                )}
            </Popper>
        </>
    )
}

AddNodes.propTypes = {
    nodesData: PropTypes.array,
    node: PropTypes.object,
    isAgentCanvas: PropTypes.bool
}

export default AddNodes
