import getCachedSession from '@ui/getCachedSession'
import AppLayout from 'flowise-ui/src/AppLayout'
import { AAIAuthProvider } from '../../../components/AAIAuthProvider'

const StudioLayout = async ({ children }: { children: React.ReactElement }) => {
    const session = await getCachedSession()
    const apiHost = session?.user?.chatflowDomain

    return (
        <AAIAuthProvider user={session?.user}>
            <AppLayout apiHost={apiHost} accessToken={session?.accessToken}>
                {children}
            </AppLayout>
        </AAIAuthProvider>
    )
}

export default StudioLayout
