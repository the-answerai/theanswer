import { useState } from 'react'
import PropTypes from 'prop-types'
import { ListItem, ListItemText, Collapse, Typography, Box, Divider, Button } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { baseURL } from '@/store/constant'
import SidebarNodeInputHandler from './SidebarNodeInputHandler'

const SidebarNodeItem = ({ node, nodeConfig, onNodeChange }) => {
    const [expanded, setExpanded] = useState(false)
    const [showAdditionalParams, setShowAdditionalParams] = useState(false)

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

    const visibleInputParams = node.data.inputParams.filter((param) => !param.hidden)
    const additionalParams = visibleInputParams.filter((param) => param.additionalParams)
    const regularParams = visibleInputParams.filter((param) => !param.additionalParams)

    // console.log('Visible Input Params:', visibleInputParams)
    // console.log('Regular Params:', regularParams)
    // console.log('Additional Params:', additionalParams)

    return (
        <>
            <ListItem button onClick={handleExpand}>
                <ListItemText primary={node.data.label} secondary={<Typography variant='caption'>{node.data.name}</Typography>} />
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={expanded} timeout='auto' unmountOnExit>
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ width: 40, height: 40, mr: 2 }}>
                            <img
                                src={`${baseURL}/api/v1/node-icon/${node.data.name}`}
                                alt={node.data.label}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </Box>
                        <Typography variant='h6'>{node.data.label}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant='subtitle1'>Inputs:</Typography>
                        {regularParams.map((param, index) => (
                            <SidebarNodeInputHandler key={index} inputParam={param} data={node.data} onChange={handleInputChange} />
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
                                        />
                                    ))}
                            </>
                        )}
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant='subtitle1'>Outputs:</Typography>
                        {node.data.outputAnchors.map((anchor, index) => (
                            <Box key={index} sx={{ mt: 1 }}>
                                <Typography variant='body2'>{anchor.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Collapse>
        </>
    )
}

SidebarNodeItem.propTypes = {
    node: PropTypes.object.isRequired,
    onNodeChange: PropTypes.func.isRequired,
    nodeConfig: PropTypes.object
}

export default SidebarNodeItem
