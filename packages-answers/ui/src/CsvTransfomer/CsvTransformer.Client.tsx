'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@utils/auth/aaiAuth0Client'
// Type declaration for the chatflows API module
declare module '@/api/chatflows' {
    interface ChatflowsApi {
        getAllChatflows: () => Promise<{ data: any[] }>
    }
    const chatflowsApi: ChatflowsApi
    export default chatflowsApi
}

import chatflowsApi from '@/api/chatflows'
// material-ui
import { Container, Box, Stack, Tabs, Tab, Typography, Alert, AlertTitle } from '@mui/material'

import ProcessCsv from './ProcessCsv'
import ProcessingHistory from './ProcessingHistory'

type WorkerBannerState = 'loading' | 'enabled' | 'disabled' | 'error'

function TabPanel(props: any) {
    const { children, currentValue, value, ...other } = props
    return (
        <div
            role='tabpanel'
            hidden={currentValue !== value}
            id={`admin-tabpanel-${value}`}
            aria-labelledby={`admin-tab-${value}`}
            {...other}
        >
            {currentValue === value && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    )
}

const CsvTransformer = () => {
    const { user, isLoading } = useUser()
    const [chatflows, setChatflows] = useState([])
    const [workerBanner, setWorkerBanner] = useState<WorkerBannerState>('loading')
    const searchParams = useSearchParams()
    const router = useRouter()
    const tab = searchParams.get('tab') ?? 'process'

    // Add a function to navigate to the history tab
    const navigateToHistory = () => {
        router.push('/sidekick-studio/csv-transformer?tab=history')
    }

    const fetchChatflows = useCallback(async () => {
        try {
            const { data } = await chatflowsApi.getAllChatflows()
            const filteredChatflows = (data ?? []).filter((chatflow: any) => chatflow.category?.toLowerCase()?.split(';')?.includes('csv'))
            setChatflows(filteredChatflows)
        } catch (error) {
            console.error('Failed to fetch chatflows:', error)
            setChatflows([])
        }
    }, [])

    useEffect(() => {
        fetchChatflows()
    }, [fetchChatflows])

    useEffect(() => {
        if (isLoading) return
        if (!user) {
            setWorkerBanner('error')
            return
        }
        let cancelled = false
        const loadWorkerStatus = async () => {
            const baseURL = sessionStorage.getItem('baseURL') || ''
            const token = sessionStorage.getItem('access_token')
            if (!baseURL || !token) {
                if (!cancelled) setWorkerBanner('error')
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/v1/csv-parser/worker-status`, {
                    headers: {
                        'x-request-from': 'aai',
                        Authorization: `Bearer ${token}`
                    }
                })
                if (!response.ok) throw new Error('worker-status failed')
                const data = (await response.json()) as { workerEnabled?: boolean }
                if (cancelled) return
                setWorkerBanner(data.workerEnabled ? 'enabled' : 'disabled')
            } catch {
                if (!cancelled) setWorkerBanner('error')
            }
        }
        loadWorkerStatus()
        return () => {
            cancelled = true
        }
    }, [isLoading, user])

    // Auto-refresh when user returns from marketplace (only if no CSV chatflows currently)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && chatflows.length === 0) {
                fetchChatflows()
            }
        }

        // Listen for visibility changes (user switching tabs/windows)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [chatflows.length, fetchChatflows])

    if (isLoading) {
        return (
            <Container>
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <Typography variant='h2' component='h1'>
                        AI CSV Transformer
                    </Typography>
                    <Typography>Loading...</Typography>
                </Stack>
            </Container>
        )
    }

    return (
        <Container>
            <Stack flexDirection='column' sx={{ gap: 3 }}>
                <Typography variant='h2' component='h1'>
                    AI CSV Transformer
                </Typography>
                {workerBanner === 'loading' && (
                    <Alert severity='info' variant='outlined'>
                        <AlertTitle>Checking worker status</AlertTitle>
                        Loading background CSV processing status from the API server…
                    </Alert>
                )}
                {workerBanner === 'enabled' && (
                    <Alert severity='success' variant='outlined'>
                        <AlertTitle>Background processing is enabled</AlertTitle>
                        Submitted CSVs will be picked up by the cron worker on the Flowise/API server (status from API).
                    </Alert>
                )}
                {workerBanner === 'disabled' && (
                    <Alert severity='warning' variant='outlined'>
                        <AlertTitle>Background processing is disabled</AlertTitle>
                        CSV runs can be created but will not be processed until <code>ENABLE_CSV_RUN_CRON=true</code> is set on the
                        Flowise/API server and that process is restarted.
                    </Alert>
                )}
                {workerBanner === 'error' && (
                    <Alert severity='warning' variant='outlined'>
                        <AlertTitle>Could not load worker status</AlertTitle>
                        The UI could not read CSV worker status from the API (session, network, or server error). Background processing may
                        still be enabled on the server.
                    </Alert>
                )}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tab} aria-label='admin tabs'>
                        <Tab label='Process CSV' value='process' component={Link} href='/sidekick-studio/csv-transformer?tab=process' />
                        <Tab
                            label='Processing History'
                            value='history'
                            component={Link}
                            href='/sidekick-studio/csv-transformer?tab=history'
                        />
                    </Tabs>
                </Box>
                <TabPanel currentValue={tab} value='process'>
                    <ProcessCsv
                        chatflows={chatflows}
                        user={user}
                        onNavigateToHistory={navigateToHistory}
                        onRefreshChatflows={fetchChatflows}
                    />
                </TabPanel>
                <TabPanel currentValue={tab} value='history'>
                    <ProcessingHistory user={user} />
                </TabPanel>
            </Stack>
        </Container>
    )
}

export default CsvTransformer
