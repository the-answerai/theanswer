import { Request, Response, NextFunction } from 'express'

/**
 * Simple authentication middleware that only checks if user is authenticated
 * Use this for routes that don't have database entities (e.g., external API proxies)
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
}

export default requireAuth
