'use client'
import { Typography } from '@mui/material'
import { User } from 'types'

export interface ResearchViewListProps {
    user: User
    accessToken?: string
}

const ResearchViewList = ({ user }: ResearchViewListProps) => {
    return <Typography>Research View List placeholder</Typography>
}

export default ResearchViewList
