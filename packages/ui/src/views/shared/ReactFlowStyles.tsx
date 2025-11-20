/**
 * React Flow Styled Components
 * Theme-aware styles for React Flow edge buttons and containers
 * Part of AGENT-138 unified glassmorphism theme
 */

import { styled } from '@mui/material/styles'
import { Box } from '@mui/material'

/**
 * Edge button wrapper for React Flow edge delete buttons
 * Replaces hardcoded CSS with theme-aware styled components
 */
export const EdgeButton = styled('button')(({ theme }) => {
    // Support both CSS vars theme (packages-answers) and standard theme (packages/ui)
    const themeVars = (theme as any).vars || theme
    const glassTransition = themeVars.palette?.glass?.transition || 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'

    return {
        width: 20,
        height: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        background: themeVars.palette?.grey?.[300] || '#eee',
        border: `1px solid ${themeVars.palette?.common?.white || '#fff'}`,
        cursor: 'pointer',
        borderRadius: '50%',
        transition: glassTransition,

        '&:hover': {
            background: themeVars.palette?.secondary?.main || '#5e35b1',
            color: themeVars.palette?.grey?.[300] || '#eee',
            boxShadow: '0 0 6px 2px rgba(0, 0, 0, 0.08)'
        }
    }
})

/**
 * Foreign object container for edge buttons
 * Wrapper for the edge button foreign object element
 */
export const EdgeButtonForeignObject = styled('div')({
    background: 'transparent',
    width: 40,
    height: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40
})

/**
 * React Flow parent wrapper
 * Main container for the React Flow canvas
 */
export const ReactFlowParentWrapper = styled(Box)({
    display: 'flex',
    flexGrow: 1,
    height: '100%',

    '& .reactflow-wrapper': {
        flexGrow: 1,
        height: '100%'
    }
})

/**
 * Additional agentflow edge selector styles
 * Used for agentflowsv2 edge hover interactions
 */
export const agentFlowEdgeStyles = {
    '.agent-flow-edge-selector:hover': {
        cursor: 'pointer'
    },
    '.agent-flow-edge-selector:hover + .agent-flow-edge': {
        strokeWidth: '3 !important',
        opacity: 1
    }
}
