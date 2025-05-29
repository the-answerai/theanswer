'use client'
import { Typography } from '@mui/material'
import { User } from 'types'

interface Props {
    researchViewId: string
    user: User
    accessToken?: string
}

const ReportsPanel = ({ researchViewId }: Props) => {
    return <Typography>Reports for {researchViewId}</Typography>
}

export default ReportsPanel
