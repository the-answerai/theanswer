import { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Typography
} from '@mui/material'

const JourneySummaryDialog = ({ open, onClose, journeyDetails, onUpdate }) => {
    const [editedDetails, setEditedDetails] = useState(journeyDetails)

    const handleInputChange = (e) => {
        setEditedDetails({
            ...editedDetails,
            [e.target.name]: e.target.value
        })
    }

    const handleSave = () => {
        onUpdate(editedDetails)
        onClose()
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>Journey Summary</DialogTitle>
            <DialogContent>
                <TextField fullWidth margin='normal' label='Title' name='title' value={editedDetails.title} onChange={handleInputChange} />
                <TextField
                    fullWidth
                    margin='normal'
                    label='Goal'
                    name='goal'
                    value={editedDetails.goal}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                />
                <Typography variant='h6' gutterBottom>
                    Documents
                </Typography>
                <List>
                    {editedDetails.documents.map((doc, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={doc} />
                        </ListItem>
                    ))}
                </List>
                <Typography variant='h6' gutterBottom>
                    Tools
                </Typography>
                <List>
                    {editedDetails.tools.map((tool, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={tool} />
                        </ListItem>
                    ))}
                </List>
                <Typography variant='h6' gutterBottom>
                    Sidekicks
                </Typography>
                <List>
                    {editedDetails.sidekicks.map((sidekick, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={sidekick} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} color='primary'>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default JourneySummaryDialog
