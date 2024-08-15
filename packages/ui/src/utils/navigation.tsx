import { useRouter as useNextRouter, usePathname as useNextPathname } from 'next/navigation'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import React from 'react'

export const usePathname = useNextPathname

export const useNavigate = () => {
    const nextRouter = useNextRouter()
    const navigate = (url: string | number, options?: { state?: any; replace?: boolean }) => {
        // Handle faux history state
        console.log('navigate', url, options)
        if (options?.state) {
            const serializedState = JSON.stringify(options.state)
            sessionStorage.setItem('navigationState', serializedState)
        } else {
            sessionStorage.removeItem('navigationState')
        }

        if (url === -1) {
            // Go back in history
            nextRouter.back()
            return
        }

        if (url === 0) {
            nextRouter.refresh()
            return
        }
        const fullUrl = `/sidekick-studio${url}`
        if (options?.replace) {
            nextRouter.replace(fullUrl)
        } else {
            nextRouter.push(fullUrl)
        }
    }

    return navigate
}
export const useLocation = () => {
    const pathname = usePathname()
    const [state, setState] = React.useState<any>(null)

    React.useEffect(() => {
        const serializedState = sessionStorage.getItem('navigationState')
        if (serializedState) {
            try {
                const parsedState = JSON.parse(serializedState)
                setState(parsedState)
            } catch (error) {
                console.error('Failed to parse state:', error)
                setState(null)
            }
        } else {
            setState(null)
        }
    }, [pathname])

    return { pathname, state }
}

interface LinkProps extends Omit<NextLinkProps, 'href'> {
    to?: string
    href?: string
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, href, ...props }, ref) {
    if (!to && !href) {
        return null
    }
    const linkHref = `/sidekick-studio${href ?? to}`
    return <NextLink {...props} ref={ref} href={linkHref} />
})

Link.displayName = 'Link'
