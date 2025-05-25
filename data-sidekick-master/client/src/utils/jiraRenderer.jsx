import { Typography, Box, Link } from '@mui/material'

const renderADFContent = (node, ticketKey, index = 0) => {
    if (!node) return null

    // Handle text nodes
    if (node.type === 'text') {
        let content = node.text
        if (node.marks) {
            for (const mark of node.marks) {
                switch (mark.type) {
                    case 'strong':
                        content = <strong key={index}>{content}</strong>
                        break
                    case 'em':
                        content = <em key={index}>{content}</em>
                        break
                    case 'strike':
                        content = <del key={index}>{content}</del>
                        break
                    case 'code':
                        content = <code key={index}>{content}</code>
                        break
                    case 'underline':
                        content = <u key={index}>{content}</u>
                        break
                    case 'link':
                        content = (
                            <Link key={index} href={mark.attrs.href} target='_blank' rel='noopener noreferrer'>
                                {content}
                            </Link>
                        )
                        break
                    default:
                        break
                }
            }
        }
        return content
    }

    // Handle mention nodes
    if (node.type === 'mention') {
        return (
            <Typography
                key={index}
                component='span'
                sx={{
                    color: 'primary.main',
                    fontWeight: 'medium'
                }}
            >
                {node.attrs.text.replace(/@/g, '')}
            </Typography>
        )
    }

    // Handle hardBreak nodes
    if (node.type === 'hardBreak') {
        return <br key={index} />
    }

    // Handle media nodes
    if (node.type === 'mediaSingle') {
        return (
            <Box
                key={index}
                sx={{
                    my: 2,
                    textAlign: node.attrs?.layout === 'center' ? 'center' : 'left',
                    width: node.attrs?.width ? `${node.attrs.width}%` : 'auto'
                }}
            >
                {node.content?.map((child, idx) => {
                    if (child.type === 'media') {
                        const fileName = child.attrs.alt.replace(/\s+/g, '_')
                        const storagePath = `${ticketKey}/${fileName}`

                        return (
                            <Box
                                key={`${child.attrs.id}-${fileName}`}
                                component='img'
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/jira-issue-attachments/${storagePath}`}
                                alt={child.attrs.alt}
                                sx={{
                                    maxWidth: '100%',
                                    height: 'auto'
                                }}
                            />
                        )
                    }
                    return renderADFContent(child, ticketKey, `${index}-${idx}`)
                })}
            </Box>
        )
    }

    // Handle container nodes
    if (node.content) {
        const children = node.content.map((child, idx) => renderADFContent(child, ticketKey, `${index}-${idx}`))

        switch (node.type) {
            case 'doc':
                return <Box key={index}>{children}</Box>
            case 'paragraph': {
                return children.length === 0 ? (
                    <br key={index} />
                ) : (
                    <Typography key={index} paragraph>
                        {children}
                    </Typography>
                )
            }
            case 'heading': {
                const HeadingComponent = `h${node.attrs?.level || 1}`
                return (
                    <Typography key={index} variant={HeadingComponent} gutterBottom>
                        {children}
                    </Typography>
                )
            }
            case 'bulletList':
                return <ul key={index}>{children}</ul>
            case 'orderedList':
                return <ol key={index}>{children}</ol>
            case 'listItem':
                return <li key={index}>{children}</li>
            case 'blockquote':
                return (
                    <Box
                        key={index}
                        sx={{
                            borderLeft: '4px solid',
                            borderColor: 'divider',
                            pl: 2,
                            my: 2
                        }}
                    >
                        {children}
                    </Box>
                )
            case 'codeBlock':
                return (
                    <Box
                        key={index}
                        component='pre'
                        sx={{
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto'
                        }}
                    >
                        <code>{children}</code>
                    </Box>
                )
            default:
                return <span key={index}>{children}</span>
        }
    }

    return null
}

export const renderJiraDescription = (description, ticketKey) => {
    if (!description) return null

    try {
        // If the description is a string, try to parse it as JSON
        const content = typeof description === 'string' ? JSON.parse(description) : description

        // Check if it's in ADF format
        if (content?.type === 'doc' && content?.version) {
            return renderADFContent(content, ticketKey)
        }

        // Fallback for plain text
        return (
            <Typography variant='body2' paragraph>
                {description}
            </Typography>
        )
    } catch {
        // If parsing fails, render as plain text
        return (
            <Typography variant='body2' paragraph>
                {description}
            </Typography>
        )
    }
}
