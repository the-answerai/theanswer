import { Box, Typography, Paper, Tabs, Tab, Grid, IconButton, Tooltip } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DatasetIcon from '@mui/icons-material/Dataset'
import PropTypes from 'prop-types'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getApiUrl } from '../../config/api'

// Import chart components
import TagCategoryChart from './charts/TagCategoryChart'
import AgentLeaderboard from './charts/AgentLeaderboard'
import EscalationRateChart from './charts/EscalationRateChart'
import HandleTimeChart from './charts/HandleTimeChart'
import DispatchResolutionChart from './charts/DispatchResolutionChart'
import EscalationHotspots from './charts/EscalationHotspots'
import KnowledgeBasePerformance from './charts/KnowledgeBasePerformance'
import CustomerSatisfactionMetrics from './charts/CustomerSatisfactionMetrics'
import SentimentFlow from './charts/SentimentFlow'
import ComplaintResolution from './charts/ComplaintResolution'
import PeakCallHeatmap from './charts/PeakCallHeatmap'
import CallAbandonment from './charts/CallAbandonment'
import CallVolumeForecast from './charts/CallVolumeForecast'
import StaffingRecommendations from './charts/StaffingRecommendations'
// Import new chat chart components
import ChatEscalationRateOverTime from './charts/ChatEscalationRateOverTime'
import ChatCategoryDistribution from './charts/ChatCategoryDistribution'
import ChatPerformanceMetrics from './charts/ChatPerformanceMetrics'

