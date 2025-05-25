import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Chip,
    Typography,
    Alert
} from '@mui/material'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

function FAQEditDialog({ open, onClose, faq, tagCategories, onSave }) {
    const [formData, setFormData] = useState({
        question: '',
        internal_notes: '',
        reasoning: '',
        status: '',
        tags: []
    })
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (faq) {
            setFormData({
                question: faq.question || '',
                internal_notes: faq.internal_notes || '',
                reasoning: faq.reasoning || '',
                status: faq.status || 'new',
                tags: faq.original_tags || []
            })
        }
    }, [faq])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleTagToggle = (tag) => {
        setFormData((prev) => {
            const currentTags = prev.tags || []
            const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag]
            return {
                ...prev,
                tags: newTags
            }
        })
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setError(null)
            await onSave(formData)
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const statusOptions = {
        new: { label: 'New', color: '#2196f3' },
        approved: { label: 'Approved', color: '#4caf50' },
        ignored: { label: 'Ignored', color: '#f44336' }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {error && (
                        <Grid item xs={12}>
                            <Alert severity='error'>{error}</Alert>
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Question'
                            name='question'
                            value={formData.question}
                            onChange={handleInputChange}
                            required
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Additional Context'
                            name='reasoning'
                            value={formData.reasoning}
                            onChange={handleInputChange}
                            multiline
                            rows={3}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Internal Notes'
                            name='internal_notes'
                            value={formData.internal_notes}
                            onChange={handleInputChange}
                            multiline
                            rows={3}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select name='status' value={formData.status} label='Status' onChange={handleInputChange}>
                                {Object.entries(statusOptions).map(([value, { label }]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant='subtitle1' gutterBottom>
                            Tags
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(tagCategories)
                                .filter(([key]) => key === 'issue-type')
                                .map(([categoryKey, category]) =>
                                    Object.entries(category.subcategories || {}).map(([subKey, subCategory]) => (
                                        <Chip
                                            key={subKey}
                                            label={subCategory.label}
                                            onClick={() => handleTagToggle(subKey)}
                                            sx={{
                                                bgcolor: formData.tags?.includes(subKey) ? `${subCategory.color}22` : 'transparent',
                                                border: `1px solid ${subCategory.color}`,
                                                color: formData.tags?.includes(subKey) ? subCategory.color : 'text.primary',
                                                '&:hover': {
                                                    bgcolor: `${subCategory.color}33`
                                                }
                                            }}
                                            variant={formData.tags?.includes(subKey) ? 'filled' : 'outlined'}
                                        />
                                    ))
                                )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant='contained' disabled={isSaving || !formData.question.trim()}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

FAQEditDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    faq: PropTypes.object,
    tagCategories: PropTypes.object.isRequired,
    onSave: PropTypes.func.isRequired
}

export default FAQEditDialog
