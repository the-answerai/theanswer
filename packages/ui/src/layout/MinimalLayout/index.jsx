// import { Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'

// ==============================|| MINIMAL LAYOUT ||============================== //

const MinimalLayout = ({ children }) => (
    <>
        {/* <Outlet /> */}
        {children}
    </>
)

MinimalLayout.propTypes = {
    children: PropTypes.node.isRequired
}

export default MinimalLayout
