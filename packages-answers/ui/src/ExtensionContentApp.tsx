import { CssBaseline } from '@mui/material'
import { CssVarsThemeProvider } from './theme/cssVarsTheme'
import { AnswersProvider } from './AnswersContext'
import ChatExtensionWidget from './ChatExtensionWidget'
import { User } from 'types'
import { PermissionProvider } from './PermissionProvider'

const ExtensionContentApp = ({ apiUrl }: { apiUrl: string }) => {
    return (
        <AnswersProvider user={{} as User} appSettings={{}} apiUrl={apiUrl}>
            <PermissionProvider>
                <CssVarsThemeProvider>
                    <CssBaseline enableColorScheme />
                    <ChatExtensionWidget />
                </CssVarsThemeProvider>
            </PermissionProvider>
        </AnswersProvider>
    )
    // React.useEffect(() => {
    //   console.log('ExtensionContentApp mounted');
    //   chrome.runtime.sendMessage({ data: document.body.innerHTML });
    // }, []);
    // return (
    //   <div
    //     style={{
    //       position: 'fixed',
    //       top: 0,
    //       right: 0,
    //       minWidth: 420,
    //       height: '100vh',
    //       overflow: 'hidden'
    //     }}>
    //     {/* TODO: Use same component as the webapp instead */}
    //     <iframe
    //       src={process.env.VITE_APP_URL}
    //       width="100%"
    //       height="100%"
    //       style={{ border: 'none' }}></iframe>
    //   </div>
    // );
}
export default ExtensionContentApp
