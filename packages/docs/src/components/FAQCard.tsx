import React, { useState } from 'react'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import styles from './FAQCard.module.css'

interface FAQItem {
    id: string
    question: string
    answer: string
    category?: string
}

interface FAQCardProps {
    title: string
    description?: string
    icon?: React.ReactNode
    faqs: FAQItem[]
    className?: string
}

const FAQCard: React.FC<FAQCardProps> = ({ title, description, icon, faqs, className }) => {
    const [openItems, setOpenItems] = useState<Set<string>>(new Set())

    const toggleItem = (id: string) => {
        const newOpenItems = new Set(openItems)
        if (newOpenItems.has(id)) {
            newOpenItems.delete(id)
        } else {
            newOpenItems.add(id)
        }
        setOpenItems(newOpenItems)
    }

    const toggleAll = () => {
        if (openItems.size === faqs.length) {
            setOpenItems(new Set())
        } else {
            setOpenItems(new Set(faqs.map((faq) => faq.id)))
        }
    }

    return (
        <div className={clsx(styles.faqCard, className)}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    {icon && <div className={styles.icon}>{icon}</div>}
                    <div>
                        <h3 className={styles.title}>{title}</h3>
                        {description && <p className={styles.description}>{description}</p>}
                    </div>
                </div>
                <button
                    className={styles.toggleAll}
                    onClick={toggleAll}
                    aria-label={openItems.size === faqs.length ? 'Collapse all' : 'Expand all'}
                >
                    {openItems.size === faqs.length ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            <div className={styles.content}>
                {faqs.map((faq) => (
                    <div key={faq.id} className={styles.faqItem}>
                        <button
                            className={clsx(styles.question, {
                                [styles.questionOpen]: openItems.has(faq.id)
                            })}
                            onClick={() => toggleItem(faq.id)}
                            aria-expanded={openItems.has(faq.id)}
                        >
                            <span className={styles.questionText}>{faq.question}</span>
                            <svg
                                className={clsx(styles.chevron, {
                                    [styles.chevronOpen]: openItems.has(faq.id)
                                })}
                                width='20'
                                height='20'
                                viewBox='0 0 20 20'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M5 7.5L10 12.5L15 7.5'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </button>
                        <div
                            className={clsx(styles.answer, {
                                [styles.answerOpen]: openItems.has(faq.id)
                            })}
                        >
                            <div className={styles.answerContent}>
                                <ReactMarkdown
                                    components={{
                                        // Customize link rendering to handle internal links
                                        a: ({ href, children, ...props }) => {
                                            // Check if it's an internal link (starts with /)
                                            if (href?.startsWith('/')) {
                                                return (
                                                    <a href={href} {...props} className={styles.internalLink}>
                                                        {children}
                                                    </a>
                                                )
                                            }
                                            // External links
                                            return (
                                                <a
                                                    href={href}
                                                    {...props}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className={styles.externalLink}
                                                >
                                                    {children}
                                                </a>
                                            )
                                        },
                                        // Style other markdown elements appropriately
                                        h1: ({ children }) => <h1 className={styles.markdownH1}>{children}</h1>,
                                        h2: ({ children }) => <h2 className={styles.markdownH2}>{children}</h2>,
                                        h3: ({ children }) => <h3 className={styles.markdownH3}>{children}</h3>,
                                        h4: ({ children }) => <h4 className={styles.markdownH4}>{children}</h4>,
                                        ul: ({ children }) => <ul className={styles.markdownUl}>{children}</ul>,
                                        ol: ({ children }) => <ol className={styles.markdownOl}>{children}</ol>,
                                        li: ({ children }) => <li className={styles.markdownLi}>{children}</li>,
                                        p: ({ children }) => <p className={styles.markdownP}>{children}</p>,
                                        strong: ({ children }) => <strong className={styles.markdownStrong}>{children}</strong>,
                                        code: ({ children }) => <code className={styles.markdownCode}>{children}</code>,
                                        pre: ({ children }) => <pre className={styles.markdownPre}>{children}</pre>
                                    }}
                                >
                                    {faq.answer}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FAQCard
