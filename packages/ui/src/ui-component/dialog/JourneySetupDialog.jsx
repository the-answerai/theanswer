import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    TextField,
    LinearProgress,
    List,
    ListItem,
    ListItemText
} from '@mui/material'
import DocumentLoaderListDialog from '@/views/docstore/DocumentLoaderListDialog'
import FlowListView from '@/ui-component/lists/FlowListView'
import useApi from '@/hooks/useApi'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import toolsApi from '@/api/tools'
import chatflowsApi from '@/api/chatflows'
import journeysApi from '@/api/journeys'
import { baseURL } from '@/store/constant'
import ItemCard from '@/ui-component/cards/ItemCard'

const JourneySetupDialog = ({ open, onClose, onComplete, journeyData: initialJourneyData }) => {
    const [step, setStep] = useState(0)
    const [title, setTitle] = useState('')
    const [goal, setGoal] = useState('')
    const [documents, setDocuments] = useState([])
    const [selectedTools, setSelectedTools] = useState([])
    const [selectedChatflows, setSelectedChatflows] = useState([])
    const getToolsApi = useApi(toolsApi.getAllTools)
    const getChatflowsApi = useApi(chatflowsApi.getAllChatflows)
    const [tools, setTools] = useState([])
    const [chatflows, setChatflows] = useState([])
    const createJourneyApi = useApi(journeysApi.createNewJourney)
    const updateJourneyApi = useApi(journeysApi.updateJourney)
    const [journeyData, setJourneyData] = useLocalStorage('journeySetupData', {
        title: '',
        goal: '',
        documents: [],
        tools: [],
        chatflows: []
    })

    const resetJourneyData = () => {
        setStep(0)
        setTitle('')
        setGoal('')
        setDocuments([])
        setSelectedTools([])
        setSelectedChatflows([])
        setJourneyData({
            title: '',
            goal: '',
            documents: [],
            tools: [],
            chatflows: []
        })
    }

    const renderItem = ({ item, onClick, type, updateFlowsApi, setError }) => {
        return <ItemCard data={item} onClick={onClick} type={type} updateFlowsApi={updateFlowsApi} setError={setError} />
    }

    const totalSteps = 5

    useEffect(() => {
        if (open) {
            resetJourneyData()
            getToolsApi.request()
            getChatflowsApi.request()
        }
    }, [open])

    useEffect(() => {
        if (createJourneyApi.data) {
            onComplete(createJourneyApi.data)
            onClose()
        } else if (createJourneyApi.error) {
            console.error('Error saving journey:', createJourneyApi.error)
            // You might want to show an error message to the user here
        }
    }, [createJourneyApi.data, createJourneyApi.error])

    useEffect(() => {
        if (open && initialJourneyData) {
            setTitle(initialJourneyData.title || '')
            setGoal(initialJourneyData.goal || '')
            // Ensure documents is always an array
            setDocuments(
                Array.isArray(initialJourneyData.documents)
                    ? initialJourneyData.documents
                    : initialJourneyData.documents
                    ? [initialJourneyData.documents]
                    : []
            )
            setSelectedTools(initialJourneyData.tools || [])
            setSelectedChatflows(initialJourneyData.chatflows || [])
            setJourneyData({
                title: initialJourneyData.title || '',
                goal: initialJourneyData.goal || '',
                // Ensure documents is always an array
                documents: Array.isArray(initialJourneyData.documents)
                    ? initialJourneyData.documents
                    : initialJourneyData.documents
                    ? [initialJourneyData.documents]
                    : [],
                tools: initialJourneyData.tools || [],
                chatflows: initialJourneyData.chatflows || []
            })
        } else if (open) {
            resetJourneyData()
        }
        // ... rest of the effect ...
    }, [open, initialJourneyData])

    useEffect(() => {
        if (getToolsApi.data) setTools(getToolsApi.data)
    }, [getToolsApi.data])

    useEffect(() => {
        if (getChatflowsApi.data) setChatflows(getChatflowsApi.data)
    }, [getChatflowsApi.data])

    const handleNext = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)

    const handleTitleGoalSubmit = () => {
        if (title.trim() && goal.trim()) {
            setJourneyData((prev) => ({
                ...prev,
                title: title.trim(),
                goal: goal.trim()
            }))
            handleNext()
        }
    }

    const handleDocumentsSelected = (selectedDocs) => {
        // Ensure selectedDocs is always an array
        const docsArray = Array.isArray(selectedDocs) ? selectedDocs : [selectedDocs].filter(Boolean)

        setDocuments(docsArray)
        setJourneyData((prev) => ({
            ...prev,
            documents: docsArray.map((doc) => ({
                name: doc.name,
                iconSrc: `${baseURL}/api/v1/node-icon/${doc.name}`
            }))
        }))
        handleNext()
    }

    const handleToolToggle = (tool) => {
        const updatedTools = selectedTools.includes(tool) ? selectedTools.filter((t) => t !== tool) : [...selectedTools, tool]

        setSelectedTools(updatedTools)
        setJourneyData((prev) => ({
            ...prev,
            tools: updatedTools.map((t) => ({
                name: t.name,
                iconSrc: t.iconSrc || `${baseURL}/api/v1/node-icon/${t.name}`
            }))
        }))
    }

    const handleChatflowToggle = (chatflow) => {
        const updatedChatflows = selectedChatflows.includes(chatflow)
            ? selectedChatflows.filter((c) => c !== chatflow)
            : [...selectedChatflows, chatflow]

        setSelectedChatflows(updatedChatflows)
        setJourneyData((prev) => ({
            ...prev,
            chatflows: updatedChatflows.map((c) => ({
                // Change this from 'sidekicks' to 'chatflows'
                name: c.name,
                iconSrc: c.iconSrc || `${baseURL || ''}/api/v1/node-icon/${c.name}`
            }))
        }))
    }

    const handleFinish = () => {
        setStep(totalSteps - 1) // Move to the summary step instead of closing
    }

    const handleSubmit = async () => {
        const finalJourneyData = {
            ...journeyData,
            title,
            goal,
            documents: Array.isArray(documents) ? documents : documents ? [documents] : [],
            tools: selectedTools,
            chatflows: selectedChatflows
        }
        setJourneyData(finalJourneyData)
        console.log('Submitting journey data:', finalJourneyData)

        try {
            let response
            if (initialJourneyData && initialJourneyData.id) {
                console.log('Updating existing journey')
                response = await updateJourneyApi.request(initialJourneyData.id, finalJourneyData)
            } else {
                console.log('Creating new journey')
                response = await createJourneyApi.request(finalJourneyData)
            }
            console.log('Journey API response:', response)
            onComplete(response)
            onClose()
        } catch (error) {
            console.error('Error saving journey:', error)
            // You might want to show an error message to the user here
        }
    }

    const progress = (step / totalSteps) * 100

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>{initialJourneyData ? 'Edit Your Journey' : 'Set Up Your Journey'}</DialogTitle>
            <LinearProgress variant='determinate' value={progress} />
            <DialogContent>
                <Box sx={{ width: '100%', typography: 'body1' }}>
                    {step === 0 && (
                        <>
                            <Typography variant='h6' gutterBottom>
                                Step 1: Define Your Journey
                            </Typography>
                            <TextField
                                fullWidth
                                label='Journey Title'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                margin='normal'
                            />
                            <TextField
                                fullWidth
                                label='Journey Goal'
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                margin='normal'
                                multiline
                                rows={3}
                            />
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={handleTitleGoalSubmit} disabled={!title.trim() || !goal.trim()}>
                                    Next
                                </Button>
                            </Box>
                        </>
                    )}
                    {step === 1 && (
                        <>
                            <Typography variant='h6' gutterBottom>
                                Step 2: Configure Document Loaders
                            </Typography>
                            <DocumentLoaderListDialog
                                show={true}
                                dialogProps={{}}
                                onCancel={handleBack}
                                onDocLoaderSelected={handleDocumentsSelected}
                            />
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <Typography variant='h6' gutterBottom>
                                Step 3: Select Tools
                            </Typography>
                            {getToolsApi.loading ? (
                                <Typography>Loading tools...</Typography>
                            ) : tools.length > 0 ? (
                                <FlowListView
                                    data={tools}
                                    isLoading={false}
                                    updateFlowsApi={getToolsApi}
                                    setError={() => {}}
                                    type='tools'
                                    onItemClick={handleToolToggle}
                                    selectedItems={selectedTools}
                                    renderItem={renderItem}
                                />
                            ) : (
                                <Typography>No tools available</Typography>
                            )}
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Button onClick={handleBack}>Back</Button>
                                <Button onClick={handleNext}>Next</Button>
                            </Box>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <Typography variant='h6' gutterBottom>
                                Step 4: Select Sidekicks (Chatflows)
                            </Typography>
                            {getChatflowsApi.loading ? (
                                <Typography>Loading chatflows...</Typography>
                            ) : chatflows.length > 0 ? (
                                <FlowListView
                                    data={chatflows}
                                    isLoading={false}
                                    updateFlowsApi={getChatflowsApi}
                                    setError={() => {}}
                                    type='chatflows'
                                    onItemClick={handleChatflowToggle}
                                    selectedItems={selectedChatflows}
                                    renderItem={renderItem}
                                />
                            ) : (
                                <Typography>No chatflows available</Typography>
                            )}
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Button onClick={handleBack}>Back</Button>
                                <Button onClick={handleFinish} disabled={selectedChatflows.length === 0}>
                                    Review Journey
                                </Button>
                            </Box>
                        </>
                    )}
                    {step === 4 && (
                        <>
                            <Typography variant='h6' gutterBottom>
                                Step 5: Review Your Journey
                            </Typography>
                            <Typography>
                                <strong>Title:</strong> {title}
                            </Typography>
                            <Typography>
                                <strong>Goal:</strong> {goal}
                            </Typography>
                            <Typography>
                                <strong>Documents:</strong>
                            </Typography>
                            <List>
                                {Array.isArray(journeyData.documents) && journeyData.documents.length > 0 ? (
                                    journeyData.documents.map((doc, index) => (
                                        <ListItem key={index}>
                                            <ListItemText primary={doc.name} />
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText primary='No documents selected' />
                                    </ListItem>
                                )}
                            </List>
                            <Typography>
                                <strong>Tools:</strong>
                            </Typography>
                            <List>
                                {journeyData.tools.map((tool, index) => (
                                    <ListItem key={index}>
                                        <ListItemText primary={tool.name} />
                                    </ListItem>
                                ))}
                            </List>
                            <Typography>
                                <strong>Sidekicks:</strong>
                            </Typography>
                            <List>
                                {journeyData.chatflows.map((sidekick, index) => (
                                    <ListItem key={index}>
                                        <ListItemText primary={sidekick.name} />
                                    </ListItem>
                                ))}
                            </List>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Button onClick={handleBack}>Back</Button>
                                <Button onClick={handleSubmit} color='primary'>
                                    Start Journey
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    )
}

JourneySetupDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onComplete: PropTypes.func.isRequired,
    journeyData: PropTypes.object
}

export default JourneySetupDialog
