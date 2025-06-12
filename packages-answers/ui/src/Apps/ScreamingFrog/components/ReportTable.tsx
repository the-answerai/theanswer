import React from 'react'
import { Button, CircularProgress, Link } from '@mui/material'
import TableWrapper from '../../components/TableWrapper'

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
    totalRows?: number
}

interface ReportTableProps {
    files: FileInfo[]
    openModal: (idx: number, tab?: number, autoGen?: boolean) => void
    handleGenerateReportFromList: (idx: number) => void
    formatReportName: (filename: string) => string
    handleDeleteFile: (idx: number) => void
}

const columns = ['Group', 'Report Name', 'Rows', 'Actions']

const ReportTable: React.FC<ReportTableProps> = ({
    files,
    openModal,
    handleGenerateReportFromList,
    formatReportName,
    handleDeleteFile
}) => {
    const rows = files.map((f, idx) => {
        const reportName = formatReportName(f.filename)
        const group = reportName.split(' ')[0]
        const rowCount = typeof f.totalRows === 'number' ? f.totalRows.toString() : ''
        return [group, reportName, rowCount, idx.toString()]
    })

    return (
        <TableWrapper
            columns={columns}
            rows={rows}
            renderCell={(cell, rowIdx, colIdx) => {
                const f = files[parseInt(rows[rowIdx][3], 10)]
                switch (colIdx) {
                    case 0:
                        // Group
                        return rows[rowIdx][0]
                    case 1:
                        // Report Name as link
                        return (
                            <Link
                                href={`/screaming-frog-analysis/${encodeURIComponent(f.filename)}`}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                {rows[rowIdx][1]}
                            </Link>
                        )
                    case 2:
                        // Rows
                        return rows[rowIdx][2] || '-'
                    case 3:
                        // Actions
                        return (
                            <>
                                <Button variant='outlined' size='small' onClick={() => openModal(rowIdx, 0)} sx={{ mr: 1 }}>
                                    {f.prompt ? 'Edit Prompt' : 'Create Prompt'}
                                </Button>
                                {!f.reportSection ? (
                                    <Button
                                        variant='contained'
                                        size='small'
                                        onClick={() => handleGenerateReportFromList(rowIdx)}
                                        disabled={f.loading || !f.editedPrompt}
                                        sx={{ mr: 1 }}
                                    >
                                        {f.loading ? <CircularProgress size={20} /> : 'Generate Report'}
                                    </Button>
                                ) : (
                                    <Button variant='outlined' size='small' onClick={() => openModal(rowIdx, 1)} sx={{ mr: 1 }}>
                                        View Report
                                    </Button>
                                )}
                                <Button variant='outlined' color='error' size='small' onClick={() => handleDeleteFile(rowIdx)}>
                                    Delete
                                </Button>
                            </>
                        )
                    default:
                        return cell
                }
            }}
        />
    )
}

export default ReportTable
