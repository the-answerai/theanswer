import React from 'react'
import { Box, Typography, List, ListItemButton, ListItemText, Button, CircularProgress, Paper } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ExportDialog from './ExportDialog'
import MarkdownPreview from '../../components/MarkdownPreview'

interface Section {
    filename: string
    name: string
    content: string
}

interface FinalReportPreviewTabProps {
    finalReportSections: Section[]
    finalReportEdits: { [filename: string]: string }
    selectedFinalSection: string
    setSelectedFinalSection: (filename: string) => void
    handleRegenerateFinalSection: (filename: string) => void
    finalSectionLoading: boolean
    finalReportLoading: boolean
    exportDialogOpen: boolean
    handleExportOpen: () => void
    handleExportClose: () => void
    exportOrder: string[]
    exportChecked: { [filename: string]: boolean }
    handleExportCheck: (filename: string) => void
    handleExportOrder: (result: any) => void
    handleExportDownload: () => void
}

const FinalReportPreviewTab: React.FC<FinalReportPreviewTabProps> = ({
    finalReportSections,
    finalReportEdits,
    selectedFinalSection,
    setSelectedFinalSection,
    handleRegenerateFinalSection,
    finalSectionLoading,
    finalReportLoading,
    exportDialogOpen,
    handleExportOpen,
    handleExportClose,
    exportOrder,
    exportChecked,
    handleExportCheck,
    handleExportOrder,
    handleExportDownload
}) => (
    <Box sx={{ display: 'flex', height: '70vh', maxHeight: '70vh' }}>
        {/* Sidebar nav */}
        <Box sx={{ width: 260, overflowY: 'auto' }}>
            <List dense>
                {finalReportSections.map((section) => (
                    <ListItemButton
                        key={section.filename}
                        selected={selectedFinalSection === section.filename}
                        onClick={() => setSelectedFinalSection(section.filename)}
                    >
                        <ListItemText primary={section.name} />
                    </ListItemButton>
                ))}
            </List>
            <Button
                variant='contained'
                color='primary'
                startIcon={<DownloadIcon />}
                sx={{ m: 2, width: 'calc(100% - 32px)' }}
                onClick={handleExportOpen}
                disabled={finalReportSections.length === 0}
            >
                Export
            </Button>
        </Box>
        {/* Main content: edit and preview */}
        <Box
            sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}
        >
            {finalReportLoading ? (
                <CircularProgress />
            ) : finalReportSections.length === 0 ? (
                <Typography color='text.secondary'>No report sections found.</Typography>
            ) : (
                (() => {
                    const selected = finalReportSections.find((s) => s.filename === selectedFinalSection) || finalReportSections[0]
                    if (!selected) return null
                    return (
                        <>
                            <Typography variant='h6' sx={{ mb: 1 }}>
                                {selected.name}
                            </Typography>
                            <Button
                                variant='outlined'
                                color='primary'
                                onClick={() => handleRegenerateFinalSection(selected.filename)}
                                disabled={finalSectionLoading}
                                sx={{ mb: 2 }}
                            >
                                {finalSectionLoading ? <CircularProgress size={18} /> : 'Regenerate Section'}
                            </Button>
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <MarkdownPreview markdown={finalReportEdits[selected.filename] ?? selected.content} />
                            </Paper>
                        </>
                    )
                })()
            )}
        </Box>
        {/* Export dialog */}
        <ExportDialog
            open={exportDialogOpen}
            onClose={handleExportClose}
            exportOrder={exportOrder}
            exportChecked={exportChecked}
            finalReportSections={finalReportSections}
            onExportCheck={handleExportCheck}
            onExportOrder={handleExportOrder}
            onExportDownload={handleExportDownload}
        />
    </Box>
)

export default FinalReportPreviewTab
