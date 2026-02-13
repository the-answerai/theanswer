declare module 'react-markdown' {
    import { ReactNode, ComponentType } from 'react'

    interface ReactMarkdownProps {
        children: string
        remarkPlugins?: any[]
        rehypePlugins?: any[]
        components?: Record<string, ComponentType<any>>
        className?: string
        [key: string]: any
    }

    const ReactMarkdown: ComponentType<ReactMarkdownProps>
    export default ReactMarkdown
}

declare module 'react-markdown/lib/complex-types' {
    const _default: any
    export = _default
}
