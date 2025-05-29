import { Request, Response, NextFunction } from 'express'
import analyzerService from '../services/analyzerService'

export const getResearchViews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const views = await analyzerService.getResearchViews()
        res.json({ data: views })
    } catch (error) {
        next(error)
    }
}

export default {
    getResearchViews
}
