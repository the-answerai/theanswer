import { useCallback, useRef, useState } from 'react'
import nodesApi from '@/api/nodes'
import { collectFlowCredentials, updateFlowDataWithCredentials } from '@/utils/flowCredentialsHelper'
import { getCredentialModalDismissed, setCredentialModalDismissed } from '@/utils/credentialModalPreference'

const nodeDefinitionCache = new Map()

const fetchNodeDefinition = async (nodeName) => {
    if (!nodeName) return null
    if (nodeDefinitionCache.has(nodeName)) return nodeDefinitionCache.get(nodeName)
    try {
        const response = await nodesApi.getSpecificNode(nodeName)
        const nodeDefinition = response?.data || null
        if (nodeDefinition) {
            nodeDefinitionCache.set(nodeName, nodeDefinition)
        }
        return nodeDefinition
    } catch (_error) {
        return null
    }
}

const resetState = (setShowModal, setCredentialList, setAllCredentialsState, setInitialDontShowAgain) => {
    setShowModal(false)
    setCredentialList([])
    setAllCredentialsState([])
    setInitialDontShowAgain(false)
}

const buildCallbackPayload = (flowState, evaluation, mode) => ({
    flowData: flowState?.raw ?? null,
    parsedFlow: flowState?.parsed ?? null,
    allCredentials: evaluation?.allCredentials ?? [],
    missingCredentials: evaluation?.missingCredentials ?? [],
    mode
})

export const useFlowCredentials = () => {
    const [showCredentialModal, setShowCredentialModal] = useState(false)
    const [credentialList, setCredentialList] = useState([])
    const [allCredentialsState, setAllCredentialsState] = useState([])
    const [initialDontShowAgain, setInitialDontShowAgain] = useState(false)

    const preferenceScopeRef = useRef(null)
    const callbacksRef = useRef({ onAssign: null, onSkip: null, onCancel: null })
    const flowRef = useRef({ raw: null, parsed: null, format: 'object' })
    const evaluationRef = useRef({ allCredentials: [], missingCredentials: [] })
    const modeRef = useRef('missing')

    const openCredentialModal = useCallback(async (flowData, options = {}) => {
        const { preferenceScope = null, onAssign, onSkip, onCancel, forceShow = false, mode = 'missing' } = options

        const evaluation = await collectFlowCredentials(flowData, { fetchNodeDefinition })
        evaluationRef.current = evaluation

        const listForModal = mode === 'all' ? evaluation.allCredentials : evaluation.missingCredentials
        const hasItems = listForModal.length > 0
        const preferenceDismissed = preferenceScope ? getCredentialModalDismissed(preferenceScope) : false

        if (!forceShow && (!hasItems || preferenceDismissed)) {
            return { shown: false, evaluation }
        }

        const isStringInput = typeof flowData === 'string'
        const parsedFlow = isStringInput ? JSON.parse(flowData) : { ...flowData }

        flowRef.current = {
            raw: isStringInput ? flowData : parsedFlow,
            parsed: parsedFlow,
            format: isStringInput ? 'string' : 'object'
        }

        callbacksRef.current = { onAssign, onSkip, onCancel }
        preferenceScopeRef.current = preferenceScope
        modeRef.current = mode

        setCredentialList(listForModal)
        setAllCredentialsState(evaluation.allCredentials)
        setInitialDontShowAgain(preferenceScope ? preferenceDismissed : false)
        setShowCredentialModal(true)

        return { shown: true, evaluation }
    }, [])

    const applyPreference = (options) => {
        const scope = preferenceScopeRef.current
        if (!scope) return
        if (options?.dontShowDirty) {
            setCredentialModalDismissed(scope, !!options.dontShowAgain)
        }
    }

    const handleAssign = useCallback((credentialAssignments, options = {}) => {
        applyPreference(options)

        const currentFlow = flowRef.current
        const format = currentFlow.format
        const source = format === 'string' ? currentFlow.raw : currentFlow.parsed

        let nextRaw = currentFlow.raw
        let nextParsed = currentFlow.parsed

        if (credentialAssignments && Object.keys(credentialAssignments).length > 0) {
            const updatedFlow = updateFlowDataWithCredentials(source, credentialAssignments)
            nextParsed = updatedFlow
            nextRaw = format === 'string' ? JSON.stringify(updatedFlow) : updatedFlow
        }

        flowRef.current = {
            raw: nextRaw,
            parsed: nextParsed,
            format
        }

        callbacksRef.current.onAssign?.(
            nextRaw,
            credentialAssignments,
            buildCallbackPayload(flowRef.current, evaluationRef.current, modeRef.current)
        )

        resetState(setShowCredentialModal, setCredentialList, setAllCredentialsState, setInitialDontShowAgain)
        preferenceScopeRef.current = null
        callbacksRef.current = { onAssign: null, onSkip: null, onCancel: null }
    }, [])

    const handleSkip = useCallback((options = {}) => {
        applyPreference(options)
        callbacksRef.current.onSkip?.(flowRef.current.raw, buildCallbackPayload(flowRef.current, evaluationRef.current, modeRef.current))

        resetState(setShowCredentialModal, setCredentialList, setAllCredentialsState, setInitialDontShowAgain)
        preferenceScopeRef.current = null
        callbacksRef.current = { onAssign: null, onSkip: null, onCancel: null }
    }, [])

    const handleCancel = useCallback((options = {}) => {
        applyPreference(options)
        callbacksRef.current.onCancel?.(flowRef.current.raw, buildCallbackPayload(flowRef.current, evaluationRef.current, modeRef.current))

        resetState(setShowCredentialModal, setCredentialList, setAllCredentialsState, setInitialDontShowAgain)
        preferenceScopeRef.current = null
        callbacksRef.current = { onAssign: null, onSkip: null, onCancel: null }
    }, [])

    return {
        showCredentialModal,
        missingCredentials: credentialList,
        allCredentials: allCredentialsState,
        initialDontShowAgain,
        modalMode: modeRef.current,
        openCredentialModal,
        handleAssign,
        handleSkip,
        handleCancel
    }
}

export default useFlowCredentials
