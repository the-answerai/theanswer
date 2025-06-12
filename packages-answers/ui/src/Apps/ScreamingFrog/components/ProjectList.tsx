import React, { useEffect, useState } from 'react'
import { Box, Button, Typography, CircularProgress, Alert, Container, Stack, Card, CardContent } from '@mui/material'
// @ts-ignore: No type declaration for '@/api/apps/screamingFrog'
import screamingFrogApi from '@/api/apps/screamingFrog'
import { useRouter } from 'next/navigation'
import CreateProjectDialog from './CreateProjectDialog'

interface Project {
    id: string
    name: string
    createdAt: string
    description?: string
}

// Header component for the project list
function ProjectListHeader({ onCreate }: { onCreate: () => void }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant='h5'>Projects</Typography>
            <Button variant='contained' color='primary' onClick={onCreate}>
                Create New Project
            </Button>
        </Box>
    )
}

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setLoading(true)
        screamingFrogApi
            .getProjects()
            .then((res: any) => {
                const data = res.data
                setProjects(data.projects || [])
                setLoading(false)
            })
            .catch(() => {
                setError('Failed to load projects')
                setLoading(false)
            })
    }, [])

    const handleProjectClick = (project: Project) => {
        router.push(`/apps/screaming-frog-analysis/${project.id}`)
    }

    return (
        <Container maxWidth='lg'>
            <ProjectListHeader onCreate={() => setCreateOpen(true)} />

            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity='error'>{error}</Alert>
            ) : (
                <Stack flexDirection='row' sx={{ gap: 3, flexWrap: 'wrap' }}>
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            variant='outlined'
                            sx={{ minWidth: 275, cursor: 'pointer', flex: '1 1 300px', maxWidth: 350 }}
                            onClick={() => handleProjectClick(project)}
                        >
                            <CardContent>
                                <Typography variant='h5' component='div'>
                                    {project.name}
                                </Typography>
                                {project.description && (
                                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                                        {project.description}
                                    </Typography>
                                )}
                                <Typography variant='body2' color='text.secondary'>
                                    Created: {new Date(project.createdAt).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}

            <CreateProjectDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(project) => {
                    setCreateOpen(false)
                    // Refresh project list after creation
                    setLoading(true)
                    screamingFrogApi
                        .getProjects()
                        .then((res: any) => {
                            const data = res.data
                            setProjects(data.projects || [])
                            setLoading(false)
                        })
                        .catch(() => {
                            setError('Failed to load projects')
                            setLoading(false)
                        })
                    // Optionally, navigate to the new project
                    if (project?.id) {
                        router.push(`/apps/screaming-frog-analysis/${project.id}`)
                    }
                }}
            />
        </Container>
    )
}

export default ProjectList
