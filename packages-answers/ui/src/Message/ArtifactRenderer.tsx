'use client'
import React from 'react'
import { Box, Card, CardMedia } from '@mui/material'
import { SimpleMarkdown } from './SimpleMarkdown'

export interface Artifact {
    type: 'png' | 'jpeg' | 'html' | 'markdown' | 'csv' | 'json' | string
    name: string
    data: string
}

interface ArtifactRendererProps {
    artifact: Artifact
    index: number
    isAgentReasoning?: boolean
    chatflowId?: string
    chatId?: string
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ artifact, index, isAgentReasoning = false }) => {
    if (!artifact || !artifact.data) {
        return null
    }

    const imageStyle = isAgentReasoning
        ? {
              width: '200px',
              height: '200px',
              objectFit: 'cover' as const
          }
        : {
              width: '100%',
              height: 'auto'
          }

    // Handle image artifacts
    if (artifact.type === 'png' || artifact.type === 'jpeg') {
        return (
            <Card
                key={index}
                sx={{
                    p: 0,
                    m: 0,
                    mt: isAgentReasoning ? 1 : 2,
                    mb: isAgentReasoning ? 1 : 2,
                    flex: '0 0 auto'
                }}
            >
                <CardMedia
                    component='img'
                    image={artifact.data}
                    sx={{ height: 'auto' }}
                    alt={artifact.name || 'artifact'}
                    style={imageStyle}
                />
            </Card>
        )
    }

    // Handle HTML artifacts
    if (artifact.type === 'html') {
        return (
            <Box
                key={index}
                sx={{
                    mt: isAgentReasoning ? 1 : 2,
                    mb: isAgentReasoning ? 1 : 2
                }}
            >
                <div dangerouslySetInnerHTML={{ __html: artifact.data }}></div>
            </Box>
        )
    }

    // Handle markdown and all other types (fallback)
    return (
        <Box
            key={index}
            sx={{
                mt: isAgentReasoning ? 1 : 2,
                mb: isAgentReasoning ? 1 : 2
            }}
        >
            <SimpleMarkdown content={artifact.data} />
        </Box>
    )
}
