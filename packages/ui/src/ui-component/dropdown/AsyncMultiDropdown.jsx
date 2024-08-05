import { useEffect, useState } from 'react'
import {
    Autocomplete,
    TextField,
    CircularProgress,
    Checkbox,
    Link,
    Box,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography
} from '@mui/material'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import client from '../../api/client'

export const AsyncMultiDropdown = ({ name, nodeData, value, onSelect, disabled, isCreateNewOption }) => {
    const [options, setOptions] = useState([])
    const [loading, setLoading] = useState(true)
    const customization = useSelector((state) => state.customization)

    useEffect(() => {
        console.log(`AsyncMultiDropdown mounted for ${name}`)
        loadOptions()
    }, [])

    const loadOptions = async () => {
        setLoading(true)
        try {
            const loadMethod = nodeData.inputParams.find((param) => param.name === name)?.loadMethod
            const response = await client.post(`/node-load-method/${nodeData.name}`, { ...nodeData, loadMethod })
            const data = response.data
            console.log('AsyncMultiDropdown: Options loaded:', JSON.stringify(data, null, 2))
            setOptions(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('AsyncMultiDropdown: Error loading options:', error)
            setOptions([])
        }
        setLoading(false)
    }

    const handleChange = (_, newValue) => {
        console.log('AsyncMultiDropdown: New value selected:', JSON.stringify(newValue, null, 2))
        // Save only the 'name' (id) of the selected items
        const selectedIds = newValue.map((item) => item.name)
        onSelect(selectedIds)
    }

    console.log('AsyncMultiDropdown rendering with options:', JSON.stringify(options, null, 2))
    console.log('AsyncMultiDropdown rendering with value:', JSON.stringify(value, null, 2))

    const isOptionEqualToValue = (option, value) => option.name === value.name

    return (
        <Box>
            {Array.isArray(value) && value.length > 0 && (
                <List>
                    {value.map((itemId) => {
                        const item = options.find((option) => option.name === itemId) || { label: itemId, name: itemId }
                        return (
                            <ListItem
                                key={item.name}
                                secondaryAction={
                                    <>
                                        <IconButton edge='end' aria-label='edit' href='/document-store' target='_blank' rel='noopener'>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            edge='end'
                                            aria-label='delete'
                                            onClick={() => {
                                                const newValue = value.filter((v) => v !== item.name)
                                                onSelect(newValue)
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </>
                                }
                            >
                                <ListItemText primary={item.label || ''} secondary={`Store: ${nodeData.label || nodeData.name}`} />
                            </ListItem>
                        )
                    })}
                </List>
            )}
            <Autocomplete
                multiple
                disableCloseOnSelect
                disabled={disabled}
                options={options}
                value={options.filter((option) => value.includes(option.name))}
                onChange={handleChange}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant='outlined'
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color='inherit' size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            )
                        }}
                    />
                )}
                renderOption={(props, option, { selected }) => (
                    <li {...props}>
                        <Checkbox
                            icon={<CheckBoxOutlineBlankIcon fontSize='small' />}
                            checkedIcon={<CheckBoxIcon fontSize='small' />}
                            style={{ marginRight: 8 }}
                            checked={selected}
                        />
                        {option.label || ''}
                    </li>
                )}
                loading={loading}
                getOptionLabel={(option) => option.label || ''}
                isOptionEqualToValue={(option, value) => option.name === value.name}
                renderTags={() => null}
                placeholder={`${Array.isArray(value) ? value.length : 0} item${value.length !== 1 ? 's' : ''} selected`}
            />
            <Typography variant='body2' style={{ marginTop: '8px' }}>
                <Link href='/document-store' target='_blank' rel='noopener'>
                    Go to Document Store
                </Link>
            </Typography>
        </Box>
    )
}

AsyncMultiDropdown.propTypes = {
    name: PropTypes.string,
    nodeData: PropTypes.object,
    value: PropTypes.array,
    onSelect: PropTypes.func,
    disabled: PropTypes.bool,
    isCreateNewOption: PropTypes.bool
}

export default AsyncMultiDropdown
