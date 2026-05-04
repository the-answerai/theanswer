'use client'
import dynamic from 'next/dynamic'

const View = dynamic(() => import('@ui/CsvTransfomer'), { ssr: false })

interface Props {
    cronEnabled: boolean
}

const CsvTransformerClient = ({ cronEnabled }: Props) => {
    return <View cronEnabled={cronEnabled} />
}

export default CsvTransformerClient