// Sample data for charts
const sampleData = {
    agentPerformance: [
        {
            id: 1,
            name: 'John Smith',
            callsHandled: 245,
            resolutionRate: 92,
            avgSentiment: 8.5,
            escalationRate: 5,
            avgHandleTime: 12.3
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            callsHandled: 230,
            resolutionRate: 88,
            avgSentiment: 8.2,
            escalationRate: 7,
            avgHandleTime: 11.8
        },
        {
            id: 3,
            name: 'Michael Chen',
            callsHandled: 210,
            resolutionRate: 90,
            avgSentiment: 8.7,
            escalationRate: 4,
            avgHandleTime: 13.1
        }
    ],
    escalationRates: [
        { name: 'John Smith', rate: 5 },
        { name: 'Sarah Johnson', rate: 7 },
        { name: 'Michael Chen', rate: 4 }
    ],
    handleTimes: [
        { name: 'John Smith', time: 12.3 },
        { name: 'Sarah Johnson', time: 11.8 },
        { name: 'Michael Chen', time: 13.1 }
    ],
    dispatchResolution: [
        { name: 'Hardware Issues', rate: 85, total: 150, resolved: 127 },
        { name: 'Software Updates', rate: 78, total: 180, resolved: 140 },
        { name: 'Network Problems', rate: 72, total: 200, resolved: 144 },
        { name: 'System Maintenance', rate: 68, total: 120, resolved: 82 },
        { name: 'Equipment Replacement', rate: 65, total: 90, resolved: 58 }
    ],
    knowledgeBase: [
        { article: 'Password Reset Guide', views: 1250, successRate: 92 },
        { article: 'Billing FAQ', views: 980, successRate: 88 },
        { article: 'Product Setup Tutorial', views: 850, successRate: 85 },
        { article: 'Account Security Guide', views: 720, successRate: 90 },
        { article: 'Feature Comparison', views: 690, successRate: 87 }
    ],
    escalationTopics: [
        { topic: 'Technical Issues', count: 145, percentage: 35 },
        { topic: 'Billing Disputes', count: 98, percentage: 24 },
        { topic: 'Product Features', count: 67, percentage: 16 },
        { topic: 'Account Access', count: 54, percentage: 13 },
        { topic: 'Service Upgrade', count: 48, percentage: 12 }
    ],
    customerSatisfaction: [
        { month: 'Jan', nps: 65, csat: 78, callVolume: 840 },
        { month: 'Feb', nps: 68, csat: 82, callVolume: 920 },
        { month: 'Mar', nps: 72, csat: 85, callVolume: 880 },
        { month: 'Apr', nps: 70, csat: 83, callVolume: 950 },
        { month: 'May', nps: 75, csat: 88, callVolume: 890 }
    ],
    sentimentFlow: [
        {
            category: 'Technical Support',
            beforeSentiment: 4.2,
            afterSentiment: 8.1
        },
        { category: 'Billing Issues', beforeSentiment: 3.8, afterSentiment: 7.5 },
        {
            category: 'Product Questions',
            beforeSentiment: 5.5,
            afterSentiment: 8.7
        },
        { category: 'Account Access', beforeSentiment: 3.5, afterSentiment: 8.3 },
        { category: 'Service Changes', beforeSentiment: 5.0, afterSentiment: 8.9 }
    ],
    complaintResolution: [
        { priority: 'High', avgResolutionTime: 2.5, totalComplaints: 45 },
        { priority: 'Medium', avgResolutionTime: 8, totalComplaints: 78 },
        { priority: 'Low', avgResolutionTime: 24, totalComplaints: 120 }
    ],
    peakCallHeatmap: [
        {
            hour: '9AM',
            Mon: 45,
            Tue: 50,
            Wed: 55,
            Thu: 48,
            Fri: 52,
            Sat: 30,
            Sun: 25
        },
        {
            hour: '10AM',
            Mon: 65,
            Tue: 70,
            Wed: 75,
            Thu: 68,
            Fri: 72,
            Sat: 40,
            Sun: 35
        },
        {
            hour: '11AM',
            Mon: 85,
            Tue: 80,
            Wed: 88,
            Thu: 82,
            Fri: 84,
            Sat: 45,
            Sun: 40
        }
    ],
    callAbandonment: [
        { hour: '9AM', rate: 2.5, calls: 150 },
        { hour: '10AM', rate: 3.8, calls: 220 },
        { hour: '11AM', rate: 5.2, calls: 280 },
        { hour: '12PM', rate: 4.5, calls: 250 },
        { hour: '1PM', rate: 3.2, calls: 200 }
    ],
    staffingRecommendations: [
        'Peak hours are between 11AM-1PM, requiring maximum staff coverage',
        'Weekend staffing can be reduced by 40% based on call volumes',
        'Consider adding more staff on Wednesdays during peak hours',
        'Forecasted 12% increase in call volume over the next 4 weeks'
    ],
    // New chat analytics sample data
    chatEscalationOverTime: [
        { date: 'Jan', rate: 18 },
        { date: 'Feb', rate: 15 },
        { date: 'Mar', rate: 12 },
        { date: 'Apr', rate: 10 },
        { date: 'May', rate: 8 },
        { date: 'Jun', rate: 7 }
    ],
    chatCategoryDistribution: [
        { name: 'Account Issues', value: 120 },
        { name: 'Technical Support', value: 230 },
        { name: 'Billing Questions', value: 180 },
        { name: 'Product Inquiry', value: 150 },
        { name: 'Feature Requests', value: 85 }
    ],
    chatPerformanceMetrics: [
        {
            month: 'Jan',
            userSatisfaction: 82,
            responseTime: 5.2,
            messagingVolume: 3240
        },
        {
            month: 'Feb',
            userSatisfaction: 84,
            responseTime: 4.8,
            messagingVolume: 3780
        },
        {
            month: 'Mar',
            userSatisfaction: 87,
            responseTime: 4.5,
            messagingVolume: 4120
        },
        {
            month: 'Apr',
            userSatisfaction: 89,
            responseTime: 4.2,
            messagingVolume: 4580
        },
        {
            month: 'May',
            userSatisfaction: 92,
            responseTime: 3.8,
            messagingVolume: 5240
        }
    ]
}

