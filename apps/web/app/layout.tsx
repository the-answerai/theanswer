import React from 'react'
import { Poppins } from 'next/font/google'
import { ThemeScript } from './ThemeScript'
import { ThemeProviderWrapper } from '@ui/theme/ThemeProviderWrapper'

const poppins = Poppins({
    weight: ['100', '300', '400', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-poppins'
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    if (!children) return null

    return (
        <html
            className={poppins.className}
            lang='en'
            style={{ height: '100%', width: '100%', flex: 1, display: 'flex' }}
            suppressHydrationWarning
        >
            <head>
                <ThemeScript />
            </head>
            <body style={{ height: '100%', width: '100%', flex: 1, display: 'flex' }}>
                <ThemeProviderWrapper>
                    {/* Portal container for MUI dialogs - must be first child and positioned */}
                    <div id='portal' style={{ position: 'fixed', zIndex: 9999 }} />
                    {children}
                </ThemeProviderWrapper>
            </body>
        </html>
    )
}
