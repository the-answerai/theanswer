import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction, SET_CHATFLOW } from '@/store/actions'

// material-ui
import { Button, Box, Typography } from '@mui/material'
import { IconX } from '@tabler/icons'

// Project import
import { StyledButton } from '@/ui-component/button/StyledButton'

// store
import useNotifier from '@/utils/useNotifier'

// API
import chatflowsApi from '@/api/chatflows'
import { SwitchInput } from '../switch/Switch'
import { TooltipWithParser } from '../tooltip/TooltipWithParser'

const AnswersSettings = ({ dialogProps }) => {
    const dispatch = useDispatch()
    const chatflow = useSelector((state) => state.canvas.chatflow)

    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [answersConfig, setAnswersConfig] = useState(chatflow.answersConfig ? JSON.parse(chatflow.answersConfig) : {})

    const handleChange = (value, fieldName) => {
        console.log('Change', { fieldName, value })
        setAnswersConfig({ ...answersConfig, [fieldName]: value })
    }

    const onSave = async () => {
        try {
            const saveResp = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
                answersConfig: JSON.stringify(answersConfig)
            })
            if (saveResp.data) {
                enqueueSnackbar({
                    message: 'Answers Settings Saved',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                dispatch({ type: SET_CHATFLOW, chatflow: saveResp.data })
            }
        } catch (error) {
            const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`
            enqueueSnackbar({
                message: `Failed to save Answers Settings: ${errorData}`,
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
    }

    useEffect(() => {
        if (dialogProps.chatflow && dialogProps.chatflow.answersConfig) {
            let answersConfig = JSON.parse(dialogProps.chatflow.answersConfig)
            setAnswersConfig(answersConfig || {})
        }

        return () => {}
    }, [dialogProps])
    console.log('AnswerSettings', { answersConfig })
    return (
        <>
            <Typography variant='h4' sx={{ mb: 1 }}>
                Answers
                <TooltipWithParser style={{ mb: 1, mt: 2, marginLeft: 10 }} title={'Control visibility and organization permissons'} />
            </Typography>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <SwitchInput
                    label='Visible (not displayed in Sidekick selector)'
                    onChange={(value) => {
                        handleChange(value, 'isVisible')
                    }}
                    value={answersConfig?.isVisible}
                />
            </Box>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <SwitchInput
                    label='Shared with organization'
                    onChange={(value) => {
                        handleChange(value, 'isSharedWithOrganization')
                    }}
                    value={answersConfig?.isSharedWithOrganization}
                />
            </Box>
            <StyledButton variant='contained' onClick={onSave}>
                Save
            </StyledButton>
        </>
    )
}

AnswersSettings.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func
}

export default AnswersSettings