// Add this component near the top, after the sampleData definition
const SampleDataIndicator = () => (
    <Tooltip title='Sample Chart. Charts are personalized and can be configured to use actual data during onboarding'>
        <DatasetIcon
            sx={{
                fontSize: '1rem',
                ml: 1,
                verticalAlign: 'middle',
                color: 'warning.main'
            }}
        />
    </Tooltip>
)

// Create a HOC to wrap charts with sample data indicator
const withSampleDataIndicator = (WrappedComponent) => {
    return function WithSampleDataIndicator(props) {
        return <WrappedComponent {...props} SampleDataIndicator={SampleDataIndicator} />
    }
}

// Wrap components that use sample data
const KnowledgeBasePerformanceWithIndicator = withSampleDataIndicator(KnowledgeBasePerformance)
const EscalationHotspotsWithIndicator = withSampleDataIndicator(EscalationHotspots)
const CustomerSatisfactionMetricsWithIndicator = withSampleDataIndicator(CustomerSatisfactionMetrics)
const SentimentFlowWithIndicator = withSampleDataIndicator(SentimentFlow)
const ComplaintResolutionWithIndicator = withSampleDataIndicator(ComplaintResolution)
const StaffingRecommendationsWithIndicator = withSampleDataIndicator(StaffingRecommendations)
const PeakCallHeatmapWithIndicator = withSampleDataIndicator(PeakCallHeatmap)
const CallAbandonmentWithIndicator = withSampleDataIndicator(CallAbandonment)
const CallVolumeForecastWithIndicator = withSampleDataIndicator(CallVolumeForecast)
// Wrap new chat components with sample data indicator
const ChatEscalationRateOverTimeWithIndicator = withSampleDataIndicator(ChatEscalationRateOverTime)
const ChatCategoryDistributionWithIndicator = withSampleDataIndicator(ChatCategoryDistribution)
const ChatPerformanceMetricsWithIndicator = withSampleDataIndicator(ChatPerformanceMetrics)

