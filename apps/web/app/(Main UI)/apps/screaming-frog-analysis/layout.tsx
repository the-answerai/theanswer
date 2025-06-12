'use client'
import React from 'react'

import StudioAppLayout from '@ui/Apps/StudioAppLayout'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import Container from '@mui/material/Container'

const AppLayout = ({ children }) => {
    return (
        <Container maxWidth='lg' sx={{ py: 4, px: 2 }}>
            <StudioAppLayout
                headerTitleLink='/apps/screaming-frog-analysis'
                headerTitle='Screaming Frog Analysis'
                headerLinks={[
                    {
                        label: 'Home',
                        href: '/apps/screaming-frog-analysis',
                        icon: <HomeRoundedIcon fontSize='medium' />
                    }
                ]}
            />{' '}
            {children}
        </Container>
    )
}

export default AppLayout
