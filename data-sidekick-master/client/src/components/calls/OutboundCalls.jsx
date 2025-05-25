import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import { getApiUrl } from '../../config/api'

function OutboundCalls() {
    const [twilioNumbers, setTwilioNumbers] = useState([])
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [testNumber, setTestNumber] = useState('+14155968024')
    const [numberAssignments, setNumberAssignments] = useState({})

    useEffect(() => {
        fetchTwilioNumbers()
        fetchAgents()
    }, [])

    const formatToE164 = (phoneNumber) => {
        // Remove non-digit characters
        const digits = phoneNumber.replace(/\D/g, '')
        // If the number doesn't start with '+', assume +1 (US)
        if (!phoneNumber.startsWith('+')) {
            return `+1${digits}`
        }
        return `+${digits}`
    }

    const fetchTwilioNumbers = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(getApiUrl('api/twilio-numbers'))
            if (!response.ok) {
                throw new Error('Failed to fetch Twilio numbers')
            }
            const data = await response.json()
            setTwilioNumbers(data)
        } catch (err) {
            console.error('Error fetching Twilio numbers:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchAgents = async () => {
        try {
            const response = await fetch(getApiUrl('api/elevenlabs-agents'))
            if (!response.ok) {
                throw new Error('Failed to fetch ElevenLabs agents')
            }
            const data = await response.json()
            setAgents(data)
        } catch (err) {
            console.error('Error fetching agents:', err)
            setError(err.message)
        }
    }

    const handleAssignAgent = (twilioNumber, agentId) => {
        setNumberAssignments((prev) => ({
            ...prev,
            [twilioNumber]: agentId
        }))
    }

    const handleCall = async (twilioNumber) => {
        try {
            if (!testNumber) {
                alert('Please enter a test number to call')
                return
            }

            const agentId = numberAssignments[twilioNumber]
            if (!agentId) {
                alert('Please assign an agent to this number first')
                return
            }

            const formattedNumber = formatToE164(testNumber)
            console.log('Initiating call with data:', {
                phoneNumber: formattedNumber,
                fromNumber: twilioNumber,
                agentId: agentId
            })

            const response = await fetch(getApiUrl('api/make-call'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: formattedNumber,
                    fromNumber: twilioNumber,
                    agentId: agentId
                })
            })

            if (!response.ok) {
                const errorMsg = await response.text()
                throw new Error(`Failed to initiate call. Server responded with: ${errorMsg}`)
            }

            const data = await response.json()
            console.log('Server response for make-call:', data)

            alert('Call initiated successfully!')
        } catch (err) {
            console.error('Error making call:', err)
            alert(`Failed to initiate call. Error: ${err.message}`)
        }
    }

    if (loading) {
        return (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color='error'>Error: {error}</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant='h4' gutterBottom>
                Outbound Calls
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant='h6' gutterBottom>
                    Test Number
                </Typography>
                <TextField
                    fullWidth
                    label='Enter number to call'
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder='+1234567890'
                    sx={{ mb: 2 }}
                />
            </Paper>

            <Paper sx={{ mt: 2 }}>
                <List>
                    {twilioNumbers.map((number) => (
                        <ListItem
                            key={number.sid}
                            secondaryAction={
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <FormControl sx={{ minWidth: 200 }}>
                                        <InputLabel>Assign Agent</InputLabel>
                                        <Select
                                            value={numberAssignments[number.phoneNumber] || ''}
                                            onChange={(e) => handleAssignAgent(number.phoneNumber, e.target.value)}
                                            label='Assign Agent'
                                        >
                                            {agents.map((agent) => (
                                                <MenuItem key={agent.agent_id} value={agent.agent_id}>
                                                    {agent.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <IconButton
                                        edge='end'
                                        aria-label='call'
                                        onClick={() => handleCall(number.phoneNumber)}
                                        color='primary'
                                        disabled={!numberAssignments[number.phoneNumber] || !testNumber}
                                    >
                                        <PhoneIcon />
                                    </IconButton>
                                </Box>
                            }
                        >
                            <ListItemText primary={number.phoneNumber} secondary={`Name: ${number.friendlyName}`} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    )
}

export default OutboundCalls
