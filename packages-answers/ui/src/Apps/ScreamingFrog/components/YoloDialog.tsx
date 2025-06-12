import React from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    FormControlLabel,
    Switch,
    Button,
    CircularProgress
} from '@mui/material'
import ItemProgressList from '../../components/ItemProgressList'

interface FileInfo {
    filename: string
}

interface YoloProgress {
    status: 'pending' | 'in-progress' | 'done' | 'error'
    error?: string
}

interface YoloDialogProps {
    open: boolean
    onClose: () => void
    yoloLoading: boolean
    files: FileInfo[]
    yoloProgress: YoloProgress[]
    sequential: boolean
    setSequential: (val: boolean) => void
    handleYolo: () => void
    handleStopYolo: () => void
    yoloStopRequested: boolean
}

const statusToStep = {
    pending: 0,
    'in-progress': 1,
    done: 2,
    error: 3
} as const

const getYoloProgress = (step: number) => {
    switch (step) {
        case 0:
            return { value: 0, label: 'Waiting' }
        case 1:
            return { value: 50, label: 'In Progress' }
        case 2:
            return { value: 100, label: 'Done' }
        case 3:
            return { value: 100, label: 'Error' }
        default:
            return { value: 0, label: '' }
    }
}

const getYoloColor = (step: number) => {
    if (step === 3) return 'error'
    if (step === 2) return 'success'
    return 'primary'
}

const YoloDialog: React.FC<YoloDialogProps> = ({
    open,
    onClose,
    yoloLoading,
    files,
    yoloProgress,
    sequential,
    setSequential,
    handleYolo,
    handleStopYolo,
    yoloStopRequested
}) => {
    const progressList = files.map((file, idx) => ({
        label: file.filename,
        step: statusToStep[yoloProgress[idx]?.status || 'pending'],
        message: yoloProgress[idx]?.status === 'error' ? yoloProgress[idx]?.error : undefined
    }))
    return (
        <Dialog
            open={open || yoloLoading}
            onClose={() => {
                if (!yoloLoading) onClose()
            }}
        >
            <DialogTitle>Re-generate All Report Sections?</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2 }}>
                    Are you sure you want to re-generate and overwrite <b>all</b> report sections? This will use the current prompt for each
                    file and cannot be undone.
                </Typography>
                <FormControlLabel
                    control={<Switch checked={sequential} onChange={(e) => setSequential(e.target.checked)} />}
                    label='Sequential (safer for rate limits, slower)'
                />
                {yoloLoading && (
                    <ItemProgressList
                        progress={progressList}
                        title='Regeneration Progress:'
                        getProgress={(step) => getYoloProgress(step)}
                        getColor={(step) => getYoloColor(step)}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={yoloLoading}>
                    Cancel
                </Button>
                <Button onClick={handleStopYolo} color='warning' disabled={!yoloLoading || yoloStopRequested}>
                    Stop
                </Button>
                <Button variant='contained' color='error' onClick={handleYolo} disabled={yoloLoading}>
                    {yoloLoading ? <CircularProgress size={20} /> : 'Yes, Yolo!'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default YoloDialog
