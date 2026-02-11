'use client'
import { useCallback, useState, useEffect, useContext } from 'react'
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
import { flowContext } from '@/store/context/ReactFlowContext'
import { FLOWISE_CREDENTIAL_ID } from '@/store/constant'
import { useSidekickWithCredentials } from '@/hooks/useSidekickWithCredentials'
import { extractAllCredentials, updateFlowDataWithCredentials } from '@/utils/flowCredentialsHelper'
import { getCredentialModalDismissed, setCredentialModalDismissed } from '@/utils/credentialModalPreference'
import useConfirm from '@/hooks/useConfirm'

// Dynamic imports
const UnifiedCredentialsModal = dynamic(() => import('@/ui-component/dialog/UnifiedCredentialsModal'), { ssr: false })
const ConfirmDialog = dynamic(() => import('@/ui-component/dialog/ConfirmDialog'), { ssr: false })

const SidekickSetupModal = ({ sidekickId, onComplete }) => {
    const { confirm } = useConfirm()
    const preferenceScope = sidekickId ? `sidekick:${sidekickId}` : null
    const { reactFlowInstance } = useContext(flowContext)

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
                    let flowDataForSave
                    if (reactFlowInstance) {
                        const rfObject = reactFlowInstance.toObject()
                        rfObject.nodes = rfObject.nodes.map((node) => {
                            if (credentialAssignments[node.id]) {
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        credential: credentialAssignments[node.id],
                                        inputs: { ...node.data.inputs, [FLOWISE_CREDENTIAL_ID]: credentialAssignments[node.id] }
                                    }
                                }
                            }
                            return node
                        })
                        flowDataForSave = JSON.stringify(rfObject)
                    } else {
                        const updatedFlowData = updateFlowDataWithCredentials(sidekick.flowData, credentialAssignments)
                        flowDataForSave = JSON.stringify(updatedFlowData)
                    }
                    await updateSidekick({ flowData: flowDataForSave })

                    if (reactFlowInstance) {
                        reactFlowInstance.setNodes((nodes) =>
                            nodes.map((node) => {
                                if (credentialAssignments[node.id]) {
                                    return {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            credential: credentialAssignments[node.id],
                                            inputs: {
                                                ...node.data.inputs,
                                                [FLOWISE_CREDENTIAL_ID]: credentialAssignments[node.id]
                                            }
                                        }
                                    }
                                }
                                return node
                            })
                        )
                    }

                    // Skip refetch on canvas to preserve unsaved changes
                    window.dispatchEvent(
                        new CustomEvent('credentials-updated', {
                            detail: { chatflowId: sidekickId, skipRefetch: !!reactFlowInstance }
                        })
                    )
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
        [
            sidekick,
            reactFlowInstance,
            updateSidekick,
            enqueueSnackbar,
            sidekickId,
            handleURLCleanup,
            handleModalError,
            persistDismissPreference
        ]
    )

    const handleModalSkip = useCallback(
        async (options) => {
            const confirmPayload = {
                title: 'Skip credential setup?',
                description: 'The chat flow will not work properly without credentials. Are you sure you want to skip setup?',
                confirmButtonName: 'Skip anyway',
                cancelButtonName: 'Continue setup'
            }
            const isConfirmed = await confirm(confirmPayload)

            if (isConfirmed) {
                setHasSkipped(true)
                persistDismissPreference(options)
                handleURLCleanup()
            }
        },
        [handleURLCleanup, persistDismissPreference, confirm]
    )

    const handleModalCancel = useCallback(
        (options) => {
            console.log('[SidekickSetupModal] handleModalCancel called')
            setHasSkipped(true) // Hide the modal by setting skipped state
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

    // When canvas is open, use live nodes for credentials. Otherwise fall back to SWR data.
    let effectiveCredentials = credentialsToShow
    try {
        if (reactFlowInstance) {
            const { allCredentials } = extractAllCredentials(reactFlowInstance.toObject())
            if (allCredentials?.length) effectiveCredentials = allCredentials
        }
    } catch (_e) {
        /* fall back to SWR data */
    }

    return (
        <>
            <ConfirmDialog />
            <UnifiedCredentialsModal
                show={true}
                missingCredentials={effectiveCredentials}
                onAssign={handleModalAssign}
                onSkip={handleModalSkip}
                onCancel={handleModalCancel}
                onError={handleModalError}
                initialDontShowAgain={isSuppressed}
            />
        </>
    )
}

SidekickSetupModal.propTypes = {
    sidekickId: PropTypes.string.isRequired,
    onComplete: PropTypes.func
}

export default SidekickSetupModal
