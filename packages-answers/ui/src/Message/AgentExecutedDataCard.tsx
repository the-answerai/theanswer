import { useEffect, useState, useCallback, forwardRef, memo } from 'react'

// MUI
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import {
    Typography,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    IconButton
} from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useTreeItem2 } from '@mui/x-tree-view/useTreeItem2'
import {
    TreeItem2Content,
    TreeItem2IconContainer,
    TreeItem2GroupTransition,
    TreeItem2Label,
    TreeItem2Root,
    TreeItem2Checkbox
} from '@mui/x-tree-view/TreeItem2'
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon'
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider'
import { TreeItem2DragAndDropOverlay } from '@mui/x-tree-view/TreeItem2DragAndDropOverlay'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { IconArrowsMaximize, IconLoader, IconCircleXFilled, IconRelationOneToManyFilled } from '@tabler/icons-react'

// Project imports
import { FLOWISE_CREDENTIAL_ID, AGENTFLOW_ICONS } from '../constants/agentflow'
import { NodeExecutionDetails } from './NodeExecutionDetails'

export interface AgentFlowExecutionNode {
    nodeId: string
    nodeLabel: string
    previousNodeIds: string[]
    status: 'FINISHED' | 'ERROR' | 'TIMEOUT' | 'TERMINATED' | 'STOPPED' | 'INPROGRESS'
    data: any
}

interface AgentExecutedDataCardProps {
    executedData: AgentFlowExecutionNode[]
    chatflowId: string
    sessionId: string
}

interface TreeNode {
    id: string
    label: string
    name?: string
    status: string
    data: any
    children: TreeNode[]
}

const getIconColor = (status: string) => {
    switch (status) {
        case 'FINISHED':
            return 'success.dark'
        case 'ERROR':
        case 'TIMEOUT':
            return 'error.main'
        case 'TERMINATED':
        case 'STOPPED':
            return 'error.main'
        case 'INPROGRESS':
            return 'warning.dark'
    }
}

const StyledTreeItemRoot = styled(TreeItem2Root)(({ theme }) => ({
    color: theme.palette.grey[400]
}))

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme }) => ({
    flexDirection: 'row-reverse',
    borderRadius: theme.spacing(0.7),
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    paddingRight: theme.spacing(1),
    fontWeight: 500,
    [`&.Mui-expanded `]: {
        '&:not(.Mui-focused, .Mui-selected, .Mui-selected.Mui-focused) .labelIcon': {
            color: theme.palette.primary.dark,
            ...theme.applyStyles('light', {
                color: theme.palette.primary.main
            })
        },
        '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            left: '16px',
            top: '44px',
            height: 'calc(100% - 48px)',
            width: '1.5px',
            backgroundColor: theme.palette.grey[700],
            ...theme.applyStyles('light', {
                backgroundColor: theme.palette.grey[300]
            })
        }
    },
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: 'white',
        ...theme.applyStyles('light', {
            color: theme.palette.primary.main
        })
    },
    [`&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused`]: {
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.primary.contrastText,
        ...theme.applyStyles('light', {
            backgroundColor: theme.palette.primary.main
        })
    }
}))

const StyledTreeItemLabelText = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary
}))

interface CustomLabelProps {
    icon?: React.ComponentType<any>
    itemStatus?: string
    children: React.ReactNode
    name?: string
    label?: string
    data?: any
    metadata?: {
        agentflowId: string
        sessionId: string
    }
}

