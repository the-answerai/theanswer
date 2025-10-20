'use client'
import { useCallback, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { getCredentialModalDismissed, setCredentialModalDismissed } from '@/utils/credentialModalPreference'

// Dynamic import for UnifiedCredentialsModal
const UnifiedCredentialsModal = dynamic(() => import('@/ui-component/dialog/UnifiedCredentialsModal'), { ssr: false })

const SidekickSetupModal = ({ sidekickId, onComplete }) => {
    const preferenceScope = sidekickId ? `sidekick:${sidekickId}` : null

    // Local state to track if user has skipped setup for this instance
    const [hasSkipped, setHasSkipped] = useState(false)
    const [isSuppressed, setIsSuppressed] = useState(() => (preferenceScope ? getCredentialModalDismissed(preferenceScope) : false))

    // Get search params to check for QuickSetup and router for URL manipulation
    const searchParams = useSearchParams()
    const router = useRouter()
    const isQuickSetup = searchParams.get('QuickSetup') === 'true'

    // Fetch sidekick data with credentials
    const { sidekick, needsSetup, credentialsToShow, updateSidekick } = useSidekickWithCredentials(sidekickId, isQuickSetup)

    // Redux notification setup
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = useCallback((...args) => dispatch(enqueueSnackbarAction(...args)), [dispatch])

    // Handle URL cleanup when modal closes
    const handleURLCleanup = useCallback(() => {
        const currentSearchParams = new URLSearchParams(window.location.search)
        if (currentSearchParams.get('QuickSetup') === 'true') {
            currentSearchParams.delete('QuickSetup')
            const newUrl = `${window.location.pathname}${currentSearchParams.toString() ? '?' + currentSearchParams.toString() : ''}`
            router.replace(newUrl)
        }
        // Call the optional external onComplete callback
        onComplete?.()
    }, [router, onComplete])

    useEffect(() => {
        if (!preferenceScope) return
        // Local storage only available in browser
        const storedPreference = getCredentialModalDismissed(preferenceScope)
        setIsSuppressed((prev) => (prev === storedPreference ? prev : storedPreference))
    }, [preferenceScope])

    // Reset hasSkipped when QuickSetup is true
    useEffect(() => {
        if (isQuickSetup && hasSkipped) {
            setHasSkipped(false)
        }
    }, [isQuickSetup])

    const persistDismissPreference = useCallback(
        (options) => {
            if (!preferenceScope || !options?.dontShowDirty) return

            const shouldSuppress = !!options.dontShowAgain
            setCredentialModalDismissed(preferenceScope, shouldSuppress)
            setIsSuppressed(shouldSuppress)
        },
        [preferenceScope]
    )

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
        async (credentialAssignments, options) => {
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
                persistDismissPreference(options)
                handleURLCleanup()
            } catch (error) {
                console.error('Error assigning credentials:', error)
                handleModalError('Error assigning credentials. Please try again.')
            }
        },
        [sidekick, updateSidekick, enqueueSnackbar, handleURLCleanup, handleModalError, persistDismissPreference]
    )

    const handleModalSkip = useCallback((options) => {
        const userConfirmed = window.confirm(
            'Warning: The chat flow will not work properly without credentials. Are you sure you want to skip setup?'
        )

        if (userConfirmed) {
            setHasSkipped(true)
            persistDismissPreference(options)
            handleURLCleanup()
        }
    }, [handleURLCleanup, persistDismissPreference])

    const handleModalCancel = useCallback(
        (options) => {
            persistDismissPreference(options)
            handleURLCleanup()
        },
        [handleURLCleanup, persistDismissPreference]
    )

    const shouldHideModal = () => {
        if (!sidekick) return true
        if (isQuickSetup) return false
        if (hasSkipped) return true
        if (isSuppressed) return true
        return !needsSetup
    }

    if (shouldHideModal()) {
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
            initialDontShowAgain={isSuppressed}
        />
    )
}

SidekickSetupModal.propTypes = {
    sidekickId: PropTypes.string.isRequired,
    onComplete: PropTypes.func
}

export default SidekickSetupModal
