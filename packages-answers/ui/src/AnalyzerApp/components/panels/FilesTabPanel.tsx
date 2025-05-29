'use client'
import { Typography } from '@mui/material'
import { User } from 'types'

interface Props {
    researchViewId: string
    user: User
    accessToken?: string
}

const FilesTabPanel = ({ researchViewId }: Props) => {
    return <Typography>Files for {researchViewId}</Typography>
}

export default FilesTabPanel
