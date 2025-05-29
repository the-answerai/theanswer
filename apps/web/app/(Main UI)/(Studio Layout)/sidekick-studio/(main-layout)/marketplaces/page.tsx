import React from 'react'
import dynamic from 'next/dynamic'

const View = dynamic(() => import('@/views/marketplaces/index'), { ssr: false })

const Page = () => {
    return (MarketplaceCanvas
        <>
            <View />
        </>
    )
}

export default Page
