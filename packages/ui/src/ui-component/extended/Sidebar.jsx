import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { List, ListItem, Collapse, Select, MenuItem } from '@mui/material'
import chatflowApi from '@/api/chatflows'
import SidebarNodeItem from './SidebarNodeItem'
import nodesApi from '@/api/nodes'

const Sidebar = ({ chatflows, selectedChatflow, setSelectedChatflow, setOverrideConfig }) => {
    const [chatflowNodes, setChatflowNodes] = useState({})
    const [nodeConfigs, setNodeConfigs] = useState({})

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
            const newConfig = {
                [updatedNode.id]: changedInputs
            }
            console.log('Sidebar - Updated overrideConfig:', newConfig)
            setOverrideConfig(newConfig)
        }
    }

    return (
        <List sx={{ width: 250, bgcolor: 'background.paper' }}>
            <ListItem>
                <Select value={selectedChatflow} onChange={handleChatflowChange} fullWidth>
                    {chatflows.map((chatflow) => (
                        <MenuItem key={chatflow.id} value={chatflow.id}>
                            {chatflow.name}
                        </MenuItem>
                    ))}
                </Select>
            </ListItem>
            <Collapse in={Boolean(selectedChatflow)} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    {chatflowNodes[selectedChatflow]?.map((node) => (
                        <SidebarNodeItem
                            key={node.id}
                            node={node}
                            nodeConfig={nodeConfigs[node.data.name]}
                            onNodeChange={handleNodeChange}
                        />
                    ))}
                </List>
            </Collapse>
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
