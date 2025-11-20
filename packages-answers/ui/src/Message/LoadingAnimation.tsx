'use client'
import React, { useState, useEffect } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { keyframes } from '@mui/system'

const quirkWordList = [
    'analyzing',
    'scheming',
    'searching',
    'planning',
    'pondering',
    'computing',
    'brewing',
    'crafting',
    'investigating',
    'evaluating',
    'synthesizing',
    'strategizing',
    'deliberating',
    'processing',
    'contemplating',
    'orchestrating',
    'formulating',
    'decoding',
    'assembling',
    'optimizing'
]

const typeWriter = keyframes`
  0% { 
    width: 0; 
    opacity: 1;
  }
  50% { 
    width: 100%; 
    opacity: 1;
  }
  75% { 
    width: 100%; 
    opacity: 1;
  }
  100% { 
    width: 0; 
    opacity: 0;
  }
`

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`

interface LoadingAnimationProps {
    duration?: number // duration per word in milliseconds
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ duration = 1000 }) => {
    const theme = useTheme()
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [isTyping, setIsTyping] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTyping(false)
            setTimeout(() => {
                setCurrentWordIndex((prev) => (prev + 1) % quirkWordList.length)
                setIsTyping(true)
            }, 200) // Brief pause between words
        }, duration)

        return () => clearInterval(interval)
    }, [duration])

    const currentWord = quirkWordList[currentWordIndex]

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 2,
                px: 3,
                bgcolor: theme.vars.palette.background.paper,
                borderRadius: 2,
                border: `1px solid ${theme.vars.palette.divider}`,
                minHeight: '60px'
            }}
        >
            <Typography
                variant='body2'
                sx={{
                    color: theme.vars.palette.text.secondary,
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                }}
            >
                <Box
                    component='span'
                    sx={{
                        display: 'inline-block',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        borderRight: `2px solid ${theme.vars.palette.text.primary}`,
                        animation: `${typeWriter} ${duration}ms ease-in-out infinite`,
                        minWidth: '120px',
                        color: theme.vars.palette.text.primary,
                        fontWeight: 500
                    }}
                >
                    {currentWord}
                </Box>
                <Box
                    component='span'
                    sx={{
                        animation: `${blink} 1s infinite`,
                        color: theme.vars.palette.text.primary,
                        ml: 0.5
                    }}
                >
                    ...
                </Box>
            </Typography>
        </Box>
    )
}
