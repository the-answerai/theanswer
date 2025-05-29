'use client'
import { Typography } from '@mui/material'
import { User } from 'types'

interface Props {
    researchViewId: string
    user: User
    accessToken?: string
}

const AnalysisPanel = ({ researchViewId }: Props) => {
    return <Typography>Analysis for {researchViewId}</Typography>
}

export default AnalysisPanel
