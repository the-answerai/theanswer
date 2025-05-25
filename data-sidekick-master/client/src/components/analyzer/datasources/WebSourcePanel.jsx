import { useState } from 'react'
import { Box, Typography, TextField, Button, DialogContent, DialogActions, Dialog, DialogTitle } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import PropTypes from 'prop-types'

const WebSourcePanel = ({ onAdd, onClose, isOpen }) => {
    const [formData, setFormData] = useState({
        url: '',
        filterPaths: ''
    })

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    // Submit the form to add a web source
    const handleAddSource = () => {
        if (!formData.url.trim()) {
            // Validation error
            return
        }

        // Convert paths string to array if not empty
        const filterPaths = formData.filterPaths.trim() ? formData.filterPaths.split(',').map((path) => path.trim()) : null

        // Prepare data
        const payload = {
            sourceType: 'website',
            url: formData.url.trim(),
            filterPaths
        }

        onAdd(payload)
    }

    const handleCancel = () => {
        setFormData({
            url: '',
            filterPaths: ''
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth='md'>
            <DialogTitle>Add Web Source</DialogTitle>
            <DialogContent sx={{ minWidth: 500 }}>
                <Box mt={1}>
                    <Box display='flex' alignItems='center' mb={2}>
                        <LanguageIcon color='primary' sx={{ mr: 1, fontSize: 30 }} />
                        <Typography variant='h6'>Website Configuration</Typography>
                    </Box>

                    <TextField
                        margin='normal'
                        name='url'
                        label='Website URL'
                        fullWidth
                        variant='outlined'
                        value={formData.url}
                        onChange={handleInputChange}
                        placeholder='https://example.com'
                        required
                    />

                    <Typography variant='subtitle1' mt={3} mb={1}>
                        Optional Filters
                    </Typography>

                    <TextField
                        margin='normal'
                        name='filterPaths'
                        label='Path Filters (comma-separated)'
                        fullWidth
                        variant='outlined'
                        value={formData.filterPaths}
                        onChange={handleInputChange}
                        placeholder='/blog, /docs'
                        helperText='Only crawl pages under these paths'
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleAddSource} variant='contained'>
                    Add Source
                </Button>
            </DialogActions>
        </Dialog>
    )
}

WebSourcePanel.propTypes = {
    onAdd: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired
}

export default WebSourcePanel
