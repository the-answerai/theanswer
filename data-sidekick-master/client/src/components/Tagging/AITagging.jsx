import { useState, useEffect } from 'react'
import {
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    List,
    ListItem,
    ListItemText,
    FormControlLabel,
    Switch,
    LinearProgress,
    Alert,
    AlertTitle,
    Card,
    CardContent,
    CardActionArea
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import PropTypes from 'prop-types'
import { getApiUrl } from '../../config/api'

// 1) New multi-task prompt function
const generateMultiTaskPrompt = () => {
    return '${transcript}'
}

const generateSlug = (label) => {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

// 2) CategoryEditDialog remains the same ...
const CategoryEditDialog = ({ open, category, onClose, onSave }) => {
    const [editedCategory, setEditedCategory] = useState(
        category || {
            label: '',
            description: '',
            slug: '',
            color: '#000000',
            subcategories: {}
        }
    )

    // Reset form when category changes
    useEffect(() => {
        if (category) {
            // Ensure we have the complete category data with subcategories
            setEditedCategory({
                label: category.label || '',
                description: category.description || '',
                slug: category.slug || '',
                color: category.color || '#000000',
                subcategories: category.subcategories || {}
            })
        } else {
            setEditedCategory({
                label: '',
                description: '',
                slug: '',
                color: '#000000',
                subcategories: {}
            })
        }
    }, [category])

    const [newSubcategory, setNewSubcategory] = useState({
        label: '',
        description: '',
        slug: '',
        color: '#000000'
    })

    const handleSave = () => {
        onSave(editedCategory)
    }

    const handleLabelChange = (e) => {
        const newLabel = e.target.value
        const newSlug = generateSlug(newLabel)
        setEditedCategory((prev) => ({
            ...prev,
            label: newLabel,
            slug: newSlug
        }))
    }

    const handleSubcategoryLabelChange = (subSlug, newLabel) => {
        const newSubSlug = generateSlug(newLabel)
        setEditedCategory((prev) => {
            const subcategories = { ...prev.subcategories }
            // Update the existing subcategory instead of recreating it
            subcategories[subSlug] = {
                ...subcategories[subSlug],
                label: newLabel,
                slug: newSubSlug
            }
            return {
                ...prev,
                subcategories
            }
        })
    }

    const handleNewSubcategoryLabelChange = (e) => {
        const newLabel = e.target.value
        const newSlug = generateSlug(newLabel)
        setNewSubcategory((prev) => ({
            ...prev,
            label: newLabel,
            slug: newSlug
        }))
    }

    const handleEditSubcategory = (subSlug, field, value) => {
        setEditedCategory((prev) => ({
            ...prev,
            subcategories: {
                ...prev.subcategories,
                [subSlug]: {
                    ...prev.subcategories[subSlug],
                    [field]: value
                }
            }
        }))
    }

    const handleDeleteSubcategory = (subSlug) => {
        setEditedCategory((prev) => {
            const newSubcategories = { ...prev.subcategories }
            delete newSubcategories[subSlug]
            return {
                ...prev,
                subcategories: newSubcategories
            }
        })
    }

    const handleAddSubcategory = () => {
        if (newSubcategory.label) {
            setEditedCategory((prev) => ({
                ...prev,
                subcategories: {
                    ...prev.subcategories,
                    [newSubcategory.slug]: {
                        ...newSubcategory,
                        parent_id: prev.id
                    }
                }
            }))
            setNewSubcategory({
                label: '',
                description: '',
                slug: '',
                color: '#000000'
            })
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TextField sx={{ flex: 1 }} label='Category Label' value={editedCategory.label} onChange={handleLabelChange} />
                            <TextField
                                type='color'
                                value={editedCategory.color}
                                onChange={(e) =>
                                    setEditedCategory((prev) => ({
                                        ...prev,
                                        color: e.target.value
                                    }))
                                }
                                sx={{
                                    width: '60px',
                                    '& input': {
                                        width: '60px',
                                        height: '40px',
                                        padding: '4px'
                                    }
                                }}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label='Slug'
                            value={editedCategory.slug}
                            onChange={(e) => setEditedCategory((prev) => ({ ...prev, slug: e.target.value }))}
                            helperText='Unique identifier (auto-generated from label)'
                            sx={{ mt: 2 }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label='Description'
                            value={editedCategory.description}
                            onChange={(e) =>
                                setEditedCategory((prev) => ({
                                    ...prev,
                                    description: e.target.value
                                }))
                            }
                        />
                    </Grid>

                    {/* Subcategories List */}
                    <Grid item xs={12}>
                        <Typography variant='h6' gutterBottom>
                            Subcategories
                        </Typography>
                        <List>
                            {Object.entries(editedCategory.subcategories || {}).map(([subSlug, sub]) => (
                                <ListItem key={subSlug}>
                                    <Grid container spacing={2} alignItems='center'>
                                        <Grid item xs={12} md={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <TextField
                                                    fullWidth
                                                    label='Label'
                                                    value={sub.label}
                                                    onChange={(e) => handleSubcategoryLabelChange(subSlug, e.target.value)}
                                                />
                                                <TextField
                                                    type='color'
                                                    value={sub.color || '#000000'}
                                                    onChange={(e) => handleEditSubcategory(subSlug, 'color', e.target.value)}
                                                    sx={{
                                                        width: '60px',
                                                        '& input': {
                                                            width: '60px',
                                                            height: '40px',
                                                            padding: '4px'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                label='Slug'
                                                value={sub.slug}
                                                disabled
                                                helperText='Auto-generated from label'
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                label='Description'
                                                value={sub.description}
                                                onChange={(e) => handleEditSubcategory(subSlug, 'description', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={1}>
                                            <IconButton onClick={() => handleDeleteSubcategory(subSlug)} color='error'>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </ListItem>
                            ))}
                        </List>
                    </Grid>

                    {/* Add New Subcategory */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant='subtitle1' gutterBottom>
                                Add New Subcategory
                            </Typography>
                            <Grid container spacing={2} alignItems='center'>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            label='Label'
                                            value={newSubcategory.label}
                                            onChange={handleNewSubcategoryLabelChange}
                                        />
                                        <TextField
                                            type='color'
                                            value={newSubcategory.color}
                                            onChange={(e) =>
                                                setNewSubcategory((prev) => ({
                                                    ...prev,
                                                    color: e.target.value
                                                }))
                                            }
                                            sx={{
                                                width: '60px',
                                                '& input': {
                                                    width: '60px',
                                                    height: '40px',
                                                    padding: '4px'
                                                }
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label='Slug'
                                        value={newSubcategory.slug}
                                        disabled
                                        helperText='Auto-generated from label'
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label='Description'
                                        value={newSubcategory.description}
                                        onChange={(e) =>
                                            setNewSubcategory((prev) => ({
                                                ...prev,
                                                description: e.target.value
                                            }))
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={1}>
                                    <Button variant='outlined' onClick={handleAddSubcategory} startIcon={<AddIcon />}>
                                        Add
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant='contained'>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}

CategoryEditDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    category: PropTypes.shape({
        label: PropTypes.string,
        description: PropTypes.string,
        slug: PropTypes.string,
        color: PropTypes.string,
        subcategories: PropTypes.object
    }),
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired
}

const AITagging = () => {
    const [tagCategories, setTagCategories] = useState({})
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [calls, setCalls] = useState([])
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10
    })
    const [totalRows, setTotalRows] = useState(0)
    const [selectionModel, setSelectionModel] = useState([])
    const [unprocessedOnly, setUnprocessedOnly] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [processProgress, setProcessProgress] = useState({
        total: 0,
        processed: 0,
        errors: []
    })

    // 4) UseEffect calls fetchTags and fetchCalls
    useEffect(() => {
        fetchTags()
        fetchCalls()
    }, [paginationModel, unprocessedOnly])

    // 5) Updated fetchTags to set the new multi-task prompt
    const fetchTags = async () => {
        try {
            console.log('Fetching tags from:', getApiUrl('api/tags'))
            const response = await fetch(getApiUrl('api/tags'))

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError(`Expected JSON but got ${contentType}`)
            }

            const data = await response.json()
            console.log('Tags data received:', data)
            setTagCategories(data)

            // Use the new multi-task prompt
            setPrompt(generateMultiTaskPrompt())
        } catch (error) {
            console.error('Error fetching tags:', error)
            console.error('Full error details:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            })
        }
    }

    const fetchCalls = async () => {
        try {
            setLoading(true)
            const queryParams = new URLSearchParams({
                page: paginationModel.page,
                pageSize: paginationModel.pageSize,
                unprocessedOnly: unprocessedOnly
            })

            const response = await fetch(getApiUrl(`api/calls?${queryParams}`))
            const data = await response.json()

            const callsWithIds = data.calls.map((call, index) => ({
                ...call,
                id: paginationModel.page * paginationModel.pageSize + index
            }))

            setCalls(callsWithIds)
            setTotalRows(data.total)
        } catch (error) {
            console.error('Error fetching calls:', error)
        } finally {
            setLoading(false)
        }
    }

    // 6) We'll add fields for sentiment_score, resolution_status, escalated.
    //    The rest remains as is.
    const columns = [
        { field: 'EMPLOYEE_NAME', headerName: 'Employee Name', width: 180 },
        { field: 'CALLER_NAME', headerName: 'Caller Name', width: 180 },
        { field: 'CALL_DURATION', headerName: 'Duration (s)', width: 130 },
        { field: 'CALL_TYPE', headerName: 'Call Type', width: 130 },
        {
            field: 'TAGS_ARRAY',
            headerName: 'Current Tags',
            width: 200,
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(params.value || []).map((tag, index) => (
                        <Chip key={index} label={tag} size='small' sx={{ backgroundColor: '#e0e0e0' }} />
                    ))}
                </Box>
            )
        },
        {
            field: 'sentiment_score',
            headerName: 'Sentiment',
            width: 100
            // If your DB column is exactly "sentiment_score",
            // then each call row should have row.sentiment_score
        },
        {
            field: 'resolution_status',
            headerName: 'Resolution',
            width: 130
        },
        {
            field: 'escalated',
            headerName: 'Escalated',
            width: 100,
            renderCell: (params) => (params.value ? 'Yes' : 'No')
        }
    ]

    // 7) Processing calls logic remains the same
    //    We rely on the server side to parse the new fields
    const processBatch = async (calls) => {
        try {
            const response = await fetch(getApiUrl('api/tags/process'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    calls,
                    prompt,
                    tagCategories,
                    chatflowId: import.meta.env.VITE_ANSWERAI_ANALYSIS_CHATFLOW
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            // Update progress immediately after each batch completes
            setProcessProgress((prev) => ({
                ...prev,
                processed: prev.processed + (result.processedCalls?.length || 0),
                errors: [...prev.errors, ...(result.errors || [])]
            }))

            return {
                processedCalls: result.processedCalls || [],
                errors: result.errors || []
            }
        } catch (error) {
            console.error('Error processing batch:', error)
            const batchErrors = calls.map((call) => ({
                callId: call.RECORDING_URL,
                error: error.message
            }))

            // Update progress even if batch fails
            setProcessProgress((prev) => ({
                ...prev,
                errors: [...prev.errors, ...batchErrors]
            }))

            return {
                processedCalls: [],
                errors: batchErrors
            }
        }
    }

    const handleProcessCalls = async (callsToProcess = null) => {
        const selectedCalls = callsToProcess || calls.filter((call) => selectionModel.includes(call.id))

        if (!selectedCalls.length) {
            alert('Please select at least one call to process')
            return
        }

        setLoading(true)
        setProcessing(true)

        try {
            if (!selectedCalls.some((call) => call.TRANSCRIPTION)) {
                throw new Error('None of the selected calls have transcriptions to process')
            }

            // Reset progress
            const initialProgress = {
                total: selectedCalls.length,
                processed: 0,
                errors: []
            }
            setProcessProgress(initialProgress)

            // Split into batches of 20
            const batchSize = 20
            const batches = []
            for (let i = 0; i < selectedCalls.length; i += batchSize) {
                batches.push(selectedCalls.slice(i, Math.min(i + batchSize, selectedCalls.length)))
            }

            const finalProgress = { ...initialProgress }

            // Process all batches concurrently and wait for all to complete
            const results = await Promise.all(batches.map((batch) => processBatch(batch)))

            // Calculate final progress
            results.forEach((result) => {
                finalProgress.processed += result.processedCalls.length
                finalProgress.errors.push(...result.errors)
            })

            // Update final progress state
            setProcessProgress(finalProgress)

            // Refresh the calls list
            await fetchCalls()

            // Show completion message using the final progress numbers
            setTimeout(() => {
                setProcessing(false)
                alert(
                    `Processing complete!\n${finalProgress.processed} calls processed successfully.\n${finalProgress.errors.length} errors encountered.`
                )
            }, 1000)
        } catch (error) {
            console.error('Error processing calls:', error)
            alert(`Error processing calls: ${error.message}\nPlease check the console for more details.`)
        } finally {
            setLoading(false)
            setSelectionModel([])
        }
    }

    const handleProcessUnanalyzedCalls = async () => {
        try {
            setLoading(true)
            setProcessing(true)

            // Get all unanalyzed calls
            const response = await fetch(getApiUrl('api/calls/untagged'))
            const data = await response.json()

            if (!data.calls || data.calls.length === 0) {
                alert('No unanalyzed calls found')
                setLoading(false)
                setProcessing(false)
                return
            }

            // Process the calls using the existing batch processing function
            await handleProcessCalls(data.calls)
        } catch (error) {
            console.error('Error processing unanalyzed calls:', error)
            alert(`Error processing unanalyzed calls: ${error.message}`)
            setLoading(false)
            setProcessing(false)
        }
    }

    const handleEditCategory = (categoryKey) => {
        if (categoryKey) {
            const category = tagCategories[categoryKey]
            setEditingCategory({
                ...category,
                key: categoryKey,
                id: category.id,
                subcategories: Object.entries(category.subcategories || {}).reduce((acc, [slug, sub]) => {
                    acc[slug] = { ...sub, id: sub.id }
                    return acc
                }, {})
            })
        } else {
            setEditingCategory(null)
        }
        setOpenDialog(true)
    }

    const handleSaveCategory = async (editedCategory) => {
        try {
            setLoading(true)
            const isNew = !editedCategory.id
            console.log('Saving category:', { isNew, editedCategory })

            if (isNew) {
                // Create new category
                const categoryData = {
                    label: editedCategory.label,
                    description: editedCategory.description,
                    slug: editedCategory.slug,
                    color: editedCategory.color
                }
                console.log('Creating new category with data:', categoryData)

                const response = await fetch(getApiUrl('api/tags'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoryData)
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(`Failed to create category: ${errorData.details || errorData.error || response.statusText}`)
                }

                const newCategory = await response.json()
                console.log('Successfully created category:', newCategory)

                // Add subcategories if any
                for (const [, subcategory] of Object.entries(editedCategory.subcategories)) {
                    const subcategoryData = {
                        label: subcategory.label,
                        description: subcategory.description,
                        slug: subcategory.slug,
                        parent_id: editedCategory.id,
                        color: subcategory.color
                    }
                    console.log('Creating subcategory with data:', subcategoryData)

                    const subResponse = await fetch(getApiUrl('api/tags'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(subcategoryData)
                    })

                    if (!subResponse.ok) {
                        const errorData = await subResponse.json()
                        throw new Error(`Failed to create subcategory: ${errorData.details || errorData.error || subResponse.statusText}`)
                    }

                    const newSubcategory = await subResponse.json()
                    console.log('Successfully created subcategory:', newSubcategory)
                }
            } else {
                // Update existing category
                const categoryData = {
                    label: editedCategory.label,
                    description: editedCategory.description,
                    color: editedCategory.color,
                    slug: editedCategory.slug,
                    parent_id: null
                }
                console.log('Updating category with data:', categoryData)

                const response = await fetch(getApiUrl(`api/tags/${editedCategory.id}`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoryData)
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(`Failed to update category: ${errorData.details || errorData.error || response.statusText}`)
                }

                const updatedCategory = await response.json()
                console.log('Successfully updated category:', updatedCategory)

                // Handle subcategories updates
                const existingSubcategories = tagCategories[editedCategory.key]?.subcategories || {}

                // Update or create subcategories
                for (const [subSlug, subcategory] of Object.entries(editedCategory.subcategories)) {
                    const exists = existingSubcategories[subSlug] && subcategory.id
                    const method = exists ? 'PUT' : 'POST'
                    const url = exists ? getApiUrl(`api/tags/${subcategory.id}`) : getApiUrl('api/tags')

                    const subcategoryData = {
                        label: subcategory.label,
                        description: subcategory.description,
                        slug: subcategory.slug,
                        parent_id: editedCategory.id,
                        color: subcategory.color
                    }
                    console.log(`${method}ing subcategory with data:`, subcategoryData)

                    const subResponse = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(subcategoryData)
                    })

                    if (!subResponse.ok) {
                        const errorData = await subResponse.json()
                        throw new Error(
                            `Failed to ${method.toLowerCase()} subcategory: ${
                                errorData.details || errorData.error || subResponse.statusText
                            }`
                        )
                    }

                    const updatedSubcategory = await subResponse.json()
                    console.log(`Successfully ${method.toLowerCase()}ed subcategory:`, updatedSubcategory)
                }

                // Delete removed subcategories
                for (const [subSlug, subcategory] of Object.entries(existingSubcategories)) {
                    if (!editedCategory.subcategories[subSlug]) {
                        console.log('Deleting subcategory:', subSlug)
                        const deleteResponse = await fetch(getApiUrl(`api/tags/${subcategory.id}`), {
                            method: 'DELETE'
                        })

                        if (!deleteResponse.ok) {
                            const errorData = await deleteResponse.json()
                            throw new Error(
                                `Failed to delete subcategory: ${errorData.details || errorData.error || deleteResponse.statusText}`
                            )
                        }
                        console.log('Successfully deleted subcategory:', subSlug)
                    }
                }
            }

            // Refresh tags after save
            await fetchTags()
            setOpenDialog(false)
            setEditingCategory(null)
        } catch (error) {
            console.error('Error saving category:', error)
            alert('Failed to save category: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCategory = async (categoryKey) => {
        if (!window.confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) {
            return
        }

        try {
            setLoading(true)
            const category = tagCategories[categoryKey]

            const response = await fetch(getApiUrl(`api/tags/${category.id}`), {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Failed to delete category: ${errorData.details || errorData.error || response.statusText}`)
            }

            await fetchTags()
        } catch (error) {
            console.error('Error deleting category:', error)
            alert('Failed to delete category: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box>
            <Grid container spacing={2}>
                {/* Left side: DataGrid of calls */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant='h6' gutterBottom>
                                Call Processing
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch checked={unprocessedOnly} onChange={(e) => setUnprocessedOnly(e.target.checked)} />
                                        }
                                        label='Show only unprocessed calls'
                                    />
                                    <Button
                                        variant='contained'
                                        color='secondary'
                                        onClick={handleProcessUnanalyzedCalls}
                                        disabled={loading || processing}
                                    >
                                        Process All Unanalyzed Calls
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        {/* Progress bar section */}
                        {processing && (
                            <Box sx={{ width: '100%', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress
                                            variant='determinate'
                                            value={
                                                processProgress.total > 0 ? (processProgress.processed / processProgress.total) * 100 : 0
                                            }
                                        />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            {`${Math.round((processProgress.processed / processProgress.total) * 100)}%`}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant='body2' color='text.secondary' align='center'>
                                    {processProgress.processed} of {processProgress.total} calls processed
                                </Typography>
                                {processProgress.errors.length > 0 && (
                                    <Alert severity='warning' sx={{ mt: 1 }}>
                                        <AlertTitle>Processing Errors ({processProgress.errors.length})</AlertTitle>
                                        <List dense sx={{ maxHeight: 100, overflow: 'auto' }}>
                                            {processProgress.errors.map((error) => (
                                                <ListItem key={error.callId} divider>
                                                    <ListItemText
                                                        primary={
                                                            error.callId ? `Error processing call ${error.callId}` : 'Processing Error'
                                                        }
                                                        secondary={error.error}
                                                        secondaryTypographyProps={{
                                                            sx: { wordBreak: 'break-word' }
                                                        }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Alert>
                                )}
                            </Box>
                        )}

                        <DataGrid
                            rows={calls}
                            columns={columns}
                            paginationModel={paginationModel}
                            onPaginationModelChange={setPaginationModel}
                            pageSizeOptions={[10, 25, 50]}
                            rowCount={totalRows}
                            paginationMode='server'
                            loading={loading}
                            checkboxSelection
                            disableSelectionOnClick
                            keepNonExistentRowsSelected
                            rowSelectionModel={selectionModel}
                            onRowSelectionModelChange={(newSelectionModel) => {
                                console.log('Selection changed:', newSelectionModel)
                                setSelectionModel(newSelectionModel)
                            }}
                            autoHeight
                        />
                        <Box
                            sx={{
                                mt: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <Typography variant='body2' color='text.secondary'>
                                {selectionModel.length} calls selected
                            </Typography>
                            <Button
                                variant='contained'
                                onClick={() => handleProcessCalls()}
                                disabled={loading || selectionModel.length === 0}
                            >
                                {loading ? 'Processing...' : `Process ${selectionModel.length} Selected`}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right side: Tag Categories & AI Prompt */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                            }}
                        >
                            <Typography variant='h6'>Tag Categories</Typography>
                            <Button startIcon={<AddIcon />} variant='outlined' size='small' onClick={() => handleEditCategory(null)}>
                                Add
                            </Button>
                        </Box>
                        <List dense>
                            {Object.entries(tagCategories).map(([key, category]) => (
                                <Card key={key} sx={{ mb: 2 }}>
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        <Box
                                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                            onClick={() => handleEditCategory(key)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Typography variant='subtitle2'>{category.label}</Typography>
                                            <Box sx={{ flexGrow: 1 }} />
                                            <IconButton
                                                size='small'
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteCategory(key)
                                                }}
                                            >
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </Box>
                                        <Box sx={{ mt: 0.5 }}>
                                            {Object.values(category.subcategories || {}).map((sub) => (
                                                <Chip
                                                    key={sub.slug}
                                                    label={sub.label}
                                                    size='small'
                                                    sx={{
                                                        mr: 0.5,
                                                        mb: 0.5,
                                                        backgroundColor: sub.color,
                                                        color: 'white'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </List>
                    </Paper>

                    {/* Prompt Section */}
                    {/* <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              AI Prompt
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              size="small"
              helperText="Prompt used for classification & sentiment analysis"
            />
          </Paper> */}
                </Grid>
            </Grid>

            <CategoryEditDialog
                open={openDialog}
                category={editingCategory}
                onClose={() => {
                    setOpenDialog(false)
                    setEditingCategory(null)
                }}
                onSave={handleSaveCategory}
            />
        </Box>
    )
}

export default AITagging
