'use client'
import { useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import dynamic from 'next/dynamic'
import PropTypes from 'prop-types'

// Material-UI imports
import Button from '@mui/material/Button'

// Redux notification imports
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import useNotifier from '@/utils/useNotifier'

// UI components and utilities
import { IconX } from '@tabler/icons-react'
import { useSidekickWithCredentials } from '@/hooks/useSidekickWithCredentials'
import { updateFlowDataWithCredentials } from '@/utils/flowCredentialsHelper'

// Dynamic import for UnifiedCredentialsModal
const UnifiedCredentialsModal = dynamic(() => import('@/ui-component/dialog/UnifiedCredentialsModal'), { ssr: false })

const SidekickSetupModal = ({ sidekickId, onComplete }) => {
    // Local state to track if user has skipped setup for this instance
    const [hasSkipped, setHasSkipped] = useState(false)

    // Get search params to check for QuickSetup
    const searchParams = useSearchParams()
    const isQuickSetup = searchParams.get('QuickSetup') === 'true'

    // Fetch sidekick data with credentials
    const { sidekick, needsSetup, credentialsToShow, updateSidekick } = useSidekickWithCredentials(sidekickId, isQuickSetup)

    // Redux notification setup
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = useCallback((...args) => dispatch(enqueueSnackbarAction(...args)), [dispatch])

    // Reset hasSkipped when QuickSetup is true
    useEffect(() => {
        if (isQuickSetup && hasSkipped) {
            setHasSkipped(false)
        }
    }, [isQuickSetup])

    // Simplified error handler
    const handleModalError = useCallback(
        (errorMessage) => {
            enqueueSnackbar({
                message: errorMessage,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => dispatch(closeSnackbarAction(key))}>
                            <IconX />
                        </Button>
                    )
                }
            })
        },
        [enqueueSnackbar, dispatch]
    )

    // Handle credential assignment
    const handleModalAssign = useCallback(
        async (credentialAssignments) => {
            try {
                if (credentialAssignments && Object.keys(credentialAssignments).length > 0) {
                    const updatedFlowData = updateFlowDataWithCredentials(sidekick.flowData, credentialAssignments)
                    await updateSidekick({
                        flowData: JSON.stringify(updatedFlowData)
                    })
                    enqueueSnackbar({
                        message: 'Credentials saved successfully!',
                        options: { variant: 'success' }
                    })
                }
                onComplete?.()
            } catch (error) {
                console.error('Error assigning credentials:', error)
                handleModalError('Error assigning credentials. Please try again.')
            }
        },
        [sidekick, updateSidekick, enqueueSnackbar, onComplete, handleModalError]
    )

    const handleModalSkip = useCallback(() => {
        const userConfirmed = window.confirm(
            'Warning: The chat flow will not work properly without credentials. Are you sure you want to skip setup?'
        )

        if (userConfirmed) {
            setHasSkipped(true)
            onComplete?.()
        }
    }, [onComplete])

    const handleModalCancel = useCallback(() => {
        onComplete?.()
    }, [onComplete])

    // Only show modal if:
    // 1. Sidekick exists and needs setup
    // 2. Has credentials to show
    // 3. User hasn't skipped setup for this instance (unless QuickSetup is true)
    if (!sidekick || !needsSetup || credentialsToShow.length === 0 || (hasSkipped && !isQuickSetup)) {
        return null
    }

    return (
        <UnifiedCredentialsModal
            show={true}
            missingCredentials={credentialsToShow}
            onAssign={handleModalAssign}
            onSkip={handleModalSkip}
            onCancel={handleModalCancel}
            onError={handleModalError}
        />
    )
}

SidekickSetupModal.propTypes = {
    sidekickId: PropTypes.string.isRequired,
    onComplete: PropTypes.func
}

export default SidekickSetupModal
