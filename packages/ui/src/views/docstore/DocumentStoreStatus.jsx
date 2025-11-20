import { useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { useThemeMode } from '@ui/theme'

const DocumentStoreStatus = ({ status, isTableView }) => {
    const theme = useTheme()
    const { mode } = useThemeMode()

    const getColor = (status) => {
        switch (status) {
            case 'STALE':
                return mode === 'dark'
                    ? [theme.vars.palette.grey[400], theme.vars.palette.grey[600], theme.vars.palette.grey[800]]
                    : [theme.vars.palette.grey[300], theme.vars.palette.grey[500], theme.vars.palette.grey[700]]
            case 'EMPTY':
                return mode === 'dark'
                    ? ['#1e3a8a', '#3b82f6', '#ffffff'] // Blue from unified theme
                    : ['#dbeafe', '#93c5fd', '#3b82f6']
            case 'SYNCING':
                return mode === 'dark'
                    ? ['#ff6f00', '#ff8f00', '#ffffff'] // Amber
                    : ['#fff8e1', '#ffe57f', '#ffc107']
            case 'UPSERTING':
                return mode === 'dark'
                    ? ['#01579b', '#0277bd', '#ffffff'] // Light Blue
                    : ['#e1f5fe', '#4fc3f7', '#0288d1']
            case 'SYNC':
                return mode === 'dark'
                    ? ['#1b5e20', '#2e7d32', '#ffffff'] // Green
                    : ['#e8f5e9', '#81c784', '#43a047']
            case 'UPSERTED':
                return mode === 'dark'
                    ? ['#004d40', '#00695c', '#ffffff'] // Teal
                    : ['#e0f2f1', '#4db6ac', '#00897b']
            case 'NEW':
                return mode === 'dark'
                    ? ['#0d47a1', '#1565c0', '#ffffff'] // Blue
                    : ['#e3f2fd', '#64b5f6', '#1e88e5']
            default:
                return mode === 'dark'
                    ? [theme.vars.palette.grey[300], theme.vars.palette.grey[500], theme.vars.palette.grey[700]]
                    : [theme.vars.palette.grey[200], theme.vars.palette.grey[400], theme.vars.palette.grey[600]]
        }
    }

    return (
        <>
            {!isTableView && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignContent: 'center',
                        alignItems: 'center',
                        background: status === 'EMPTY' ? 'transparent' : getColor(status)[0],
                        border: status === 'EMPTY' ? '1px solid' : 'none',
                        borderColor: status === 'EMPTY' ? getColor(status)[0] : 'transparent',
                        borderRadius: '25px',
                        paddingTop: '3px',
                        paddingBottom: '3px',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        width: 'fit-content'
                    }}
                >
                    <div
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: status === 'EMPTY' ? 'transparent' : getColor(status)[1],
                            border: status === 'EMPTY' ? '3px solid' : 'none',
                            borderColor: status === 'EMPTY' ? getColor(status)[1] : 'transparent'
                        }}
                    />
                    <span style={{ fontSize: '0.7rem', color: getColor(status)[2], marginLeft: 5 }}>{status}</span>
                </div>
            )}
            {isTableView && (
                <div
                    style={{
                        display: 'flex',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: status === 'EMPTY' ? 'transparent' : getColor(status)[1],
                        border: status === 'EMPTY' ? '3px solid' : 'none',
                        borderColor: status === 'EMPTY' ? getColor(status)[1] : 'transparent'
                    }}
                    title={status}
                ></div>
            )}
        </>
    )
}

DocumentStoreStatus.propTypes = {
    status: PropTypes.string,
    isTableView: PropTypes.bool
}

export default DocumentStoreStatus
