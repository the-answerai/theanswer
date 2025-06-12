import React from 'react'
import { Box, Typography, Stack, LinearProgress } from '@mui/material'

export interface ItemProgress {
    label: string
    step: number
    message?: string
    [key: string]: any
}

export interface ItemProgressListProps {
    progress: ItemProgress[]
    title?: string
    getProgress?: (step: number, item?: ItemProgress) => { value: number; label: string }
    getColor?: (step: number, item?: ItemProgress) => 'primary' | 'success' | 'error' | 'info' | 'warning'
    renderLabel?: (item: ItemProgress) => React.ReactNode
}

const defaultGetProgress = (step: number) => {
    switch (step) {
        case -1:
            return { value: 0, label: 'Waiting' }
        case 0:
            return { value: 16, label: 'Step 1' }
        case 1:
            return { value: 32, label: 'Step 2' }
        case 2:
            return { value: 48, label: 'Step 3' }
        case 3:
            return { value: 64, label: 'Step 4' }
        case 4:
            return { value: 80, label: 'Step 5' }
        case 5:
            return { value: 100, label: 'Done' }
        case 6:
            return { value: 100, label: 'Error' }
        default:
            return { value: 0, label: '' }
    }
}

const defaultGetColor = (step: number) => {
    if (step === 6) return 'error'
    if (step === 5) return 'success'
    return 'primary'
}

const ItemProgressList: React.FC<ItemProgressListProps> = ({
    progress,
    title,
    getProgress = defaultGetProgress,
    getColor = defaultGetColor,
    renderLabel
}) => {
    if (!progress || progress.length === 0) return null
    return (
        <Box sx={{ mt: 2 }}>
            {title && <Typography variant='subtitle1'>{title}</Typography>}
            <Stack sx={{ mt: 1 }}>
                {progress.map((item, idx) => {
                    const { value, label } = getProgress(item.step, item)
                    const color = getColor(item.step, item)
                    return (
                        <Box key={item.label + idx} sx={{ mb: 1 }}>
                            <Typography sx={{ minWidth: 180 }}>{renderLabel ? renderLabel(item) : item.label}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <LinearProgress variant='determinate' value={value} sx={{ height: 8, borderRadius: 4 }} color={color} />
                                </Box>
                                <Typography variant='body2' sx={{ minWidth: 120 }}>
                                    {label}
                                    {item.step === 6 && item.message ? `: ${item.message}` : ''}
                                </Typography>
                            </Box>
                        </Box>
                    )
                })}
            </Stack>
        </Box>
    )
}

export default ItemProgressList
