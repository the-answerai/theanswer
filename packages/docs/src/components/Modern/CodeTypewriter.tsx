import React, { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import styles from './Modern.module.css'

interface CodeTypewriterProps {
    codeString?: string
    language?: string
}

const defaultCode = `// Define your AI Agent
const agent = new Agent({
  name: "Research Assistant",
  model: "gpt-4",
  tools: ["web-browser", "calculator"]
});

// Execute task
await agent.run(
  "Analyze market trends for 2025"
);`

const CodeTypewriter: React.FC<CodeTypewriterProps> = ({ codeString = defaultCode, language = 'typescript' }) => {
    const [displayedCode, setDisplayedCode] = useState('')
    const [isTyping, setIsTyping] = useState(true)

    useEffect(() => {
        let index = 0
        setDisplayedCode('')
        setIsTyping(true)

        const interval = setInterval(() => {
            if (index < codeString.length) {
                setDisplayedCode((prev) => prev + codeString.charAt(index))
                index++
            } else {
                setIsTyping(false)
                clearInterval(interval)
            }
        }, 30) // Typing speed

        return () => clearInterval(interval)
    }, [codeString])

    return (
        <div className={styles.codeWindow}>
            <div className={styles.codeHeader}>
                <div className={styles.windowControls}>
                    <div className={styles.control} style={{ background: '#ff5f56' }} />
                    <div className={styles.control} style={{ background: '#ffbd2e' }} />
                    <div className={styles.control} style={{ background: '#27c93f' }} />
                </div>
                <div className={styles.fileName}>agent.ts</div>
                <Play size={14} className={styles.runIcon} />
            </div>
            <div className={styles.codeBody}>
                <pre>
                    <code className={`language-${language}`}>
                        {displayedCode}
                        {isTyping && <span className={styles.cursor}>|</span>}
                    </code>
                </pre>
            </div>
        </div>
    )
}

export default CodeTypewriter
