import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { IconSparkles } from '@tabler/icons-react'

interface FollowUpPromptsProps {
    prompts: string[]
    onPromptClick: (prompt: string) => void
}

export const FollowUpPrompts: React.FC<FollowUpPromptsProps> = ({ prompts, onPromptClick }) => {
    // Safety check for prompts
    if (!prompts || prompts.length === 0) {
        return null
    }

    return (
        <Box sx={{ mt: 2 }}>
            {/* Header with sparkles icon and text */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <IconSparkles size={16} color='#1976D2' />
                <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    Try these prompts
                </Typography>
            </Box>

            {/* Prompts container */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {prompts.map((prompt, index) => (
                    <Chip
                        key={index}
                        label={prompt}
                        onClick={() => onPromptClick(prompt)}
                        variant='outlined'
                        sx={{
                            cursor: 'pointer',
                            borderRadius: '15px',
                            fontSize: '0.875rem',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                                filter: 'brightness(0.9)'
                            },
                            '&:active': {
                                filter: 'brightness(0.75)'
                            }
                        }}
                    />
                ))}
            </Box>
        </Box>
    )
}
