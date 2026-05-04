import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

// material-ui
import { Button, IconButton } from '@mui/material'
import { IconEdit, IconX } from '@tabler/icons-react'

// project import
import { AsyncDropdown } from '@/ui-component/dropdown/AsyncDropdown'
import AddEditCredentialDialog from '@/views/credentials/AddEditCredentialDialog'
import CredentialListDialog from '@/views/credentials/CredentialListDialog'

// API
import credentialsApi from '@/api/credentials'
import { useAuth } from '@/hooks/useAuth'
import { FLOWISE_CREDENTIAL_ID } from '@/store/constant'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// ===========================|| CredentialInputHandler ||=========================== //

const CredentialInputHandler = ({ inputParam, data, onSelect, disabled = false }) => {
    const ref = useRef(null)
    const dispatch = useDispatch()
    const [credentialId, setCredentialId] = useState(data?.credential || (data?.inputs && data.inputs[FLOWISE_CREDENTIAL_ID]) || '')
    const [showCredentialListDialog, setShowCredentialListDialog] = useState(false)
    const [credentialListDialogProps, setCredentialListDialogProps] = useState({})
    const [showSpecificCredentialDialog, setShowSpecificCredentialDialog] = useState(false)
    const [specificCredentialDialogProps, setSpecificCredentialDialogProps] = useState({})
    const [reloadTimestamp, setReloadTimestamp] = useState(Date.now().toString())
    const { hasPermission } = useAuth()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // Resolve possibly-legacy credentialNames (e.g. saved chatflow has 'JiraApi' but
    // the live pool now uses 'jiraApi') against the current canonical list. Old chatflow
    // JSON can outlive credential renames, so we normalize before issuing lookups.
    const resolveCanonicalCredentialNames = async (requestedNames) => {
        try {
            const allComponentsResp = await credentialsApi.getAllComponentsCredentials()
            const liveNames = Array.isArray(allComponentsResp?.data) ? allComponentsResp.data.map((c) => c.name) : []
            const liveByLower = new Map(liveNames.map((n) => [n.toLowerCase(), n]))

            const resolved = []
            const unresolved = []
            for (const requested of requestedNames) {
                const canonical = liveByLower.get(String(requested).toLowerCase())
                if (canonical) {
                    resolved.push(canonical)
                } else {
                    unresolved.push(requested)
                }
            }
            return { resolved, unresolved }
        } catch (error) {
            // If we can't fetch the list (network/auth issue) just fall back to the raw input
            // so the original behavior is preserved.
            console.error('Failed to resolve canonical credential names:', error)
            return { resolved: [...requestedNames], unresolved: [] }
        }
    }

    const editCredential = (credentialId) => {
        const dialogProp = {
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Save',
            credentialId
        }
        setSpecificCredentialDialogProps(dialogProp)
        setShowSpecificCredentialDialog(true)
    }

    const showCredentialErrorToast = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'error',
                persist: true,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    const addAsyncOption = async () => {
        try {
            const requestedNames = Array.isArray(inputParam.credentialNames) ? inputParam.credentialNames : []
            if (!requestedNames.length) {
                showCredentialErrorToast('No credential type configured for this input.')
                return
            }

            // Heal stale chatflow JSON: the saved node may reference a legacy credential
            // name (e.g. `JiraApi`) that has since been renamed (e.g. `jiraApi`). Map each
            // requested name to its current canonical key before we ask the server for it.
            const { resolved, unresolved } = await resolveCanonicalCredentialNames(requestedNames)

            if (unresolved.length) {
                showCredentialErrorToast(
                    `Could not find credential type${unresolved.length > 1 ? 's' : ''}: ${unresolved.join(
                        ', '
                    )}. The chatflow may reference an outdated integration.`
                )
            }

            if (!resolved.length) {
                return
            }

            const names = resolved.length > 1 ? resolved.join('&') : resolved[0]
            const componentCredentialsResp = await credentialsApi.getSpecificComponentCredential(names)
            if (componentCredentialsResp.data) {
                if (Array.isArray(componentCredentialsResp.data)) {
                    const dialogProp = {
                        title: 'Add New Credential',
                        componentsCredentials: componentCredentialsResp.data
                    }
                    setCredentialListDialogProps(dialogProp)
                    setShowCredentialListDialog(true)
                } else {
                    const dialogProp = {
                        type: 'ADD',
                        cancelButtonName: 'Cancel',
                        confirmButtonName: 'Add',
                        credentialComponent: componentCredentialsResp.data
                    }
                    setSpecificCredentialDialogProps(dialogProp)
                    setShowSpecificCredentialDialog(true)
                }
            }
        } catch (error) {
            console.error(error)
            const apiMessage =
                typeof error?.response?.data === 'object' ? error.response.data.message : error?.response?.data || error?.message
            showCredentialErrorToast(`Failed to load credential type: ${apiMessage || 'Unknown error'}`)
        }
    }

    const onConfirmAsyncOption = (selectedCredentialId = '') => {
        setCredentialId(selectedCredentialId)
        setReloadTimestamp(Date.now().toString())
        setSpecificCredentialDialogProps({})
        setShowSpecificCredentialDialog(false)
        onSelect(selectedCredentialId)
    }

    const onCredentialSelected = (credentialComponent) => {
        setShowCredentialListDialog(false)
        const dialogProp = {
            type: 'ADD',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            credentialComponent
        }
        setSpecificCredentialDialogProps(dialogProp)
        setShowSpecificCredentialDialog(true)
    }

    useEffect(() => {
        setCredentialId(data?.credential || (data?.inputs && data.inputs[FLOWISE_CREDENTIAL_ID]) || '')
    }, [data])

    useEffect(() => {
        const handleCredentialsUpdated = () => {
            setReloadTimestamp(Date.now().toString())
        }
        window.addEventListener('credentials-updated', handleCredentialsUpdated)
        return () => window.removeEventListener('credentials-updated', handleCredentialsUpdated)
    }, [])

    return (
        <div ref={ref}>
            {inputParam && (
                <>
                    {inputParam.type === 'credential' && (
                        <div key={reloadTimestamp} style={{ display: 'flex', flexDirection: 'row' }}>
                            <AsyncDropdown
                                disabled={disabled}
                                name={inputParam.name}
                                nodeData={data}
                                value={credentialId ?? 'choose an option'}
                                isCreateNewOption={hasPermission('credentials:create')}
                                credentialNames={inputParam.credentialNames}
                                onSelect={(newValue) => {
                                    setCredentialId(newValue)
                                    onSelect(newValue)
                                }}
                                onCreateNew={() => addAsyncOption(inputParam.name)}
                            />
                            {credentialId && hasPermission('credentials:update') && (
                                <IconButton title='Edit' color='primary' size='small' onClick={() => editCredential(credentialId)}>
                                    <IconEdit />
                                </IconButton>
                            )}
                        </div>
                    )}
                </>
            )}
            {showSpecificCredentialDialog && (
                <AddEditCredentialDialog
                    show={showSpecificCredentialDialog}
                    dialogProps={specificCredentialDialogProps}
                    onCancel={() => setShowSpecificCredentialDialog(false)}
                    onConfirm={onConfirmAsyncOption}
                ></AddEditCredentialDialog>
            )}
            {showCredentialListDialog && (
                <CredentialListDialog
                    show={showCredentialListDialog}
                    dialogProps={credentialListDialogProps}
                    onCancel={() => setShowCredentialListDialog(false)}
                    onCredentialSelected={onCredentialSelected}
                ></CredentialListDialog>
            )}
        </div>
    )
}

CredentialInputHandler.propTypes = {
    inputParam: PropTypes.object,
    data: PropTypes.object,
    onSelect: PropTypes.func,
    disabled: PropTypes.bool
}

export default CredentialInputHandler
