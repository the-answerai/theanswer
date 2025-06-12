import React, { useEffect, useState, useRef } from 'react'
import { Box, Button, Typography, CircularProgress, Container, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import pLimit from 'p-limit'
import FinalReportModal from './components/FinalReportModal'
import FileModal from './components/FileModal'
import ReportTable from './components/ReportTable'
import YoloDialog from './components/YoloDialog'
// @ts-ignore: No type declaration for '@/api/apps/screamingFrog'
import screamingFrogApi from '@/api/apps/screamingFrog'
import useSWR from 'swr'
import EditProjectDialog from './components/EditProjectDialog'
import { useRouter } from 'next/navigation'
import { runSteps, Step } from './utils/stepUtils'
import DeleteFileProgressList from './components/DeleteFileProgressList'

interface FileInfo {
    id: string
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
    totalRows: number
}

interface Project {
    id: string
    name: string
    createdAt: string
}

interface ScreamingFrogProjectProps {
    projectId: string
}

function formatReportName(filename: string) {
    return filename
        .replace(/\.[^/.]+$/, '')
        .replace(/_/g, ' ')
        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

function downloadMarkdown(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

const ScreamingFrogProject: React.FC<ScreamingFrogProjectProps> = ({ projectId }) => {
    const [_snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })
    const [modalOpen, setModalOpen] = useState(false)
    const [modalIdx, setModalIdx] = useState<number | null>(null)
    const [modalTab, setModalTab] = useState(0)
    const [currentReport, setCurrentReport] = useState<string>('')
    const [newReport, setNewReport] = useState<string>('')
    const [reportLoading, setReportLoading] = useState(false)
    const [reportSaving, setReportSaving] = useState(false)
    const [autoGenerateReport, setAutoGenerateReport] = useState(false)
    const [finalReportModalOpen, setFinalReportModalOpen] = useState(false)
    const [finalReportEdit, setFinalReportEdit] = useState('')
    const [finalReportTab, setFinalReportTab] = useState(0)
    const [finalReportSaving, setFinalReportSaving] = useState(false)
    const [yoloDialogOpen, setYoloDialogOpen] = useState(false)
    const [yoloLoading, setYoloLoading] = useState(false)
    const [sequential, setSequential] = useState(false)
    const [yoloProgress, setYoloProgress] = useState<{ status: 'pending' | 'in-progress' | 'done' | 'error'; error?: string }[]>([])
    const [selectedFinalSection, setSelectedFinalSection] = useState<string>('')
    const [exportDialogOpen, setExportDialogOpen] = useState(false)
    const [exportOrder, setExportOrder] = useState<string[]>([])
    const [exportChecked, setExportChecked] = useState<{ [filename: string]: boolean }>({})
    const [finalReportSections, setFinalReportSections] = useState<{ filename: string; name: string; content: string }[]>([])
    const [finalReportEdits, setFinalReportEdits] = useState<{ [filename: string]: string }>({})
    const [finalReportLoading, setFinalReportLoading] = useState(false)
    const [finalSectionLoading, setFinalSectionLoading] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [projectDeleteDialogOpen, setProjectDeleteDialogOpen] = useState(false)
    const [fileDeleteDialogOpen, setFileDeleteDialogOpen] = useState(false)
    const [fileToDeleteIdx, setFileToDeleteIdx] = useState<number | null>(null)
    const [deleteProgressOpen, setDeleteProgressOpen] = useState(false)
    const [deleteInProgress, setDeleteInProgress] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const [deleteProgress, setDeleteProgress] = useState<
        {
            label: string
            step: number
            message?: string
        }[]
    >([])
    const router = useRouter()
    const yoloStopRequested = useRef(false)
    const handleStopYolo = () => {
        yoloStopRequested.current = true
    }
    const [stopYoloDialogOpen, setStopYoloDialogOpen] = useState(false)

    // SWR for project
    const {
        data: project,
        isLoading: projectLoading,
        error: projectError
    } = useSWR<Project>(projectId ? ['screamingFrogProject', projectId] : null, async ([, id]: [string, string]) => {
        const res = await screamingFrogApi.getProject(id)
        return res.data as Project
    })

    // SWR for files (with meta fetch for each file)
    const {
        data: files = [],
        isLoading: filesLoading,
        error: filesError,
        mutate: mutateFiles
    } = useSWR<FileInfo[]>(projectId ? ['screamingFrogFiles', projectId] : null, async ([, id]: [string, string]) => {
        const res: any = await screamingFrogApi.getProjectFiles(id)
        const data: { id: string; filename: string; totalRows: number }[] = res.data
        const fileInfos = await Promise.all(
            data.map(async (file: any) => {
                const metaRes: any = await screamingFrogApi.getFileCsv(file.id)
                const meta = metaRes.data
                return {
                    id: file.id,
                    filename: file.filename,
                    columns: meta.columns,
                    sample: meta.sample,
                    prompt: meta.prompt || '',
                    editedPrompt: meta.prompt || '',
                    reportSection: meta.reportSection || '',
                    loading: false,
                    saving: false,
                    isDirty: false,
                    recommendLoading: false,
                    totalRows: file.totalRows
                }
            })
        )
        return fileInfos
    })

    useEffect(() => {
        if (modalOpen && modalIdx !== null && modalTab === 1 && (files ?? [])[modalIdx]) {
            setCurrentReport((files ?? [])[modalIdx].reportSection || '')
            setNewReport('')
        }
    }, [modalOpen, modalIdx, modalTab, files])

    useEffect(() => {
        if (modalOpen && modalIdx !== null && modalTab === 1 && autoGenerateReport && (files ?? [])[modalIdx]) {
            if (!(files ?? [])[modalIdx].reportSection) {
                ;(async () => {
                    setReportLoading(true)
                    setNewReport('')
                    const prompt = (files ?? [])[modalIdx].editedPrompt
                    const res = await screamingFrogApi.generateFileReport(files[modalIdx].id, prompt)
                    const data = res.data
                    setNewReport(data.reportSection || '')
                    setReportLoading(false)
                })()
            }
            setAutoGenerateReport(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalOpen, modalIdx, modalTab, autoGenerateReport, files])

    useEffect(() => {
        if (finalReportModalOpen) {
            setFinalReportLoading(true)
            screamingFrogApi
                .getProjectFiles(projectId)
                .then((res) => res.data)
                .then(async (data) => {
                    const sections = await Promise.all(
                        data.map(async (file: { id: string; filename: string; totalRows: number }) => {
                            const metaRes = await screamingFrogApi.getFileReport(file.id)
                            const meta = metaRes.data
                            return {
                                filename: file.filename,
                                name: formatReportName(file.filename),
                                content: meta.reportSection || ''
                            }
                        })
                    )
                    setFinalReportSections(sections)
                    setExportOrder(sections.map((s) => s.filename))
                    setExportChecked(Object.fromEntries(sections.map((s) => [s.filename, true])))
                    setFinalReportEdits(Object.fromEntries(sections.map((s) => [s.filename, s.content])))
                    setSelectedFinalSection(sections[0]?.filename || '')
                    setFinalReportLoading(false)
                })
        }
    }, [finalReportModalOpen, projectId])

    const handleDeleteProject = async () => {
        setProjectDeleteDialogOpen(false)
        setDeleteProgressOpen(true)
        setDeleteInProgress(true)
        setDeleteError(null)
        // Build progress state for each file
        setDeleteProgress(files.map((file) => ({ label: file.filename, step: -1, message: 'Waiting...' })))
        let fileError = false
        try {
            await Promise.all(
                files.map(async (file, idx) => {
                    const steps: Step<any>[] = [
                        {
                            label: 'Removing from storage...',
                            fn: async (ctx) => {
                                await new Promise((res) => setTimeout(res, 400)) // simulate
                                return ctx
                            }
                        },
                        {
                            label: 'Removing from DB...',
                            fn: async (ctx) => {
                                await new Promise((res) => setTimeout(res, 200)) // simulate
                                return ctx
                            }
                        }
                    ]
                    try {
                        await runSteps(steps, {}, (stepIdx, label) =>
                            setDeleteProgress((prev) => prev.map((f, i) => (i === idx ? { ...f, step: stepIdx, message: label } : f)))
                        )
                        setDeleteProgress((prev) => prev.map((f, i) => (i === idx ? { ...f, step: 2, message: 'Deleted' } : f)))
                    } catch (err) {
                        setDeleteProgress((prev) =>
                            prev.map((f, i) => (i === idx ? { ...f, step: 3, message: err instanceof Error ? err.message : 'Error' } : f))
                        )
                        fileError = true
                    }
                })
            )
            // Only delete project if no file errors
            if (!fileError) {
                const projectSteps: Step<any>[] = [
                    {
                        label: 'Deleting project...',
                        fn: async (ctx) => {
                            await screamingFrogApi.deleteProject(projectId)
                            return ctx
                        }
                    }
                ]
                try {
                    await runSteps(projectSteps, {}, (stepIdx, label) =>
                        setDeleteProgress((prev) => [...prev, { label: 'Project', step: stepIdx, message: label }])
                    )
                    setDeleteInProgress(false)
                    setSnackbar({ open: true, message: 'Project deleted!', severity: 'success' })
                    setTimeout(() => router.push('/apps/screaming-frog-analysis'), 1200)
                } catch (err) {
                    setDeleteProgress((prev) => [
                        ...prev,
                        { label: 'Project', step: 3, message: err instanceof Error ? err.message : 'Error deleting project' }
                    ])
                    setDeleteInProgress(false)
                    setDeleteError('Failed to delete project')
                }
            } else {
                setDeleteProgress((prev) => [...prev, { label: 'Project', step: 3, message: 'Skipped due to file errors' }])
                setDeleteInProgress(false)
                setDeleteError('Some files could not be deleted. Project deletion was skipped.')
            }
        } catch (err: any) {
            setDeleteProgress((prev) => [...prev, { label: 'Project', step: 3, message: err?.message || 'Failed to delete project' }])
            setDeleteInProgress(false)
            setDeleteError(err?.message || 'Failed to delete project')
        }
    }

    const handleDeleteFile = (idx: number) => {
        setFileToDeleteIdx(idx)
        setFileDeleteDialogOpen(true)
    }

    const confirmDeleteFile = async () => {
        if (fileToDeleteIdx === null || !files) return
        setFileDeleteDialogOpen(false)
        const file = files[fileToDeleteIdx]
        try {
            await screamingFrogApi.deleteFile(file.id)
            mutateFiles((prev) => (prev ?? []).filter((_, i) => i !== fileToDeleteIdx), false)
            setSnackbar({ open: true, message: 'File deleted!', severity: 'success' })
        } catch {
            setSnackbar({ open: true, message: 'Failed to delete file', severity: 'error' })
        }
        setFileToDeleteIdx(null)
    }

    const handleRequestStopYolo = () => setStopYoloDialogOpen(true)
    const handleConfirmStopYolo = () => {
        setStopYoloDialogOpen(false)
        handleStopYolo()
    }
    const handleCancelStopYolo = () => setStopYoloDialogOpen(false)

    return (
        <Container maxWidth='lg' sx={{ py: 4, px: 2 }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant='h6'>Report: {project?.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant='contained' color='primary' onClick={() => setFinalReportModalOpen(true)}>
                            View Final Report
                        </Button>
                        <Button variant='outlined' color='secondary' onClick={() => setEditDialogOpen(true)}>
                            Edit Project
                        </Button>
                        <Button variant='contained' color='error' onClick={() => setProjectDeleteDialogOpen(true)}>
                            Delete Project
                        </Button>
                        <Button variant='contained' color='error' onClick={() => setYoloDialogOpen(true)} disabled={yoloLoading}>
                            {yoloLoading ? <CircularProgress size={20} /> : 'Yolo'}
                        </Button>
                    </Box>
                </Box>
                <ReportTable
                    files={files ?? []}
                    openModal={(idx, tab, autoGen) => {
                        setModalIdx(idx)
                        setModalTab(typeof tab === 'number' ? tab : 0)
                        setModalOpen(true)
                        setCurrentReport('')
                        setNewReport('')
                        setAutoGenerateReport(!!autoGen)
                    }}
                    handleGenerateReportFromList={(idx) => {
                        setModalIdx(idx)
                        setModalTab(1)
                        setModalOpen(true)
                        setCurrentReport('')
                        setNewReport('')
                        setAutoGenerateReport(true)
                    }}
                    formatReportName={formatReportName}
                    handleDeleteFile={handleDeleteFile}
                />
                <FileModal
                    open={modalOpen}
                    onClose={() => {
                        setModalOpen(false)
                        setModalIdx(null)
                        setModalTab(0)
                        setCurrentReport('')
                        setNewReport('')
                        setAutoGenerateReport(false)
                    }}
                    modalTab={modalTab}
                    setModalTab={(tab) => setModalTab(typeof tab === 'number' ? tab : 0)}
                    file={modalIdx !== null ? (files ?? [])[modalIdx] || null : null}
                    handlePromptChange={(value) => {
                        if (modalIdx === null) return
                        mutateFiles(
                            (prev) =>
                                (prev ?? []).map((f, i) =>
                                    i === modalIdx ? { ...f, editedPrompt: value, isDirty: value !== f.prompt } : f
                                ),
                            false
                        )
                    }}
                    handleRecommendPrompt={async () => {
                        if (modalIdx === null) return
                        mutateFiles((prev) => (prev ?? []).map((f, i) => (i === modalIdx ? { ...f, recommendLoading: true } : f)), false)
                        const res = await screamingFrogApi.generateFilePrompt(files[modalIdx].id)
                        const data = res.data
                        mutateFiles(
                            (prev) =>
                                (prev ?? []).map((f, i) =>
                                    i === modalIdx
                                        ? { ...f, editedPrompt: data.prompt, isDirty: data.prompt !== f.prompt, recommendLoading: false }
                                        : f
                                ),
                            false
                        )
                    }}
                    handleSavePrompt={async () => {
                        if (modalIdx === null) return
                        mutateFiles((prev) => (prev ?? []).map((f, i) => (i === modalIdx ? { ...f, saving: true } : f)), false)
                        const prompt = (files ?? [])[modalIdx].editedPrompt
                        try {
                            const res = await screamingFrogApi.saveFilePrompt(files[modalIdx].id, prompt)
                            if (!res.ok) throw new Error('Failed to save prompt')
                            // Use the prompt value from the API response if available
                            const newPrompt = res.data?.prompt ?? prompt
                            mutateFiles(
                                (prev) =>
                                    (prev ?? []).map((f, i) =>
                                        i === modalIdx
                                            ? { ...f, prompt: newPrompt, editedPrompt: newPrompt, isDirty: false, saving: false }
                                            : f
                                    ),
                                false
                            )
                            setSnackbar({ open: true, message: 'Prompt saved!', severity: 'success' })
                        } catch {
                            mutateFiles((prev) => (prev ?? []).map((f, i) => (i === modalIdx ? { ...f, saving: false } : f)), false)
                            setSnackbar({ open: true, message: 'Failed to save prompt', severity: 'error' })
                        }
                    }}
                    handleGenerateNewReport={async () => {
                        if (modalIdx === null) return
                        setReportLoading(true)
                        setNewReport('')
                        const prompt = (files ?? [])[modalIdx].editedPrompt
                        const res = await screamingFrogApi.generateFileReport(files[modalIdx].id, prompt)
                        const data = res.data
                        setNewReport(data.reportSection || '')
                        setReportLoading(false)
                    }}
                    handleSaveReportSection={async () => {
                        if (modalIdx === null) return
                        setReportSaving(true)
                        const res = await screamingFrogApi.saveFileReport(files[modalIdx].id, newReport)
                        if (res.ok) {
                            setCurrentReport(newReport)
                            setNewReport('')
                            setSnackbar({ open: true, message: 'Report section saved!', severity: 'success' })
                            mutateFiles((prev) => (prev ?? []).map((f, i) => (i === modalIdx ? { ...f, reportSection: newReport } : f)))
                        } else {
                            setSnackbar({ open: true, message: 'Failed to save report section', severity: 'error' })
                        }
                        setReportSaving(false)
                    }}
                    currentReport={currentReport}
                    newReport={newReport}
                    reportLoading={reportLoading}
                    reportSaving={reportSaving}
                />
                <FinalReportModal
                    open={finalReportModalOpen}
                    onClose={() => setFinalReportModalOpen(false)}
                    finalReportTab={finalReportTab}
                    setFinalReportTab={setFinalReportTab}
                    finalReportSections={finalReportSections}
                    finalReportEdits={finalReportEdits}
                    setFinalReportEdit={setFinalReportEdit}
                    finalReportEdit={finalReportEdit}
                    finalReportLoading={finalReportLoading}
                    finalReportSaving={finalReportSaving}
                    handleSaveFinalReport={async () => {
                        setFinalReportSaving(true)
                        const res = await screamingFrogApi.saveProjectFinalReport(projectId, finalReportEdit)
                        if (res.ok) {
                            setSnackbar({ open: true, message: 'Final report saved!', severity: 'success' })
                        } else {
                            setSnackbar({ open: true, message: 'Failed to save final report', severity: 'error' })
                        }
                        setFinalReportSaving(false)
                    }}
                    selectedFinalSection={selectedFinalSection}
                    setSelectedFinalSection={(value) => setSelectedFinalSection(value || '')}
                    handleRegenerateFinalSection={async (filename: string) => {
                        setFinalSectionLoading(true)
                        const file = (files ?? []).find((f) => f.filename === filename)
                        const prompt = file?.editedPrompt || file?.prompt || ''
                        const res = await screamingFrogApi.generateFileReport(file?.id || '', prompt)
                        const genData = res.data
                        setFinalReportEdits((prev) => ({ ...prev, [filename]: genData.reportSection || '' }))
                        setFinalSectionLoading(false)
                    }}
                    finalSectionLoading={finalSectionLoading}
                    exportDialogOpen={exportDialogOpen}
                    handleExportOpen={() => setExportDialogOpen(true)}
                    handleExportClose={() => setExportDialogOpen(false)}
                    exportOrder={exportOrder}
                    exportChecked={exportChecked}
                    handleExportCheck={(filename: string) => setExportChecked((prev) => ({ ...prev, [filename]: !prev[filename] }))}
                    handleExportOrder={() => {}}
                    handleExportDownload={() => {
                        const md = exportOrder
                            .filter((filename) => exportChecked[filename])
                            .map((filename) => {
                                const section = finalReportSections.find((s) => s.filename === filename)
                                if (!section) return ''
                                return `# ${section.name}\n${finalReportEdits[filename] || section.content}`
                            })
                            .filter(Boolean)
                            .join('\n\n')
                        downloadMarkdown('final-report.md', md)
                        setExportDialogOpen(false)
                    }}
                />
                <YoloDialog
                    open={yoloDialogOpen}
                    onClose={() => setYoloDialogOpen(false)}
                    yoloLoading={yoloLoading}
                    files={files ?? []}
                    yoloProgress={yoloProgress}
                    sequential={sequential}
                    setSequential={setSequential}
                    handleStopYolo={handleRequestStopYolo}
                    yoloStopRequested={yoloStopRequested.current}
                    handleYolo={async () => {
                        setYoloDialogOpen(false)
                        setYoloLoading(true)
                        setYoloProgress(files.map(() => ({ status: 'pending' })))
                        yoloStopRequested.current = false
                        try {
                            if (sequential) {
                                for (let idx = 0; idx < files.length; idx++) {
                                    if (yoloStopRequested.current) break
                                    setYoloProgress((prev) => prev.map((p, i) => (i === idx ? { status: 'in-progress' } : p)))
                                    try {
                                        const file = files[idx]
                                        if (yoloStopRequested.current) break
                                        const genRes = await screamingFrogApi.generateFileReport(file.id, file.editedPrompt)
                                        const genData = genRes.data
                                        if (yoloStopRequested.current) break
                                        await screamingFrogApi.saveFileReport(file.id, genData.reportSection)
                                        mutateFiles((prev) =>
                                            (prev ?? []).map((f, i) => (i === idx ? { ...f, reportSection: genData.reportSection } : f))
                                        )
                                        setYoloProgress((prev) => prev.map((p, i) => (i === idx ? { status: 'done' } : p)))
                                    } catch (err) {
                                        const errorMsg =
                                            err &&
                                            typeof err === 'object' &&
                                            err !== null &&
                                            'message' in err &&
                                            typeof (err as { message?: unknown }).message === 'string'
                                                ? (err as { message: string }).message
                                                : 'Error'
                                        setYoloProgress((prev) =>
                                            prev.map((p, i) => (i === idx ? { status: 'error', error: errorMsg } : p))
                                        )
                                    }
                                }
                            } else {
                                const limit = pLimit(20)
                                await Promise.all(
                                    files.map((file, idx) =>
                                        limit(async () => {
                                            if (yoloStopRequested.current) return
                                            setYoloProgress((prev) => prev.map((p, i) => (i === idx ? { status: 'in-progress' } : p)))
                                            try {
                                                if (yoloStopRequested.current) return
                                                const genRes = await screamingFrogApi.generateFileReport(file.id, file.editedPrompt)
                                                const genData = genRes.data
                                                if (yoloStopRequested.current) return
                                                await screamingFrogApi.saveFileReport(file.id, genData.reportSection)
                                                mutateFiles((prev) =>
                                                    (prev ?? []).map((f, i) =>
                                                        i === idx ? { ...f, reportSection: genData.reportSection } : f
                                                    )
                                                )
                                                setYoloProgress((prev) => prev.map((p, i) => (i === idx ? { status: 'done' } : p)))
                                            } catch (err) {
                                                const errorMsg =
                                                    err &&
                                                    typeof err === 'object' &&
                                                    err !== null &&
                                                    'message' in err &&
                                                    typeof (err as { message?: unknown }).message === 'string'
                                                        ? (err as { message: string }).message
                                                        : 'Error'
                                                setYoloProgress((prev) =>
                                                    prev.map((p, i) => (i === idx ? { status: 'error', error: errorMsg } : p))
                                                )
                                            }
                                        })
                                    )
                                )
                            }
                            if (yoloStopRequested.current) {
                                setSnackbar({ open: true, message: 'YOLO stopped by user.', severity: 'error' })
                            } else {
                                setSnackbar({ open: true, message: 'All report sections re-generated!', severity: 'success' })
                            }
                        } catch {
                            setSnackbar({ open: true, message: 'Error during YOLO run', severity: 'error' })
                        }
                        setYoloLoading(false)
                    }}
                />
                <EditProjectDialog
                    open={editDialogOpen}
                    project={project || null}
                    onClose={() => setEditDialogOpen(false)}
                    onProjectUpdated={(updated) => {
                        setEditDialogOpen(false)
                        if (projectId) {
                            if (typeof window !== 'undefined') {
                                import('swr').then(({ mutate }) => {
                                    mutate(['screamingFrogProject', projectId], updated, false)
                                })
                            }
                        }
                    }}
                />
                <Dialog open={projectDeleteDialogOpen} onClose={() => setProjectDeleteDialogOpen(false)}>
                    <DialogTitle>Delete Project?</DialogTitle>
                    <DialogContent>Are you sure you want to delete this project and all its files? This cannot be undone.</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setProjectDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteProject} color='error' variant='contained'>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={fileDeleteDialogOpen} onClose={() => setFileDeleteDialogOpen(false)}>
                    <DialogTitle>Delete File?</DialogTitle>
                    <DialogContent>Are you sure you want to delete this file and all its data? This cannot be undone.</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFileDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmDeleteFile} color='error' variant='contained'>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={deleteProgressOpen}
                    onClose={() => {
                        if (!deleteInProgress) setDeleteProgressOpen(false)
                    }}
                    disableEscapeKeyDown={deleteInProgress}
                    maxWidth='sm'
                    fullWidth
                >
                    <DialogTitle>Deleting Project...</DialogTitle>
                    <DialogContent>
                        <DeleteFileProgressList progress={deleteProgress} title='Delete Progress:' />
                        {deleteError && (
                            <Typography color='error' sx={{ mt: 2 }}>
                                {deleteError}
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteProgressOpen(false)} disabled={deleteInProgress}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={stopYoloDialogOpen} onClose={handleCancelStopYolo}>
                    <DialogTitle>Stop Regeneration?</DialogTitle>
                    <DialogContent>
                        Are you sure you want to stop? Any progress made so far will be saved, but any further progress will stop
                        immediately.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelStopYolo}>Cancel</Button>
                        <Button onClick={handleConfirmStopYolo} color='warning' variant='contained'>
                            Yes, Stop
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    )
}

export default ScreamingFrogProject
