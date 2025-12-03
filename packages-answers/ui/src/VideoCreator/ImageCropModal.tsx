'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Slider,
    Stack,
    Switch,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material'
import { IconDeviceMobile, IconDeviceMobileRotated } from '@tabler/icons-react'
import type { Area, Point } from 'react-easy-crop'

interface ImageCropModalProps {
    open: boolean
    onClose: () => void
    imageSrc: string
    resolution: string // e.g., "1280x720" or "1920x1080"
    aspectRatio: string // e.g., "16:9" or "9:16"
    onCropComplete: (croppedImageBase64: string, finalAspectRatio: string) => void
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

const getCroppedImg = async (imageSrc: string, pixelCrop: Area, targetWidth: number, targetHeight: number): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('Failed to get canvas context')
    }

    // Set canvas size to exact target dimensions
    canvas.width = targetWidth
    canvas.height = targetHeight

    // Draw the cropped area scaled to exact target dimensions
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, targetWidth, targetHeight)

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.95)
}

const getFittedImg = async (imageSrc: string, targetWidth: number, targetHeight: number): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('Failed to get canvas context')
    }

    // Set canvas size to exact target dimensions
    canvas.width = targetWidth
    canvas.height = targetHeight

    // Fill with black background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, targetWidth, targetHeight)

    // Calculate how to fit the image within the target dimensions
    const imageAspect = image.width / image.height
    const targetAspect = targetWidth / targetHeight

    let drawWidth: number
    let drawHeight: number
    let offsetX: number
    let offsetY: number

    if (imageAspect > targetAspect) {
        // Image is wider than target - fit to width
        drawWidth = targetWidth
        drawHeight = targetWidth / imageAspect
        offsetX = 0
        offsetY = (targetHeight - drawHeight) / 2
    } else {
        // Image is taller than target - fit to height
        drawHeight = targetHeight
        drawWidth = targetHeight * imageAspect
        offsetX = (targetWidth - drawWidth) / 2
        offsetY = 0
    }

    // Draw the image centered with black bars
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.95)
}

const ImageCropModal = ({ open, onClose, imageSrc, resolution, aspectRatio, onCropComplete }: ImageCropModalProps) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [processing, setProcessing] = useState(false)
    const [currentAspectRatio, setCurrentAspectRatio] = useState(aspectRatio)
    const [fitMode, setFitMode] = useState(false)

    // Calculate dimensions based on resolution and aspect ratio
    const calculateDimensions = (res: string, aspect: string) => {
        const [baseWidth, baseHeight] = res.split('x').map(Number)

        if (aspect === '9:16') {
            // For portrait, swap dimensions
            return { width: baseHeight, height: baseWidth }
        }
        // For landscape, use as is
        return { width: baseWidth, height: baseHeight }
    }

    const { width: targetWidth, height: targetHeight } = calculateDimensions(resolution, currentAspectRatio)
    const aspect = targetWidth / targetHeight

    // Reset crop when aspect ratio changes
    useEffect(() => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }, [currentAspectRatio])

    const onCropChange = useCallback((location: Point) => {
        setCrop(location)
    }, [])

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom)
    }, [])

    const onCropCompleteInternal = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleConfirm = async () => {
        setProcessing(true)
        try {
            console.log(`[Image Crop] Creating image with dimensions: ${targetWidth}x${targetHeight} (${currentAspectRatio})`)
            console.log(`[Image Crop] Mode: ${fitMode ? 'FIT with padding' : 'CROP'}`)

            let finalImage: string
            if (fitMode) {
                // Fit mode - add black bars
                finalImage = await getFittedImg(imageSrc, targetWidth, targetHeight)
            } else {
                // Crop mode - use crop area
                if (!croppedAreaPixels) return
                finalImage = await getCroppedImg(imageSrc, croppedAreaPixels, targetWidth, targetHeight)
            }

            // Verify the image dimensions
            const img = await createImage(finalImage)
            console.log(`[Image Crop] Actual created dimensions: ${img.width}x${img.height}`)

            if (img.width !== targetWidth || img.height !== targetHeight) {
                console.error(`[Image Crop] DIMENSION MISMATCH! Expected ${targetWidth}x${targetHeight}, got ${img.width}x${img.height}`)
            } else {
                console.log('[Image Crop] ✓ Dimensions match perfectly')
            }

            onCropComplete(finalImage, currentAspectRatio)
            onClose()
        } catch (error) {
            console.error('Error cropping image:', error)
        } finally {
            setProcessing(false)
        }
    }

    const handleAspectRatioChange = (_: React.MouseEvent<HTMLElement>, newAspect: string | null) => {
        if (newAspect !== null) {
            setCurrentAspectRatio(newAspect)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
            <DialogTitle>Crop Image to Match Video Dimensions</DialogTitle>
            <DialogContent>
                <Stack spacing={3}>
                    <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between' flexWrap='wrap'>
                        <Typography variant='body2' color='text.secondary'>
                            {fitMode ? 'Fit' : 'Crop'} your reference image to{' '}
                            <strong>
                                {targetWidth}×{targetHeight}
                            </strong>{' '}
                            pixels ({currentAspectRatio})
                        </Typography>

                        <Stack direction='row' spacing={2} alignItems='center'>
                            <FormControlLabel
                                control={<Switch checked={fitMode} onChange={(e) => setFitMode(e.target.checked)} size='small' />}
                                label={<Typography variant='caption'>Fit (add black bars)</Typography>}
                            />

                            <ToggleButtonGroup value={currentAspectRatio} exclusive onChange={handleAspectRatioChange} size='small'>
                                <ToggleButton value='16:9' sx={{ px: 2, py: 0.5 }}>
                                    <IconDeviceMobileRotated size={18} style={{ marginRight: 4 }} />
                                    16:9
                                </ToggleButton>
                                <ToggleButton value='9:16' sx={{ px: 2, py: 0.5 }}>
                                    <IconDeviceMobile size={18} style={{ marginRight: 4 }} />
                                    9:16
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                    </Stack>

                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: 500,
                            bgcolor: 'grey.900',
                            borderRadius: 1
                        }}
                    >
                        {fitMode ? (
                            // Preview mode - show how it will look with black bars
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: '#000'
                                }}
                            >
                                <Box
                                    component='img'
                                    src={imageSrc}
                                    alt='Preview'
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </Box>
                        ) : (
                            // Crop mode
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                onCropChange={onCropChange}
                                onZoomChange={onZoomChange}
                                onCropComplete={onCropCompleteInternal}
                            />
                        )}
                    </Box>

                    {!fitMode && (
                        <Box sx={{ px: 2 }}>
                            <Typography variant='body2' gutterBottom>
                                Zoom
                            </Typography>
                            <Slider
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby='zoom-slider'
                                onChange={(_, value) => onZoomChange(value as number)}
                            />
                        </Box>
                    )}

                    <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
                        <Typography variant='caption' color='text.secondary'>
                            Final dimensions: {targetWidth}×{targetHeight}px | Aspect ratio: {currentAspectRatio}
                        </Typography>
                        {fitMode && (
                            <Typography variant='caption' color='primary.main' sx={{ fontWeight: 600 }}>
                                Black bars will be added to fit your image
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={processing}>
                    Cancel
                </Button>
                <Button variant='contained' onClick={handleConfirm} disabled={processing || (!fitMode && !croppedAreaPixels)}>
                    {processing ? 'Processing...' : fitMode ? 'Apply Fit' : 'Apply Crop'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ImageCropModal
