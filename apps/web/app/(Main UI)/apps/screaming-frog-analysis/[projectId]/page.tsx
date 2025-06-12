'use client'
import { useParams } from 'next/navigation'
import ScreamingFrogProject from '@ui/Apps/ScreamingFrog/ScreamingFrogProject.Client'

export default function ProjectPage() {
    const { projectId } = useParams()
    return <ScreamingFrogProject projectId={projectId} />
}
