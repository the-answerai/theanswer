import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
    Avatar,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Dialog,
    DialogContent,
    Box,
    OutlinedInput,
    InputAdornment,
    IconButton,
    DialogTitle,
    Button,
    Typography
} from '@mui/material'
import { IconSearch, IconX, IconPlus } from '@tabler/icons-react'

// const

const JourneyItemSelectDialog = ({
    show,
    dialogProps,
    onCancel,
    onItemsSelected,
    allowMultipleSelection = false,
    selectedItems = [],
    isInnerContent = false,
    onCreateNew,
    itemType,
    items,
    loading,
    error,
    renderItemIcon,
    renderItemAvatar
}) => {
    const [searchValue, setSearchValue] = useState('')

    const onSearchChange = useCallback((val) => {
        setSearchValue(val)
    }, [])

    const filteredItems = useMemo(() => {
        return items.filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase()))
    }, [items, searchValue])

    const handleItemSelection = useCallback(
        (item) => {
            if (allowMultipleSelection) {
                const updatedItems = selectedItems.includes(item) ? selectedItems.filter((s) => s.id !== item.id) : [...selectedItems, item]
                onItemsSelected(updatedItems)
            } else {
                onItemsSelected([item])
            }
        },
        [allowMultipleSelection, onItemsSelected, selectedItems]
    )

    const sortedItems = useMemo(() => {
        const selected = filteredItems.filter((item) => selectedItems.some((s) => s.id === item.id))
        const unselected = filteredItems.filter((item) => !selectedItems.some((s) => s.id === item.id))

        selected.sort((a, b) => a.name.localeCompare(b.name))
        unselected.sort((a, b) => a.name.localeCompare(b.name))

        return [...selected, ...unselected]
    }, [filteredItems, selectedItems])

    const content = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <OutlinedInput
                sx={{ mb: 2 }}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder='Search'
                startAdornment={
                    <InputAdornment position='start'>
                        <IconSearch />
                    </InputAdornment>
                }
                endAdornment={
                    searchValue && (
                        <InputAdornment position='end'>
                            <IconButton onClick={() => onSearchChange('')}>
                                <IconX />
                            </IconButton>
                        </InputAdornment>
                    )
                }
            />
            {loading ? (
                <Typography>Loading...</Typography>
            ) : error ? (
                <Typography color='error'>Error: {error}</Typography>
            ) : (
                <List sx={{ flexGrow: 1, overflow: 'auto', padding: 2 }}>
                    {sortedItems.map((item) => (
                        <ListItemButton
                            key={item.id}
                            onClick={() => handleItemSelection(item)}
                            sx={{
                                // ... existing styles ...
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <ListItemIcon>
                                <Checkbox edge='start' checked={selectedItems.some((s) => s.id === item.id)} tabIndex={-1} disableRipple />
                            </ListItemIcon>
                            {renderItemAvatar && <Avatar sx={{ mr: 2 }}>{renderItemAvatar(item)}</Avatar>}
                            {renderItemIcon && <ListItemIcon>{renderItemIcon(item)}</ListItemIcon>}
                            <ListItemText primary={item.name} secondary={item.description} />
                        </ListItemButton>
                    ))}
                </List>
            )}
            {onCreateNew && (
                <Button variant='contained' color='primary' startIcon={<IconPlus />} onClick={onCreateNew} sx={{ mt: 2 }}>
                    Create New {itemType}
                </Button>
            )}
        </Box>
    )

    return isInnerContent ? (
        content
    ) : (
        <Dialog open={show} onClose={onCancel} maxWidth='md' fullWidth>
            <DialogTitle>{dialogProps.title || `Select ${itemType}`}</DialogTitle>
            <DialogContent>{content}</DialogContent>
        </Dialog>
    )
}

JourneyItemSelectDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func,
    onItemsSelected: PropTypes.func,
    allowMultipleSelection: PropTypes.bool,
    selectedItems: PropTypes.array,
    isInnerContent: PropTypes.bool,
    onCreateNew: PropTypes.func,
    itemType: PropTypes.string.isRequired,
    getItemsApi: PropTypes.object.isRequired,
    renderItemIcon: PropTypes.func,
    items: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    renderItemAvatar: PropTypes.func
}

export default React.memo(JourneyItemSelectDialog)
