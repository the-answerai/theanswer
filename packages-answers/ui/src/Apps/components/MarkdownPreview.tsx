import { TableContainer, Paper, Table, TableHead, TableBody, TableRow, TableCell, Typography, Link, Divider } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReactNode } from 'react'
import { TableCellProps } from '@mui/material'

const getMuiAlign = (align?: string): TableCellProps['align'] => {
    if (!align) return undefined
    if (['left', 'right', 'center', 'justify', 'inherit'].includes(align)) return align as TableCellProps['align']
    return 'left'
}

const MarkdownPreview = ({ markdown }: { markdown: string }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            table: (props: { children?: ReactNode }) => (
                <TableContainer component={Paper} sx={{ maxHeight: '50vh', overflowY: 'auto', mb: 2 }} {...props}>
                    <Table size='small' stickyHeader {...props}>
                        {props.children}
                    </Table>
                </TableContainer>
            ),
            thead: (props: { children?: ReactNode }) => <TableHead {...props}>{props.children}</TableHead>,
            tbody: (props: { children?: ReactNode }) => <TableBody {...props}>{props.children}</TableBody>,
            tr: (props: { children?: ReactNode }) => <TableRow {...props}>{props.children}</TableRow>,
            th: (props: { children?: ReactNode; align?: string }) => (
                <TableCell {...props} align={getMuiAlign(props.align)}>
                    {props.children}
                </TableCell>
            ),
            td: (props: { children?: ReactNode; align?: string }) => (
                <TableCell {...props} align={getMuiAlign(props.align)}>
                    {props.children}
                </TableCell>
            ),
            a: (props: { children?: ReactNode }) => <Link {...props}>{props.children}</Link>,
            h1: (props: { children?: ReactNode }) => (
                <Typography variant='h4' gutterBottom {...props}>
                    {props.children}
                </Typography>
            ),
            h2: (props: { children?: ReactNode }) => (
                <Typography variant='h6' gutterBottom {...props}>
                    {props.children}
                </Typography>
            ),
            h3: (props: { children?: ReactNode }) => (
                <Typography variant='h6' gutterBottom {...props}>
                    {props.children}
                </Typography>
            ),
            h4: (props: { children?: ReactNode }) => (
                <Typography variant='subtitle1' gutterBottom {...props}>
                    {props.children}
                </Typography>
            ),
            h5: (props: { children?: ReactNode }) => (
                <Typography variant='h6' gutterBottom {...props}>
                    {props.children}
                </Typography>
            ),
            h6: (props: { children?: ReactNode }) => (
                <Typography variant='body1' gutterBottom {...props}>
                    {props.children}
                </Typography>
            ),
            p: (props: { children?: ReactNode }) => (
                <Typography variant='body2' paragraph {...props}>
                    {props.children}
                </Typography>
            ),
            li: (props: { children?: ReactNode }) => (
                <li {...props}>
                    <Typography variant='body2' component='span' {...props}>
                        {props.children}
                    </Typography>
                </li>
            ),
            hr: (props: any) => <Divider {...props} />
        }}
    >
        {markdown}
    </ReactMarkdown>
)

export default MarkdownPreview
