'use client'
import dynamic from 'next/dynamic'

const View = dynamic(() => import('@ui/CsvTransfomer'), { ssr: false })

const CsvTransformerClient = () => {
    return <View />
}

export default CsvTransformerClient
