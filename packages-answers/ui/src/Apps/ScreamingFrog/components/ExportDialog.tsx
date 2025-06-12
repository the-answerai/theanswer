import React from 'react'
import {
    Dialog as MuiDialog,
    DialogTitle as MuiDialogTitle,
    DialogContent as MuiDialogContent,
    DialogActions as MuiDialogActions,
    List,
    ListItemButton,
    ListItemText,
    Checkbox,
    Button,
    IconButton
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import Draggable from 'react-draggable'

interface Section {
    filename: string
    name: string
    content: string
}

interface ExportDialogProps {
    open: boolean
    onClose: () => void
    exportOrder: string[]
    exportChecked: { [filename: string]: boolean }
    finalReportSections: Section[]
    onExportCheck: (filename: string) => void
    onExportOrder: (newOrder: string[]) => void
    onExportDownload: () => void
}

const ExportDialog: React.FC<ExportDialogProps> = ({
    open,
    onClose,
    exportOrder,
    exportChecked,
    finalReportSections,
    onExportCheck,
    onExportOrder,
    onExportDownload
}) => (
    <MuiDialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
        <MuiDialogTitle>
            Export Final Report
            <IconButton aria-label='close' onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CloseIcon />
            </IconButton>
        </MuiDialogTitle>
        <MuiDialogContent>
            <List>
                {exportOrder.map((filename, idx) => {
                    const section = finalReportSections.find((s) => s.filename === filename)
                    if (!section) return null
                    return (
                        <Draggable
                            key={filename}
                            axis='y'
                            bounds='parent'
                            onStop={(e, data) => {
                                const delta = Math.round(data.y / 40)
                                let newIdx = idx + delta
                                if (newIdx < 0) newIdx = 0
                                if (newIdx >= exportOrder.length) newIdx = exportOrder.length - 1
                                if (newIdx !== idx) {
                                    const newOrder = [...exportOrder]
                                    const [removed] = newOrder.splice(idx, 1)
                                    newOrder.splice(newIdx, 0, removed)
                                    onExportOrder(newOrder)
                                }
                            }}
                        >
                            <ListItemButton sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Checkbox checked={exportChecked[filename]} onChange={() => onExportCheck(filename)} />
                                <ListItemText primary={section.name} />
                            </ListItemButton>
                        </Draggable>
                    )
                })}
            </List>
        </MuiDialogContent>
        <MuiDialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant='contained' color='primary' onClick={onExportDownload} startIcon={<DownloadIcon />}>
                Download
            </Button>
        </MuiDialogActions>
    </MuiDialog>
)

export default ExportDialog
