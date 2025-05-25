import { useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { ResearchViewContext } from '../context/ResearchViewContext.jsx'

export const useChatbotId = () => {
    const location = useLocation()
    const isFAQPage = location.pathname === '/faq'
    const isCallListPage = location.pathname === '/calls'
    const isResearchViewPage = location.pathname.includes('/analyzer/research-views/')
    const { currentResearchView } = useContext(ResearchViewContext)

    // If we're in a research view page and it has a chatflow ID, use that
    if (isResearchViewPage && currentResearchView?.answerai_chatflow_id) {
        return {
            chatflowId: currentResearchView.answerai_chatflow_id,
            title: `${currentResearchView.name} - Research Assistant`
        }
    }

    // Default fallbacks based on the route
    return {
        chatflowId: isCallListPage
            ? import.meta.env.VITE_AAI_SUPPORT_CHATBOT || '78981c24-f304-4c1c-a41a-5d49a19e64fa'
            : isFAQPage
            ? import.meta.env.VITE_AAI_FAQ_CHATBOT || '0479c54c-a2a8-4157-b1e4-0bb9bc78f3f7'
            : import.meta.env.VITE_AAI_SUPPORT_CHATBOT || 'e753ce31-0653-4151-b23c-fa4942e7dbb3',
        title: isCallListPage ? 'Support Sidekick' : isFAQPage ? 'FAQ Sidekick' : 'Support Sidekick'
    }
}
