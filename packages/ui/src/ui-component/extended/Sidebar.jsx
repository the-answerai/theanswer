import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { List, ListItem, Collapse, Select, MenuItem, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import chatflowApi from '@/api/chatflows'
import SidebarNodeItem from './SidebarNodeItem'
import nodesApi from '@/api/nodes'
import SidebarToolModal from './SidebarToolModal'

const Sidebar = ({ chatflows, selectedChatflow, setSelectedChatflow, setOverrideConfig }) => {
    const [chatflowNodes, setChatflowNodes] = useState({})
    const [nodeConfigs, setNodeConfigs] = useState({})
    const [isToolModalOpen, setIsToolModalOpen] = useState(false)
    const [availableTools, setAvailableTools] = useState([])

    const allowedCategories = ['Chat Models', 'Prompts', 'Document Loaders', 'Tools']

    const filterNodes = (nodes) => {
        return nodes.filter((node) => {
            const nodeConfig = nodeConfigs[node.data.name]
            return nodeConfig && allowedCategories.includes(nodeConfig.category)
        })
    }

    const handleToolSelect = (tool) => {
        // Create a new node for the selected tool
        const newNode = {
            id: `${tool.name}-${Date.now()}`, // Generate a unique ID
            data: {
                id: `${tool.name}-${Date.now()}`,
                name: tool.name,
                label: tool.label,
                inputs: {},
                inputAnchors: [],
                inputParams: [],
                outputAnchors: []
            }
        }

        // Add the new node to the chatflowNodes
        setChatflowNodes((prev) => ({
            ...prev,
            [selectedChatflow]: [...(prev[selectedChatflow] || []), newNode]
        }))

        setIsToolModalOpen(false)
    }

    const groupNodesByCategory = (nodes) => {
        const groupedNodes = {}
        allowedCategories.forEach((category) => {
            groupedNodes[category] = nodes.filter((node) => {
                const nodeConfig = nodeConfigs[node.data.name]
                return nodeConfig && nodeConfig.category === category
            })
        })
        return groupedNodes
    }

    const handleOpenToolModal = () => {
        const toolNodes = Object.values(nodeConfigs).filter((node) => node.category === 'Tools')
        setAvailableTools(toolNodes)
        setIsToolModalOpen(true)
    }

    useEffect(() => {
        const fetchChatflowData = async (chatflowId) => {
            try {
                const response = await chatflowApi.getSpecificChatflow(chatflowId)
                const flowData = JSON.parse(response.data.flowData)
                const formattedNodes = flowData.nodes.map((node) => ({
                    id: node.id,
                    data: {
                        ...node.data,
                        id: node.id,
                        name: node.data.name,
                        label: node.data.label,
                        inputAnchors: node.data.inputAnchors || [],
                        inputParams: node.data.inputParams || [],
                        outputAnchors: node.data.outputAnchors || []
                    }
                }))
                setChatflowNodes((prev) => ({ ...prev, [chatflowId]: formattedNodes }))
                setOverrideConfig({})
            } catch (error) {
                console.error('Error fetching chatflow data:', error)
            }
        }

        if (selectedChatflow) {
            fetchChatflowData(selectedChatflow)
        }
    }, [selectedChatflow])

    useEffect(() => {
        const fetchNodeConfigs = async () => {
            try {
                const response = await nodesApi.getAllNodes()
                const configs = {}
                response.data.forEach((node) => {
                    configs[node.name] = node
                })
                setNodeConfigs(configs)
            } catch (error) {
                console.error('Error fetching node configurations:', error)
            }
        }
        fetchNodeConfigs()
    }, [])

    const handleChatflowChange = (event) => {
        setSelectedChatflow(event.target.value)
    }

    const handleNodeChange = (updatedNode) => {
        console.log('Sidebar - Received updated node:', updatedNode)
        setChatflowNodes((prev) => ({
            ...prev,
            [selectedChatflow]: prev[selectedChatflow].map((node) => (node.id === updatedNode.id ? updatedNode : node))
        }))

        // Find the original node to compare with
        const originalNode = chatflowNodes[selectedChatflow]?.find((node) => node.id === updatedNode.id)

        const changedInputs = {}
        Object.entries(updatedNode.data.inputs).forEach(([key, value]) => {
            if (originalNode && value !== originalNode.data.inputs[key]) {
                changedInputs[key] = value
            }
        })

        if (Object.keys(changedInputs).length > 0) {
            setOverrideConfig((prevConfig) => ({
                ...prevConfig,
                [updatedNode.id]: changedInputs
            }))
        }
    }

    return (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <ListItem sx={{ width: '100%' }}>
                <Select value={selectedChatflow} onChange={handleChatflowChange} fullWidth>
                    {chatflows.map((chatflow) => (
                        <MenuItem key={chatflow.id} value={chatflow.id}>
                            {chatflow.name}
                        </MenuItem>
                    ))}
                </Select>
            </ListItem>
            <Collapse in={Boolean(selectedChatflow)} timeout='auto' unmountOnExit sx={{ width: '100%' }}>
                <List component='div' disablePadding sx={{ width: '100%' }}>
                    {selectedChatflow &&
                        Object.entries(groupNodesByCategory(chatflowNodes[selectedChatflow] || [])).map(
                            ([category, nodes]) =>
                                nodes.length > 0 && (
                                    <React.Fragment key={category}>
                                        <ListItem>
                                            <Typography variant='h6'>{category}</Typography>
                                            {category === 'Tools' && (
                                                <Button startIcon={<AddIcon />} onClick={handleOpenToolModal} sx={{ ml: 2 }}>
                                                    Add More Tools
                                                </Button>
                                            )}
                                        </ListItem>
                                        {nodes.map((node) => (
                                            <SidebarNodeItem
                                                key={node.id}
                                                node={node}
                                                nodeConfig={nodeConfigs[node.data.name]}
                                                onNodeChange={handleNodeChange}
                                                allowedCategories={allowedCategories}
                                            />
                                        ))}
                                    </React.Fragment>
                                )
                        )}
                </List>
            </Collapse>
            {selectedChatflow && filterNodes(chatflowNodes[selectedChatflow] || []).length === 0 && (
                <Typography variant='body2' sx={{ p: 2, textAlign: 'center' }}>
                    No nodes of the allowed categories found in this chatflow.
                </Typography>
            )}

            <SidebarToolModal
                open={isToolModalOpen}
                onClose={() => setIsToolModalOpen(false)}
                availableTools={availableTools}
                onToolSelect={handleToolSelect}
            />
        </List>
    )
}

Sidebar.propTypes = {
    chatflows: PropTypes.array.isRequired,
    selectedChatflow: PropTypes.string.isRequired,
    setSelectedChatflow: PropTypes.func.isRequired,
    setOverrideConfig: PropTypes.func.isRequired
}

export default React.memo(Sidebar)
