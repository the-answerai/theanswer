import React from 'react'
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material'
import MarkdownPreview from '../../components/MarkdownPreview'

interface ReportSectionEditorProps {
    currentReport: string
    newReport: string
    reportLoading: boolean
    reportSaving: boolean
    onGenerateNewReport: () => void
    onSaveReportSection: () => void
}

const ReportSectionEditor: React.FC<ReportSectionEditorProps> = ({
    currentReport,
    newReport,
    reportLoading,
    reportSaving,
    onGenerateNewReport,
    onSaveReportSection
}) => (
    <Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
                <Typography variant='h6' sx={{ mb: 1 }}>
                    Current Saved Report
                </Typography>
                <Paper
                    sx={{
                        p: 2,
                        minHeight: 200,
                        height: '60vh',
                        maxHeight: '60vh',
                        overflow: 'auto'
                    }}
                >
                    {currentReport ? (
                        <MarkdownPreview markdown={currentReport} />
                    ) : (
                        <Typography color='text.secondary'>No report generated yet.</Typography>
                    )}
                </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant='h6' sx={{ mb: 1 }}>
                    Newly Generated Report
                </Typography>
                <Paper
                    sx={{
                        p: 2,
                        minHeight: 200,
                        height: '60vh',
                        maxHeight: '60vh',
                        overflow: 'auto',
                        whiteSpace: 'pre-line'
                    }}
                >
                    {reportLoading ? (
                        <CircularProgress />
                    ) : (
                        newReport || <Typography color='text.secondary'>No new report generated.</Typography>
                    )}
                </Paper>
            </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant='contained' onClick={onGenerateNewReport} disabled={reportLoading}>
                {reportLoading ? <CircularProgress size={20} /> : 'Generate Report'}
            </Button>
            <Button variant='contained' color='success' onClick={onSaveReportSection} disabled={reportSaving || !newReport}>
                {reportSaving ? <CircularProgress size={20} /> : 'Save'}
            </Button>
        </Box>
    </Box>
)

export default ReportSectionEditor
