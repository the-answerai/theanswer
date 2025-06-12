import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Box, Checkbox, FormControlLabel } from '@mui/material'
import screamingFrogApi from '@/api/apps/screamingFrog'
import FileProgressList from './FileProgressList'
import { runSteps, Step } from '../utils/stepUtils'

interface Project {
    id: string
    name: string
    createdAt: string
    description?: string
}

interface EditProjectDialogProps {
    open: boolean
    project: Project | null
    onClose: () => void
    onProjectUpdated: (updated: Project) => void
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ open, project, onClose, onProjectUpdated }) => {
    const [name, setName] = useState(project?.name || '')
    const [description, setDescription] = useState(project?.description || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [generateReport, setGenerateReport] = useState(false)
    const [fileProgress, setFileProgress] = useState<
        {
            label: string
            step: number
            message?: string
        }[]
    >([])
    const [descriptionError, setDescriptionError] = useState<string | null>(null)

    React.useEffect(() => {
        setName(project?.name || '')
        setDescription(project?.description || '')
        setFiles([])
        setError(null)
        setFileProgress([])
    }, [project, open])

    const handleSave = async () => {
        if (!project) return
        if (description.length > 256) {
            setDescriptionError('Description must be 256 characters or less')
            return
        }
        setDescriptionError(null)
        setSaving(true)
        setError(null)
        setFileProgress(files.map((file) => ({ label: file.name, step: -1, message: 'Waiting...' })))
        try {
            // Update project name
            const res = await screamingFrogApi.updateProject(project.id, name, description)
            const updated = res.data
            // Upload new files if any
            if (files.length > 0) {
                await Promise.all(
                    files.map(async (file, idx) => {
                        const steps: Step<any>[] = [
                            {
                                label: 'Uploading...',
                                fn: async (ctx) => {
                                    const uploadRes = await screamingFrogApi.uploadProjectFile(project.id, file)
                                    ctx.uploadedFile = uploadRes.data
                                    return ctx
                                }
                            },
                            {
                                label: 'Generating prompt...',
                                fn: async (ctx) => {
                                    const genPromptRes = await screamingFrogApi.generateFilePrompt(ctx.uploadedFile.id)
                                    ctx.recommendedPrompt = genPromptRes.data?.prompt
                                    return ctx
                                }
                            },
                            {
                                label: 'Saving prompt...',
                                fn: async (ctx) => {
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
                                setFileProgress((prev) => prev.map((f, i) => (i === idx ? { ...f, step: stepIdx, message: label } : f)))
                            )
                            setFileProgress((prev) =>
                                prev.map((f, i) => (i === idx ? { ...f, step: 5, message: generateReport ? 'Report saved' : 'Done' } : f))
                            )
                        } catch (err) {
                            setFileProgress((prev) =>
                                prev.map((f, i) =>
                                    i === idx ? { ...f, step: 6, message: err instanceof Error ? err.message : 'Error' } : f
                                )
                            )
                        }
                    })
                )
            }
            setTimeout(() => setFileProgress([]), 2000)
            setFiles([])
            setSaving(false)
            onProjectUpdated(updated)
        } catch {
            setError('Failed to update project')
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogContent>
                <TextField label='Project Name' value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mb: 2 }} />
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
                    disabled={saving}
                    error={!!descriptionError}
                    helperText={descriptionError || `${description.length}/256`}
                />
                <FormControlLabel
                    control={<Checkbox checked={generateReport} onChange={(e) => setGenerateReport(e.target.checked)} disabled={saving} />}
                    label='Generate report for each file after prompt is saved'
                    sx={{ mt: 1 }}
                />
                <Button variant='outlined' component='label' sx={{ mt: 2 }} disabled={saving}>
                    Upload Files
                    <input
                        type='file'
                        hidden
                        multiple
                        onChange={(e) => {
                            if (e.target.files) setFiles(Array.from(e.target.files))
                        }}
                    />
                </Button>
                {files.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        {files.map((file, idx) => (
                            <span key={idx}>{file.name}</span>
                        ))}
                    </Box>
                )}
                {error && (
                    <Alert severity='error' sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
                <FileProgressList progress={fileProgress} title='File Edit Progress:' />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleSave} variant='contained' color='primary' disabled={saving || !name.trim()}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default EditProjectDialog
