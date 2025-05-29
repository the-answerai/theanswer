'use client'
import { Dialog, DialogTitle, DialogActions, Button } from '@mui/material'

interface Props {
    open: boolean
    onClose: (confirm: boolean) => void
}

const DeleteConfirmDialog = ({ open, onClose }: Props) => (
    <Dialog open={open} onClose={() => onClose(false)}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogActions>
            <Button onClick={() => onClose(false)}>Cancel</Button>
            <Button onClick={() => onClose(true)} color='error'>
                Delete
            </Button>
        </DialogActions>
    </Dialog>
)

export default DeleteConfirmDialog
