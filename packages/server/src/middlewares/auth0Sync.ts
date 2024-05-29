import { NextFunction, Request, Response } from 'express'

import { DataSource } from 'typeorm'
import { User } from '../database/entities/User'

export const auth0Sync =
    ({ AppDataSource }: { AppDataSource: DataSource }) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const authUser = req.auth?.payload
        const auth0Id = authUser?.sub
        const email = authUser?.email as string
        const name = authUser?.name as string

        if (!auth0Id || !email) {
            return next()
        }

        let user = await AppDataSource.getRepository(User).findOneBy({
            auth0Id
        })
        if (!user) {
            user = new User()
            user.auth0Id = auth0Id
            user.email = email
            user.name = name
            await AppDataSource.getRepository(User).save(user)
        } else {
            // Update existing user if needed
            user.email = email
            user.name = name
            await AppDataSource.getRepository(User).save(user)
        }

        req.user = user // Attach user entity to request for downstream use
        return next()
    }
