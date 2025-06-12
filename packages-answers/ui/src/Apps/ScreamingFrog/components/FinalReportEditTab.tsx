import React from 'react'
import { TextField } from '@mui/material'

interface FinalReportEditTabProps {
    finalReportEdit: string
    setFinalReportEdit: (value: string) => void
}

const FinalReportEditTab: React.FC<FinalReportEditTabProps> = ({ finalReportEdit, setFinalReportEdit }) => (
    <TextField
        label='Final Report (Markdown)'
        multiline
        minRows={10}
        fullWidth
        value={finalReportEdit}
        onChange={(e) => setFinalReportEdit(e.target.value)}
        sx={{ height: '70vh', maxHeight: '70vh', overflow: 'auto' }}
        InputProps={{
            style: {
                height: '70vh',
                maxHeight: '70vh',
                overflow: 'auto',
                verticalAlign: 'top'
            }
        }}
    />
)

export default FinalReportEditTab
