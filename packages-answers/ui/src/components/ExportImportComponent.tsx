import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { stringify, exportData } from '@/utils/exportImport'

// Material UI
import { Button, Dialog, DialogTitle, DialogContent, Stack, FormControlLabel, Checkbox, DialogActions, Box, MenuItem } from '@mui/material'

// API
import exportImportApi from '@/api/exportimport'

// Hooks
import useApi from '@/hooks/useApi'
import { getErrorMessage } from '@/utils/errorHandler'

//Assets
import ExportingGIF from '../../../../packages/ui/src/assets/images/Exporting.gif'

interface ExportDialogProps {
    show: boolean
    onCancel: () => void
    onExport: (data: string[]) => void
}

interface ExportImportComponentProps {
    onClose: () => void
    onSuccess?: () => void
}

const dataToExport = [
    'Agentflows',
    'Agentflows V2',
    'Assistants Custom',
    'Assistants OpenAI',
    'Assistants Azure',
    'Chatflows',
    'Chat Messages',
    'Chat Feedbacks',
    'Custom Templates',
    'Document Stores',
    'Executions',
    'Tools',
    'Variables'
]

const ExportDialog = ({ show, onCancel, onExport }: ExportDialogProps) => {
    const [selectedData, setSelectedData] = useState(dataToExport)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        if (show) setIsExporting(false)

        return () => {
            setIsExporting(false)
        }
    }, [show])

    return (
        <Dialog
            onClose={!isExporting ? onCancel : undefined}
            open={show}
            fullWidth
            maxWidth='sm'
            aria-labelledby='export-dialog-title'
            aria-describedby='export-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='export-dialog-title'>
                {!isExporting ? 'Select Data to Export' : 'Exporting..'}
            </DialogTitle>
            <DialogContent>
                {!isExporting && (
                    <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap' }}>
                        {dataToExport.map((data, index) => (
                            <FormControlLabel
                                key={index}
                                control={
                                    <Checkbox
                                        color='success'
                                        checked={selectedData.includes(data)}
                                        onChange={(event) => {
                                            setSelectedData(
                                                event.target.checked
                                                    ? [...selectedData, data]
                                                    : selectedData.filter((item) => item !== data)
                                            )
                                        }}
                                    />
                                }
                                label={data}
                            />
                        ))}
                    </Stack>
                )}
                {isExporting && (
                    <Box sx={{ height: 'auto', display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Image
                                style={{
                                    objectFit: 'cover',
                                    height: 'auto',
                                    width: 'auto'
                                }}
                                src={ExportingGIF}
                                alt='ExportingGIF'
                                width={100}
                                height={100}
                            />
                            <span>Exporting data might take a while</span>
                        </div>
                    </Box>
                )}
            </DialogContent>
            {!isExporting && (
                <DialogActions>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button
                        disabled={selectedData.length === 0}
                        variant='contained'
                        onClick={() => {
                            setIsExporting(true)
                            onExport(selectedData)
                        }}
                    >
                        Export
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    )
}

export const ExportImportMenuItems = ({ onClose, onSuccess }: ExportImportComponentProps) => {
    const [exportDialogOpen, setExportDialogOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const importAllApi = useApi(exportImportApi.importData)
    const exportAllApi = useApi(exportImportApi.exportData)

    const { data: importData, error: importError, loading: importLoading, request: requestImport } = importAllApi

    const { data: exportDataResponse, error: exportError, request: requestExport } = exportAllApi

    const fileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return
        }

        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (evt) => {
            if (!evt?.target?.result) {
                return
            }

            try {
                const fileContent = evt.target.result as string
                const body = JSON.parse(fileContent)
                requestImport(body)
            } catch (error) {
                console.error('❌ Error parsing JSON file:', error)
            }
        }

        reader.onerror = (error) => {
            console.error('❌ FileReader error:', error)
        }

        reader.readAsText(file)
    }

    const importAll = () => {
        if (inputRef.current) {
            inputRef.current.click()
        }
        onClose?.()
    }

    const onExport = (data: string[]) => {
        const body: Record<string, boolean> = {}
        // Use the exact same parameters as ProfileSection
        if (data.includes('Agentflows')) body.agentflow = true
        if (data.includes('Agentflows V2')) body.agentflowv2 = true
        if (data.includes('Assistants Custom')) body.assistantCustom = true
        if (data.includes('Assistants OpenAI')) body.assistantOpenAI = true
        if (data.includes('Assistants Azure')) body.assistantAzure = true
        if (data.includes('Chatflows')) body.chatflow = true
        if (data.includes('Chat Messages')) body.chat_message = true
        if (data.includes('Chat Feedbacks')) body.chat_feedback = true
        if (data.includes('Custom Templates')) body.custom_template = true
        if (data.includes('Document Stores')) body.document_store = true
        if (data.includes('Executions')) body.execution = true
        if (data.includes('Tools')) body.tool = true
        if (data.includes('Variables')) body.variable = true

        requestExport(body)
    }

    // Import success effect
    useEffect(() => {
        if (importData) {
            onSuccess?.()
            onClose?.()
            router.push('/')
        }
    }, [importData, onClose, onSuccess, router])

    // Import error effect
    useEffect(() => {
        if (importError) {
            let errMsg = 'Invalid Imported File'
            const error = importError
            if (error?.response?.data) {
                errMsg = typeof error.response.data === 'object' ? error.response.data.message : error.response.data
            }
            console.error(`❌ Import error: ${errMsg}`)
        }
    }, [importError])

    // Import loading effect
    useEffect(() => {
        if (importLoading) {
            // Loading state can be handled by UI components
        }
    }, [importLoading])

    useEffect(() => {
        if (exportDataResponse) {
            setExportDialogOpen(false)
            try {
                const dataStr = stringify(exportData(exportDataResponse))
                const blob = new Blob([dataStr], { type: 'application/json' })
                const dataUri = URL.createObjectURL(blob)

                const linkElement = document.createElement('a')
                linkElement.setAttribute('href', dataUri)
                linkElement.setAttribute('download', exportDataResponse.FileDefaultName)
                linkElement.click()

                onClose?.()
            } catch (error) {
                console.error(`Failed to export all: ${getErrorMessage(error)}`)
            }
        }
    }, [exportDataResponse, onClose])

    useEffect(() => {
        if (exportError) {
            setExportDialogOpen(false)
            let errMsg = 'Internal Server Error'
            const error = exportError
            if (error?.response?.data) {
                errMsg = typeof error.response.data === 'object' ? error.response.data.message : error.response.data
            }
            console.error(`Failed to export: ${errMsg}`)
        }
    }, [exportError])

    return (
        <>
            <MenuItem onClick={() => setExportDialogOpen(true)}>Export Data</MenuItem>
            <MenuItem onClick={importAll}>Import Data</MenuItem>
            <input ref={inputRef} type='file' hidden onChange={fileChange} accept='.json' />
            <ExportDialog show={exportDialogOpen} onCancel={() => setExportDialogOpen(false)} onExport={(data) => onExport(data)} />
        </>
    )
}

export default ExportImportMenuItems
