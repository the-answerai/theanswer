import { useEffect, useRef } from 'react'
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from 'reactflow'
import 'reactflow/dist/style.css'
import '@/views/canvas/index.css'

import { useLocation, useNavigate } from '@/utils/navigation'

// material-ui
import { Toolbar, Box, AppBar } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MarketplaceCanvasNode from './MarketplaceCanvasNode'
import MarketplaceCanvasHeader from './MarketplaceCanvasHeader'
import StickyNote from '../canvas/StickyNote'

// credential checking
import { useCredentialChecker } from '@/hooks/useCredentialChecker'
import UnifiedCredentialsModal from '@/ui-component/dialog/UnifiedCredentialsModal'

const nodeTypes = { customNode: MarketplaceCanvasNode, stickyNote: StickyNote }
const edgeTypes = { buttonedge: '' }

// ==============================|| CANVAS ||============================== //

const MarketplaceCanvas = () => {
    const theme = useTheme()
    const navigate = useNavigate()

    const { state } = useLocation()
    const { flowData, name } = state

    // ==============================|| ReactFlow ||============================== //

    const [nodes, setNodes, onNodesChange] = useNodesState()
    const [edges, setEdges, onEdgesChange] = useEdgesState()

    const reactFlowWrapper = useRef(null)

    // Credential checking hook
    const { showCredentialModal, missingCredentials, checkCredentials, handleAssign, handleSkip, handleCancel } = useCredentialChecker()

    // ==============================|| useEffect ||============================== //

    useEffect(() => {
        if (flowData) {
            const initialFlow = JSON.parse(flowData)
            setNodes(initialFlow.nodes || [])
            setEdges(initialFlow.edges || [])
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowData])

    const proceedWithTemplate = (updatedFlowData) => {
        /**
         * Processes template data and stores it in localStorage for the Canvas component.
         * Preserves critical metadata like chatbotConfig, visibility, type, and category
         * to ensure proper functionality when the template is copied.
         */

        const isAgentCanvas = (updatedFlowData?.nodes || []).some(
            (node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents'
        )

        const flowDataParsed = typeof updatedFlowData === 'string' ? JSON.parse(updatedFlowData) : updatedFlowData

        // Store the data in the format Canvas component expects
        const chatflowData = {
            name: name || 'Copied Template',
            description: state?.description || 'Copied from marketplace', // Preserve original description
            nodes: flowDataParsed.nodes || [],
            edges: flowDataParsed.edges || [],
            flowData: JSON.stringify(flowDataParsed),
            parentChatflowId: state?.parentChatflowId,
            // Preserve critical template metadata
            chatbotConfig: state?.chatbotConfig,
            visibility: state?.visibility,
            type: state?.type,
            category: state?.category
        }

        try {
            localStorage.setItem('duplicatedFlowData', JSON.stringify(chatflowData))
        } catch (error) {
            console.error('Failed to store template data in localStorage:', error)
            // Continue with navigation even if localStorage fails
        }

        const targetPath = `/${isAgentCanvas ? 'agentcanvas' : 'canvas'}`
        navigate(targetPath)
    }

    const onChatflowCopy = (flowData) => {
        // Check for missing credentials before proceeding
        checkCredentials(flowData, proceedWithTemplate)
    }

    return (
        <>
            <Box>
                <AppBar
                    enableColorOnDark
                    position='fixed'
                    color='inherit'
                    elevation={1}
                    sx={{
                        bgcolor: theme.palette.background.default
                    }}
                >
                    <Toolbar>
                        <MarketplaceCanvasHeader
                            flowName={name}
                            flowData={JSON.parse(flowData)}
                            onChatflowCopy={(flowData) => onChatflowCopy(flowData)}
                        />
                    </Toolbar>
                </AppBar>
                <Box sx={{ pt: '70px', height: '100vh', width: '100%' }}>
                    <div className='reactflow-parent-wrapper'>
                        <div className='reactflow-wrapper' ref={reactFlowWrapper}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                nodesDraggable={false}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                fitView
                                minZoom={0.1}
                            >
                                <Controls
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                />
                                <Background color='#aaa' gap={16} />
                            </ReactFlow>
                        </div>
                    </div>
                </Box>
            </Box>

            {/* Unified Credentials Modal */}
            <UnifiedCredentialsModal
                show={showCredentialModal}
                missingCredentials={missingCredentials}
                onAssign={handleAssign}
                onSkip={handleSkip}
                onCancel={handleCancel}
                flowData={flowData ? JSON.parse(flowData) : null}
            />
        </>
    )
}

export default MarketplaceCanvas
