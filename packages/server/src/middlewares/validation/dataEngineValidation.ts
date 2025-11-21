import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

/**
 * Validation middleware for Data Engine API requests
 * Provides input validation and sanitization
 */

// ====================VALIDATORS ====================

/**
 * Validate required fields are present
 */
function validateRequiredFields(data: any, requiredFields: string[], resourceName: string): void {
    const missingFields = requiredFields.filter((field) => !data[field] && data[field] !== 0 && data[field] !== false)

    if (missingFields.length > 0) {
        throw new InternalFlowiseError(
            StatusCodes.BAD_REQUEST,
            `Error: ${resourceName} validation - Missing required fields: ${missingFields.join(', ')}`
        )
    }
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePaginationParams(req: Request, res: Response, next: NextFunction) {
    try {
        const { page, pageSize } = req.query

        // Validate page number
        if (page !== undefined) {
            const pageNum = parseInt(page as string, 10)
            if (isNaN(pageNum) || pageNum < 0) {
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Validation - page must be a non-negative integer')
            }
            req.query.page = pageNum.toString()
        }

        // Validate page size with maximum limit
        if (pageSize !== undefined) {
            const pageSizeNum = parseInt(pageSize as string, 10)
            if (isNaN(pageSizeNum) || pageSizeNum < 1) {
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Validation - pageSize must be a positive integer')
            }
            if (pageSizeNum > 100) {
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Validation - pageSize cannot exceed 100')
            }
            req.query.pageSize = pageSizeNum.toString()
        }

        next()
    } catch (error) {
        next(error)
    }
}

// ==================== DOMAIN VALIDATORS ====================

export function validateCreateDomain(req: Request, res: Response, next: NextFunction) {
    try {
        const { domain_name } = req.body

        validateRequiredFields(req.body, ['domain_name'], 'createDomain')

        // Validate domain name format (basic validation)
        if (typeof domain_name !== 'string' || domain_name.trim().length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Domain validation - domain_name must be a non-empty string')
        }

        // Sanitize domain name
        req.body.domain_name = domain_name.trim().toLowerCase()

        next()
    } catch (error) {
        next(error)
    }
}

export function validateUpdateDomain(req: Request, res: Response, next: NextFunction) {
    try {
        // At least one field must be provided for update
        const updateableFields = ['meta_title', 'meta_description', 'is_valid', 'custom_data', 'metadata']
        const hasAtLeastOneField = updateableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))

        if (!hasAtLeastOneField) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Domain validation - At least one field must be provided for update: ${updateableFields.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

// ==================== URL VALIDATORS ====================

export function validateCreateUrl(req: Request, res: Response, next: NextFunction) {
    try {
        const { url } = req.body

        validateRequiredFields(req.body, ['domain_id', 'url', 'domain_name'], 'createUrl')

        // Validate URL format
        if (typeof url !== 'string' || url.trim().length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: URL validation - url must be a non-empty string')
        }

        // Basic URL validation
        try {
            new URL(url)
        } catch {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: URL validation - url must be a valid URL')
        }

        next()
    } catch (error) {
        next(error)
    }
}

export function validateUpdateUrl(req: Request, res: Response, next: NextFunction) {
    try {
        const updateableFields = [
            'page_title',
            'meta_description',
            'http_status',
            'status_text',
            'content_type',
            'canonical_url',
            'custom_data',
            'metadata'
        ]
        const hasAtLeastOneField = updateableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))

        if (!hasAtLeastOneField) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: URL validation - At least one field must be provided for update: ${updateableFields.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

// ==================== CALL VALIDATORS ====================

export function validateCreateCall(req: Request, res: Response, next: NextFunction) {
    try {
        // Calls don't have strict required fields, but validate types if provided
        const { sentiment_score, duration } = req.body

        if (sentiment_score !== undefined) {
            const score = parseFloat(sentiment_score)
            if (isNaN(score) || score < 0 || score > 10) {
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Call validation - sentiment_score must be between 0 and 10')
            }
        }

        if (duration !== undefined) {
            const dur = parseInt(duration, 10)
            if (isNaN(dur) || dur < 0) {
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Call validation - duration must be a non-negative integer')
            }
        }

        next()
    } catch (error) {
        next(error)
    }
}

export function validateUpdateCall(req: Request, res: Response, next: NextFunction) {
    try {
        const updateableFields = [
            'transcript',
            'transcript_json',
            'recording_url',
            'duration',
            'sentiment_score',
            'summary',
            'custom_data',
            'ai_analysis',
            'ai_coaching',
            'metadata'
        ]
        const hasAtLeastOneField = updateableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))

        if (!hasAtLeastOneField) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Call validation - At least one field must be provided for update: ${updateableFields.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

// ==================== TAG VALIDATORS ====================

export function validateCreateTag(req: Request, res: Response, next: NextFunction) {
    try {
        const { slug } = req.body

        validateRequiredFields(req.body, ['slug', 'label'], 'createTag')

        // Validate slug format (alphanumeric, hyphens, underscores)
        if (!/^[a-z0-9-_]+$/.test(slug)) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                'Error: Tag validation - slug must contain only lowercase letters, numbers, hyphens, and underscores'
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

export function validateUpdateTag(req: Request, res: Response, next: NextFunction) {
    try {
        const updateableFields = ['slug', 'label', 'description', 'color', 'shade', 'parent_id']
        const hasAtLeastOneField = updateableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))

        if (!hasAtLeastOneField) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Tag validation - At least one field must be provided for update: ${updateableFields.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

// ==================== DOCUMENT VALIDATORS ====================

export function validateCreateDocument(req: Request, res: Response, next: NextFunction) {
    try {
        const { content } = req.body

        validateRequiredFields(req.body, ['content'], 'createDocument')

        if (typeof content !== 'string' || content.trim().length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Document validation - content must be a non-empty string')
        }

        next()
    } catch (error) {
        next(error)
    }
}

export function validateUpdateDocument(req: Request, res: Response, next: NextFunction) {
    try {
        const updateableFields = ['content', 'embedding', 'metadata']
        const hasAtLeastOneField = updateableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))

        if (!hasAtLeastOneField) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Document validation - At least one field must be provided for update: ${updateableFields.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

export function validateSearchDocuments(req: Request, res: Response, next: NextFunction) {
    try {
        const { query_embedding } = req.body

        validateRequiredFields(req.body, ['query_embedding'], 'searchDocuments')

        if (!Array.isArray(query_embedding)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Document search validation - query_embedding must be an array')
        }

        next()
    } catch (error) {
        next(error)
    }
}

// ==================== TICKET VALIDATORS ====================

export function validateCreateTicket(req: Request, res: Response, next: NextFunction) {
    try {
        const { title, status, priority } = req.body

        validateRequiredFields(req.body, ['title', 'created_by'], 'createTicket')

        if (typeof title !== 'string' || title.trim().length === 0) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Error: Ticket validation - title must be a non-empty string')
        }

        // Validate status if provided
        const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
        if (status && !validStatuses.includes(status)) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Ticket validation - status must be one of: ${validStatuses.join(', ')}`
            )
        }

        // Validate priority if provided
        const validPriorities = ['low', 'normal', 'high', 'urgent']
        if (priority && !validPriorities.includes(priority)) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Ticket validation - priority must be one of: ${validPriorities.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

export function validateUpdateTicket(req: Request, res: Response, next: NextFunction) {
    try {
        const updateableFields = ['title', 'description', 'status', 'priority', 'ticket_type', 'assigned_to', 'escalated', 'tags_array']
        const hasAtLeastOneField = updateableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))

        if (!hasAtLeastOneField) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Ticket validation - At least one field must be provided for update: ${updateableFields.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}

// ==================== CHAT VALIDATORS ====================

export function validateCreateChat(req: Request, res: Response, next: NextFunction) {
    try {
        validateRequiredFields(req.body, ['chatbot_name', 'user_message', 'bot_response'], 'createChat')

        next()
    } catch (error) {
        next(error)
    }
}

export function validateUpdateChat(req: Request, res: Response, next: NextFunction) {
    try {
        const updateableFields = ['sentiment_score', 'resolution_status', 'tags_array']
        const hasAtLeastOneField = updateableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))

        if (!hasAtLeastOneField) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                `Error: Chat validation - At least one field must be provided for update: ${updateableFields.join(', ')}`
            )
        }

        next()
    } catch (error) {
        next(error)
    }
}
