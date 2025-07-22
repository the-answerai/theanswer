'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const ShareModal = dynamic(() => import('../ShareModal'), { ssr: false })

const Modal = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const modal = searchParams?.get('modal')
    const quickSetup = searchParams?.get('QuickSetup')
    
    const handleClose = () => {
        if (pathname) router.push(pathname)
    }

    if (modal === 'share') {
        return <ShareModal onClose={handleClose} />
    }

    // QuickSetup modal support - redirect to credentials page for now
    if (modal === 'quickSetup' || quickSetup === 'true') {
        // For now, just redirect to the main page without QuickSetup
        // The actual modal will be handled by the useQuickSetup hook
        return null
    }

    return null
}
export default Modal
