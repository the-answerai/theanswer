import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Tabs, Tab, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import FlowListView from '@/ui-component/lists/FlowListView'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import MainCard from '@/ui-component/cards/MainCard'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { IconPlus } from '@tabler/icons-react'

// API
import chatflowsApi from '@/api/chatflows'
import marketplacesApi from '@/api/marketplaces'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL } from '@/store/constant'

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
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    )
}

const Agentflows = () => {
    const navigate = useNavigate()

    const [tabValue, setTabValue] = useState(0)
    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [images, setImages] = useState({})
    const [nodeTypes, setNodeTypes] = useState({})
    const [myAgentflows, setMyAgentflows] = useState([])
    const [answerAIAgentflows, setAnswerAIAgentflows] = useState([])
    const [communityAgentflows, setCommunityAgentflows] = useState([])

    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [categories, setCategories] = useState(['All'])

    const getAllAgentflowsApi = useApi(chatflowsApi.getAllAgentflows)
    const getMarketplaceAgentflowsApi = useApi(marketplacesApi.getAllTemplatesFromMarketplaces)

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    const addNew = () => {
        navigate('/agentcanvas')
    }

    const goToCanvas = (selectedAgentflow) => {
        navigate(`/agentcanvas/${selectedAgentflow.id}`)
    }

    const goToMarketplaceCanvas = (selectedAgentflow) => {
        navigate(`/marketplace/${selectedAgentflow.id}`, {
            state: selectedAgentflow
        })
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    const handleCategoryChange = (event) => {
        setCategoryFilter(event.target.value)
    }

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
            const processFlowData = (flows) => {
                const processedImages = {}
                const processedNodeTypes = {}
                flows.forEach((flow) => {
                    if (flow && flow.flowData) {
                        const flowData = JSON.parse(flow.flowData)
                        const nodes = flowData.nodes || []
                        processedImages[flow.id] = []
                        processedNodeTypes[flow.id] = []
                        nodes.forEach((node) => {
                            if (['Multi Agents', 'Chat Models', 'Tools', 'Document Loaders'].includes(node.data.category)) {
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
            }

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
    }, [getAllAgentflowsApi.data, getMarketplaceAgentflowsApi.data])

    const filteredMyAgentflows = useMemo(() => {
        return myAgentflows.filter((flow) => {
            const matchesSearch =
                flow.name.toLowerCase().includes(search.toLowerCase()) ||
                (flow.description && flow.description.toLowerCase().includes(search.toLowerCase()))
            const matchesCategory = categoryFilter === 'All' || (flow.category && flow.category.includes(categoryFilter))
            return matchesSearch && matchesCategory
        })
    }, [myAgentflows, search, categoryFilter])

    const filteredAnswerAIAgentflows = useMemo(() => {
        return answerAIAgentflows.filter((flow) => {
            const matchesSearch =
                flow.templateName.toLowerCase().includes(search.toLowerCase()) ||
                (flow.description && flow.description.toLowerCase().includes(search.toLowerCase()))
            const matchesCategory = categoryFilter === 'All' || (flow.category && flow.category.includes(categoryFilter))
            return matchesSearch && matchesCategory
        })
    }, [answerAIAgentflows, search, categoryFilter])

    const filteredCommunityAgentflows = useMemo(() => {
        return communityAgentflows.filter((flow) => {
            const matchesSearch =
                flow.templateName.toLowerCase().includes(search.toLowerCase()) ||
                (flow.description && flow.description.toLowerCase().includes(search.toLowerCase()))
            const matchesCategory = categoryFilter === 'All' || (flow.category && flow.category.includes(categoryFilter))
            return matchesSearch && matchesCategory
        })
    }, [communityAgentflows, search, categoryFilter])

    return (
        <MainCard>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ViewHeader
                    onSearchChange={onSearchChange}
                    search={true}
                    searchPlaceholder='Search Name, Description or Category'
                    title='Agentflows'
                >
                    <FormControl sx={{ minWidth: 120, mr: 1 }}>
                        <InputLabel id='category-filter-label'>Category</InputLabel>
                        <Select labelId='category-filter-label' value={categoryFilter} onChange={handleCategoryChange} label='Category'>
                            {categories.map((category) => (
                                <MenuItem key={category} value={category}>
                                    {category}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <StyledButton variant='contained' onClick={addNew} startIcon={<IconPlus />}>
                        Add New
                    </StyledButton>
                </ViewHeader>

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
            </Box>
        </MainCard>
    )
}

export default Agentflows
