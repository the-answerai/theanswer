import { IUser } from './Interface'

declare global {
    namespace Express {
        interface Request {
            user?: IUser
        }
    }
}
