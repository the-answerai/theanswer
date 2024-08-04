import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Tabs, Tab, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { IconPlus } from '@tabler/icons-react'
import FlowListView from '@/ui-component/lists/FlowListView'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import MainCard from '@/ui-component/cards/MainCard'
import { StyledButton } from '@/ui-component/button/StyledButton'
import JourneySetupDialog from '@/ui-component/dialog/JourneySetupDialog'
import JourneyCard from '@/ui-component/cards/JourneyCard'

// API
import journeysApi from '@/api/journeys'

// Hooks
import useApi from '@/hooks/useApi'

function TabPanel(props) {
    const { children, value, index, ...other } = props
    return (
        <div role='tabpanel' hidden={value !== index} id={`journey-tabpanel-${index}`} aria-labelledby={`journey-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    )
}

const Journeys = () => {
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(0)
    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [journeys, setJourneys] = useState([])
    const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [categories, setCategories] = useState(['All'])

    const getAllJourneysApi = useApi(journeysApi.getAllJourneys)

    useEffect(() => {
        getAllJourneysApi.request()
    }, [])

    useEffect(() => {
        if (getAllJourneysApi.error) {
            setError(getAllJourneysApi.error)
        }
    }, [getAllJourneysApi.error])

    useEffect(() => {
        setLoading(getAllJourneysApi.loading)
    }, [getAllJourneysApi.loading])

    useEffect(() => {
        if (getAllJourneysApi.data) {
            setJourneys(getAllJourneysApi.data)
            const uniqueCategories = [
                'All',
                ...new Set(getAllJourneysApi.data.flatMap((item) => (item?.category ? item.category.split(';') : [])))
            ]
            setCategories(uniqueCategories)
        }
    }, [getAllJourneysApi.data])

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    const handleOpenSetupDialog = () => {
        setIsSetupDialogOpen(true)
    }

    const handleCloseSetupDialog = () => {
        setIsSetupDialogOpen(false)
    }

    const handleJourneySetupComplete = (newJourneyDetails) => {
        setIsSetupDialogOpen(false)
        navigate(`/journeys/${newJourneyDetails.id}`)
    }

    const goToJourneyDetails = (selectedJourney) => {
        navigate(`/journeys/${selectedJourney.id}`)
    }

    const onSearchChange = (event) => {
        setSearch(event.target.value)
    }

    const handleCategoryChange = (event) => {
        setCategoryFilter(event.target.value)
    }

    const filterJourneys = (journeys, search, categoryFilter) => {
        const searchRegex = new RegExp(search, 'i')

        return journeys.filter((journey) => {
            if (!journey) return false

            const category = journey.category || ''
            if (categoryFilter !== 'All' && !category.includes(categoryFilter)) {
                return false
            }

            const name = journey.title || ''
            const description = journey.goal || ''
            const searchText = `${name} ${description}`

            return searchRegex.test(searchText)
        })
    }

    const currentJourneys = useMemo(() => journeys.filter((journey) => !journey.completedAt), [journeys])
    const pastJourneys = useMemo(() => journeys.filter((journey) => journey.completedAt), [journeys])

    const filteredCurrentJourneys = useMemo(
        () => filterJourneys(currentJourneys, search, categoryFilter),
        [currentJourneys, search, categoryFilter]
    )

    const filteredPastJourneys = useMemo(() => filterJourneys(pastJourneys, search, categoryFilter), [pastJourneys, search, categoryFilter])

    const renderJourneyCard = ({ item, images, nodeTypes, onClick, type, updateFlowsApi, setError }) => (
        <JourneyCard
            data={item}
            images={images}
            nodeTypes={nodeTypes}
            onClick={onClick}
            type={type}
            updateFlowsApi={updateFlowsApi}
            setError={setError}
        />
    )

    return (
        <MainCard>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ViewHeader
                    onSearchChange={onSearchChange}
                    search={true}
                    searchPlaceholder='Search Name, Description or Category'
                    title='Journeys'
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
                    <StyledButton variant='contained' onClick={handleOpenSetupDialog} startIcon={<IconPlus />}>
                        Add Journey
                    </StyledButton>
                </ViewHeader>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label='journey tabs'>
                        <Tab label='Current Journeys' />
                        <Tab label='Past Journeys' />
                    </Tabs>
                </Box>
                <TabPanel value={tabValue} index={0}>
                    <FlowListView
                        data={filteredCurrentJourneys}
                        isLoading={isLoading}
                        updateFlowsApi={getAllJourneysApi}
                        setError={setError}
                        type='journeys'
                        onItemClick={goToJourneyDetails}
                        renderItem={renderJourneyCard}
                    />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <FlowListView
                        data={filteredPastJourneys}
                        isLoading={isLoading}
                        updateFlowsApi={getAllJourneysApi}
                        setError={setError}
                        type='journeys'
                        onItemClick={goToJourneyDetails}
                        renderItem={renderJourneyCard}
                    />
                </TabPanel>
            </Box>

            <JourneySetupDialog open={isSetupDialogOpen} onClose={handleCloseSetupDialog} onComplete={handleJourneySetupComplete} />
        </MainCard>
    )
}

export default Journeys
