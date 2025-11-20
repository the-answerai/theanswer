import logo from '@/assets/images/flowise_logo.png'
import logoDark from '@/assets/images/flowise_logo_dark.png'
import Image from 'next/image'
import { useThemeMode } from '@ui/theme'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const { mode } = useThemeMode()

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
            <Image
                style={{ objectFit: 'contain', height: 'auto', width: 150 }}
                src={mode === 'dark' ? logoDark : logo}
                alt='The AnswerAI'
            />
        </div>
    )
}

export default Logo
