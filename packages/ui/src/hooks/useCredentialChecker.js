import { useState, useCallback } from 'react'
import { extractMissingCredentials, extractAllCredentials, updateFlowDataWithCredentials } from '@/utils/flowCredentialsHelper'

/**
 * Custom hook for checking and managing missing credentials in flows
 */
export const useCredentialChecker = () => {
    const [showCredentialModal, setShowCredentialModal] = useState(false)
    const [missingCredentials, setMissingCredentials] = useState([])
    const [pendingFlowData, setPendingFlowData] = useState(null)
    const [onCredentialsAssigned, setOnCredentialsAssigned] = useState(null)

    /**
     * Check if a flow has missing credentials and show modal if needed
     * @param {string|object} flowData - Flow data to check
     * @param {function} onAssign - Callback when credentials are assigned
     * @param {boolean} forceShow - Force show modal regardless of missing credentials
     * @returns {boolean} Whether modal was shown
     */
    const checkCredentials = useCallback((flowData, onAssign, forceShow = false) => {
        try {
            let result
            let credentialsToShow

            if (forceShow) {
                // For QuickSetup mode, extract ALL credentials (assigned and unassigned)
                result = extractAllCredentials(flowData)
                credentialsToShow = result.allCredentials || []
            } else {
                // Normal mode - extract only missing credentials
                result = extractMissingCredentials(flowData)
                credentialsToShow = result.missingCredentials || []
            }

            // Show modal if forceShow is true OR if there are missing credentials
            if (forceShow || (result.hasCredentials && credentialsToShow.length > 0)) {
                setMissingCredentials(credentialsToShow)
                setPendingFlowData(flowData)
                setOnCredentialsAssigned(() => onAssign)
                setShowCredentialModal(true)
                return true
            } else {
                if (onAssign) {
                    onAssign(flowData, {})
                }
                return false
            }
        } catch (error) {
            console.error('Error checking credentials:', error)
            // Proceed without credentials modal on error
            if (onAssign) {
                onAssign(flowData, {})
            }
            return false
        }
    }, [])

    /**
     * Handle credential assignments from the modal
     * @param {object} credentialAssignments - Map of node IDs to credential IDs
     */
    const handleAssign = useCallback(
        (credentialAssignments) => {
            if (pendingFlowData && onCredentialsAssigned) {
                try {
                    const updatedFlowData = updateFlowDataWithCredentials(pendingFlowData, credentialAssignments)
                    onCredentialsAssigned(updatedFlowData, credentialAssignments)
                } catch (error) {
                    console.error('Error updating flow data with credentials:', error)
                    // Proceed with original flow data
                    onCredentialsAssigned(pendingFlowData, credentialAssignments)
                }
            }

            // Reset state
            setShowCredentialModal(false)
            setMissingCredentials([])
            setPendingFlowData(null)
            setOnCredentialsAssigned(null)
        },
        [pendingFlowData, onCredentialsAssigned]
    )

    /**
     * Handle skipping credential assignment
     */
    const handleSkip = useCallback(() => {
        if (pendingFlowData && onCredentialsAssigned) {
            onCredentialsAssigned(pendingFlowData, {})
        }

        // Reset state
        setShowCredentialModal(false)
        setMissingCredentials([])
        setPendingFlowData(null)
        setOnCredentialsAssigned(null)
    }, [pendingFlowData, onCredentialsAssigned])

    /**
     * Handle canceling credential assignment
     */
    const handleCancel = useCallback(() => {
        // Reset state without calling onCredentialsAssigned
        setShowCredentialModal(false)
        setMissingCredentials([])
        setPendingFlowData(null)
        setOnCredentialsAssigned(null)
    }, [])

    return {
        showCredentialModal,
        missingCredentials,
        checkCredentials,
        handleAssign,
        handleSkip,
        handleCancel
    }
}