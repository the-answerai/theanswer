import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { Input } from '@/ui-component/input/Input'
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import { SwitchInput } from '@/ui-component/switch/Switch'
import { JsonEditorInput } from '@/ui-component/json/JsonEditor'
import { File } from '@/ui-component/file/File'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'

const SidebarNodeInputHandler = ({ inputParam, data, onChange }) => {
    const handleChange = (newValue) => {
        onChange(inputParam.name, newValue)
    }

    return (
        <Box sx={{ mb: 2 }}>
            <Typography>
                {inputParam.label}
                {!inputParam.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                {inputParam.description && <TooltipWithParser style={{ marginLeft: 10 }} title={inputParam.description} />}
            </Typography>
            {(inputParam.type === 'string' || inputParam.type === 'password' || inputParam.type === 'number') && (
                <Input inputParam={inputParam} onChange={handleChange} value={data.inputs[inputParam.name] ?? inputParam.default ?? ''} />
            )}
            {inputParam.type === 'boolean' && (
                <SwitchInput onChange={handleChange} value={data.inputs[inputParam.name] ?? inputParam.default ?? false} />
            )}
            {inputParam.type === 'file' && (
                <File
                    fileType={inputParam.fileType || '*'}
                    onChange={handleChange}
                    value={data.inputs[inputParam.name] ?? inputParam.default ?? 'Choose a file to upload'}
                />
            )}
            {inputParam.type === 'options' && (
                <Dropdown
                    name={inputParam.name}
                    options={inputParam.options}
                    onSelect={handleChange}
                    value={data.inputs[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                />
            )}
            {inputParam.type === 'json' && (
                <JsonEditorInput onChange={handleChange} value={data.inputs[inputParam.name] || inputParam.default || ''} />
            )}
            {/* Add more input types as needed */}
        </Box>
    )
}

SidebarNodeInputHandler.propTypes = {
    inputParam: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
}

export default SidebarNodeInputHandler
