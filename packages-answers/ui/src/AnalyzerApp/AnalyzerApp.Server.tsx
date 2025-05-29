import getCachedSession from '../getCachedSession'
import AnalyzerAppClient from './AnalyzerApp.Client'

export default async function AnalyzerApp() {
    const session = await getCachedSession()
    if (!session?.user?.email) return null
    return <AnalyzerAppClient user={session.user} accessToken={session.accessToken} />
}
