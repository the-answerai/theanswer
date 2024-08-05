import PropTypes from 'prop-types'
import { useState, useEffect, useCallback } from 'react'
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
import JourneyItemSelectDialog from '@/ui-component/dialog/JourneyItemSelectDialog'
import useApi from '@/hooks/useApi'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import toolsApi from '@/api/tools'
import chatflowsApi from '@/api/chatflows'
import documentStoreApi from '@/api/documentstore'
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
    const getDocumentStoresApi = useApi(documentStoreApi.getAllDocumentStores)
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
    const stepTitles = [
        'Define Your Journey',
        'Select Sidekicks (Chatflows)',
        'Configure Document Loaders',
        'Select Tools',
        'Review Your Journey'
    ]

    useEffect(() => {
        if (open) {
            resetJourneyData()
            getToolsApi.request()
            getChatflowsApi.request()
            getDocumentStoresApi.request()
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
        if (open) {
            if (initialJourneyData) {
                setTitle(initialJourneyData.title || '')
                setGoal(initialJourneyData.goal || '')
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
                    documents: Array.isArray(initialJourneyData.documents)
                        ? initialJourneyData.documents
                        : initialJourneyData.documents
                        ? [initialJourneyData.documents]
                        : [],
                    tools: initialJourneyData.tools || [],
                    chatflows: initialJourneyData.chatflows || []
                })
            } else {
                resetJourneyData()
            }
            getToolsApi.request()
            getChatflowsApi.request()
            getDocumentStoresApi.request()
        }
    }, [open, initialJourneyData])

    useEffect(() => {
        if (getToolsApi.data) {
            console.log('Tools data received:', getToolsApi.data)
            // Don't set all tools as selected
        }
        if (getToolsApi.error) {
            console.error('Error fetching tools:', getToolsApi.error)
        }
    }, [getToolsApi.data, getToolsApi.error])

    useEffect(() => {
        if (getChatflowsApi.data) {
            console.log('Chatflows data received:', getChatflowsApi.data)
            // Don't set all chatflows as selected
        }
        if (getChatflowsApi.error) {
            console.error('Error fetching chatflows:', getChatflowsApi.error)
        }
    }, [getChatflowsApi.data, getChatflowsApi.error])

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

    const handleDocumentsSelected = useCallback(
        (selectedDocs) => {
            console.log('Documents selected:', selectedDocs)
            const docsArray = Array.isArray(selectedDocs) ? selectedDocs : [selectedDocs].filter(Boolean)
            setDocuments(docsArray)
            setJourneyData((prev) => ({
                ...prev,
                documents: docsArray.map((doc) => ({
                    name: doc.name,
                    iconSrc: `${baseURL}/api/v1/node-icon/${doc.name}`
                }))
            }))
        },
        [setJourneyData]
    )

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

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <>
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
                    </>
                )
            case 1:
                return (
                    <JourneyItemSelectDialog
                        show={true}
                        dialogProps={{ title: 'Select Sidekicks (Chatflows)' }}
                        onCancel={handleBack}
                        onItemsSelected={(chatflows) => setSelectedChatflows(chatflows)}
                        allowMultipleSelection={true}
                        selectedItems={selectedChatflows}
                        isInnerContent={true}
                        itemType='Sidekick'
                        items={getChatflowsApi.data || []}
                        loading={getChatflowsApi.loading}
                        error={getChatflowsApi.error}
                    />
                )
            case 2:
                return (
                    <JourneyItemSelectDialog
                        show={true}
                        dialogProps={{ title: 'Select Document Stores' }}
                        onCancel={handleBack}
                        onItemsSelected={handleDocumentsSelected}
                        allowMultipleSelection={true}
                        selectedItems={documents}
                        isInnerContent={true}
                        onCreateNew={() => {
                            console.log('Create new document store')
                        }}
                        itemType='Document Store'
                        items={getDocumentStoresApi.data || []}
                        loading={getDocumentStoresApi.loading}
                        error={getDocumentStoresApi.error}
                    />
                )
            case 3:
                return (
                    <JourneyItemSelectDialog
                        show={true}
                        dialogProps={{ title: 'Select Tools' }}
                        onCancel={handleBack}
                        onItemsSelected={(tools) => setSelectedTools(tools)}
                        allowMultipleSelection={true}
                        selectedItems={selectedTools}
                        isInnerContent={true}
                        itemType='Tool'
                        items={getToolsApi.data || []}
                        loading={getToolsApi.loading}
                        error={getToolsApi.error}
                    />
                )
            case 4:
                return (
                    <>
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
                            {documents.length > 0 ? (
                                documents.map((doc, index) => (
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
                            {selectedTools.length > 0 ? (
                                selectedTools.map((tool, index) => (
                                    <ListItem key={index}>
                                        <ListItemText primary={tool.name} />
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary='No tools selected' />
                                </ListItem>
                            )}
                        </List>
                        <Typography>
                            <strong>Sidekicks:</strong>
                        </Typography>
                        <List>
                            {selectedChatflows.length > 0 ? (
                                selectedChatflows.map((chatflow, index) => (
                                    <ListItem key={index}>
                                        <ListItemText primary={chatflow.name} />
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary='No sidekicks selected' />
                                </ListItem>
                            )}
                        </List>
                    </>
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>{initialJourneyData ? 'Edit Your Journey' : 'Set Up Your Journey'}</DialogTitle>
            <LinearProgress variant='determinate' value={(step / totalSteps) * 100} />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '70vh', p: 2 }}>
                <Box sx={{ flexGrow: 0, mb: 2 }}>
                    <Typography variant='h6' gutterBottom>
                        Step {step + 1} of {totalSteps}: {stepTitles[step]}
                    </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>{renderStepContent()}</Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button onClick={handleBack} disabled={step === 0}>
                        Back
                    </Button>
                    {step < totalSteps - 1 ? (
                        <Button
                            onClick={step === 0 ? handleTitleGoalSubmit : handleNext}
                            disabled={(step === 0 && (!title.trim() || !goal.trim())) || (step === 1 && selectedChatflows.length === 0)}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} color='primary'>
                            Start Journey
                        </Button>
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
