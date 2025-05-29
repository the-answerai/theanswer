'use client'
import ResearchViewList from './components/ResearchViewList'
import ResearchViewDetail from './components/ResearchViewDetail'
import { User } from 'types'

export interface AnalyzerAppProps {
    user: User
    accessToken?: string
    viewId?: string
}

const AnalyzerApp = ({ user, accessToken, viewId }: AnalyzerAppProps) => {
    return (
        <div>
            {viewId ? (
                <ResearchViewDetail user={user} accessToken={accessToken} viewId={viewId} />
            ) : (
                <ResearchViewList user={user} accessToken={accessToken} />
            )}
        </div>
    )
}

export default AnalyzerApp
