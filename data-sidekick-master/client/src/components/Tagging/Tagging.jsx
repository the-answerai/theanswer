import { useState, useEffect } from 'react'
import {
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField,
    Card,
    CardContent,
    CircularProgress,
    List,
    ListItem,
    Alert,
    Fab
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import LockIcon from '@mui/icons-material/Lock'
import PropTypes from 'prop-types'
import { getApiUrl } from '../../config/api'

const CategoryEditDialog = ({ open, category, onClose }) => {
    const [editedCategory, setEditedCategory] = useState(
        category || {
            label: '',
            description: '',
            slug: '',
            color: '#000000',
            subcategories: {}
        }
    )

    const [newSubcategory, setNewSubcategory] = useState({
        label: '',
        description: '',
        slug: '',
        color: '#000000'
    })

    // Reset form when category changes
    useEffect(() => {
        if (category) {
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

    const generateSlug = (label) => {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
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
                <Alert severity='info' sx={{ mb: 2 }}>
                    Demo Account Only: Custom Tagging and Analysis is available for paid plans
                </Alert>
                <Alert severity='success' sx={{ mb: 2 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Tip: Make Your Tags Work Smarter
                    </Typography>
                    Detailed descriptions help our AI better understand your business context. Be specific about what each category and
                    subcategory means for your organization - this improves tag accuracy and makes analysis more valuable.
                </Alert>
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
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label='Description'
                            value={editedCategory.description}
                            onChange={(e) =>
                                setEditedCategory((prev) => ({
                                    ...prev,
                                    description: e.target.value
                                }))
                            }
                            helperText='Describe what this category means in your business context'
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
                                        <Grid item xs={12} md={3}>
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
                                                    onChange={(e) =>
                                                        setEditedCategory((prev) => ({
                                                            ...prev,
                                                            subcategories: {
                                                                ...prev.subcategories,
                                                                [subSlug]: {
                                                                    ...prev.subcategories[subSlug],
                                                                    color: e.target.value
                                                                }
                                                            }
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
                                        <Grid item xs={12} md={8}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={2}
                                                label='Description'
                                                value={sub.description}
                                                onChange={(e) =>
                                                    setEditedCategory((prev) => ({
                                                        ...prev,
                                                        subcategories: {
                                                            ...prev.subcategories,
                                                            [subSlug]: {
                                                                ...prev.subcategories[subSlug],
                                                                description: e.target.value
                                                            }
                                                        }
                                                    }))
                                                }
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
                                <Grid item xs={12} md={3}>
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
                                <Grid item xs={12} md={8}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
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
                                <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Fab
                                        size='small'
                                        onClick={handleAddSubcategory}
                                        disabled={!newSubcategory.label}
                                        sx={{
                                            backgroundColor: newSubcategory.label ? '#4caf50' : newSubcategory.color,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: newSubcategory.label ? '#45a049' : newSubcategory.color
                                            },
                                            '&.Mui-disabled': {
                                                backgroundColor: newSubcategory.color,
                                                opacity: 0.6
                                            }
                                        }}
                                    >
                                        <AddIcon />
                                    </Fab>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant='contained'
                    startIcon={<LockIcon />}
                    disabled
                    sx={{
                        backgroundColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'),
                        '&:hover': {
                            backgroundColor: (theme) =>
                                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
                        }
                    }}
                >
                    Save (Demo)
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
    onClose: PropTypes.func.isRequired
}

const Tagging = () => {
    const [tagCategories, setTagCategories] = useState({})
    const [loading, setLoading] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)

    useEffect(() => {
        fetchTags()
    }, [])

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
        } catch (error) {
            console.error('Error fetching tags:', error)
            console.error('Full error details:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            })
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
            alert(`Failed to delete category: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                }}
            >
                <Typography variant='h5'>Tag Management</Typography>
                <Button startIcon={<AddIcon />} variant='contained' onClick={() => handleEditCategory(null)} disabled={loading}>
                    Add Category
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {Object.entries(tagCategories).map(([key, category]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                            <Card
                                sx={{
                                    backgroundColor: `${category.color}11`,
                                    height: '100%',
                                    position: 'relative'
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            mb: 2
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    backgroundColor: category.color
                                                }}
                                            />
                                            <Typography
                                                variant='subtitle1'
                                                sx={{
                                                    color: category.color,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {category.label}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <IconButton size='small' onClick={() => handleEditCategory(key)} sx={{ color: category.color }}>
                                                <EditIcon fontSize='small' />
                                            </IconButton>
                                            <IconButton size='small' onClick={() => handleDeleteCategory(key)} color='error'>
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {category.description && (
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                            sx={{ mb: 2 }}
                                            noWrap
                                            title={category.description}
                                        >
                                            {category.description}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {Object.entries(category.subcategories || {}).map(([subKey, sub]) => (
                                            <Chip
                                                key={subKey}
                                                label={sub.label}
                                                size='small'
                                                sx={{
                                                    backgroundColor: `${sub.color}22`,
                                                    color: (theme) => (theme.palette.mode === 'dark' ? sub.color : 'rgba(0, 0, 0, 0.87)'),
                                                    border: `1px solid ${sub.color}`,
                                                    '& .MuiChip-deleteIcon': {
                                                        color: (theme) =>
                                                            theme.palette.mode === 'dark' ? sub.color : 'rgba(0, 0, 0, 0.87)',
                                                        '&:hover': {
                                                            color: (theme) =>
                                                                theme.palette.mode === 'dark' ? `${sub.color}99` : 'rgba(0, 0, 0, 0.54)'
                                                        }
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <CategoryEditDialog
                open={openDialog}
                category={editingCategory}
                onClose={() => {
                    setOpenDialog(false)
                    setEditingCategory(null)
                }}
            />
        </Box>
    )
}

export default Tagging
