'use client'
import { useCallback } from 'react'
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
    // Get search params to check for QuickSetup
    const searchParams = useSearchParams()
    const isQuickSetup = searchParams.get('QuickSetup') === 'true'

    // Fetch sidekick data with credentials
    const { sidekick, needsSetup, credentialsToShow, updateSidekick } = useSidekickWithCredentials(sidekickId, isQuickSetup)

    // Redux notification setup
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = useCallback((...args) => dispatch(enqueueSnackbarAction(...args)), [dispatch])
    const closeSnackbar = useCallback((...args) => dispatch(closeSnackbarAction(...args)), [dispatch])

    // Notification helper function
    const createNotification = useCallback(
        (message, variant, persist = false) => ({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant,
                ...(persist && { persist: true }),
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        }),
        [closeSnackbar]
    )

    // Error handler for modal
    const handleModalError = useCallback(
        (errorMessage) => {
            enqueueSnackbar(createNotification(errorMessage, 'error', true))
        },
        [enqueueSnackbar, createNotification]
    )

    // Handle credential assignment
    const handleModalAssign = useCallback(
        async (credentialAssignments) => {
            try {
                if (credentialAssignments && Object.keys(credentialAssignments).length > 0) {
                    // Use the helper function to update flow data with credentials
                    const updatedFlowData = updateFlowDataWithCredentials(sidekick.flowData, credentialAssignments)

                    await updateSidekick({
                        flowData: JSON.stringify(updatedFlowData)
                    })
                    enqueueSnackbar(createNotification('Credentials saved successfully!', 'success'))
                }

                if (onComplete) {
                    onComplete()
                }
            } catch (error) {
                console.error('Error assigning credentials:', error)
                enqueueSnackbar(createNotification('Error assigning credentials. Please try again.', 'error', true))
            }
        },
        [sidekick, updateSidekick, enqueueSnackbar, createNotification, onComplete]
    )

    const handleModalSkip = useCallback(() => {
        if (onComplete) {
            onComplete()
        }
    }, [onComplete])

    const handleModalCancel = useCallback(() => {
        if (onComplete) {
            onComplete()
        }
    }, [onComplete])

    // Only show modal if sidekick needs setup and has credentials to show
    if (!sidekick || !needsSetup || credentialsToShow.length === 0) {
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
