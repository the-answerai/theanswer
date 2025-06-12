import React from 'react'
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material'

interface PromptEditorProps {
    prompt: string
    editedPrompt: string
    isDirty: boolean
    saving: boolean
    recommendLoading: boolean
    onPromptChange: (value: string) => void
    onRecommendPrompt: () => void
    onSavePrompt: () => void
}

const PromptEditor: React.FC<PromptEditorProps> = ({
    prompt,
    editedPrompt,
    isDirty,
    saving,
    recommendLoading,
    onPromptChange,
    onRecommendPrompt,
    onSavePrompt
}) => (
    <Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
                <Typography variant='h6' sx={{ mb: 1 }}>
                    Current Saved Prompt
                </Typography>
                <Box
                    sx={{
                        p: 2,
                        minHeight: 200,
                        height: '60vh',
                        maxHeight: '60vh',
                        overflow: 'auto',
                        whiteSpace: 'pre-line'
                    }}
                >
                    {prompt || <Typography color='text.secondary'>No prompt saved yet.</Typography>}
                </Box>
            </Box>
            {/* Right: Editable Prompt */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}
            >
                <Typography variant='h6' sx={{ mb: 1 }}>
                    Edit Prompt
                </Typography>
                <TextField
                    multiline
                    minRows={4}
                    fullWidth
                    value={editedPrompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    sx={{
                        mb: 2,
                        height: '60vh',
                        maxHeight: '60vh',
                        overflow: 'auto',
                        verticalAlign: 'top',
                        border: 'none'
                    }}
                    InputProps={{
                        style: {
                            height: '60vh',
                            maxHeight: '60vh',
                            overflow: 'auto',
                            verticalAlign: 'top'
                        }
                    }}
                />
                <Box
                    sx={{
                        display: 'flex',
                        alignSelf: 'flex-end',
                        gap: 1,
                        mt: 'auto'
                    }}
                >
                    <Button variant='outlined' onClick={onRecommendPrompt} disabled={recommendLoading}>
                        {recommendLoading ? <CircularProgress size={20} /> : 'Recommend Prompt'}
                    </Button>
                    {isDirty && (
                        <Button variant='contained' color='success' onClick={onSavePrompt} disabled={saving}>
                            {saving ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    </Box>
)

export default PromptEditor
