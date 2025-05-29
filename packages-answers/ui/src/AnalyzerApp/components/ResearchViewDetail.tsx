'use client'
import { Typography } from '@mui/material'
import { User } from 'types'

export interface ResearchViewDetailProps {
    user: User
    accessToken?: string
    viewId: string
}

const ResearchViewDetail = ({ viewId }: ResearchViewDetailProps) => {
    return <Typography>Research View Detail for {viewId}</Typography>
}

export default ResearchViewDetail
