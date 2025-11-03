import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip } from '@mui/material'
import { JsonViewer } from '@textea/json-viewer'

interface NodeExecutionDetailsProps {
    open: boolean
    onClose: () => void
    nodeData: {
        nodeId: string
        nodeLabel: string
        status: string
        data: any
    } | null
}

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'FINISHED':
            return 'success'
        case 'ERROR':
            return 'error'
        case 'INPROGRESS':
            return 'info'
        default:
            return 'default'
    }
}

export const NodeExecutionDetails: React.FC<NodeExecutionDetailsProps> = ({ open, onClose, nodeData }) => {
    if (!nodeData) return null

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                <Typography variant='h6'>{nodeData.nodeLabel}</Typography>
                <Chip label={nodeData.status} color={getStatusColor(nodeData.status)} size='small' />
            </DialogTitle>
            <DialogContent>
                <Box sx={{ maxHeight: '60vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                        <Typography variant='subtitle2' sx={{ mb: 1, color: '#B0B0B0' }}>
                            Node ID:
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#E0E0E0', fontFamily: 'monospace' }}>
                            {nodeData.nodeId}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant='subtitle2' sx={{ mb: 1, color: '#B0B0B0' }}>
                            Execution Data:
                        </Typography>
                        <JsonViewer
                            rootName='data'
                            value={nodeData.data}
                            theme={'dark'}
                            defaultInspectDepth={2}
                            collapseStringsAfterLength={300}
                            displayDataTypes={true}
                            quotesOnKeys={false}
                            enableClipboard={true}
                            displayObjectSize={true}
                            maxDisplayLength={1000}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