function CustomLabel({ icon: Icon, itemStatus, children, name, label, data, metadata }: CustomLabelProps) {
    const [openDialog, setOpenDialog] = useState(false)

    const handleOpenDialog = (event: React.MouseEvent) => {
        event.stopPropagation()
        setOpenDialog(true)
    }

    const handleCloseDialog = () => setOpenDialog(false)

    const isIterationNode = name === 'iterationAgentflow'

    return (
        <TreeItem2Label
            sx={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {(() => {
                    if (isIterationNode) {
                        return (
                            <Box
                                sx={{
                                    mr: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <IconRelationOneToManyFilled size={20} color={'#9C89B8'} />
                            </Box>
                        )
                    }

                    const foundIcon = AGENTFLOW_ICONS.find((icon) => icon.name === name)
                    if (foundIcon) {
                        return (
                            <Box
                                sx={{
                                    mr: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <foundIcon.icon size={20} color={foundIcon.color} />
                            </Box>
                        )
                    }
                    return null
                })()}

                <StyledTreeItemLabelText sx={{ flex: 1 }}>{children}</StyledTreeItemLabelText>
                <IconButton
                    onClick={handleOpenDialog}
                    size='small'
                    title='View Details'
                    sx={{
                        ml: 2,
                        zIndex: 10
                    }}
                >
                    <IconArrowsMaximize size={15} color={'teal'} />
                </IconButton>
                {Icon && <Box component={Icon} className='labelIcon' color={getIconColor(itemStatus || '')} sx={{ ml: 1, fontSize: '1.2rem' }} />}
            </Box>
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='md' fullWidth>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    {data ? (
                        <NodeExecutionDetails
                            open={openDialog}
                            onClose={handleCloseDialog}
                            nodeData={{
                                nodeId: data.id || '',
                                nodeLabel: label || '',
                                status: itemStatus || '',
                                data: data
                            }}
                        />
                    ) : (
                        <Typography color='text.secondary'>No data available for this item</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </TreeItem2Label>
    )
}

const isExpandable = (reactChildren: any): boolean => {
    if (Array.isArray(reactChildren)) {
        return reactChildren.length > 0 && reactChildren.some(isExpandable)
    }
    return Boolean(reactChildren)
}

const getIconFromStatus = (status: string, theme: any) => {
    switch (status) {
        case 'FINISHED':
            return CheckCircleIcon
        case 'ERROR':
        case 'TIMEOUT':
            return ErrorIcon
        case 'TERMINATED':
            return (props: any) => <IconCircleXFilled {...props} color={theme.palette.error.main} />
        case 'STOPPED':
            return StopCircleIcon
        case 'INPROGRESS':
            return (props: any) => <IconLoader {...props} color={theme.palette.warning.dark} className={`spin-animation ${props.className || ''}`} />
    }
}

interface CustomTreeItemProps {
    id?: string
    itemId: string
    label: string
    disabled?: boolean
    children?: React.ReactNode
    agentflowId: string
    sessionId: string
    className?: string
}

const CustomTreeItem = forwardRef<HTMLLIElement, CustomTreeItemProps>(function CustomTreeItem(props, ref) {
    const { id, itemId, label, disabled, children, agentflowId, sessionId, ...other } = props
    const theme = useTheme()

    const {
        getRootProps,
        getContentProps,
        getIconContainerProps,
        getCheckboxProps,
        getLabelProps,
        getGroupTransitionProps,
        getDragAndDropOverlayProps,
        status,
        publicAPI
    } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref })

    const item = publicAPI.getItem(itemId)
    const expandable = isExpandable(children)
    let icon
    if (item.status) {
        icon = getIconFromStatus(item.status, theme)
    }

    return (
        <TreeItem2Provider itemId={itemId}>
            <StyledTreeItemRoot {...getRootProps(other)}>
                <CustomTreeItemContent {...getContentProps()}>
                    <TreeItem2IconContainer {...getIconContainerProps()}>
                        <TreeItem2Icon status={status} />
                    </TreeItem2IconContainer>
                    <TreeItem2Checkbox {...getCheckboxProps()} />
                    <CustomLabel
                        {...getLabelProps({
                            icon,
                            itemStatus: item.status,
                            expandable: expandable && status.expanded,
                            name: item.name || item.id?.split('_')[0],
                            label: item.label,
                            data: item.data,
                            metadata: { agentflowId, sessionId }
                        })}
                    />
                    <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
                </CustomTreeItemContent>
                {children && (
                    <TreeItem2GroupTransition
                        {...getGroupTransitionProps()}
                        style={{
                            borderLeft: `${status.selected ? '3px solid' : '1px dashed'} ${(() => {
                                const nodeName = item.name || item.id?.split('_')[0]
                                const foundIcon = AGENTFLOW_ICONS.find((icon) => icon.name === nodeName)
                                return foundIcon ? foundIcon.color : theme.palette.primary.main
                            })()}`,
                            marginLeft: '13px',
                            paddingLeft: '8px'
                        }}
                    />
                )}
            </StyledTreeItemRoot>
        </TreeItem2Provider>
    )
})

const AgentExecutedDataCard = ({ executedData, chatflowId, sessionId }: AgentExecutedDataCardProps) => {
    const [executionTree, setExecution] = useState<TreeNode[]>([])
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const [selectedItem, setSelectedItem] = useState<TreeNode | null>(null)
    const theme = useTheme()

    const getAllNodeIds = (nodes: TreeNode[]): string[] => {
        let ids: string[] = []
        nodes.forEach((node) => {
            ids.push(node.id)
            if (node.children && node.children.length > 0) {
                ids = [...ids, ...getAllNodeIds(node.children)]
            }
        })
        return ids
    }

    // Transform the execution data into a tree structure
    const buildTreeData = (nodes: AgentFlowExecutionNode[]): TreeNode[] => {
        // Remove FLOWISE_CREDENTIAL_ID from all nested keys
        nodes.forEach((node) => {
            const removeFlowiseCredentialId = (data: any) => {
                for (const key in data) {
                    if (key === FLOWISE_CREDENTIAL_ID) {
                        delete data[key]
                    }
                    if (typeof data[key] === 'object') {
                        removeFlowiseCredentialId(data[key])
                    }
                }
            }
            removeFlowiseCredentialId(node.data)
        })

        // Create a map for quick node lookup
        const nodeMap = new Map()
        nodes.forEach((node, index) => {
            const uniqueNodeId = `${node.nodeId}_${index}`
            nodeMap.set(uniqueNodeId, { ...node, uniqueNodeId, children: [], executionIndex: index })
        })

        // Identify iteration nodes and their children
        const iterationGroups = new Map()

        // Group iteration child nodes by their parent and iteration index
        nodes.forEach((node, index) => {
            if (node.data?.parentNodeId && node.data?.iterationIndex !== undefined) {
                const parentId = node.data.parentNodeId
                const iterationIndex = node.data.iterationIndex

                if (!iterationGroups.has(parentId)) {
                    iterationGroups.set(parentId, new Map())
                }

                const iterationMap = iterationGroups.get(parentId)
                if (!iterationMap.has(iterationIndex)) {
                    iterationMap.set(iterationIndex, [])
                }

                iterationMap.get(iterationIndex).push(`${node.nodeId}_${index}`)
            }
        })

        // Create virtual iteration container nodes
        iterationGroups.forEach((iterationMap, parentId) => {
            iterationMap.forEach((nodeIds: string[], iterationIndex: number) => {
                // Find the parent iteration node
                let parentNode = null
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].nodeId === parentId) {
                        parentNode = nodes[i]
                        break
                    }
                }

                if (!parentNode) return

                // Get iteration context from first child node
                const firstChildId = nodeIds[0]
                const firstChild = nodeMap.get(firstChildId)
                const iterationContext = firstChild?.data?.iterationContext || { index: iterationIndex }

                // Create a virtual node for this iteration
                const iterationNodeId = `${parentId}_${iterationIndex}`
                const iterationLabel = `Iteration #${iterationIndex}`

                // Determine status based on child nodes
                const childNodes = nodeIds.map((id) => nodeMap.get(id))
                const iterationStatus = childNodes.some((n: any) => n.status === 'ERROR')
                    ? 'ERROR'
                    : childNodes.some((n: any) => n.status === 'INPROGRESS')
                      ? 'INPROGRESS'
                      : childNodes.every((n: any) => n.status === 'FINISHED')
                        ? 'FINISHED'
                        : 'UNKNOWN'

                // Create the virtual node and add to nodeMap
                const virtualNode = {
                    nodeId: iterationNodeId,
                    nodeLabel: iterationLabel,
                    data: {
                        name: 'iterationAgentflow',
                        iterationIndex,
                        iterationContext,
                        isVirtualNode: true,
                        parentIterationId: parentId
                    },
                    previousNodeIds: [],
                    status: iterationStatus,
                    uniqueNodeId: iterationNodeId,
                    children: [],
                    executionIndex: -1
                }

                nodeMap.set(iterationNodeId, virtualNode)

                // Set this virtual node as the parent for all nodes in this iteration
                nodeIds.forEach((childId) => {
                    const childNode = nodeMap.get(childId)
                    if (childNode) {
                        childNode.virtualParentId = iterationNodeId
                    }
                })
            })
        })

        // Root nodes have no previous nodes
        const rootNodes: any[] = []
        const processedNodes = new Set()

        // First pass: Build the main tree structure (excluding iteration children)
        nodes.forEach((node, index) => {
            const uniqueNodeId = `${node.nodeId}_${index}`
            const treeNode = nodeMap.get(uniqueNodeId)

            // Skip nodes that belong to an iteration
            if (node.data?.parentNodeId && node.data?.iterationIndex !== undefined) {
                return
            }

            if (node.previousNodeIds.length === 0) {
                rootNodes.push(treeNode)
            } else {
                // Find the most recent parent node
                let mostRecentParentIndex = -1
                let mostRecentParentId = null

                node.previousNodeIds.forEach((parentId) => {
                    for (let i = 0; i < index; i++) {
                        if (nodes[i].nodeId === parentId && i > mostRecentParentIndex) {
                            mostRecentParentIndex = i
                            mostRecentParentId = parentId
                        }
                    }
                })

                // Only add to the most recent parent
                if (mostRecentParentIndex !== -1) {
                    const parentUniqueId = `${mostRecentParentId}_${mostRecentParentIndex}`
                    const parentNode = nodeMap.get(parentUniqueId)
                    if (parentNode) {
                        parentNode.children.push(treeNode)
                        processedNodes.add(uniqueNodeId)
                    }
                }
            }
        })

        // Second pass: Build the iteration sub-trees
        iterationGroups.forEach((iterationMap, parentId) => {
            // Find all instances of the parent node
            const parentInstances: string[] = []
            nodes.forEach((node, index) => {
                if (node.nodeId === parentId) {
                    parentInstances.push(`${node.nodeId}_${index}`)
                }
            })

            // Find the latest instance of the parent node
            let latestParent = null
            for (let i = parentInstances.length - 1; i >= 0; i--) {
                const parentId = parentInstances[i]
                const parent = nodeMap.get(parentId)
                if (parent) {
                    latestParent = parent
                    break
                }
            }

            if (!latestParent) return

            // Add all virtual iteration nodes to the parent
            iterationMap.forEach((nodeIds: string[], iterationIndex: number) => {
                const iterationNodeId = `${parentId}_${iterationIndex}`
                const virtualNode = nodeMap.get(iterationNodeId)
                if (virtualNode) {
                    latestParent.children.push(virtualNode)
                }
            })
        })

        // Third pass: Build the structure inside each virtual iteration node
        nodeMap.forEach((node) => {
            if (node.virtualParentId) {
                const virtualParent = nodeMap.get(node.virtualParentId)
                if (virtualParent) {
                    if (node.previousNodeIds.length === 0) {
                        virtualParent.children.push(node)
                    } else {
                        let parentFound = false
                        for (const prevNodeId of node.previousNodeIds) {
                            nodeMap.forEach((potentialParent) => {
                                if (
                                    potentialParent.nodeId === prevNodeId &&
                                    potentialParent.data?.iterationIndex === node.data?.iterationIndex &&
                                    potentialParent.data?.parentNodeId === node.data?.parentNodeId &&
                                    !parentFound
                                ) {
                                    potentialParent.children.push(node)
                                    parentFound = true
                                }
                            })
                        }

                        if (!parentFound) {
                            virtualParent.children.push(node)
                        }
                    }
                }
            }
        })

        // Final pass: Sort all children arrays
        const sortChildrenNodes = (node: any) => {
            if (node.children && node.children.length > 0) {
                node.children.sort((a: any, b: any) => {
                    const aIsIteration = a.data?.name === 'iterationAgentflow' || a.data?.isVirtualNode
                    const bIsIteration = b.data?.name === 'iterationAgentflow' || b.data?.isVirtualNode

                    if (aIsIteration === bIsIteration) {
                        return a.executionIndex - b.executionIndex
                    }

                    return aIsIteration ? -1 : 1
                })

                node.children.forEach(sortChildrenNodes)
            }
        }

        rootNodes.forEach(sortChildrenNodes)

        // Transform to the required format
        const transformNode = (node: any): TreeNode => ({
            id: node.uniqueNodeId,
            label: node.nodeLabel,
            name: node.data?.name,
            status: node.status,
            data: node.data,
            children: node.children.map(transformNode)
        })

        return rootNodes.map(transformNode)
    }

    const handleExpandedItemsChange = (event: React.SyntheticEvent, itemIds: string[]) => {
        setExpandedItems(itemIds)
    }

    useEffect(() => {
        if (executedData) {
            const newTree = buildTreeData(executedData)

            setExecution(newTree)
            setExpandedItems(getAllNodeIds(newTree))
            if (newTree.length > 0) {
                setSelectedItem(newTree[0])
            }
        }
    }, [executedData])

    const handleNodeSelect = (event: React.SyntheticEvent, itemId: string | null) => {
        if (!itemId) return

        const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
            for (const node of nodes) {
                if (node.id === id) return node
                if (node.children) {
                    const found = findNode(node.children, id)
                    if (found) return found
                }
            }
            return null
        }

        const selectedNode = findNode(executionTree, itemId)
        setSelectedItem(selectedNode)
    }

    const getExecutionStatus = useCallback((executionTree: TreeNode[]) => {
        const getAllStatuses = (nodes: TreeNode[]): string[] => {
            let statuses: string[] = []
            nodes.forEach((node) => {
                if (node.status) statuses.push(node.status)
                if (node.children && node.children.length > 0) {
                    statuses = [...statuses, ...getAllStatuses(node.children)]
                }
            })
            return statuses
        }

        const statuses = getAllStatuses(executionTree)
        if (statuses.includes('ERROR')) return 'ERROR'
        if (statuses.includes('INPROGRESS')) return 'INPROGRESS'
        if (statuses.includes('STOPPED')) return 'STOPPED'
        if (statuses.every((status) => status === 'FINISHED')) return 'FINISHED'
        return null
    }, [])

    return (
        <Box sx={{ display: 'flex', height: '100%', width: '100%', mt: 2 }}>
            <Accordion
                sx={{
                    width: '100%'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        '& .MuiAccordionSummary-content': {
                            alignItems: 'center'
                        }
                    }}
                >
                    {executionTree.length > 0 &&
                        (() => {
                            const execStatus = getExecutionStatus(executionTree)
                            return (
                                <Box sx={{ mr: 1, fontSize: '1.2rem' }}>
                                    <Box
                                        component={getIconFromStatus(execStatus || '', theme)}
                                        sx={{
                                            mr: 1,
                                            fontSize: '1.2rem',
                                            color: getIconColor(execStatus || '')
                                        }}
                                    />
                                </Box>
                            )
                        })()}
                    <Typography>Process Flow</Typography>
                </AccordionSummary>
                <Divider />
                <AccordionDetails>
                    <RichTreeView
                        expandedItems={expandedItems}
                        onExpandedItemsChange={handleExpandedItemsChange}
                        selectedItems={selectedItem ? selectedItem.id : null}
                        onSelectedItemsChange={handleNodeSelect}
                        items={executionTree}
                        slots={{
                            item: (treeItemProps: any) => <CustomTreeItem {...treeItemProps} agentflowId={chatflowId} sessionId={sessionId} />
                        }}
                        sx={{ width: '100%' }}
                    />
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

export default memo(AgentExecutedDataCard)
