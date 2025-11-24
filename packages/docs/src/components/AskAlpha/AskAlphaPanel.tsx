import React, { useEffect, useRef, useState } from 'react'
import styles from './AskAlpha.module.css'

// Declare custom element for TypeScript
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'aai-fullchatbot': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
        }
    }
}

interface AskAlphaPanelProps {
    isOpen: boolean
    onClose: () => void
    initialContext?: Record<string, any>
    chatflowId?: string
    apiHost?: string
}

export const AskAlphaPanel: React.FC<AskAlphaPanelProps> = ({
    isOpen,
    onClose,
    initialContext = {},
    chatflowId = 'd480f12e-0f35-48a3-bac8-a2cacb924f78',
    apiHost = 'https://api.staging.theanswer.ai'
}) => {
    const embedContainerRef = useRef<HTMLDivElement>(null)
    const chatbotInitialized = useRef(false)
    const [chatbotKey, setChatbotKey] = useState(0)
    const scriptLoaded = useRef(false)

    const loadChatbotScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (scriptLoaded.current || (window as any).Chatbot) {
                scriptLoaded.current = true
                resolve()
                return
            }

            // Check if script tag already exists
            const existingScript = document.querySelector('script[src*="aai-embed"]')
            if (existingScript) {
                scriptLoaded.current = true
                resolve()
                return
            }

            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/aai-embed/dist/web.js'
            script.type = 'module'
            script.onload = () => {
                scriptLoaded.current = true
                resolve()
            }
            script.onerror = () => {
                reject(new Error('Failed to load chatbot script'))
            }
            document.head.appendChild(script)
        })
    }

    const initChatbot = async (force = false) => {
        if (!embedContainerRef.current) return
        if (chatbotInitialized.current && !force) return

        try {
            // Load the script first
            await loadChatbotScript()

            // Access the Chatbot from window
            const Chatbot = (window as any).Chatbot
            if (!Chatbot) {
                throw new Error('Chatbot not available on window')
            }

            chatbotInitialized.current = true

            Chatbot.initFull({
                chatflowid: chatflowId,
                apiHost: apiHost,
                getChatflowConfig: async () => {
                    // Get page content
                    const pageContent = document.body.innerText || ''
                    const url = initialContext.url || window.location.href

                    let hostname = ''
                    try {
                        hostname = new URL(url).hostname
                    } catch (error) {
                        // Silently fail
                    }

                    return {
                        returnSourceDocuments: true,
                        includedDomains: {
                            exaSearch_0: hostname
                        },
                        promptValues: {
                            url: url,
                            webContentText:
                                pageContent.length > 50000 ? pageContent.substring(0, 50000) + '...[content truncated]' : pageContent,
                            pageName: initialContext.page || document.title,
                            section: initialContext.section || '',
                            ...initialContext
                        }
                    }
                },
                theme: {
                    chatWindow: {
                        showTitle: false,
                        showAgentMessages: true,
                        backgroundColor: '#f5f7fa',
                        welcomeMessage: 'Hi! I have context about this page. How can I help?',
                        height: '100%',
                        width: '100%',
                        fontSize: 15,
                        renderHTML: true,
                        botMessage: {
                            backgroundColor: '#ffffff',
                            textColor: '#333333',
                            showAvatar: true,
                            avatarSrc: '/img/aai-logo-cropped.svg'
                        },
                        userMessage: {
                            backgroundColor: '#16213e',
                            textColor: '#ffffff',
                            showAvatar: false
                        },
                        textInput: {
                            placeholder: 'Type your message...',
                            backgroundColor: '#f8f9fa',
                            textColor: '#333333',
                            sendButtonColor: '#16213e'
                        },
                        footer: {
                            textColor: '#999999',
                            text: '',
                            company: 'Download Chrome Extension',
                            companyLink:
                                'https://chromewebstore.google.com/detail/answerai-ai-copilot-for-a/paadmncfnipigbanaghhgfgeoemhbbgk'
                        }
                    }
                }
            })
        } catch (error) {
            console.error('Failed to initialize chatbot:', error)
        }
    }

    const handleNewChat = () => {
        try {
            // Clear chatbot localStorage to start fresh
            const keysToRemove: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && (key.includes('flowise') || key.includes('chatId') || key.includes(chatflowId))) {
                    keysToRemove.push(key)
                }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key))

            // Destroy the chatbot
            if ((window as any).Chatbot?.destroy) {
                ;(window as any).Chatbot.destroy()
            }

            // Reset initialized flag
            chatbotInitialized.current = false

            // Force remount by changing key
            setChatbotKey((prev) => prev + 1)
        } catch (error) {
            console.error('Failed to start new chat:', error)
        }
    }

    useEffect(() => {
        if (!isOpen) return

        initChatbot()
    }, [isOpen, initChatbot])

    const renderIcon = () => (
        <svg width='24' height='24' viewBox='0 0 1600 1600' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='800' cy='800' r='800' fill='#16213E' />
            <path d='M800 400L950 700H650L800 400Z M600 800H1000L900 1000H700L600 800Z' fill='#EEEEFF' />
        </svg>
    )

    return (
        <>
            <div
                className={`${styles.slideOutOverlay} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
                role='button'
                tabIndex={0}
                aria-label='Close panel'
            />
            <div className={`${styles.slideOutPanel} ${isOpen ? styles.open : ''}`}>
                <div className={styles.panelHeader}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.panelTitle}>
                            {renderIcon()}
                            Ask Alpha
                            {initialContext.section && <span className={styles.contextBadge}>📍 {initialContext.section}</span>}
                        </h2>
                    </div>
                    <div className={styles.headerRight}>
                        <button className={styles.newChatButton} onClick={handleNewChat} title='Start new chat'>
                            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                                <line x1='9' y1='10' x2='15' y2='10' />
                                <line x1='12' y1='7' x2='12' y2='13' />
                            </svg>
                            New Chat
                        </button>
                        <button className={styles.closeButton} onClick={onClose} aria-label='Close panel'>
                            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                <path d='M18 6L6 18M6 6l12 12' />
                            </svg>
                        </button>
                    </div>
                </div>

                <div key={chatbotKey} ref={embedContainerRef} className={styles.embedContainer}>
                    <aai-fullchatbot></aai-fullchatbot>
                </div>
            </div>
        </>
    )
}
