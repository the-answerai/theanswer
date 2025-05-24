'use client'
import PropTypes from 'prop-types'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@/utils/navigation'
// import { Box, Tabs, Tab, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import FlowListView from '@/ui-component/lists/FlowListView'

// material-ui
import { Chip, Box, Tab, Tabs, Skeleton, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ItemCard from '@/ui-component/cards/ItemCard'
import { gridSpacing } from '@/store/constant'
import AgentsEmptySVG from '@/assets/images/agents_empty.svg'
// import LoginDialog from '@/ui-component/dialog/LoginDialog'
// import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import { FlowListTable } from '@/ui-component/table/FlowListTable'
import { StyledButton } from '@/ui-component/button/StyledButton'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { IconLayoutGrid, IconList, IconPlus } from '@tabler/icons-react'
// import MainCard from '@/ui-component/cards/MainCard'
// import { StyledButton } from '@/ui-component/button/StyledButton'

// API
import chatflowsApi from '@/api/chatflows'
import marketplacesApi from '@/api/marketplaces'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL, AGENTFLOW_ICONS } from '@/store/constant'
import ErrorBoundary from '@/ErrorBoundary'

function TabPanel(props) {
    const { children, value, index, ...other } = props
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`agentflow-tabpanel-${index}`}
            aria-labelledby={`agentflow-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

const Agentflows = () => {
    const navigate = useNavigate()
    const theme = useTheme()

    const [tabValue, setTabValue] = useState(0)
    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [images, setImages] = useState({})
    const [icons, setIcons] = useState({})
    const [search, setSearch] = useState('')
    const [loginDialogOpen, setLoginDialogOpen] = useState(false)
    const [loginDialogProps, setLoginDialogProps] = useState({})

    const getAllAgentflows = useApi(chatflowsApi.getAllAgentflows)
    const getAllAgentflowsApi = useApi(chatflowsApi.getAllAgentflows)
    const getMarketplaceAgentflowsApi = useApi(marketplacesApi.getAllTemplatesFromMarketplaces)
    const [view, setView] = useState(localStorage.getItem('flowDisplayStyle') || 'card')
    const [agentflowVersion, setAgentflowVersion] = useState(localStorage.getItem('agentFlowVersion') || 'v2')

    // Missing state variables
    const [myAgentflows, setMyAgentflows] = useState([])
    const [answerAIAgentflows, setAnswerAIAgentflows] = useState([])
    const [communityAgentflows, setCommunityAgentflows] = useState([])
    const [nodeTypes, setNodeTypes] = useState({})
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [categories, setCategories] = useState(['All'])

    const handleChange = (event, nextView) => {
        if (nextView === null) return
        localStorage.setItem('flowDisplayStyle', nextView)
        setView(nextView)
    }

    const handleVersionChange = (event, nextView) => {
        if (nextView === null) return
        localStorage.setItem('agentFlowVersion', nextView)
        setAgentflowVersion(nextView)
        getAllAgentflows.request(nextView === 'v2' ? 'AGENTFLOW' : 'MULTIAGENT')
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    const filterFlows = useCallback(
        (data) => {
            if (!data) return false

            const name = data.name || data.templateName || ''
            const category = data.category || ''
            const id = data.id || ''
            const description = data.description || ''

            return (
                name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
                category.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
                id.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
                description.toLowerCase().indexOf(search.toLowerCase()) > -1
            )
        },
        [search]
    )

    const onLoginClick = (username, password) => {
        localStorage.setItem('username', username)
        localStorage.setItem('password', password)
        navigate(0)
    }

    const addNew = () => {
        if (agentflowVersion === 'v2') {
            navigate('/v2/agentcanvas')
        } else {
            navigate('/agentcanvas')
        }
    }

    const goToCanvas = (selectedAgentflow) => {
        if (selectedAgentflow.type === 'AGENTFLOW') {
            navigate(`/v2/agentcanvas/${selectedAgentflow.id}`)
        } else {
            navigate(`/agentcanvas/${selectedAgentflow.id}`)
        }
    }

    useEffect(() => {
        getAllAgentflows.request(agentflowVersion === 'v2' ? 'AGENTFLOW' : 'MULTIAGENT')
    }, [agentflowVersion])

    const handleCategoryChange = (event) => {
        setCategoryFilter(event.target.value)
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    const goToMarketplaceCanvas = (selectedAgentflow) => {
        if (selectedAgentflow.type === 'AgentflowV2') {
            navigate(`/v2/marketplace/${selectedAgentflow.id}`, { state: selectedAgentflow })
        } else {
            navigate(`/marketplace/${selectedAgentflow.id}`, { state: selectedAgentflow })
        }
    }

    // Process flow data function similar to chatflows
    const processFlowData = useCallback((flows) => {
        const processedImages = {}
        const processedNodeTypes = {}
        flows.forEach((flow) => {
            if (flow && flow.flowData) {
                const flowData = JSON.parse(flow.flowData)
                const nodes = flowData.nodes || []
                processedImages[flow.id] = []
                processedNodeTypes[flow.id] = []
                nodes.forEach((node) => {
                    if (['Agents', 'Chains', 'Chat Models', 'Tools', 'Document Loaders'].includes(node.data.category)) {
                        const imageSrc = `${baseURL}/api/v1/node-icon/${node.data.name}`
                        if (!processedImages[flow.id].includes(imageSrc)) {
                            processedImages[flow.id].push(imageSrc)
                            processedNodeTypes[flow.id].push(node.data.label)
                        }
                    }
                })
            }
        })
        return { processedImages, processedNodeTypes }
    }, [])

    useEffect(() => {
        getAllAgentflowsApi.request()
        getMarketplaceAgentflowsApi.request()
    }, [])

    useEffect(() => {
        if (getAllAgentflowsApi.error || getMarketplaceAgentflowsApi.error) {
            setError(getAllAgentflowsApi.error || getMarketplaceAgentflowsApi.error)
        }
    }, [getAllAgentflowsApi.error, getMarketplaceAgentflowsApi.error])

    useEffect(() => {
        setLoading(getAllAgentflowsApi.loading || getMarketplaceAgentflowsApi.loading)
    }, [getAllAgentflowsApi.loading, getMarketplaceAgentflowsApi.loading])

    useEffect(() => {
        if (getAllAgentflowsApi.data && getMarketplaceAgentflowsApi.data) {
            const myAgentflowsData = getAllAgentflowsApi.data
            const { processedImages: myImages, processedNodeTypes: myNodeTypes } = processFlowData(myAgentflowsData)
            setMyAgentflows(myAgentflowsData)

            const marketplaceAgentflows = getMarketplaceAgentflowsApi.data
            const answerAIFlows = marketplaceAgentflows.filter((flow) => flow.type === 'Agentflow')
            const communityFlows = marketplaceAgentflows.filter((flow) => flow.type === 'Agent Community')

            const { processedImages: answerAIImages, processedNodeTypes: answerAINodeTypes } = processFlowData(answerAIFlows)
            const { processedImages: communityImages, processedNodeTypes: communityNodeTypes } = processFlowData(communityFlows)

            setAnswerAIAgentflows(answerAIFlows)
            setCommunityAgentflows(communityFlows)

            setImages({ ...myImages, ...answerAIImages, ...communityImages })
            setNodeTypes({ ...myNodeTypes, ...answerAINodeTypes, ...communityNodeTypes })

            const allFlows = [...myAgentflowsData, ...answerAIFlows, ...communityFlows]
            const uniqueCategories = ['All', ...new Set(allFlows.flatMap((item) => (item?.category ? item.category.split(';') : [])))]
            setCategories(uniqueCategories)
        }
    }, [getAllAgentflowsApi.data, getMarketplaceAgentflowsApi.data, processFlowData])

    // Handle the original agentflows data for the main display (keeping existing logic)
    useEffect(() => {
        if (getAllAgentflows.data) {
            try {
                const agentflows = getAllAgentflows.data
                const images = {}
                const icons = {}
                for (let i = 0; i < agentflows.length; i += 1) {
                    const flowDataStr = agentflows[i].flowData
                    const flowData = JSON.parse(flowDataStr)
                    const nodes = flowData.nodes || []
                    images[agentflows[i].id] = []
                    icons[agentflows[i].id] = []
                    for (let j = 0; j < nodes.length; j += 1) {
                        const foundIcon = AGENTFLOW_ICONS.find((icon) => icon.name === nodes[j].data.name)
                        if (foundIcon) {
                            icons[agentflows[i].id].push(foundIcon)
                        } else {
                            const imageSrc = `${baseURL}/api/v1/node-icon/${nodes[j].data.name}`
                            if (!images[agentflows[i].id].includes(imageSrc)) {
                                images[agentflows[i].id].push(imageSrc)
                            }
                        }
                    }
                }
                setImages((prev) => ({ ...prev, ...images }))
                setIcons(icons)
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllAgentflows.data])

    // const filterFlows = (flows, search, categoryFilter) => {
    //     const searchRegex = new RegExp(search, 'i') // 'i' flag for case-insensitive search

    //     return flows.filter((flow) => {
    //         if (!flow) return false

    //         // Check category first
    //         const category = flow.category || ''
    //         if (categoryFilter !== 'All' && !category.includes(categoryFilter)) {
    //             return false
    //         }

    //         // If category matches, then check search
    //         const name = flow.name || flow.templateName || ''
    //         const description = flow.description || ''
    //         const searchText = `${name} ${description}`

    //         return searchRegex.test(searchText)
    //     })
    // }

    const filteredMyAgentflows = useMemo(() => {
        return myAgentflows.filter((flow) => {
            const matchesSearch = filterFlows(flow)
            const matchesCategory = categoryFilter === 'All' || (flow.category && flow.category.split(';').includes(categoryFilter))
            return matchesSearch && matchesCategory
        })
    }, [myAgentflows, search, categoryFilter, filterFlows])

    const filteredAnswerAIAgentflows = useMemo(() => {
        return answerAIAgentflows.filter((flow) => {
            const matchesSearch = filterFlows(flow)
            const matchesCategory = categoryFilter === 'All' || (flow.category && flow.category.split(';').includes(categoryFilter))
            return matchesSearch && matchesCategory
        })
    }, [answerAIAgentflows, search, categoryFilter, filterFlows])

    const filteredCommunityAgentflows = useMemo(() => {
        return communityAgentflows.filter((flow) => {
            const matchesSearch = filterFlows(flow)
            const matchesCategory = categoryFilter === 'All' || (flow.category && flow.category.split(';').includes(categoryFilter))
            return matchesSearch && matchesCategory
        })
    }, [communityAgentflows, search, categoryFilter, filterFlows])

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <>
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader
                            onSearchChange={onSearchChange}
                            search={true}
                            searchPlaceholder='Search Name or Category'
                            title='Agentflows'
                            description='Multi-agent systems, workflow orchestration'
                        >
                            <ToggleButtonGroup
                                sx={{ borderRadius: 2, maxHeight: 40 }}
                                value={agentflowVersion}
                                color='primary'
                                exclusive
                                onChange={handleVersionChange}
                            >
                                <ToggleButton
                                    sx={{
                                        borderColor: theme.palette.grey[900] + 25,
                                        borderRadius: 2,
                                        color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                                    }}
                                    variant='contained'
                                    value='v2'
                                    title='V2'
                                >
                                    <Chip sx={{ mr: 1 }} label='NEW' size='small' color='primary' />
                                    V2
                                </ToggleButton>
                                <ToggleButton
                                    sx={{
                                        borderColor: theme.palette.grey[900] + 25,
                                        borderRadius: 2,
                                        color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                                    }}
                                    variant='contained'
                                    value='v1'
                                    title='V1'
                                >
                                    V1
                                </ToggleButton>
                            </ToggleButtonGroup>
                            <ToggleButtonGroup
                                sx={{ borderRadius: 2, maxHeight: 40 }}
                                value={view}
                                color='primary'
                                exclusive
                                onChange={handleChange}
                            >
                                <ToggleButton
                                    sx={{
                                        borderColor: theme.palette.grey[900] + 25,
                                        borderRadius: 2,
                                        color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                                    }}
                                    variant='contained'
                                    value='card'
                                    title='Card View'
                                >
                                    <IconLayoutGrid />
                                </ToggleButton>
                                <ToggleButton
                                    sx={{
                                        borderColor: theme.palette.grey[900] + 25,
                                        borderRadius: 2,
                                        color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                                    }}
                                    variant='contained'
                                    value='list'
                                    title='List View'
                                >
                                    <IconList />
                                </ToggleButton>
                            </ToggleButtonGroup>
                            <StyledButton
                                variant='contained'
                                onClick={addNew}
                                startIcon={<IconPlus />}
                                sx={{ borderRadius: 2, height: 40 }}
                            >
                                Add New
                            </StyledButton>
                        </ViewHeader>
                        {!view || view === 'card' ? (
                            <>
                                {isLoading && !getAllAgentflows.data ? (
                                    <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                                        <Skeleton variant='rounded' height={160} />
                                        <Skeleton variant='rounded' height={160} />
                                        <Skeleton variant='rounded' height={160} />
                                    </Box>
                                ) : (
                                    <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                                        {getAllAgentflows.data?.filter(filterFlows).map((data, index) => (
                                            <ItemCard
                                                key={index}
                                                onClick={() => goToCanvas(data)}
                                                data={data}
                                                images={images[data.id]}
                                                icons={icons[data.id]}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </>
                        ) : (
                            <FlowListTable
                                isAgentCanvas={true}
                                data={getAllAgentflows.data}
                                images={images}
                                icons={icons}
                                isLoading={isLoading}
                                filterFunction={filterFlows}
                                updateFlowsApi={getAllAgentflows}
                                setError={setError}
                            />
                        )}
                        {!isLoading && (!getAllAgentflows.data || getAllAgentflows.data.length === 0) && (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                <Box sx={{ p: 2, height: 'auto' }}>
                                    <img
                                        style={{ objectFit: 'cover', height: '12vh', width: 'auto' }}
                                        src={AgentsEmptySVG}
                                        alt='AgentsEmptySVG'
                                    />
                                </Box>
                                <div>No Agents Yet</div>
                            </Stack>
                        )}
                    </Stack>

                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label='agentflow tabs'>
                            <Tab label='My Agentflows' />
                            <Tab label='AnswerAI Supported' />
                            <Tab label='Community' />
                        </Tabs>
                    </Box>
                    <TabPanel value={tabValue} index={0}>
                        <FlowListView
                            data={filteredMyAgentflows}
                            images={images}
                            nodeTypes={nodeTypes}
                            isLoading={isLoading}
                            updateFlowsApi={getAllAgentflowsApi}
                            setError={setError}
                            type='agentflows'
                            onItemClick={goToCanvas}
                        />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <FlowListView
                            data={filteredAnswerAIAgentflows}
                            images={images}
                            nodeTypes={nodeTypes}
                            isLoading={isLoading}
                            updateFlowsApi={getMarketplaceAgentflowsApi}
                            setError={setError}
                            type='marketplace'
                            onItemClick={goToMarketplaceCanvas}
                        />
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                        <FlowListView
                            data={filteredCommunityAgentflows}
                            images={images}
                            nodeTypes={nodeTypes}
                            isLoading={isLoading}
                            updateFlowsApi={getMarketplaceAgentflowsApi}
                            setError={setError}
                            type='marketplace'
                            onItemClick={goToMarketplaceCanvas}
                        />
                    </TabPanel>
                </>
            )}
        </MainCard>
    )
}

export default Agentflows
