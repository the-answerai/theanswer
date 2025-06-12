import React from 'react'
import dynamic from 'next/dynamic'

const View = dynamic(() => import('@ui/Apps/ImageCreator'), { ssr: false })

const Page = () => {
    return (
        <>
            <View />
        </>
    )
}

export default Page