function TabPanel(props) {
    const { children, value, index, ...other } = props
    return (
        <div role='tabpanel' hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

export default function Dashboard() {
    const [tabValue, setTabValue] = useState(0)
    const [loading, setLoading] = useState(true)
    const [callDistributionData, setCallDistributionData] = useState({})
    const [totalCallCount, setTotalCallCount] = useState(0)
    const [agentPerformanceData, setAgentPerformanceData] = useState([])
    const [allCalls, setAllCalls] = useState([])
    const [tagStructure, setTagStructure] = useState([])
    const [error, setError] = useState(null)

    const processAgentPerformance = useMemo(
        () => (calls) => {
            const agentStats = {}

            // Process each call to calculate agent metrics
            for (const call of calls) {
                const employeeId = call.EMPLOYEE_ID || 'unassigned'
                const employeeName = call.EMPLOYEE_NAME || 'Unassigned'

                if (!agentStats[employeeId]) {
                    agentStats[employeeId] = {
                        id: employeeId,
                        name: employeeName,
                        callsHandled: 0,
                        resolvedCalls: 0,
                        dispatchCalls: 0,
                        resolvedDispatchCalls: 0,
                        totalSentiment: 0,
                        sentimentCount: 0,
                        escalatedCalls: 0,
                        totalHandleTime: 0
                    }
                }

                const agent = agentStats[employeeId]
                agent.callsHandled++

                if (call.resolution_status === 'resolved') {
                    agent.resolvedCalls++
                }

                // Count dispatch calls and their resolution
                if (call.resolution_status === 'dispatch') {
                    agent.dispatchCalls++
                    // A dispatch call is considered resolved if it has any resolution tag or is marked as resolved
                    const isResolved =
                        call.TAGS_ARRAY?.some((tag) => tag.startsWith('resolution-')) || call.resolution_status === 'resolved'
                    if (isResolved) {
                        agent.resolvedDispatchCalls++
                    }
                }

                if (call.sentiment_score) {
                    agent.totalSentiment += call.sentiment_score
                    agent.sentimentCount++
                }

                if (call.escalated) {
                    agent.escalatedCalls++
                }

                if (call.CALL_DURATION) {
                    agent.totalHandleTime += Number.parseFloat(call.CALL_DURATION)
                }
            }

            // Calculate final metrics for each agent
            return Object.values(agentStats).map((agent) => ({
                id: agent.id,
                name: agent.name,
                callsHandled: agent.callsHandled,
                resolutionRate: Math.round((agent.resolvedCalls / agent.callsHandled) * 100) || 0,
                dispatchResolutionRate: agent.dispatchCalls > 0 ? Math.round((agent.resolvedDispatchCalls / agent.dispatchCalls) * 100) : 0,
                avgSentiment: agent.sentimentCount > 0 ? Number.parseFloat((agent.totalSentiment / agent.sentimentCount).toFixed(1)) : 0,
                escalationRate: Math.round((agent.escalatedCalls / agent.callsHandled) * 100) || 0,
                avgHandleTime: agent.callsHandled > 0 ? Number.parseFloat((agent.totalHandleTime / agent.callsHandled / 60).toFixed(1)) : 0 // Convert to minutes
            }))
        },
        []
    ) // No dependencies needed as this is just a calculation function

    const fetchDashboardData = useCallback(
        async (forceRefresh = false) => {
            try {
                setLoading(true)
                setError(null)

                // Clear cache if force refresh
                if (forceRefresh) {
                    sessionStorage.removeItem('dashboardData')
                    sessionStorage.removeItem('tagStructure')
                    console.log('Forcing data refresh')
                } else {
                    // Check if we have cached data
                    const cachedData = sessionStorage.getItem('dashboardData')
                    const cachedTagStructure = sessionStorage.getItem('tagStructure')

                    if (cachedData && cachedTagStructure) {
                        const parsedData = JSON.parse(cachedData)
                        setCallDistributionData(parsedData.callDistributionData)
                        setTotalCallCount(parsedData.totalCallCount)
                        setAgentPerformanceData(parsedData.agentPerformanceData)
                        setAllCalls(parsedData.allCalls)
                        setTagStructure(JSON.parse(cachedTagStructure))
                        setLoading(false)
                        console.log('Using cached dashboard data')
                        return
                    }
                }

                // Fetch the tag structure from the API
                try {
                    const tagsResponse = await fetch(getApiUrl('api/tags'))

                    if (!tagsResponse.ok) {
                        throw new Error(`Failed to fetch tags: ${tagsResponse.status} ${tagsResponse.statusText}`)
                    }

                    const tagsData = await tagsResponse.json()

                    // Transform the tags data into a format compatible with our existing components
                    const transformedTagStructure = Object.keys(tagsData).map((categoryKey) => {
                        const category = tagsData[categoryKey]
                        return {
                            label: category.label,
                            slug: category.slug,
                            description: category.description,
                            color: category.color,
                            id: category.id,
                            children: Object.keys(category.subcategories).map((subKey) => {
                                const subcategory = category.subcategories[subKey]
                                return {
                                    label: subcategory.label,
                                    slug: subcategory.slug,
                                    description: subcategory.description,
                                    color: subcategory.color || category.color,
                                    id: subcategory.id
                                }
                            })
                        }
                    })

                    setTagStructure(transformedTagStructure)

                    // Cache the tag structure
                    sessionStorage.setItem('tagStructure', JSON.stringify(transformedTagStructure))
                    console.log('Tags fetched successfully:', transformedTagStructure)
                } catch (tagError) {
                    console.error('Error fetching tag structure:', tagError)
                    setError(`Failed to load tag structure: ${tagError.message}`)
                    // Continue with other data fetching even if tag fetch fails
                }

                // Fetch calls page by page until we have all data
                let allCalls = []
                let page = 0
                const pageSize = 1000
                let hasMoreData = true

                while (hasMoreData) {
                    const queryParams = new URLSearchParams({
                        tags: JSON.stringify([]),
                        pageSize,
                        page
                    })

                    const callsResponse = await fetch(getApiUrl(`api/calls?${queryParams}`))
                    const callsData = await callsResponse.json()

                    if (callsData.calls && callsData.calls.length > 0) {
                        allCalls = [...allCalls, ...callsData.calls]
                        page++
                        console.log(`Fetched ${allCalls.length} total calls so far...`)
                    } else {
                        hasMoreData = false
                    }
                }

                console.log(`Total calls fetched: ${allCalls.length}`)

                // Process agent performance data
                const agentPerformance = processAgentPerformance(allCalls)

                // Debug logging for dispatch calls
                console.log('Analyzing dispatch calls:')
                const dispatchCalls = allCalls.filter((call) => call.resolution_status === 'dispatch')
                console.log(`Total dispatch calls found: ${dispatchCalls.length}`)
                if (dispatchCalls.length > 0) {
                    console.log('Sample dispatch call:', dispatchCalls[0])
                    // Log all unique tags from dispatch calls
                    const allTags = new Set()
                    for (const call of dispatchCalls) {
                        if (call.TAGS_ARRAY) {
                            for (const tag of call.TAGS_ARRAY) {
                                allTags.add(tag)
                            }
                        }
                    }
                    console.log('All unique tags in dispatch calls:', Array.from(allTags))
                }

                const agentsWithDispatch = agentPerformance.filter((agent) => agent.dispatchCalls > 0)
                console.log(`Agents with dispatch calls: ${agentsWithDispatch.length}`)
                if (agentsWithDispatch.length > 0) {
                    console.log('Sample agent dispatch data:', agentsWithDispatch[0])
                }

                setAgentPerformanceData(agentPerformance)

                // Process data for each tag category
                const categoryData = {}

                for (const category of tagStructure) {
                    const subcategoryCounts = {}

                    // Initialize counts for all subcategories
                    for (const subcat of category.children) {
                        subcategoryCounts[subcat.slug] = 0
                    }

                    // Count occurrences of each subcategory
                    for (const call of allCalls) {
                        if (call.TAGS_ARRAY && Array.isArray(call.TAGS_ARRAY)) {
                            for (const tag of call.TAGS_ARRAY) {
                                if (Object.prototype.hasOwnProperty.call(subcategoryCounts, tag)) {
                                    subcategoryCounts[tag]++
                                }
                            }
                        }
                    }

                    // Transform the data for the chart
                    categoryData[category.slug] = category.children
                        .map((subcat) => ({
                            name: subcat.label,
                            value: subcategoryCounts[subcat.slug],
                            description: subcat.description,
                            color: subcat.color || category.color
                        }))
                        .sort((a, b) => b.value - a.value)
                }

                setCallDistributionData(categoryData)
                setTotalCallCount(allCalls.length)
                setAllCalls(allCalls)
                setLoading(false)

                // Cache the data (excluding allCalls to avoid quota issues)
                const cacheData = {
                    callDistributionData: categoryData,
                    totalCallCount: allCalls.length,
                    agentPerformanceData: agentPerformance
                }
                sessionStorage.setItem('dashboardData', JSON.stringify(cacheData))
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
                setError(`Failed to load dashboard data: ${error.message}`)
                setLoading(false)
            }
        },
        [processAgentPerformance, tagStructure]
    )

    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    if (loading) {
        return (
            <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
                <Typography variant='h6'>Loading dashboard data...</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                    Fetching and processing all call data. This may take a moment.
                </Typography>
            </Box>
        )
    }

    // Display error message if there was an error
    if (error) {
        return (
            <Box sx={{ width: '100%', p: 3, textAlign: 'center' }}>
                <Typography variant='h6' color='error'>
                    Error Loading Dashboard
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                    {error}
                </Typography>
                <Box mt={2}>
                    <IconButton onClick={() => fetchDashboardData(true)} color='primary' aria-label='retry'>
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>
        )
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box>
                        <Typography variant='h5' component='h2'>
                            Call Center Dashboard
                        </Typography>
                        {totalCallCount > 0 && (
                            <Typography variant='body2' color='text.secondary'>
                                Analyzing {totalCallCount.toLocaleString()} calls
                            </Typography>
                        )}
                    </Box>
                    <Tooltip title='Refresh'>
                        <IconButton
                            onClick={() => {
                                fetchDashboardData(true)
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            <Box mb={2} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label='High-Level Overview' />
                    <Tab label='Agent Performance' />
                    <Tab label='Call Resolution' />
                    <Tab label='Chat Insights' />
                    <Tab label='Customer Experience' />
                    <Tab label='Staffing & Scheduling' />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={2}>
                    {tagStructure.length > 0 ? (
                        tagStructure.map((category) => (
                            <Grid item xs={12} key={category.slug}>
                                <TagCategoryChart category={category} data={callDistributionData[category.slug] || []} />
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant='h6'>No Tag Categories Found</Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                    Please create tag categories in the Tag Management section to view call distribution data.
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <AgentLeaderboard data={agentPerformanceData || []} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <EscalationRateChart
                            data={(agentPerformanceData || []).map((agent) => ({
                                name: agent.name,
                                rate: agent.escalationRate
                            }))}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <HandleTimeChart
                            data={(agentPerformanceData || []).map((agent) => ({
                                name: agent.name,
                                time: agent.avgHandleTime
                            }))}
                        />
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <DispatchResolutionChart
                            data={(() => {
                                if (!allCalls || allCalls.length === 0) return []

                                // Group calls by employee
                                const employeeStats = {}

                                for (const call of allCalls) {
                                    const employeeName = call.EMPLOYEE_NAME || 'Unassigned'
                                    if (!employeeStats[employeeName]) {
                                        employeeStats[employeeName] = {
                                            totalCalls: 0,
                                            dispatchCalls: 0
                                        }
                                    }

                                    employeeStats[employeeName].totalCalls++
                                    if (call.resolution_status === 'dispatch') {
                                        employeeStats[employeeName].dispatchCalls++
                                    }
                                }

                                // Convert to array and calculate percentages
                                return Object.entries(employeeStats)
                                    .map(([name, stats]) => ({
                                        name,
                                        rate: Math.round((stats.dispatchCalls / stats.totalCalls) * 100),
                                        total: stats.totalCalls,
                                        resolved: stats.dispatchCalls // in this case, "resolved" represents dispatch calls
                                    }))
                                    .filter((employee) => employee.resolved > 0) // Only show employees with dispatch calls
                                    .sort((a, b) => b.rate - a.rate) // Sort by highest percentage first
                            })()}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <KnowledgeBasePerformanceWithIndicator data={sampleData.knowledgeBase} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <EscalationHotspotsWithIndicator data={sampleData.escalationTopics} />
                    </Grid>
                </Grid>
            </TabPanel>

            {/* New Tab for Chat Insights */}
            <TabPanel value={tabValue} index={3}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <ChatEscalationRateOverTimeWithIndicator data={sampleData.chatEscalationOverTime} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ChatCategoryDistributionWithIndicator data={sampleData.chatCategoryDistribution} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ChatPerformanceMetricsWithIndicator data={sampleData.chatPerformanceMetrics} />
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <CustomerSatisfactionMetricsWithIndicator data={sampleData.customerSatisfaction} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <SentimentFlowWithIndicator data={sampleData.sentimentFlow} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ComplaintResolutionWithIndicator data={sampleData.complaintResolution} />
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={5}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <StaffingRecommendationsWithIndicator recommendations={sampleData.staffingRecommendations} />
                    </Grid>
                    <Grid item xs={12}>
                        <PeakCallHeatmapWithIndicator data={sampleData.peakCallHeatmap} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CallAbandonmentWithIndicator data={sampleData.callAbandonment} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CallVolumeForecastWithIndicator />
                    </Grid>
                </Grid>
            </TabPanel>
        </Box>
    )
}
