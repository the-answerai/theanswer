import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
// @ts-ignore
import { stringify, exportData } from '@/utils/exportImport'

// Material UI
import { Button, Dialog, DialogTitle, DialogContent, Stack, FormControlLabel, Checkbox, DialogActions, Box, MenuItem } from '@mui/material'

// API
// @ts-ignore
import exportImportApi from '@/api/exportimport'

// Hooks
// @ts-ignore
import useApi from '@/hooks/useApi'
// @ts-ignore
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
                                alt="ExportingGIF"
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

    const importAllApi = useApi(exportImportApi.importData)
    const exportAllApi = useApi(exportImportApi.exportData)

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
                importAllApi.request(body)
            } catch (error) {
                console.error('❌ Error parsing JSON file:', error)
                console.error('📄 File content that failed:', evt.target.result)
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
        if (onClose) onClose()
    }

    const onExport = (data: string[]) => {
        const body: Record<string, boolean> = {}
        // Usar exactamente los mismos parámetros que ProfileSection
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
    
        exportAllApi.request(body)
    }

    // Import success effect
    useEffect(() => {
        if (importAllApi.data) {
            if (onSuccess) {
                onSuccess()
            }
            if (onClose) {
                onClose()
            }
            window.location.href = '/'
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importAllApi.data])

    // Import error effect
    useEffect(() => {
        if (importAllApi.error) {
            let errMsg = 'Invalid Imported File'
            let error = importAllApi.error
            if (error?.response?.data) {
                errMsg = typeof error.response.data === 'object' ? 
                    error.response.data.message : error.response.data
            }
            console.error(`❌ Import error: ${errMsg}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importAllApi.error])

    // Import loading effect
    useEffect(() => {
        if (importAllApi.loading) {
            // Loading state can be handled by UI components
        }
    }, [importAllApi.loading])

    useEffect(() => {
        if (exportAllApi.data) {
            setExportDialogOpen(false)
            try {
                const dataStr = stringify(exportData(exportAllApi.data))
                const blob = new Blob([dataStr], { type: 'application/json' })
                const dataUri = URL.createObjectURL(blob)

                const linkElement = document.createElement('a')
                linkElement.setAttribute('href', dataUri)
                linkElement.setAttribute('download', exportAllApi.data.FileDefaultName)
                linkElement.click()

                if (onClose) onClose()
            } catch (error) {
                console.error(`Failed to export all: ${getErrorMessage(error)}`)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exportAllApi.data])

    // Agregar manejo de errores para export
    useEffect(() => {
        if (exportAllApi.error) {
            setExportDialogOpen(false)
            let errMsg = 'Internal Server Error'
            let error = exportAllApi.error
            if (error?.response?.data) {
                errMsg = typeof error.response.data === 'object' ? 
                    error.response.data.message : error.response.data
            }
            console.error(`Failed to export: ${errMsg}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exportAllApi.error])

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
