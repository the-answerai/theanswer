import { Request, Response, NextFunction } from 'express'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import axios from 'axios'

interface ZoomMeeting {
    id: string | number
    topic: string
    start_time: string
    duration: number
    host_email: string
    recording_count: number
    timezone?: string
}

interface ZoomRecordingsResponse {
    meetings: ZoomMeeting[]
    page_count?: number
    page_number?: number
    page_size?: number
    total_records?: number
}

interface ZoomMeetingsRequest {
    accessToken: string
    fromDate?: string
    toDate?: string
    pageSize?: number
    accountId?: string
    userId?: string
    meetingType?: 'my' | 'shared' | 'organization'
}

/**
 * Get Zoom meetings with recordings for the authenticated user (original endpoint)
 */
const getMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: ZoomMeetingsRequest = req.method === 'GET' ? (req.query as any) : req.body

        if (!params.accessToken) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Access token is required')
        }

        // Set default date range (14 days ago to today)
        const defaultFromDate = new Date()
        defaultFromDate.setDate(defaultFromDate.getDate() - 14)
        const fromDate = params.fromDate || defaultFromDate.toISOString().split('T')[0]
        const toDate = params.toDate || new Date().toISOString().split('T')[0]

        const response = await axios.get('https://api.zoom.us/v2/users/me/recordings', {
            headers: {
                Authorization: `Bearer ${params.accessToken}`,
                'Content-Type': 'application/json'
            },
            params: {
                from: fromDate,
                to: toDate,
                page_size: params.pageSize || 30
            }
        })

        const data = response.data as ZoomRecordingsResponse

        const meetingsWithRecordings = transformMeetingsData(data.meetings || [], 'my')

        return res.status(StatusCodes.OK).json({
            meetings: meetingsWithRecordings,
            total_records: data.total_records || data.meetings?.length || 0,
            page_count: data.page_count || 1,
            page_number: data.page_number || 1,
            page_size: data.page_size || 30,
            meeting_type: 'my'
        })
    } catch (error: unknown) {
        return handleZoomApiError(error, next, res)
    }
}

/**
 * Get shared meetings - meetings that have been shared with the current user
 */
const getSharedMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: ZoomMeetingsRequest = req.method === 'GET' ? (req.query as any) : req.body

        if (!params.accessToken) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Access token is required')
        }

        // Set default date range (14 days ago to today)
        const defaultFromDate = new Date()
        defaultFromDate.setDate(defaultFromDate.getDate() - 14)
        const fromDate = params.fromDate || defaultFromDate.toISOString().split('T')[0]
        const toDate = params.toDate || new Date().toISOString().split('T')[0]

        // For shared meetings, we would typically need to query specific shared users
        // For now, we'll use the same endpoint but could be enhanced to query specific shared user IDs
        // This would need to be customized based on your organization's sharing patterns
        const response = await axios.get('https://api.zoom.us/v2/users/me/recordings', {
            headers: {
                Authorization: `Bearer ${params.accessToken}`,
                'Content-Type': 'application/json'
            },
            params: {
                from: fromDate,
                to: toDate,
                page_size: params.pageSize || 30
            }
        })

        const data = response.data as ZoomRecordingsResponse
        const meetingsWithRecordings = transformMeetingsData(data.meetings || [], 'shared')

        return res.status(StatusCodes.OK).json({
            meetings: meetingsWithRecordings,
            total_records: data.total_records || data.meetings?.length || 0,
            page_count: data.page_count || 1,
            page_number: data.page_number || 1,
            page_size: data.page_size || 30,
            meeting_type: 'shared'
        })
    } catch (error: unknown) {
        return handleZoomApiError(error, next, res)
    }
}

/**
 * Get organization meetings - for admin users to access organization-wide meetings
 */
const getOrganizationMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: ZoomMeetingsRequest = req.method === 'GET' ? (req.query as any) : req.body

        if (!params.accessToken) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Access token is required')
        }

        if (!params.accountId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Account ID is required for organization meetings')
        }

        // Set default date range (14 days ago to today)
        const defaultFromDate = new Date()
        defaultFromDate.setDate(defaultFromDate.getDate() - 14)
        const fromDate = params.fromDate || defaultFromDate.toISOString().split('T')[0]
        const toDate = params.toDate || new Date().toISOString().split('T')[0]

        // Use account-level endpoint for organization meetings
        const userId = params.userId || 'me'
        const endpoint = `https://api.zoom.us/v2/accounts/${params.accountId}/users/${userId}/recordings`

        const response = await axios.get(endpoint, {
            headers: {
                Authorization: `Bearer ${params.accessToken}`,
                'Content-Type': 'application/json'
            },
            params: {
                from: fromDate,
                to: toDate,
                page_size: params.pageSize || 30
            }
        })

        const data = response.data as ZoomRecordingsResponse
        const meetingsWithRecordings = transformMeetingsData(data.meetings || [], 'organization')

        return res.status(StatusCodes.OK).json({
            meetings: meetingsWithRecordings,
            total_records: data.total_records || data.meetings?.length || 0,
            page_count: data.page_count || 1,
            page_number: data.page_number || 1,
            page_size: data.page_size || 30,
            meeting_type: 'organization'
        })
    } catch (error: unknown) {
        return handleZoomApiError(error, next, res)
    }
}

/**
 * Get meetings by type - unified endpoint that routes to appropriate method
 */
const getMeetingsByType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: ZoomMeetingsRequest = req.method === 'GET' ? (req.query as any) : req.body
        const meetingType = params.meetingType || 'my'

        switch (meetingType) {
            case 'my':
                return getMeetings(req, res, next)
            case 'shared':
                return getSharedMeetings(req, res, next)
            case 'organization':
                return getOrganizationMeetings(req, res, next)
            default:
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `Invalid meeting type: ${meetingType}`)
        }
    } catch (error: unknown) {
        return handleZoomApiError(error, next, res)
    }
}

/**
 * Transform meetings data to include recording count and meeting type
 */
const transformMeetingsData = (meetings: ZoomMeeting[], meetingType: string): ZoomMeeting[] => {
    return meetings.map((meeting) => ({
        id: meeting.id,
        topic: meeting.topic,
        start_time: meeting.start_time,
        duration: meeting.duration,
        host_email: meeting.host_email,
        recording_count: meeting.recording_count || 1,
        timezone: meeting.timezone,
        meeting_type: meetingType
    }))
}

/**
 * Handle Zoom API errors consistently
 */
const handleZoomApiError = (error: unknown, next: NextFunction, res: Response) => {
    console.error('Error getting Zoom meetings:', error)

    if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
    ) {
        const typedError = error as any
        const status = typedError.response.status || StatusCodes.INTERNAL_SERVER_ERROR
        const message = typedError.response.data.message || 'Error fetching Zoom meetings'

        // Handle specific Zoom API errors
        if (status === 401) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'Access token expired or invalid',
                details: typedError.response.data
            })
        }

        if (status === 403) {
            return res.status(StatusCodes.FORBIDDEN).json({
                message: 'Insufficient permissions to access these meetings',
                details: typedError.response.data
            })
        }

        return res.status(status).json({
            message,
            details: typedError.response.data
        })
    }

    next(error)
}

export default {
    getMeetings,
    getSharedMeetings,
    getOrganizationMeetings,
    getMeetingsByType
}
