'use client'
import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import Box from '@mui/material/Box'
import ClickAwayListener from '@mui/material/ClickAwayListener'

import { useAnswers } from '../AnswersContext'
import JourneySourceCard from './JourneySourceCard'

import { AppSettings, AppService, Journey } from 'types'

export const JourneyAppsDrawer = ({
    appSettings,
    activeApp,
    journey
}: {
    appSettings: AppSettings
    activeApp?: string
    journey?: Journey
}) => {
    const enabledServices: AppService[] | undefined = appSettings?.services?.filter((service) => {
        return service.enabled
    })

    const [serviceOpen, setServiceOpen] = React.useState<string>('')
    const { filters, updateFilter } = useAnswers()
    // Update the value of filters to journey?.filters if journey is set

    const selectedService = enabledServices?.find((service) => service.id === serviceOpen)
    return (
        <>
            <Box
                sx={{
                    width: '100%',
                    gap: 2,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gridAutoFlow: 'dense',
                    transition: '.3s'
                }}
            >
                {appSettings?.services
                    ?.filter((s) => s.enabled)
                    ?.map((service) => (
                        <JourneySourceCard
                            appSettings={appSettings}
                            filters={filters}
                            updateFilter={updateFilter}
                            key={service?.id}
                            {...service}
                            expanded
                        />
                    ))}
            </Box>
            <AnimatePresence>
                {selectedService && serviceOpen !== '' ? (
                    <Box
                        component={motion.div}
                        key='modal'
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            display: 'flex',
                            placeContent: 'center',
                            placeItems: 'center',
                            zIndex: 1,
                            height: '100%',
                            width: '100%',
                            pointerEvents: 'none',
                            background: 'rgba(0,0,0,0.4)'
                        }}
                    >
                        <ClickAwayListener onClickAway={() => setServiceOpen('')}>
                            <Box
                                component={motion.div}
                                sx={{
                                    position: 'absolute',
                                    display: 'flex',
                                    placeContent: 'center',
                                    placeItems: 'center',
                                    width: '100%',
                                    maxWidth: '900px',
                                    willChange: 'transform',
                                    pointerEvents: 'all'
                                }}
                            >
                                <JourneySourceCard
                                    appSettings={appSettings}
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    enabled={true}
                                    {...selectedService}
                                    id={selectedService.id}
                                    expanded={true}
                                />
                            </Box>
                        </ClickAwayListener>
                    </Box>
                ) : null}
            </AnimatePresence>
        </>
    )
}
