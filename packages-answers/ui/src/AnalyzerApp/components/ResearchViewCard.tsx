'use client'
import { Card, CardContent, Typography } from '@mui/material'

interface Props {
    name: string
    description?: string
}

const ResearchViewCard = ({ name, description }: Props) => {
    return (
        <Card variant='outlined'>
            <CardContent>
                <Typography variant='h6'>{name}</Typography>
                <Typography variant='body2'>{description}</Typography>
            </CardContent>
        </Card>
    )
}

export default ResearchViewCard
