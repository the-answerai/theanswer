import PropTypes from 'prop-types'
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material'

const StudioAppHeader = ({ title, titleLink = '', links = [], appBarProps = {}, linkProps = {} }) => {
    return (
        <>
            <AppBar
                enableColorOnDark
                position='static'
                color='inherit'
                elevation={0}
                sx={{
                    bgcolor: 'transparent',
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 2,
                    ...((appBarProps && appBarProps.sx) || {})
                }}
                {...appBarProps}
            >
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: 64 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {titleLink && titleLink !== '' ? (
                            <Button
                                href={titleLink}
                                color='inherit'
                                sx={{
                                    whiteSpace: 'nowrap',
                                    flexGrow: 1,
                                    fontWeight: 700,
                                    letterSpacing: 1,
                                    textTransform: 'none',
                                    fontSize: '1.25rem',
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    pl: 0,
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        color: 'inherit',
                                        textDecoration: 'none',
                                        boxShadow: 'none'
                                    }
                                }}
                            >
                                {title}
                            </Button>
                        ) : (
                            <Typography variant='h6' noWrap component='div' sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
                                {title}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                            {links.map((link) => (
                                <Button
                                    key={link.href}
                                    href={link.href}
                                    color='primary'
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: 64,
                                        p: 1,
                                        ...(linkProps.sx || {})
                                    }}
                                    {...linkProps}
                                >
                                    {link.icon && <Box sx={{ mb: 0.5 }}>{link.icon}</Box>}
                                    <span>{link.label}</span>
                                </Button>
                            ))}
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>
        </>
    )
}

StudioAppHeader.propTypes = {
    title: PropTypes.string,
    titleLink: PropTypes.string,
    links: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
            icon: PropTypes.node
        })
    ),
    appBarProps: PropTypes.object,
    linkProps: PropTypes.object
}

export default StudioAppHeader
