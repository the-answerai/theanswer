import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import apiKeyService from '../../services/apikey'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { createRateLimiter } from '../../utils/rateLimit'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { ChatflowType } from '../../Interface'
import chatflowsService from '../../services/chatflows'
import checkOwnership from '../../utils/checkOwnership'
import billingService from '../../services/billing'
import logger from '../../utils/logger'

const checkIfChatflowIsValidForStreaming = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.checkIfChatflowIsValidForStreaming - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.checkIfChatflowIsValidForStreaming(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const checkIfChatflowIsValidForUploads = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.checkIfChatflowIsValidForUploads - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.checkIfChatflowIsValidForUploads(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.deleteChatflow - id not provided!`)
        }
        const apiResponse = await chatflowsService.deleteChatflow(req.params.id, req.user)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllChatflows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).send('Unauthorized')
        }
        const filter = req.query.filter ? JSON.parse(decodeURIComponent(req.query.filter as string)) : undefined
        const apiResponse = await chatflowsService.getAllChatflows(
            req.query?.type as ChatflowType,
            { ...res.locals.filter, ...filter },
            req.user
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Get specific chatflow via api key
const getChatflowByApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.apikey) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.getChatflowByApiKey - apikey not provided!`
            )
        }
        const apikey = await apiKeyService.getApiKey(req.params.apikey)
        if (!apikey) {
            return res.status(401).send('Unauthorized')
        }
        const apiResponse = await chatflowsService.getChatflowByApiKey(apikey.id, req.query.keyonly)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getChatflowById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getChatflowById - id not provided!`)
        }
        const apiResponse = await chatflowsService.getChatflowById(req.params.id, req.user)

        // Check if the chatflow is public (Marketplace) for unauthenticated users
        if (!req.user && (!apiResponse.visibility || !apiResponse.visibility.includes('Marketplace') || !apiResponse.isPublic)) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                `Error: chatflowsRouter.getChatflowById - Unauthorized access to non-public chatflow!`
            )
        }

        // For authenticated users, check ownership
        if (req.user && !(await checkOwnership(apiResponse, req.user))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }

        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const saveChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Error: chatflowsRouter.saveChatflow - Unauthorized!`)
        }
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.saveChatflow - body not provided!`)
        }
        const body = req.body
        const newChatFlow = new ChatFlow()

        Object.assign(newChatFlow, { ...body, userId: req.user?.id, organizationId: req.user?.organizationId })
        const apiResponse = await chatflowsService.saveChatflow(newChatFlow)

        // TODO: Abstract sending to AnswerAI through events endpoint and move to service
        const ANSWERAI_DOMAIN = req.auth?.payload.answersDomain ?? process.env.ANSWERAI_DOMAIN ?? 'https://beta.theanswer.ai'
        try {
            await fetch(ANSWERAI_DOMAIN + '/api/sidekicks/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + req.auth?.token!,
                    cookie: req.headers.cookie!
                },
                body: JSON.stringify({
                    chatflow: apiResponse,
                    chatflowDomain: req.auth?.payload?.chatflowDomain
                })
            })
        } catch (err) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.saveChatflow - AnswerAI sync failed!`)
        }

        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const importChatflows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chatflows: Partial<ChatFlow>[] = req.body.Chatflows
        const apiResponse = await chatflowsService.importChatflows(chatflows)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.updateChatflow - id not provided!`)
        }
        const chatflow = await chatflowsService.getChatflowById(req.params.id, req.user!)
        if (!chatflow) {
            return res.status(404).send(`Chatflow ${req.params.id} not found`)
        }

        if (!(await checkOwnership(chatflow, req.user))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }
        const body = req.body
        const updateChatFlow = new ChatFlow()
        Object.assign(updateChatFlow, body)

        // Ensure chatbotConfig is passed as a string
        if (body.chatbotConfig && typeof body.chatbotConfig === 'string') {
            updateChatFlow.chatbotConfig = body.chatbotConfig
        }

        updateChatFlow.id = chatflow.id
        createRateLimiter(updateChatFlow)

        const apiResponse = await chatflowsService.updateChatflow(chatflow, updateChatFlow)

        // TODO: Abstract sending to AnswerAI through events endpoint and move to service
        const ANSWERAI_DOMAIN = req.auth?.payload.answersDomain ?? process.env.ANSWERAI_DOMAIN ?? 'https://beta.theanswer.ai'
        try {
            await fetch(ANSWERAI_DOMAIN + '/api/sidekicks/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + req.auth?.token!,
                    cookie: req.headers.cookie!
                },
                body: JSON.stringify({
                    chatflow: apiResponse,
                    chatflowDomain: req.auth?.payload?.chatflowDomain
                })
            })
        } catch (err) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.saveChatflow - AnswerAI sync failed!`)
        }

        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getSinglePublicChatflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.getSinglePublicChatflow - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.getSinglePublicChatflow(req.params.id, req.user)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getSinglePublicChatbotConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.getSinglePublicChatbotConfig - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.getSinglePublicChatbotConfig(req.params.id, req.user)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

