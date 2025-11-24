import { useRoutes } from '@/utils/navigation'

// routes
import MainRoutes from './MainRoutes'
import CanvasRoutes from './CanvasRoutes'
import ChatbotRoutes from './ChatbotRoutes'
import ExecutionRoutes from './ExecutionRoutes'
import config from '@/config'
import AuthRoutes from '@/routes/AuthRoutes'

// ==============================|| ROUTING RENDER ||============================== //

export default function ThemeRoutes() {
    return useRoutes([MainRoutes, AuthRoutes, CanvasRoutes, ChatbotRoutes, ExecutionRoutes], config.basename)
}
