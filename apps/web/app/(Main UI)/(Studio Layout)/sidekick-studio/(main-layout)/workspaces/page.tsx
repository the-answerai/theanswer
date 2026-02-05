'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Box, Container } from '@mui/material'

const View = dynamic(() => import('@/views/workspace'), { ssr: false })

const Page = () => {
    return <View />
}

export default Page
