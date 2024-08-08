import PropTypes from 'prop-types'
import { Modal, Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material'

const SidebarToolModal = ({ open, onClose, availableTools, onToolSelect }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4
                }}
            >
                <Typography variant='h6' component='h2'>
                    Available Tools
                </Typography>
                <List>
                    {availableTools.map((tool) => (
                        <ListItem key={tool.name}>
                            <ListItemText primary={tool.label} />
                            <Button onClick={() => onToolSelect(tool)}>Add</Button>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Modal>
    )
}

SidebarToolModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    availableTools: PropTypes.array.isRequired,
    onToolSelect: PropTypes.func.isRequired
}

export default SidebarToolModal
