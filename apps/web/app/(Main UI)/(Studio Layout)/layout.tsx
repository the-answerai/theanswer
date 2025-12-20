import { redirect } from 'next/navigation'
import getCachedSession from '@ui/getCachedSession'
import AppLayout from 'flowise-ui/src/AppLayout'
import { AAIAuthProvider } from '../../../components/AAIAuthProvider'

const StudioLayout = async ({ children }: { children: React.ReactElement }) => {
    const session = await getCachedSession()

    // Redirect to login if no valid session
    if (!session?.user || !session?.accessToken) {
        redirect('/api/auth/login')
    }

    const apiHost = session.user.chatflowDomain

    return (
        <AAIAuthProvider user={session.user}>
            <AppLayout apiHost={apiHost} accessToken={session.accessToken}>
                {children}
            </AppLayout>
        </AAIAuthProvider>
    )
}

export default StudioLayout
