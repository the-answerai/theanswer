import { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

// Create a context to hold the research view data
export const ResearchViewContext = createContext(null)

// Provider component to make research view data available globally
export const ResearchViewProvider = ({ children }) => {
    const [currentResearchView, setCurrentResearchView] = useState(null)

    return (
        <ResearchViewContext.Provider
            value={{
                currentResearchView,
                setCurrentResearchView
            }}
        >
            {children}
        </ResearchViewContext.Provider>
    )
}

ResearchViewProvider.propTypes = {
    children: PropTypes.node.isRequired
}

// Custom hook to access and update the research view data
export const useResearchView = () => {
    const context = useContext(ResearchViewContext)
    if (context === undefined) {
        throw new Error('useResearchView must be used within a ResearchViewProvider')
    }
    return context
}