/**
 * Get usage statistics for the current user
 */
const getUsageStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customerId = req.user?.stripeCustomerId
        if (!customerId) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User has no associated Stripe customer')
        }

        const usageStats = await billingService.getUsageStats(customerId)
        return res.json(usageStats)
    } catch (error) {
        console.error('Error getting usage stats:', error)
        next(error)
    }
}

/**
 * Handles the /usage/sync endpoint to synchronize usage data from Langfuse to Stripe.
 */
const usageSyncHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const traceId = req.body.trace_id
        const result = await billingService.syncUsageToStripe(traceId)
        return res.json({
            status: 'success',
            processed_traces: result.processedTraces,
            ...result
        })
    } catch (error) {
        console.error('Error syncing usage:', error)
        next(error)
    }
}

const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await billingService.createCustomer(req.body)
        return res.json(customer)
    } catch (error) {
        next(error)
    }
}

const attachPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const paymentMethod = await billingService.attachPaymentMethod(req.body)
        return res.json(paymentMethod)
    } catch (error) {
        next(error)
    }
}

const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { priceId } = req.body
        if (!priceId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Price ID is required')
        }

        const session = await billingService.createCheckoutSession({
            priceId,
            customerId: req.user?.stripeCustomerId!,
            successUrl: `${req.headers.origin}/billing?status=success`,
            cancelUrl: `${req.headers.origin}/billing?status=cancel`
        })

        return res.json({ url: session.url })
    } catch (error) {
        logger.error('Error creating checkout session')
        logger.error(error)
        next(error)
    }
}

const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subscription = await billingService.updateSubscription({
            subscriptionId: req.params.id,
            ...req.body
        })
        return res.json(subscription)
    } catch (error) {
        next(error)
    }
}

const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subscription = await billingService.cancelSubscription(req.params.id)
        return res.json(subscription)
    } catch (error) {
        next(error)
    }
}

const getUpcomingInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await billingService.getUpcomingInvoice(req.body)
        return res.json(invoice)
    } catch (error) {
        next(error)
    }
}

const createBillingPortalSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await billingService.createBillingPortalSession({
            customerId: req.body.customerId,
            returnUrl: req.body.returnUrl
        })
        return res.json(session)
    } catch (error) {
        next(error)
    }
}

const getSubscriptionWithUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User not authenticated')
        }

        const customerId = req.user.stripeCustomerId
        if (!customerId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'No Stripe customer ID associated with user')
        }

        // Get active subscription
        const subscription = await billingService.getSubscriptionWithUsage(customerId)

        // if (!subscriptions.data.length) {
        //     return res.json({ subscription: null, usage: [] })
        // }

        // // Get subscription with usage
        // const subscription = await billingService.getSubscriptionWithUsage(subscriptions.data[0].id)
        return res.json(subscription)
    } catch (error: any) {
        if (error instanceof InternalFlowiseError) {
            next(error)
        } else {
            next(new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, error.message))
        }
    }
}

export default {
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getChatflowByApiKey,
    getChatflowById,
    saveChatflow,
    importChatflows,
    updateChatflow,
    getSinglePublicChatflow,
    getSinglePublicChatbotConfig,
    getUsageStats,
    usageSyncHandler,
    createCustomer,
    attachPaymentMethod,
    createCheckoutSession,
    updateSubscription,
    cancelSubscription,
    getUpcomingInvoice,
    createBillingPortalSession,
    getSubscriptionWithUsage
}
