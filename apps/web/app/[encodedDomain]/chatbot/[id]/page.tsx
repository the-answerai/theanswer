'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'

const DynamicView = dynamic(() => import('flowise-ui/src/views/chatbot/index'), {
    ssr: false
})

const Page = async ({ params }: { params: { encodedDomain: string; id: string } }) => {
    const { encodedDomain, id } = await params
    const apiHost = React.useMemo(() => {
        const decodedDomain = decodeURIComponent(encodedDomain)
        try {
            const decoded = atob(decodedDomain)
            if (decoded.includes('localhost')) {
                return `http://${decoded}`
            }
            return decoded.startsWith('http') ? decoded : `https://${decoded}`
        } catch (error) {
            console.warn('Failed to decode base64 domain, using as-is:', decodedDomain, error)
            if (decodedDomain.includes('localhost')) {
                return `http://${decodedDomain}`
            }
            return decodedDomain.startsWith('http') ? decodedDomain : `https://${decodedDomain}`
        }
    }, [encodedDomain])

    return (
        <>
            <DynamicView apiHost={apiHost} chatflowId={id} />
        </>
    )
}

export default Page
