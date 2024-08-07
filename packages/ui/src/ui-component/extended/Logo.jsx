import logo from '@/assets/images/answerai-wide.png'
import logoDark from '@/assets/images/answerai-wide-dark.png'

import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
            <img
                style={{ objectFit: 'contain', height: 'auto', width: 180 }}
                src={customization.isDarkMode ? logoDark : logo}
                alt='AnswerAI'
            />
        </div>
    )
}

export default Logo
