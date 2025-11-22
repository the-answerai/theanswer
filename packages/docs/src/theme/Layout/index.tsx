import OriginalLayout from '@theme-original/Layout'
import { useLocation } from '@docusaurus/router'
import '@site/src/services/trackingService' // Initialize tracking pixels
import { AskAlpha } from '@site/src/components/AskAlpha'
import styles from './styles.module.css'

export default function Layout(props) {
    const location = useLocation()
    const isWebinarPage = location.pathname.includes('webinar')

    return (
        <div className={isWebinarPage ? styles.webinarPage : styles.normalPage}>
            <OriginalLayout {...props} />
            <AskAlpha chatflowId='d480f12e-0f35-48a3-bac8-a2cacb924f78' apiHost='https://api.staging.theanswer.ai' />
        </div>
    )
}
