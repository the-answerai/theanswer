'use client'
import { Dialog, DialogTitle } from '@mui/material'

interface Props {
    open: boolean
    onClose: () => void
}

const ResearchViewDialog = ({ open, onClose }: Props) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Research View</DialogTitle>
        </Dialog>
    )
}

export default ResearchViewDialog
