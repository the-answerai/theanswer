import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'
import checkOwnership from '../../../utils/checkOwnership'

const createDomain = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.createDomain - body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.createDomain - user not authenticated'
            )
        }

        const domain = await dataEngineService.createDomain(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(domain)
    } catch (error) {
        next(error)
    }
}

const getAllDomains = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.getAllDomains - user not authenticated'
            )
        }

        const domains = await dataEngineService.getAllDomains(req.query, req.user)
        return res.json(domains)
    } catch (error) {
        next(error)
    }
}

const getDomainById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.getDomainById - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.getDomainById - user not authenticated'
            )
        }

        const domain = await dataEngineService.getDomainById(req.params.id, req.user)

        // Check ownership before returning
        if (req.user && !(await checkOwnership(domain, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineDomainsController.getDomainById - Unauthorized')
        }

        return res.json(domain)
    } catch (error) {
        next(error)
    }
}

const updateDomain = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.updateDomain - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.updateDomain - user not authenticated'
            )
        }

        // First get the resource to check ownership
        const existingDomain = await dataEngineService.getDomainById(req.params.id, req.user)

        // Check ownership before updating
        if (req.user && !(await checkOwnership(existingDomain, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineDomainsController.updateDomain - Unauthorized')
        }

        const domain = await dataEngineService.updateDomain(req.params.id, req.body, req.user)
        return res.json(domain)
    } catch (error) {
        next(error)
    }
}

const deleteDomain = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDomainsController.deleteDomain - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDomainsController.deleteDomain - user not authenticated'
            )
        }

        // First get the resource to check ownership
        const existingDomain = await dataEngineService.getDomainById(req.params.id, req.user)

        // Check ownership before deleting
        if (req.user && !(await checkOwnership(existingDomain, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineDomainsController.deleteDomain - Unauthorized')
        }

        const result = await dataEngineService.deleteDomain(req.params.id, req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    createDomain,
    getAllDomains,
    getDomainById,
    updateDomain,
    deleteDomain
}
