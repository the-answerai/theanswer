'use client'
import Container from '@mui/material/Container'
import StudioAppHeader from './StudioAppHeader'
import PropTypes from 'prop-types'

const StudioAppLayout = ({ children, headerTitleLink, headerTitle, headerLinks }) => {
    return (
        <Container maxWidth='lg' sx={{ py: 4, px: 2 }}>
            <StudioAppHeader titleLink={headerTitleLink} title={headerTitle} links={headerLinks} /> {children}
        </Container>
    )
}
StudioAppLayout.propTypes = {
    children: PropTypes.node.isRequired,
    headerTitleLink: PropTypes.string,
    headerTitle: PropTypes.string,
    headerLinks: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
            icon: PropTypes.node
        })
    )
}

export default StudioAppLayout
