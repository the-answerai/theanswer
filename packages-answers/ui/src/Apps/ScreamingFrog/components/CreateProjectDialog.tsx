import React, { useState, useRef } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    Checkbox,
    FormControlLabel
} from '@mui/material'
import FileProgressList from './FileProgressList'
import { runSteps, Step } from '../utils/stepUtils'

interface CreateProjectDialogProps {
    open: boolean
    onClose: () => void
    onCreated: (project: any) => void
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose, onCreated }) => {
    const [newName, setNewName] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [createProgress, setCreateProgress] = useState<
        {
            label: string
            step: number // -1: waiting, 0: uploading, 1: generating prompt, 2: saving prompt, 3: generating report, 4: saving report, 5: done, 6: error
            message?: string
        }[]
    >([])
    const [generateReport, setGenerateReport] = useState(false)
    const stopRequested = useRef(false)
    const [stopDialogOpen, setStopDialogOpen] = useState(false)
    const [description, setDescription] = useState('')
    const [descriptionError, setDescriptionError] = useState<string | null>(null)

    const handleRequestStop = () => setStopDialogOpen(true)
    const handleConfirmStop = () => {
        setStopDialogOpen(false)
        stopRequested.current = true
    }
    const handleCancelStop = () => setStopDialogOpen(false)

    const handleCreate = async () => {
        if (description.length > 256) {
            setDescriptionError('Description must be 256 characters or less')
            return
        }
        setDescriptionError(null)
        setLoading(true)
        setError(null)
        setCreateProgress(files.map((file) => ({ label: file.name, step: -1, message: 'Waiting...' })))
        stopRequested.current = false
        try {
            // @ts-ignore: No type declaration for '@/api/apps/screamingFrog'
            const screamingFrogApi = (await import('@/api/apps/screamingFrog')).default
            const res = await screamingFrogApi.createProject(newName, description)
            const project = res.data

            if (files.length > 0) {
                await Promise.all(
                    files.map(async (file, idx) => {
                        if (stopRequested.current) return
                        const steps: Step<any>[] = [
                            {
                                label: 'Uploading...',
                                fn: async (ctx) => {
                                    if (stopRequested.current) return ctx
                                    const uploadRes = await screamingFrogApi.uploadProjectFile(project.id, file)
                                    ctx.uploadedFile = uploadRes.data
                                    return ctx
                                }
                            },
                            {
                                label: 'Generating prompt...',
                                fn: async (ctx) => {
                                    if (stopRequested.current) return ctx
                                    const genPromptRes = await screamingFrogApi.generateFilePrompt(ctx.uploadedFile.id)
                                    ctx.recommendedPrompt = genPromptRes.data?.prompt
                                    return ctx
                                }
                            },
                            {
                                label: 'Saving prompt...',
                                fn: async (ctx) => {
                                    if (stopRequested.current) return ctx
                                    if (ctx.recommendedPrompt) {
                                        await screamingFrogApi.saveFilePrompt(ctx.uploadedFile.id, ctx.recommendedPrompt)
                                    }
                                    return ctx
                                }
                            }
                        ]
                        if (generateReport) {
                            steps.push(
                                {
                                    label: 'Generating report...',
                                    fn: async (ctx) => {
                                        if (stopRequested.current) return ctx
                                        const genReportRes = await screamingFrogApi.generateFileReport(
                                            ctx.uploadedFile.id,
                                            ctx.recommendedPrompt
                                        )
                                        ctx.generatedReport = genReportRes.data?.reportSection
                                        return ctx
                                    }
                                },
                                {
                                    label: 'Saving report...',
                                    fn: async (ctx) => {
                                        if (stopRequested.current) return ctx
                                        if (ctx.generatedReport) {
                                            await screamingFrogApi.saveFileReport(ctx.uploadedFile.id, ctx.generatedReport)
                                        }
                                        return ctx
                                    }
                                }
                            )
                        }
                        try {
                            await runSteps(steps, {}, (stepIdx, label) =>
                                setCreateProgress((prev) => prev.map((f, i) => (i === idx ? { ...f, step: stepIdx, message: label } : f)))
                            )
                            setCreateProgress((prev) =>
                                prev.map((f, i) => (i === idx ? { ...f, step: 5, message: generateReport ? 'Report saved' : 'Done' } : f))
                            )
                        } catch (err) {
                            setCreateProgress((prev) =>
                                prev.map((f, i) =>
                                    i === idx ? { ...f, step: 6, message: err instanceof Error ? err.message : 'Error' } : f
                                )
                            )
                        }
                    })
                )
            }
            setTimeout(() => setCreateProgress([]), 2000)
            setNewName('')
            setFiles([])
            setLoading(false)
            onCreated(project)
        } catch {
            setError('Failed to create project')
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogContent>
                <TextField
                    required
                    margin='dense'
                    label='Project Name'
                    type='text'
                    fullWidth
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    margin='dense'
                    label='Description'
                    type='text'
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={4}
                    value={description}
                    onChange={(e) => {
                        setDescription(e.target.value)
                        if (e.target.value.length > 256) {
                            setDescriptionError('Description must be 256 characters or less')
                        } else {
                            setDescriptionError(null)
                        }
                    }}
                    disabled={loading}
                    error={!!descriptionError}
                    helperText={descriptionError || `${description.length}/256`}
                />
                <FormControlLabel
                    control={<Checkbox checked={generateReport} onChange={(e) => setGenerateReport(e.target.checked)} disabled={loading} />}
                    label='Generate report for each file after prompt is saved'
                    sx={{ mt: 1 }}
                />
                <Button variant='outlined' component='label' sx={{ mt: 2 }} disabled={loading}>
                    Upload Files
                    <input
                        type='file'
                        hidden
                        required
                        multiple
                        onChange={(e) => {
                            if (e.target.files) setFiles(Array.from(e.target.files))
                        }}
                    />
                </Button>
                {files.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        {files.map((file, idx) => (
                            <Typography key={idx} variant='body2'>
                                {file.name}
                            </Typography>
                        ))}
                    </Box>
                )}
                {error && (
                    <Alert severity='error' sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
                {/* Progress UI for file creation */}
                <FileProgressList progress={createProgress} title='File Creation Progress:' />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleRequestStop} color='warning' disabled={!loading || stopRequested.current}>
                    Stop
                </Button>
                <Button onClick={handleCreate} variant='contained' color='primary' disabled={loading || !newName}>
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </DialogActions>
            <Dialog open={stopDialogOpen} onClose={handleCancelStop}>
                <DialogTitle>Stop Creation?</DialogTitle>
                <DialogContent>
                    Are you sure you want to stop? Any progress made so far will be saved, but any further progress will stop immediately.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelStop}>Cancel</Button>
                    <Button onClick={handleConfirmStop} color='warning' variant='contained'>
                        Yes, Stop
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    )
}

export default CreateProjectDialog
