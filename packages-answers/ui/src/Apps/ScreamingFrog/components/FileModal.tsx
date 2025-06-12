import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Button } from '@mui/material'
import PromptEditor from './PromptEditor'
import ReportSectionEditor from './ReportSectionEditor'

interface FileInfo {
    filename: string
    columns: string[]
    sample: Record<string, string>[]
    prompt: string
    editedPrompt: string
    reportSection: string
    loading: boolean
    saving: boolean
    isDirty: boolean
    recommendLoading: boolean
}

interface FileModalProps {
    open: boolean
    onClose: () => void
    modalTab: number
    setModalTab: (tab: number) => void
    file: FileInfo | null
    handlePromptChange: (value: string) => void
    handleRecommendPrompt: () => void
    handleSavePrompt: () => void
    handleGenerateNewReport: () => void
    handleSaveReportSection: () => void
    currentReport: string
    newReport: string
    reportLoading: boolean
    reportSaving: boolean
}

const FileModal: React.FC<FileModalProps> = ({
    open,
    onClose,
    modalTab,
    setModalTab,
    file,
    handlePromptChange,
    handleRecommendPrompt,
    handleSavePrompt,
    handleGenerateNewReport,
    handleSaveReportSection,
    currentReport,
    newReport,
    reportLoading,
    reportSaving
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
        <DialogTitle>{file ? file.filename : ''}</DialogTitle>
        <DialogContent
            dividers
            sx={{
                height: 'calc(90vh - 64px - 56px)',
                maxHeight: 'calc(90vh - 64px - 56px)'
            }}
        >
            <Tabs value={modalTab} onChange={(_, v) => setModalTab(v)} sx={{ mb: 2 }}>
                <Tab label='Prompt' />
                <Tab label='Report Section' />
            </Tabs>
            {modalTab === 0 && file && (
                <PromptEditor
                    prompt={file.prompt}
                    editedPrompt={file.editedPrompt}
                    isDirty={file.isDirty}
                    saving={file.saving}
                    recommendLoading={file.recommendLoading}
                    onPromptChange={handlePromptChange}
                    onRecommendPrompt={handleRecommendPrompt}
                    onSavePrompt={handleSavePrompt}
                />
            )}
            {modalTab === 1 && file && (
                <ReportSectionEditor
                    currentReport={currentReport}
                    newReport={newReport}
                    reportLoading={reportLoading}
                    reportSaving={reportSaving}
                    onGenerateNewReport={handleGenerateNewReport}
                    onSaveReportSection={handleSaveReportSection}
                />
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>
)

export default FileModal
