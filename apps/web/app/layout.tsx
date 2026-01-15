import React from 'react'
import { Poppins } from 'next/font/google'
import type { Metadata } from 'next'

const poppins = Poppins({
    weight: ['100', '300', '400', '700'],
    subsets: ['latin'],
    display: 'swap',

    variable: '--font-poppins'
})

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://theanswer.ai'

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`),
    title: {
        default: 'Answer Agent | AI-Powered Enterprise Solutions',
        template: '%s | Answer Agent'
    },
    description: 'AI-powered answers for your organization. Build intelligent chatflows, connect your data sources, and deploy AI agents that understand your business.',
    keywords: ['AI', 'chatbot', 'enterprise AI', 'LLM', 'chatflow', 'automation', 'knowledge base'],
    authors: [{ name: 'AnswerAI' }],
    creator: 'AnswerAI',
    publisher: 'AnswerAI',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: baseUrl,
        siteName: 'Answer Agent',
        title: 'Answer Agent | AI-Powered Enterprise Solutions',
        description: 'AI-powered answers for your organization. Build intelligent chatflows, connect your data sources, and deploy AI agents that understand your business.',
        images: [
            {
                url: '/api/og',
                width: 1200,
                height: 630,
                alt: 'Answer Agent - AI-Powered Enterprise Solutions'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Answer Agent | AI-Powered Enterprise Solutions',
        description: 'AI-powered answers for your organization. Build intelligent chatflows, connect your data sources, and deploy AI agents.',
        images: ['/api/og'],
        creator: '@answerai'
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1
        }
    }
}

export default async function RootLayout({
    // This will be populated with nested layouts or pages
    children
}: {
    children: React.ReactNode
}) {
    if (!children) return null
    // console.log(
    //   'LAYOUT ========================================================================================'
    // );

    return (
        <html className={poppins.className} lang='en' style={{ height: '100%', width: '100%', flex: 1, display: 'flex' }}>
            <body style={{ height: '100%', width: '100%', flex: 1, display: 'flex' }}>
                <div id='portal' />
                {children}
            </body>
        </html>
    )
}
