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
    const [addedTools, setAddedTools] = useState([])

    const allowedCategories = ['Agents', 'Chat Models', 'Prompts', 'Document Loaders', 'Tools']

    const filterNodes = (nodes) => {
        return nodes.filter((node) => {
            const nodeConfig = nodeConfigs[node.data.name]
            return nodeConfig && allowedCategories.includes(nodeConfig.category)
        })
    }

    const handleToolSelect = (tool) => {
        const newNodeId = `${tool.name}_0`
        const newNode = {
            id: newNodeId,
            position: { x: 0, y: 0 },
            type: 'customNode',
            data: {
                ...tool,
                id: newNodeId,
                inputAnchors: [],
                inputParams: tool.inputs || [],
                outputAnchors: [
                    {
                        id: `${newNodeId}-output-${tool.name}-${tool.baseClasses.join('|')}`,
                        name: tool.name,
                        label: tool.label,
                        type: tool.baseClasses.join(' | ')
                    }
                ]
            }
        }

        const agentNode = chatflowNodes[selectedChatflow]?.find((node) => nodeConfigs[node.data.name]?.category === 'Agents')

        if (agentNode) {
            const newEdge = {
                source: newNodeId,
                sourceHandle: `${newNodeId}-output-${tool.name}-${tool.baseClasses.join('|')}`,
                target: agentNode.id,
                targetHandle: `${agentNode.id}-input-tools-Tool`,
                type: 'buttonedge',
                id: `${newNodeId}-${newNodeId}-output-${tool.name}-${tool.baseClasses.join('|')}-${agentNode.id}-${
                    agentNode.id
                }-input-tools-Tool`
            }

            setOverrideConfig((prevConfig) => {
                const newConfig = { ...prevConfig }
                if (!newConfig.tools) newConfig.tools = {}
                if (!newConfig.tools[agentNode.id]) newConfig.tools[agentNode.id] = []
                newConfig.tools[agentNode.id].push({ node: newNode, edges: newEdge })
                return newConfig
            })

            // Add the new tool to the addedTools state
            setAddedTools((prevTools) => [...prevTools, newNode])
        }

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
        console.log('Sidebar - Received updated node:', JSON.stringify(updatedNode, null, 2))
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
            setOverrideConfig((prevConfig) => {
                const newConfig = { ...prevConfig }
                Object.entries(changedInputs).forEach(([key, value]) => {
                    if (!newConfig[key]) {
                        newConfig[key] = {}
                    }
                    newConfig[key][updatedNode.id] = value
                })
                console.log('Sidebar - Setting new overrideConfig:', JSON.stringify(newConfig, null, 2))
                return newConfig
            })
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
                        Object.entries(groupNodesByCategory([...(chatflowNodes[selectedChatflow] || []), ...addedTools])).map(
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
