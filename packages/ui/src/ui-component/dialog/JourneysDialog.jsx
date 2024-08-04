import { useState } from 'react'
import { Button } from '@mui/material'
import JourneySetupDialog from './JourneySetupDialog'

const JourneysDialog = () => {
    const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false)

    const handleStartJourney = () => {
        setIsSetupDialogOpen(true)
    }

    const handleCloseSetupDialog = () => {
        setIsSetupDialogOpen(false)
    }

    return (
        <>
            <Button onClick={handleStartJourney}>Start New Journey</Button>
            <JourneySetupDialog open={isSetupDialogOpen} onClose={handleCloseSetupDialog} />
        </>
    )
}

export default JourneysDialog
