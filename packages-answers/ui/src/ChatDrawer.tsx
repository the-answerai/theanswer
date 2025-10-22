'use client'
import * as React from 'react'
import useSWRInfinite from 'swr/infinite'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { styled } from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'

import closedMixin from './theme/closedMixin'
import openedMixin from './theme/openedMixin'

import { Chat, Journey } from 'types'
import { Box } from '@mui/material'

const drawerWidth = 400

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar
}))

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    position: 'relative',
    width: '100%',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',

    ...(open && {
        ...openedMixin({ theme, width: drawerWidth }),
        '& .MuiDrawer-paper': openedMixin({ theme, width: drawerWidth })
    }),

    ...(!open && {
        ...closedMixin({ theme, spacing: 0 }),
        '& .MuiDrawer-paper': closedMixin({ theme, spacing: 0 })
    })
}))
export interface ChatDrawerProps {
    journeys?: Journey[]
    chats?: Chat[]
    defaultOpen?: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ChatDrawer({ journeys, chats, defaultOpen }: ChatDrawerProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = React.useState<boolean | undefined>(defaultOpen)
    const [opened, setOpened] = React.useState<{ [key: string | number]: boolean }>({ chats: true })
    const loadMoreRef = React.useRef<HTMLDivElement>(null)

    const getKey = (pageIndex: number, previousPageData: Chat[] | null) => {
        // Reached the end (no data or less than limit means no more pages)
        if (previousPageData && previousPageData.length < 20) return null

        // First page
        if (pageIndex === 0) return '/api/chats?limit=20'

        // Get cursor from last chat of previous page
        const cursor = previousPageData?.[previousPageData.length - 1]?.createdAt
        return `/api/chats?limit=20&cursor=${cursor}`
    }

    const { data, size, setSize, isValidating } = useSWRInfinite<Chat[]>(getKey, fetcher, {
        fallbackData: chats ? [chats] : undefined,
        revalidateFirstPage: false
    })

    const fetchedChats = React.useMemo(() => data?.flat() || [], [data])
    const getDateKey = (chat: Chat) => {
        const date = new Date(chat.createdAt ?? chat.createdDate)
        const now = new Date()
        if (date.toDateString() === now.toDateString()) return 'Today'
        if (date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) return 'Yesterday'
        if (date >= new Date(now.setDate(now.getDate() - 6))) return 'Last 7 days'
        if (date >= new Date(now.setDate(now.getDate() - 23))) return 'Last 30 days'
        return date.toLocaleString('default', { month: 'long', year: 'numeric' })
    }

    const chatsByDate = React.useMemo(() => {
        if (!fetchedChats || fetchedChats.length === 0) return {}

        return fetchedChats.reduce((accum: { [key: string]: Chat[] }, chat: Chat) => {
            const dateKey = getDateKey(chat)
            return { ...accum, [dateKey]: [...(accum[dateKey] || []), chat] }
        }, {})
    }, [fetchedChats])

    // Check if there's more data to load
    const hasMore = data && data[data.length - 1]?.length === 20

    // IntersectionObserver for infinite scroll
    React.useEffect(() => {
        if (!hasMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isValidating) {
                    setSize(size + 1)
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }

        return () => observer.disconnect()
    }, [size, setSize, isValidating, hasMore])

    return (
        <>
            <List disablePadding>
                {Object.entries(chatsByDate || {}).map(([date, chats]) => (
                    <Box key={date} sx={{ mb: 1 }}>
                        <ListItem
                            sx={{
                                px: 1,
                                transition: '.2s',
                                '.MuiDrawer-closed &': {
                                    opacity: 0
                                }
                            }}
                            disablePadding
                        >
                            <ListItemText primary={date} primaryTypographyProps={{ variant: 'caption' }} />
                        </ListItem>
                        {chats.map((chat) => (
                            <ListItem
                                key={chat.id}
                                disablePadding
                                sx={{
                                    transition: '.2s',
                                    '.MuiDrawer-closed &': {
                                        opacity: 0
                                    }
                                }}
                            >
                                <ListItemButton selected={pathname === `/chat/${chat.id}`} href={`/chat/${chat.id}`} component={NextLink}>
                                    <ListItemText
                                        secondary={chat.title}
                                        sx={pathname === `/chat/${chat.id}` ? { '.MuiListItemText-secondary': { color: 'white' } } : {}}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </Box>
                ))}
                {/* Load more trigger */}
                {hasMore && (
                    <Box ref={loadMoreRef} sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                        {isValidating && <CircularProgress size={24} />}
                    </Box>
                )}
            </List>
        </>
    )
}
