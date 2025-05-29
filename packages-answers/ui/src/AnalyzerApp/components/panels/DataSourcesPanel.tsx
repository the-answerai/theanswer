'use client'
import { Typography } from '@mui/material'
import { User } from 'types'

interface Props {
    researchViewId: string
    user: User
    accessToken?: string
}

const DataSourcesPanel = ({ researchViewId }: Props) => {
    return <Typography>Data Sources for {researchViewId}</Typography>
}

export default DataSourcesPanel
