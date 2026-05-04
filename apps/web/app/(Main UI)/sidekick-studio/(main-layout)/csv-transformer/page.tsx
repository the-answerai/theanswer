import React from 'react'
import CsvTransformerClient from './CsvTransformerClient'

const Page = () => {
    const cronEnabled = process.env.ENABLE_CSV_RUN_CRON === 'true'

    return (
        <>
            <CsvTransformerClient cronEnabled={cronEnabled} />
        </>
    )
}

export default Page
