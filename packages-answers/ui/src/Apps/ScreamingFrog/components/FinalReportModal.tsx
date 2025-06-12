import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Button, CircularProgress } from '@mui/material'
import type { DropResult } from '@hello-pangea/dnd'
import FinalReportPreviewTab from './FinalReportPreviewTab'
import FinalReportEditTab from './FinalReportEditTab'

interface Section {
    filename: string
    name: string
    content: string
}

interface FinalReportModalProps {
    open: boolean
    onClose: () => void
    finalReportTab: number
    setFinalReportTab: (tab: number) => void
    finalReportSections: Section[]
    finalReportEdits: { [filename: string]: string }
    setFinalReportEdit: (value: string) => void
    finalReportEdit: string
    finalReportLoading: boolean
    finalReportSaving: boolean
    handleSaveFinalReport: () => void
    selectedFinalSection: string
    setSelectedFinalSection: (filename: string) => void
    handleRegenerateFinalSection: (filename: string) => void
    finalSectionLoading: boolean
    exportDialogOpen: boolean
    handleExportOpen: () => void
    handleExportClose: () => void
    exportOrder: string[]
    exportChecked: { [filename: string]: boolean }
    handleExportCheck: (filename: string) => void
    handleExportOrder: (result: DropResult) => void
    handleExportDownload: () => void
}

const FinalReportModal: React.FC<FinalReportModalProps> = ({
    open,
    onClose,
    finalReportTab,
    setFinalReportTab,
    finalReportSections,
    finalReportEdits,
    setFinalReportEdit,
    finalReportEdit,
    finalReportLoading,
    finalReportSaving,
    handleSaveFinalReport,
    selectedFinalSection,
    setSelectedFinalSection,
    handleRegenerateFinalSection,
    finalSectionLoading,
    exportDialogOpen,
    handleExportOpen,
    handleExportClose,
    exportOrder,
    exportChecked,
    handleExportCheck,
    handleExportOrder,
    handleExportDownload
}) => (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
            sx: {
                width: '90vw',
                height: '90vh',
                maxWidth: '90vw',
                maxHeight: '90vh'
            }
        }}
    >
        <DialogTitle>Edit/Preview Final Report</DialogTitle>
        <DialogContent
            dividers
            sx={{
                height: 'calc(90vh - 64px - 56px)',
                maxHeight: 'calc(90vh - 64px - 56px)'
            }}
        >
            <Tabs value={finalReportTab} onChange={(_, v) => setFinalReportTab(v)} sx={{ mb: 2 }}>
                <Tab label='Preview' />
                <Tab label='Edit' />
            </Tabs>
            {finalReportTab === 0 && (
                <FinalReportPreviewTab
                    finalReportSections={finalReportSections}
                    finalReportEdits={finalReportEdits}
                    selectedFinalSection={selectedFinalSection}
                    setSelectedFinalSection={setSelectedFinalSection}
                    handleRegenerateFinalSection={handleRegenerateFinalSection}
                    finalSectionLoading={finalSectionLoading}
                    finalReportLoading={finalReportLoading}
                    exportDialogOpen={exportDialogOpen}
                    handleExportOpen={handleExportOpen}
                    handleExportClose={handleExportClose}
                    exportOrder={exportOrder}
                    exportChecked={exportChecked}
                    handleExportCheck={handleExportCheck}
                    handleExportOrder={handleExportOrder}
                    handleExportDownload={handleExportDownload}
                />
            )}
            {finalReportTab === 1 && <FinalReportEditTab finalReportEdit={finalReportEdit} setFinalReportEdit={setFinalReportEdit} />}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Close</Button>
            <Button variant='contained' color='success' onClick={handleSaveFinalReport} disabled={finalReportSaving}>
                {finalReportSaving ? <CircularProgress size={20} /> : 'Save'}
            </Button>
        </DialogActions>
    </Dialog>
)

export default FinalReportModal
