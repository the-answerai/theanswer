import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ListItem, ListItemText, Collapse, Typography, Box, Divider, Button } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { baseURL } from '@/store/constant'
import { useTheme } from '@mui/material/styles'
import SidebarNodeInputHandler from './SidebarNodeInputHandler'

const SidebarNodeItem = ({ node, nodeConfig, onNodeChange }) => {
    const theme = useTheme()
    const [expanded, setExpanded] = useState(false)
    const [showAdditionalParams, setShowAdditionalParams] = useState(false)
    const [inputParams, setInputParams] = useState([])

    useEffect(() => {
        if (nodeConfig && nodeConfig.inputs) {
            setInputParams(nodeConfig.inputs)
        }
    }, [nodeConfig])

    const handleExpand = () => {
        setExpanded(!expanded)
    }

    const handleInputChange = (paramName, newValue) => {
        console.log('SidebarNodeItem - Input Change:', node.id, paramName, newValue)
        const updatedNode = {
            ...node,
            data: {
                ...node.data,
                inputs: {
                    ...node.data.inputs,
                    [paramName]: newValue
                }
            }
        }
        console.log('SidebarNodeItem - Calling onNodeChange with:', updatedNode)
        onNodeChange(updatedNode)
    }

    const visibleInputParams = inputParams.filter((param) => !param.hidden && param.type !== 'credential')
    const additionalParams = visibleInputParams.filter((param) => param.additionalParams)
    const regularParams = visibleInputParams.filter((param) => !param.additionalParams)

    return (
        <>
            <ListItem
                onClick={handleExpand}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    cursor: 'pointer'
                }}
            >
                <Box sx={{ width: 40, height: 40, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                        style={{
                            ...theme.typography.commonAvatar,
                            ...theme.typography.largeAvatar,
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        <img
                            style={{ width: '100%', height: '100%', padding: 5, objectFit: 'contain' }}
                            src={`${baseURL}/api/v1/node-icon/${node.data.name}`}
                            alt={node.data.label}
                        />
                    </div>
                </Box>
                <ListItemText primary={node.data.label} secondary={<Typography variant='caption'>{node.data.name}</Typography>} />
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={expanded} timeout='auto' unmountOnExit sx={{ width: '100%' }}>
                <Box sx={{ p: 2, width: '100%' }}>
                    <Divider />
                    <Box sx={{ mt: 2 }}>
                        {regularParams.map((param, index) => (
                            <SidebarNodeInputHandler
                                key={index}
                                inputParam={param}
                                data={node.data}
                                onChange={handleInputChange}
                                value={node.data.inputs[param.name]}
                            />
                        ))}
                        {additionalParams.length > 0 && (
                            <>
                                <Button
                                    sx={{ borderRadius: 25, width: '100%', mt: 2, mb: 2 }}
                                    variant='outlined'
                                    onClick={() => setShowAdditionalParams(!showAdditionalParams)}
                                >
                                    {showAdditionalParams ? 'Hide' : 'Show'} Additional Parameters
                                </Button>
                                {showAdditionalParams &&
                                    additionalParams.map((param, index) => (
                                        <SidebarNodeInputHandler
                                            key={index}
                                            inputParam={param}
                                            data={node.data}
                                            onChange={handleInputChange}
                                            value={node.data.inputs[param.name]}
                                        />
                                    ))}
                            </>
                        )}
                    </Box>
                </Box>
            </Collapse>
        </>
    )
}

SidebarNodeItem.propTypes = {
    node: PropTypes.object.isRequired,
    nodeConfig: PropTypes.object.isRequired,
    onNodeChange: PropTypes.func.isRequired
}

export default SidebarNodeItem
